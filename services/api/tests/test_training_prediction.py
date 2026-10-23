import pandas as pd
import pytest


def make_regression_data(rows: int = 40) -> bytes:
    """Generate reproducible data for regression tests."""
    df = pd.DataFrame({
        "feature_a": [float(i * 1.5) for i in range(rows)],
        "feature_b": [float(100 - i * 2) for i in range(rows)],
        "category_c": ["cat_1" if i % 2 == 0 else "cat_2" for i in range(rows)],
        "target_reg": [float(2.0 * i + 5.0) for i in range(rows)],
    })
    return df.to_csv(index=False).encode()


def make_classification_data(rows: int = 40) -> bytes:
    """Generate reproducible data for classification tests."""
    df = pd.DataFrame({
        "feature_a": [float(i * 1.5) for i in range(rows)],
        "feature_b": [float(100 - i * 2) for i in range(rows)],
        "category_c": ["cat_1" if i % 2 == 0 else "cat_2" for i in range(rows)],
        "target_clf": ["yes" if i % 2 == 0 else "no" for i in range(rows)],
    })
    return df.to_csv(index=False).encode()


def test_train_regression_and_predict(client):
    """Verify training a baseline regression model and querying predictions."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("reg_train.csv", make_regression_data(), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    # 1. Train Ridge Regression
    train_payload = {
        "target_column": "target_reg",
        "task_type": "regression",
        "test_size": 0.2,
        "random_state": 42,
    }
    train_res = client.post(f"/api/v1/datasets/{dataset_id}/runs", json=train_payload)
    assert train_res.status_code == 201, train_res.text
    run_data = train_res.json()

    assert run_data["status"] == "completed"
    assert run_data["task_type"] == "regression"
    assert run_data["model_name"] == "RidgeRegression"
    assert "mae" in run_data["metrics"]
    assert "rmse" in run_data["metrics"]
    assert "r2" in run_data["metrics"]

    run_id = run_data["id"]

    # 2. Predict on new sample
    predict_payload = {
        "feature_a": 15.0,
        "feature_b": 80.0,
        "category_c": "cat_1",
    }
    pred_res = client.post(f"/api/v1/runs/{run_id}/predict", json=predict_payload)
    assert pred_res.status_code == 200, pred_res.text
    pred_data = pred_res.json()

    assert pred_data["run_id"] == run_id
    assert pred_data["model_name"] == "RidgeRegression"
    assert "prediction" in pred_data
    assert isinstance(pred_data["prediction"], (int, float))

    # 3. Predict with missing feature -> 422
    missing_payload = {"feature_a": 15.0}
    bad_pred = client.post(f"/api/v1/runs/{run_id}/predict", json=missing_payload)
    assert bad_pred.status_code == 422
    assert "missing_features" in bad_pred.json()["detail"]


def test_train_classification_and_runs_retrieval(client):
    """Verify training classification, listing runs, and retrieving a run."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("train.csv", make_classification_data(), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    train_payload = {
        "target_column": "target_clf",
        "task_type": "classification",
        "test_size": 0.25,
        "random_state": 42,
    }
    train_res = client.post(f"/api/v1/datasets/{dataset_id}/runs", json=train_payload)
    assert train_res.status_code == 201
    run_id = train_res.json()["id"]

    # List runs
    list_res = client.get("/api/v1/runs")
    assert list_res.status_code == 200
    runs = list_res.json()
    assert any(r["id"] == run_id for r in runs)

    # Get specific run
    get_res = client.get(f"/api/v1/runs/{run_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == run_id


def test_train_validation_errors(client):
    """Verify validation on test_size, dataset size, and non-existent targets."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("train.csv", make_classification_data(), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    # Invalid test_size
    bad_test_size = client.post(
        f"/api/v1/datasets/{dataset_id}/runs",
        json={"target_column": "target_reg", "test_size": 0.8},
    )
    assert bad_test_size.status_code == 422

    # Nonexistent target column
    bad_target = client.post(
        f"/api/v1/datasets/{dataset_id}/runs",
        json={"target_column": "ghost_column", "test_size": 0.2},
    )
    assert bad_target.status_code == 422
