import pandas as pd
import pytest


def make_sample_dataset(rows: int = 40) -> bytes:
    df = pd.DataFrame({
        "timestamp": [f"2026-05-{1 + (i % 28):02d} 10:00:00" for i in range(rows)],
        "sensor_val": [float(i * 2.5) for i in range(rows)],
        "pressure": [float(100 - i) for i in range(rows)],
        "grade": ["A" if i % 2 == 0 else "B" for i in range(rows)],
        "target_reg": [float(10.0 + i * 1.5) for i in range(rows)],
        "target_clf": ["pass" if i % 3 == 0 else "fail" for i in range(rows)],
    })
    return df.to_csv(index=False).encode()


def test_phase6_model_training_architectures(client):
    """Test training with Random Forest and Gradient Boosting architectures."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("advanced.csv", make_sample_dataset(45), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    # 1. Train Random Forest Regressor
    rf_res = client.post(
        f"/api/v1/datasets/{dataset_id}/runs",
        json={
            "target_column": "target_reg",
            "task_type": "regression",
            "model_name": "random_forest",
            "test_size": 0.2,
        },
    )
    assert rf_res.status_code == 201, rf_res.text
    rf_data = rf_res.json()
    assert rf_data["model_name"] == "RandomForestRegressor"
    assert "r2" in rf_data["metrics"]
    assert "mae" in rf_data["metrics"]

    # 2. Train Gradient Boosting Classifier
    gb_res = client.post(
        f"/api/v1/datasets/{dataset_id}/runs",
        json={
            "target_column": "target_clf",
            "task_type": "classification",
            "model_name": "gradient_boosting",
            "test_size": 0.25,
        },
    )
    assert gb_res.status_code == 201, gb_res.text
    gb_data = gb_res.json()
    assert gb_data["model_name"] == "GradientBoostingClassifier"
    assert "accuracy" in gb_data["metrics"]
    assert "f1_weighted" in gb_data["metrics"]
    assert "confusion_matrix" in gb_data["metrics"]


def test_phase6_chronological_split_and_cross_validation(client):
    """Test chronological split strategy and k-fold cross-validation."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("ts.csv", make_sample_dataset(50), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    train_res = client.post(
        f"/api/v1/datasets/{dataset_id}/runs",
        json={
            "target_column": "target_reg",
            "task_type": "regression",
            "model_name": "ridge",
            "split_strategy": "chronological",
            "cv_folds": 3,
            "test_size": 0.2,
        },
    )
    assert train_res.status_code == 201, train_res.text
    run_data = train_res.json()

    assert run_data["parameters"]["split_strategy"] == "chronological"
    assert run_data["parameters"]["cv_folds"] == 3
    assert "cross_validation" in run_data["metrics"]
    assert "mean" in run_data["metrics"]["cross_validation"]
    assert len(run_data["metrics"]["cross_validation"]["folds"]) == 3


def test_phase8_prediction_probabilities_and_batch_inference(client):
    """Test probability outputs and high-throughput batch prediction."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("pred_test.csv", make_sample_dataset(45), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    train_res = client.post(
        f"/api/v1/datasets/{dataset_id}/runs",
        json={
            "target_column": "target_clf",
            "task_type": "classification",
            "model_name": "logistic_regression",
            "test_size": 0.2,
        },
    )
    assert train_res.status_code == 201
    run_id = train_res.json()["id"]

    # 1. Single prediction with probabilities
    single_res = client.post(
        f"/api/v1/runs/{run_id}/predict",
        json={
            "timestamp": "2026-05-10 10:00:00",
            "sensor_val": 20.0,
            "pressure": 85.0,
            "grade": "A",
            "target_reg": 25.0,
        },
    )
    assert single_res.status_code == 200, single_res.text
    pred_body = single_res.json()
    assert "prediction" in pred_body
    assert "probabilities" in pred_body
    assert isinstance(pred_body["probabilities"], dict)

    # 2. Batch prediction
    batch_samples = [
        {"timestamp": "2026-05-10 10:00:00", "sensor_val": 15.0, "pressure": 90.0, "grade": "A", "target_reg": 20.0},
        {"timestamp": "2026-05-11 10:00:00", "sensor_val": 35.0, "pressure": 70.0, "grade": "B", "target_reg": 30.0},
    ]
    batch_res = client.post(
        f"/api/v1/runs/{run_id}/predict-batch",
        json={"samples": batch_samples},
    )
    assert batch_res.status_code == 200, batch_res.text
    batch_data = batch_res.json()
    assert batch_data["count"] == 2
    assert len(batch_data["predictions"]) == 2
    assert len(batch_data["probabilities"]) == 2

    # 3. Batch prediction missing feature validation
    bad_batch = client.post(
        f"/api/v1/runs/{run_id}/predict-batch",
        json={"samples": [{"sensor_val": 15.0}]},
    )
    assert bad_batch.status_code == 422


def test_phase9_model_comparison_and_workflow_status(client):
    """Test model comparison leaderboard and dataset workflow lifecycle status."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("compare.csv", make_sample_dataset(45), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    # Train run 1: Ridge
    client.post(
        f"/api/v1/datasets/{dataset_id}/runs",
        json={"target_column": "target_reg", "model_name": "ridge", "task_type": "regression"},
    )
    # Train run 2: Random Forest
    client.post(
        f"/api/v1/datasets/{dataset_id}/runs",
        json={"target_column": "target_reg", "model_name": "random_forest", "task_type": "regression"},
    )

    # Compare models
    comp_res = client.get(f"/api/v1/datasets/{dataset_id}/runs/compare")
    assert comp_res.status_code == 200, comp_res.text
    comp_data = comp_res.json()
    assert comp_data["total_runs_evaluated"] >= 2
    assert comp_data["best_run_id"] is not None
    assert len(comp_data["ranked_runs"]) >= 2
    assert comp_data["ranked_runs"][0]["rank"] == 1

    # Check workflow status
    wf_res = client.get(f"/api/v1/datasets/{dataset_id}/workflow")
    assert wf_res.status_code == 200, wf_res.text
    wf_data = wf_res.json()
    assert wf_data["dataset_id"] == dataset_id
    assert wf_data["completed_runs"] >= 2
    assert "best_run" in wf_data
    assert "next_recommended_action" in wf_data


def test_phase10_workbench_frontend(client):
    """Test that the interactive workbench frontend and root link load with 200 OK."""
    # Workbench HTML
    bench_res = client.get("/workbench")
    assert bench_res.status_code == 200
    assert "PITWALL OS" in bench_res.text
    assert "text/html" in bench_res.headers.get("content-type", "")

    # Root endpoint
    root_res = client.get("/")
    assert root_res.status_code == 200
    root_data = root_res.json()
    assert "workbench" in root_data
    assert root_data["workbench"] == "/workbench"
