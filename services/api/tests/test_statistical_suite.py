import numpy as np
import pandas as pd
import pytest


def make_stat_dataset(rows: int = 50) -> bytes:
    np.random.seed(42)
    normal_col = np.random.normal(loc=10.0, scale=2.0, size=rows)
    skewed_col = np.random.exponential(scale=5.0, size=rows)
    # Collinear feature with pressure
    pressure = np.linspace(50, 150, rows)
    pressure_collinear = pressure * 2.0 + np.random.normal(0, 0.01, size=rows)
    category_a = ["GroupX" if i % 2 == 0 else "GroupY" for i in range(rows)]
    category_b = ["Cat1" if i % 3 == 0 else "Cat2" for i in range(rows)]
    time_seq = [f"2026-06-{1 + (i % 28):02d} {i % 24:02d}:00:00" for i in range(rows)]

    df = pd.DataFrame({
        "timestamp": time_seq,
        "normal_val": normal_col,
        "skewed_val": skewed_col,
        "pressure": pressure,
        "pressure_collinear": pressure_collinear,
        "group": category_a,
        "category": category_b,
        "target_reg": normal_col * 1.5 + pressure * 0.5,
        "target_clf": category_a,
    })
    return df.to_csv(index=False).encode()


def test_normality_endpoint(client):
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("stat_test.csv", make_stat_dataset(50), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    res = client.get(f"/api/v1/datasets/{dataset_id}/eda/normality")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "normality_results" in data
    assert "normal_val" in data["normality_results"]
    assert "shapiro_p_value" in data["normality_results"]["normal_val"]
    assert "skewness" in data["normality_results"]["normal_val"]


def test_vif_endpoint(client):
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("vif_test.csv", make_stat_dataset(50), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    res = client.get(f"/api/v1/datasets/{dataset_id}/eda/vif")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "vif_results" in data
    assert "pressure" in data["vif_results"]
    assert "pressure_collinear" in data["vif_results"]
    assert data["high_multicollinearity_detected"] is True
    assert data["vif_results"]["pressure"]["vif"] >= 5.0


def test_stationarity_endpoint(client):
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("ts_stat.csv", make_stat_dataset(50), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    res = client.get(
        f"/api/v1/datasets/{dataset_id}/eda/stationarity?value_column=normal_val&datetime_column=timestamp"
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert "adf_test" in data
    assert "kpss_test" in data
    assert "verdict" in data
    assert "statistic" in data["adf_test"]


def test_hypothesis_tests_endpoint(client):
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("hypo.csv", make_stat_dataset(50), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    # 1. Independent T-Test
    t_res = client.post(
        f"/api/v1/datasets/{dataset_id}/eda/hypothesis-test",
        json={
            "test_type": "two_sample_t_test",
            "col_a": "normal_val",
            "group_col": "group",
        },
    )
    assert t_res.status_code == 200, t_res.text
    t_data = t_res.json()
    assert "statistic" in t_data
    assert "p_value" in t_data
    assert "significant" in t_data

    # 2. ANOVA
    anova_res = client.post(
        f"/api/v1/datasets/{dataset_id}/eda/hypothesis-test",
        json={
            "test_type": "one_way_anova",
            "col_a": "normal_val",
            "group_col": "group",
        },
    )
    assert anova_res.status_code == 200, anova_res.text
    assert anova_res.json()["test_name"].startswith("One-Way ANOVA")

    # 3. Chi-Square
    chi_res = client.post(
        f"/api/v1/datasets/{dataset_id}/eda/hypothesis-test",
        json={
            "test_type": "chi_square",
            "col_a": "group",
            "col_b": "category",
        },
    )
    assert chi_res.status_code == 200, chi_res.text
    assert "cramers_v" in chi_res.json()


def test_correlations_extended_endpoint(client):
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("corr_ext.csv", make_stat_dataset(50), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    res = client.get(f"/api/v1/datasets/{dataset_id}/eda/correlations-extended")
    assert res.status_code == 200, res.text
    data = res.json()
    assert "pearson" in data
    assert "spearman" in data
    assert "kendall" in data


def test_feature_selection_endpoint(client):
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("feat_sel.csv", make_stat_dataset(50), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    res = client.post(
        f"/api/v1/datasets/{dataset_id}/feature-selection",
        json={"target_column": "target_reg", "k": 3},
    )
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["task_type"] == "regression"
    assert "recommended_features" in data
    assert len(data["recommended_features"]) == 3
    assert len(data["feature_rankings"]) > 0
    assert "mutual_information" in data["feature_rankings"][0]
    assert "rfe_rank" in data["feature_rankings"][0]


def test_advanced_cleaning_operations(client):
    # CSV with nulls and extreme outliers
    df = pd.DataFrame({
        "num": [1.0, None, 3.0, None, 5.0, 1000.0],
        "label": ["A", "B", "C", "D", "E", "F"],
    })
    csv_bytes = df.to_csv(index=False).encode()

    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("clean_adv.csv", csv_bytes, "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    # Preview ffill, zscore capping, and rename
    preview = client.post(
        f"/api/v1/datasets/{dataset_id}/cleaning/preview",
        json={
            "operations": [
                {"operation": "ffill", "column": "num"},
                {"operation": "cap_outliers_zscore", "column": "num", "z_threshold": 2.0},
                {"operation": "rename_column", "column": "label", "new_name": "category_name"},
            ]
        },
    )
    assert preview.status_code == 200, preview.text
    data = preview.json()
    assert len(data["changes"]) == 3
    assert data["remaining_missing_values"]["num"] == 0


def test_pipeline_new_scalers_and_imputers(client):
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("pipe_adv.csv", make_stat_dataset(50), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    # 1. Preview pipeline with quantile scaler and knn imputer
    preview = client.post(
        f"/api/v1/datasets/{dataset_id}/pipeline/preview",
        json={
            "target_column": "target_reg",
            "numeric_scaler": "quantile",
            "numeric_imputer": "knn",
        },
    )
    assert preview.status_code == 200, preview.text

    # 2. Train model with power transformer (Yeo-Johnson)
    train_res = client.post(
        f"/api/v1/datasets/{dataset_id}/runs",
        json={
            "target_column": "target_reg",
            "task_type": "regression",
            "model_name": "ridge",
            "numeric_scaler": "power",
            "numeric_imputer": "median",
            "test_size": 0.2,
        },
    )
    assert train_res.status_code == 201, train_res.text
    assert "r2" in train_res.json()["metrics"]
