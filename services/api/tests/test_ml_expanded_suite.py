"""
Automated Pytest Suite for the Expanded Machine Learning, Deep Learning,
and Unsupervised Intelligence Suite.
"""

import io
import pandas as pd


def make_regression_csv(rows=60):
    df = pd.DataFrame({
        "timestamp": pd.date_range("2026-01-01", periods=rows, freq="h"),
        "telemetry_temp": [20.0 + i * 0.3 + (i % 3) * 0.5 for i in range(rows)],
        "rpm": [1000 + i * 50 + (i % 5) * 20 for i in range(rows)],
        "throttle": [40.0 + (i % 10) * 4 for i in range(rows)],
        "pressure": [1.5 + (i % 4) * 0.2 for i in range(rows)],
    })
    return df.to_csv(index=False).encode("utf-8")


def make_classification_csv(rows=60):
    df = pd.DataFrame({
        "timestamp": pd.date_range("2026-01-01", periods=rows, freq="h"),
        "rpm": [1000 + i * 50 for i in range(rows)],
        "throttle": [20.0 + (i % 5) * 10 for i in range(rows)],
        "speed": [50.0 + i * 1.5 for i in range(rows)],
        "pit_status": ["IN_PIT" if i % 3 == 0 else "ON_TRACK" for i in range(rows)],
    })
    return df.to_csv(index=False).encode("utf-8")


def test_expanded_regression_models(client):
    """Test regression model zoo and verify advanced metrics + permutation importance."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("race_telemetry.csv", make_regression_csv(), "text/csv")},
    )
    assert upload.status_code == 201, upload.text
    dataset_id = upload.json()["id"]

    models_to_test = [
        "linear_regression", "lasso", "elastic_net", "bayesian_ridge",
        "decision_tree", "extra_trees", "adaboost", "knn", "svr", "mlp", "voting", "stacking"
    ]
    for model_name in models_to_test:
        resp = client.post(
            f"/api/v1/datasets/{dataset_id}/runs",
            json={
                "target_column": "telemetry_temp",
                "model_name": model_name,
                "task_type": "regression",
                "test_size": 0.2,
                "random_state": 42,
            },
        )
        assert resp.status_code == 201, f"Failed for regression model {model_name}: {resp.text}"
        data = resp.json()
        metrics = data["metrics"]
        assert "r2" in metrics
        assert "adjusted_r2" in metrics
        assert "median_ae" in metrics
        assert "max_error" in metrics
        assert "feature_importance" in metrics
        assert len(metrics["feature_importance"]) > 0


def test_expanded_classification_models(client):
    """Test classification model zoo and verify balanced accuracy, MCC, kappa, and importance."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("pit_classification.csv", make_classification_csv(), "text/csv")},
    )
    assert upload.status_code == 201, upload.text
    dataset_id = upload.json()["id"]

    models_to_test = [
        "decision_tree", "extra_trees", "adaboost", "svm", "knn",
        "naive_bayes", "mlp", "voting", "stacking"
    ]
    for model_name in models_to_test:
        resp = client.post(
            f"/api/v1/datasets/{dataset_id}/runs",
            json={
                "target_column": "pit_status",
                "model_name": model_name,
                "task_type": "classification",
                "test_size": 0.25,
                "random_state": 42,
            },
        )
        assert resp.status_code == 201, f"Failed for classification model {model_name}: {resp.text}"
        data = resp.json()
        metrics = data["metrics"]
        assert "accuracy" in metrics
        assert "balanced_accuracy" in metrics
        assert "mcc" in metrics
        assert "cohen_kappa" in metrics
        assert "confusion_matrix" in metrics
        assert "feature_importance" in metrics


def test_unsupervised_clustering_endpoints(client):
    """Test clustering algorithms (KMeans, GMM, Agglomerative) and silhouette scores."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("race_telemetry.csv", make_regression_csv(), "text/csv")},
    )
    assert upload.status_code == 201, upload.text
    dataset_id = upload.json()["id"]

    methods = ["kmeans", "minibatch_kmeans", "agglomerative", "gmm"]
    for method in methods:
        resp = client.post(
            f"/api/v1/datasets/{dataset_id}/unsupervised/cluster",
            json={"method": method, "n_clusters": 3},
        )
        assert resp.status_code == 200, f"Clustering failed for {method}: {resp.text}"
        res = resp.json()
        assert res["n_clusters_found"] == 3
        assert "metrics" in res
        assert "cluster_distribution" in res
        assert len(res["sample_assignments"]) > 0


def test_unsupervised_pca_endpoint(client):
    """Test PCA dimensionality reduction endpoint."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("race_telemetry.csv", make_regression_csv(), "text/csv")},
    )
    assert upload.status_code == 201, upload.text
    dataset_id = upload.json()["id"]

    resp = client.post(
        f"/api/v1/datasets/{dataset_id}/unsupervised/pca",
        json={"n_components": 2},
    )
    assert resp.status_code == 200, resp.text
    res = resp.json()
    assert res["n_components"] == 2
    assert len(res["explained_variance_ratio"]) == 2
    assert res["total_explained_variance"] > 0
    assert len(res["components"]) == 2
    assert len(res["projected_samples"]) > 0


def test_unsupervised_anomaly_detection_endpoints(client):
    """Test Isolation Forest and LOF anomaly detection."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("race_telemetry.csv", make_regression_csv(), "text/csv")},
    )
    assert upload.status_code == 201, upload.text
    dataset_id = upload.json()["id"]

    for method in ["isolation_forest", "local_outlier_factor"]:
        resp = client.post(
            f"/api/v1/datasets/{dataset_id}/unsupervised/anomaly",
            json={"method": method, "contamination": 0.1},
        )
        assert resp.status_code == 200, f"Anomaly detection failed for {method}: {resp.text}"
        res = resp.json()
        assert res["total_rows"] == 60
        assert res["anomaly_count"] > 0
        assert "top_anomalies" in res
        assert len(res["top_anomalies"]) > 0
