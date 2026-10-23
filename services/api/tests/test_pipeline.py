import pandas as pd
import pytest
from app.services.pipeline import DateTimeFeatureExtractor, build_preprocessor, preview_pipeline_transform


def make_timeseries_dataset(rows: int = 40) -> bytes:
    """Generate reproducible dataset with datetime, numeric, and categorical columns."""
    df = pd.DataFrame({
        "timestamp": [f"2026-03-{1 + (i % 28):02d} {10 + (i % 12):02d}:00:00" for i in range(rows)],
        "engine_temp": [70.0 + (i * 0.8) for i in range(rows)],
        "rpm": [3000 + (i * 50) for i in range(rows)],
        "tire_compound": ["soft" if i % 2 == 0 else "medium" for i in range(rows)],
        "lap_time": [90.5 - (i * 0.1) for i in range(rows)],
    })
    return df.to_csv(index=False).encode()


def test_datetime_feature_extractor_standalone():
    """Verify DateTimeFeatureExtractor transforms datetime columns into cyclical/numeric components."""
    df = pd.DataFrame({
        "recorded_at": ["2026-05-15 14:30:00", "2026-06-20 08:15:00", None],
    })
    extractor = DateTimeFeatureExtractor(
        datetime_columns=["recorded_at"],
        features=["hour", "day", "month", "dayofweek"],
    )
    extractor.fit(df)
    transformed = extractor.transform(df)

    assert transformed.shape == (3, 4)
    # Row 0: 14:30 on May 15
    assert transformed[0, 0] == 14.0  # hour
    assert transformed[0, 1] == 15.0  # day
    assert transformed[0, 2] == 5.0   # month
    # Row 2: None -> -1.0 imputation
    assert transformed[2, 0] == -1.0

    feature_names = extractor.get_feature_names_out().tolist()
    assert feature_names == [
        "recorded_at_hour",
        "recorded_at_day",
        "recorded_at_month",
        "recorded_at_dayofweek",
    ]


def test_pipeline_preview_endpoint(client):
    """Verify POST /api/v1/datasets/{id}/pipeline/preview returns transformed feature previews."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("race_data.csv", make_timeseries_dataset(), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    # Preview pipeline transformation
    payload = {
        "target_column": "lap_time",
        "numeric_scaler": "minmax",
        "numeric_imputer": "median",
        "datetime_handling": "extract",
        "sample_rows": 3,
    }
    preview_res = client.post(
        f"/api/v1/datasets/{dataset_id}/pipeline/preview",
        json=payload,
    )
    assert preview_res.status_code == 200, preview_res.text
    data = preview_res.json()

    assert data["original_features_count"] == 4
    assert "timestamp" in data["original_features"]
    assert "engine_temp" in data["original_features"]
    assert "rpm" in data["original_features"]
    assert "tire_compound" in data["original_features"]

    # Datetime was extracted into 4 features, 2 numeric, 2 one-hot categories = 8 transformed features
    assert data["transformed_features_count"] >= 7
    assert any("timestamp" in name for name in data["transformed_feature_names"])
    assert any("engine_temp" in name for name in data["transformed_feature_names"])
    assert any("tire_compound" in name for name in data["transformed_feature_names"])

    assert len(data["sample_preview"]) == 3
    assert data["configuration"]["numeric_scaler"] == "minmax"
    assert data["configuration"]["datetime_handling"] == "extract"


def test_pipeline_preview_validation_errors(client):
    """Verify validation when target is invalid or settings are unsupported."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("race_data.csv", make_timeseries_dataset(), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    # Nonexistent target
    res_bad_target = client.post(
        f"/api/v1/datasets/{dataset_id}/pipeline/preview",
        json={"target_column": "nonexistent_target"},
    )
    assert res_bad_target.status_code == 422

    # Invalid scaler
    res_bad_scaler = client.post(
        f"/api/v1/datasets/{dataset_id}/pipeline/preview",
        json={"target_column": "lap_time", "numeric_scaler": "magic_scaler"},
    )
    assert res_bad_scaler.status_code == 422


def test_train_with_pipeline_and_predict_raw_inputs(client):
    """Verify full end-to-end training with custom preprocessor and inference on unscaled raw inputs."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("race_data.csv", make_timeseries_dataset(50), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    train_payload = {
        "target_column": "lap_time",
        "task_type": "regression",
        "test_size": 0.2,
        "random_state": 42,
        "numeric_scaler": "robust",
        "numeric_imputer": "mean",
        "datetime_handling": "extract",
    }
    train_res = client.post(f"/api/v1/datasets/{dataset_id}/runs", json=train_payload)
    assert train_res.status_code == 201, train_res.text
    run_data = train_res.json()

    assert run_data["status"] == "completed"
    assert "metrics" in run_data
    assert "mae" in run_data["metrics"]

    # Verify run parameters recorded preprocessing
    params = run_data["parameters"]
    assert "preprocessing" in params
    assert params["preprocessing"]["numeric_scaler"] == "robust"
    assert params["preprocessing"]["numeric_imputer"] == "mean"
    assert params["preprocessing"]["datetime_handling"] == "extract"
    assert "timestamp" in params["preprocessing"]["datetime_columns"]
    assert len(params["transformed_feature_names"]) > 0

    run_id = run_data["id"]

    # Predict on a raw, unscaled row containing a timestamp string
    raw_sample = {
        "timestamp": "2026-03-25 15:00:00",
        "engine_temp": 85.0,
        "rpm": 4200,
        "tire_compound": "soft",
    }
    pred_res = client.post(f"/api/v1/runs/{run_id}/predict", json=raw_sample)
    assert pred_res.status_code == 200, pred_res.text
    pred_data = pred_res.json()

    assert pred_data["run_id"] == run_id
    assert "prediction" in pred_data
    assert isinstance(pred_data["prediction"], (int, float))


def test_train_with_datetime_handling_ignore(client):
    """Verify training with datetime_handling='ignore' drops datetime features."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("race_data.csv", make_timeseries_dataset(40), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    train_payload = {
        "target_column": "lap_time",
        "task_type": "regression",
        "numeric_scaler": "none",
        "datetime_handling": "ignore",
    }
    train_res = client.post(f"/api/v1/datasets/{dataset_id}/runs", json=train_payload)
    assert train_res.status_code == 201, train_res.text
    run_data = train_res.json()

    # Transformed features should not contain timestamp components
    transformed_names = run_data["parameters"]["transformed_feature_names"]
    assert not any("timestamp" in name for name in transformed_names)
    assert run_data["parameters"]["preprocessing"]["datetime_columns"] == []


def test_train_classification_with_custom_pipeline(client):
    """Verify training classification with custom scaler and predicting categorical target."""
    df = pd.DataFrame({
        "timestamp": [f"2026-04-{1 + (i % 28):02d} {8 + (i % 8):02d}:00:00" for i in range(50)],
        "telemetry_val": [float(i * 3.2) for i in range(50)],
        "weather": ["dry" if i % 3 == 0 else "wet" for i in range(50)],
        "pit_stop_needed": ["yes" if i % 2 == 0 else "no" for i in range(50)],
    })
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("pit_data.csv", df.to_csv(index=False).encode(), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    train_payload = {
        "target_column": "pit_stop_needed",
        "task_type": "classification",
        "numeric_scaler": "standard",
        "numeric_imputer": "median",
        "datetime_handling": "extract",
    }
    train_res = client.post(f"/api/v1/datasets/{dataset_id}/runs", json=train_payload)
    assert train_res.status_code == 201, train_res.text
    run_data = train_res.json()

    assert run_data["task_type"] == "classification"
    assert "accuracy" in run_data["metrics"]
    assert "f1_weighted" in run_data["metrics"]

    # Predict with classification model
    pred_res = client.post(
        f"/api/v1/runs/{run_data['id']}/predict",
        json={
            "timestamp": "2026-04-10 12:00:00",
            "telemetry_val": 45.0,
            "weather": "wet",
        },
    )
    assert pred_res.status_code == 200, pred_res.text
    assert pred_res.json()["prediction"] in ("yes", "no")


def test_pipeline_pure_numeric_and_pure_categorical(client):
    """Verify preprocessor works on datasets that lack datetime or lack categorical columns."""
    # Pure numeric
    df_num = pd.DataFrame({
        "num1": [float(i) for i in range(30)],
        "num2": [float(i * 2) for i in range(30)],
        "target": [float(i + 10) for i in range(30)],
    })
    up_num = client.post(
        "/api/v1/datasets",
        files={"file": ("num.csv", df_num.to_csv(index=False).encode(), "text/csv")},
    )
    assert up_num.status_code == 201
    ds_num_id = up_num.json()["id"]

    preview_num = client.post(
        f"/api/v1/datasets/{ds_num_id}/pipeline/preview",
        json={"target_column": "target", "numeric_scaler": "minmax"},
    )
    assert preview_num.status_code == 200
    assert len(preview_num.json()["transformed_feature_names"]) == 2

    # Pure categorical
    df_cat = pd.DataFrame({
        "cat1": ["a" if i % 2 == 0 else "b" for i in range(40)],
        "cat2": ["x" if i % 3 == 0 else "y" for i in range(40)],
        "target": [float(i) for i in range(40)],
    })
    up_cat = client.post(
        "/api/v1/datasets",
        files={"file": ("cat.csv", df_cat.to_csv(index=False).encode(), "text/csv")},
    )
    assert up_cat.status_code == 201
    ds_cat_id = up_cat.json()["id"]

    preview_cat = client.post(
        f"/api/v1/datasets/{ds_cat_id}/pipeline/preview",
        json={"target_column": "target"},
    )
    assert preview_cat.status_code == 200
    assert len(preview_cat.json()["transformed_feature_names"]) >= 2

