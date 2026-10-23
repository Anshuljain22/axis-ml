import io
import pandas as pd
import pytest


def make_sample_csv(rows: int = 50) -> bytes:
    """Create a sample dataset with numeric, categorical, and datetime columns."""
    dates = pd.date_range("2024-01-01", periods=rows, freq="30min")
    df = pd.DataFrame({
        "timestamp": dates.strftime("%Y-%m-%d %H:%M:%S"),
        "temperature": [20.0 + (i % 10) * 0.5 for i in range(rows)],
        "humidity": [60.0 - (i % 10) * 1.2 for i in range(rows)],
        "wind_speed": [5.0 + (i % 5) * 0.8 for i in range(rows)],
        "category": ["A" if i % 2 == 0 else "B" for i in range(rows)],
    })
    return df.to_csv(index=False).encode()


def make_edge_case_csv() -> bytes:
    """
    Create a dataset with:
    - a constant numeric column (constant_val)
    - an insufficient data / high missing numeric column (mostly_nan)
    - a column with undefined correlation due to zero variance
    - missing values
    """
    df = pd.DataFrame({
        "constant_val": [10.0] * 30,
        "mostly_nan": [1.0, None, None, None, None] * 6,
        "var_col": [float(i) for i in range(30)],
        "text_col": ["sample"] * 30,
    })
    return df.to_csv(index=False).encode()


def test_eda_diagnostics_endpoint_valid_dataset(client):
    """Test that the diagnostics endpoint returns expected keys on a valid dataset."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("weather.csv", make_sample_csv(), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    response = client.get(f"/api/v1/datasets/{dataset_id}/eda/diagnostics")
    assert response.status_code == 200
    data = response.json()

    assert data["dataset_id"] == dataset_id
    assert data["dataset_name"] == "weather"
    assert data["numeric_columns_analyzed"] == 3
    assert isinstance(data["constant_columns"], list)
    assert isinstance(data["insufficient_data_columns"], list)
    assert isinstance(data["undefined_correlation_pairs"], list)
    assert len(data["constant_columns"]) == 0
    assert len(data["undefined_correlation_pairs"]) == 0


def test_eda_summary_regression_contains_numeric_diagnostics(client):
    """
    Regression test for the Internal Server Error in build_eda_summary:
    Verifies that the unified EDA summary runs without error and includes
    the numeric_diagnostics object alongside all existing EDA fields.
    """
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("weather.csv", make_sample_csv(), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    response = client.get(f"/api/v1/datasets/{dataset_id}/eda/summary")
    assert response.status_code == 200
    data = response.json()

    # Core metadata
    assert data["dataset_id"] == dataset_id
    assert data["dataset_name"] == "weather"

    # Preserved summary sections
    assert "dataset" in data
    assert data["dataset"]["rows"] == 50
    assert data["dataset"]["columns"] == 5
    assert "column_summary" in data
    assert len(data["column_summary"]) == 5
    assert "numeric_statistics" in data
    assert "distributions" in data
    assert "correlations" in data
    assert "time_series" in data
    assert "warnings" in data

    # Newly integrated numeric diagnostics
    assert "numeric_diagnostics" in data
    diagnostics = data["numeric_diagnostics"]
    assert diagnostics["numeric_columns_analyzed"] == 3
    assert diagnostics["constant_columns"] == []
    assert diagnostics["insufficient_data_columns"] == []
    assert diagnostics["undefined_correlation_pairs"] == []


def test_eda_diagnostics_edge_cases_constant_and_undefined(client):
    """
    Verify that constant columns and undefined correlations are detected
    and trigger appropriate warnings in the unified EDA summary.
    """
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("edge_cases.csv", make_edge_case_csv(), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    # 1. Check direct diagnostics endpoint
    diag_res = client.get(f"/api/v1/datasets/{dataset_id}/eda/diagnostics")
    assert diag_res.status_code == 200
    diag = diag_res.json()

    assert "constant_val" in diag["constant_columns"]
    # Constant columns cause undefined Pearson correlations with any other column
    undefined_pairs = [
        (p["column_a"], p["column_b"]) for p in diag["undefined_correlation_pairs"]
    ]
    # Check that at least one undefined pair involving constant_val is reported
    assert any("constant_val" in pair for pair in undefined_pairs)

    # 2. Check unified summary warnings
    summary_res = client.get(f"/api/v1/datasets/{dataset_id}/eda/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()

    warning_types = [w["type"] for w in summary["warnings"]]
    assert "constant_column" in warning_types
    assert "undefined_correlation" in warning_types
    assert "missing_values" in warning_types


def test_eda_individual_endpoints(client):
    """Verify statistics, distributions, correlations, and time-series endpoints individually."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("weather.csv", make_sample_csv(), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    # Statistics
    stats_res = client.get(f"/api/v1/datasets/{dataset_id}/eda/statistics")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert "numeric_statistics" in stats
    assert "temperature" in stats["numeric_statistics"]

    # Distributions
    dist_res = client.get(f"/api/v1/datasets/{dataset_id}/eda/distributions?bins=5")
    assert dist_res.status_code == 200
    dist = dist_res.json()
    assert "distributions" in dist
    assert "temperature" in dist["distributions"]
    assert len(dist["distributions"]["temperature"]["bins"]) == 5

    # Invalid bins parameter
    bad_dist = client.get(f"/api/v1/datasets/{dataset_id}/eda/distributions?bins=0")
    assert bad_dist.status_code == 422
    bad_dist2 = client.get(f"/api/v1/datasets/{dataset_id}/eda/distributions?bins=51")
    assert bad_dist2.status_code == 422

    # Correlations
    corr_res = client.get(f"/api/v1/datasets/{dataset_id}/eda/correlations")
    assert corr_res.status_code == 200
    corr = corr_res.json()
    assert "correlations" in corr
    assert "temperature" in corr["correlations"]

    # Time-series
    ts_res = client.get(
        f"/api/v1/datasets/{dataset_id}/eda/time-series?datetime_column=timestamp"
    )
    assert ts_res.status_code == 200
    ts = ts_res.json()
    assert ts["datetime_column"] == "timestamp"
    assert ts["valid_timestamp_count"] == 50
    assert ts["duplicate_timestamp_count"] == 0
    assert ts["chronologically_sorted"] is True


def test_eda_time_series_unavailable_handles_gracefully(client):
    """
    Datasets without a usable datetime column should return 422 on the time-series endpoint,
    but the unified summary should complete successfully with a time_series_unavailable warning.
    """
    df = pd.DataFrame({"a": [1, 2, 3, 4], "b": [10, 20, 30, 40]})
    csv_bytes = df.to_csv(index=False).encode()
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("no_time.csv", csv_bytes, "text/csv")},
    )
    dataset_id = upload.json()["id"]

    # Time-series endpoint alone returns 422
    ts_res = client.get(f"/api/v1/datasets/{dataset_id}/eda/time-series")
    assert ts_res.status_code == 422

    # Unified summary handles it gracefully
    summary_res = client.get(f"/api/v1/datasets/{dataset_id}/eda/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["time_series"] is None
    warning_types = [w["type"] for w in summary["warnings"]]
    assert "time_series_unavailable" in warning_types


def test_eda_nonexistent_dataset(client):
    """Verify 404 is returned when requesting EDA for a nonexistent dataset."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    for endpoint in ["statistics", "distributions", "correlations", "time-series", "diagnostics", "summary"]:
        res = client.get(f"/api/v1/datasets/{fake_id}/eda/{endpoint}")
        assert res.status_code == 404


def test_eda_high_missingness_and_high_correlation(client):
    """Verify diagnostic detection of high missingness, high correlation, and standardized warning schema."""
    df = pd.DataFrame({
        "col_a": [float(i) for i in range(25)],
        "col_b": [float(2 * i) for i in range(25)],  # Pearson r = 1.0 with col_a
        "mostly_empty": [1.0] * 5 + [None] * 20,     # 80% missing
    })
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("diagnostics_test.csv", df.to_csv(index=False).encode(), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    # 1. Direct diagnostics endpoint
    diag_res = client.get(f"/api/v1/datasets/{dataset_id}/eda/diagnostics")
    assert diag_res.status_code == 200
    diag = diag_res.json()

    assert any(c["column"] == "mostly_empty" for c in diag["high_missing_columns"])
    assert any(
        (p["column_a"] == "col_a" and p["column_b"] == "col_b") or
        (p["column_a"] == "col_b" and p["column_b"] == "col_a")
        for p in diag["high_correlation_pairs"]
    )

    # 2. Unified summary warnings schema validation
    summary_res = client.get(f"/api/v1/datasets/{dataset_id}/eda/summary")
    assert summary_res.status_code == 200
    summary = summary_res.json()

    warning_types = [w["type"] for w in summary["warnings"]]
    assert "high_missingness" in warning_types
    assert "high_correlation" in warning_types

    # Ensure every warning conforms to the standardized schema
    for w in summary["warnings"]:
        assert "type" in w
        assert "severity" in w
        assert w["severity"] in ("info", "warning", "critical")
        assert "message" in w
        assert "column" in w
        assert "columns" in w


def test_eda_non_finite_values_handling(client):
    """Verify that Inf and -Inf values do not crash descriptive stats or distributions."""
    csv_content = b"val_a,val_b\n1.0,10.0\ninf,20.0\n-inf,30.0\n4.0,40.0\n"
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("infs.csv", csv_content, "text/csv")},
    )
    dataset_id = upload.json()["id"]

    stats_res = client.get(f"/api/v1/datasets/{dataset_id}/eda/statistics")
    assert stats_res.status_code == 200

    dist_res = client.get(f"/api/v1/datasets/{dataset_id}/eda/distributions")
    assert dist_res.status_code == 200

    summary_res = client.get(f"/api/v1/datasets/{dataset_id}/eda/summary")
    assert summary_res.status_code == 200

