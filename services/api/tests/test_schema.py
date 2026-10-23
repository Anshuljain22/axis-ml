import pandas as pd
import pytest
from app.services.dataset_schema import (
    apply_schema_to_dataframe,
    infer_dataset_schema,
    load_dataset_dataframe,
)


def make_schema_test_csv() -> bytes:
    df = pd.DataFrame({
        "id_col": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "measurement": [10.5, 20.2, 30.8, 40.1, 50.9, 60.3, 70.4, 80.7, 90.0, 100.5],
        "category_tag": ["high", "low", "med", "high", "low", "med", "high", "low", "med", "high"],
        "date_str": [f"2024-01-{i:02d} 10:00:00" for i in range(1, 11)],
    })
    return df.to_csv(index=False).encode()


def test_upload_creates_and_retrieves_schema(client):
    """Test that CSV upload registers an inferred schema and exposes it via API."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("experiment.csv", make_schema_test_csv(), "text/csv")},
    )
    assert upload.status_code == 201
    dataset = upload.json()
    dataset_id = dataset["id"]

    # Verify schema in dataset profile
    assert "schema" in dataset["profile"]
    schema = dataset["profile"]["schema"]
    assert schema["column_count"] == 4
    assert "date_str" in schema["datetime_columns"]
    assert "measurement" in schema["numeric_columns"]
    assert "category_tag" in schema["categorical_columns"]

    # Test dedicated GET /schema endpoint
    schema_res = client.get(f"/api/v1/datasets/{dataset_id}/schema")
    assert schema_res.status_code == 200
    schema_data = schema_res.json()
    assert schema_data["dataset_id"] == dataset_id
    assert len(schema_data["columns"]) == 4

    col_map = {c["name"]: c for c in schema_data["columns"]}
    assert col_map["measurement"]["logical_type"] == "numeric"
    assert col_map["date_str"]["logical_type"] == "datetime"
    assert col_map["category_tag"]["logical_type"] == "categorical"


def test_schema_preserves_dtypes_after_cleaning(client):
    """
    Test that cleaning operations (e.g. convert_type to datetime) are persisted
    in the schema and re-applied when inspected or reloaded, resolving the loss
    of dtypes across CSV reloads.
    """
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("experiment.csv", make_schema_test_csv(), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    apply_payload = {
        "operations": [
            {"operation": "convert_type", "column": "date_str", "dtype": "datetime"},
            {"operation": "convert_type", "column": "id_col", "dtype": "integer"},
        ]
    }
    cleaned_res = client.post(f"/api/v1/datasets/{dataset_id}/cleaning/apply", json=apply_payload)
    assert cleaned_res.status_code == 201
    cleaned_id = cleaned_res.json()["id"]

    # 1. Verify schema on cleaned dataset
    schema_res = client.get(f"/api/v1/datasets/{cleaned_id}/schema")
    assert schema_res.status_code == 200
    cleaned_schema = schema_res.json()

    col_map = {c["name"]: c for c in cleaned_schema["columns"]}
    assert col_map["date_str"]["logical_type"] == "datetime"
    assert "datetime" in col_map["date_str"]["physical_type"]
    assert col_map["id_col"]["logical_type"] == "integer"
    assert col_map["id_col"]["physical_type"] == "Int64"

    # 2. Verify inspection reloads with preserved dtypes
    inspect_res = client.get(f"/api/v1/datasets/{cleaned_id}/inspect")
    assert inspect_res.status_code == 200
    inspect_data = inspect_res.json()

    col_details = {c["name"]: c for c in inspect_data["inspection"]["column_details"]}
    # date_str is preserved as datetime64[ns], not lost as object!
    assert "datetime" in col_details["date_str"]["dtype"]
    assert "Int64" in col_details["id_col"]["dtype"]

    # 3. Verify lineage links
    profile = cleaned_res.json()["profile"]
    assert profile["lineage"]["parent_dataset_id"] == dataset_id
    assert "schema" in profile["lineage"]


def test_apply_schema_to_dataframe_pure_helper():
    """Unit test for apply_schema_to_dataframe with various types."""
    raw_df = pd.DataFrame({
        "time": ["2024-01-01", "2024-01-02"],
        "num": ["10", "20"],
        "cat": ["a", "b"],
    })
    schema = {
        "columns": [
            {"name": "time", "logical_type": "datetime", "physical_type": "datetime64[ns]"},
            {"name": "num", "logical_type": "integer", "physical_type": "Int64"},
            {"name": "cat", "logical_type": "categorical", "physical_type": "category"},
        ]
    }

    typed_df = apply_schema_to_dataframe(raw_df, schema)
    assert pd.api.types.is_datetime64_any_dtype(typed_df["time"])
    assert str(typed_df["num"].dtype) == "Int64"
    assert typed_df["cat"].dtype.name == "category"
