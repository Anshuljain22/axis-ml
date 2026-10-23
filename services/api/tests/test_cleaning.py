import pandas as pd
import pytest


def make_dirty_csv() -> bytes:
    """Create a dataset with duplicates, missing values, outliers, and type issues."""
    df = pd.DataFrame({
        "id": [1, 2, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        "age": [25.0, 30.0, 30.0, None, 45.0, 50.0, 55.0, 60.0, 65.0, 70.0, 200.0],  # 200 is an outlier
        "city": ["NY", "SF", "SF", "LA", "NY", "SF", None, "LA", "NY", "SF", "LA"],
        "num_str": ["10", "20", "20", "30", "40", "50", "60", "70", "80", "90", "100"],
    })
    return df.to_csv(index=False).encode()


def test_cleaning_preview_does_not_mutate_original(client):
    """Verify that previewing cleaning operations does not alter the original dataset."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("dirty.csv", make_dirty_csv(), "text/csv")},
    )
    assert upload.status_code == 201
    dataset_id = upload.json()["id"]

    preview_payload = {
        "operations": [
            {"operation": "drop_duplicates"},
            {"operation": "fill_missing", "column": "age", "strategy": "median"},
            {"operation": "convert_type", "column": "num_str", "dtype": "integer"},
            {"operation": "cap_outliers", "column": "age", "multiplier": 1.5},
        ]
    }

    res = client.post(f"/api/v1/datasets/{dataset_id}/cleaning/preview", json=preview_payload)
    assert res.status_code == 200
    data = res.json()

    assert data["original_file_unchanged"] is True
    assert data["operations_applied"] == 4
    assert len(data["changes"]) == 4

    # Verify original dataset record remains untouched
    original = client.get(f"/api/v1/datasets/{dataset_id}").json()
    assert original["rows"] == 11
    assert original["columns"] == 4


def test_cleaning_apply_creates_separate_dataset_with_lineage(client):
    """
    Verify that applying cleaning operations creates a distinct new dataset
    with lineage pointing to the parent dataset.
    """
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("dirty.csv", make_dirty_csv(), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    apply_payload = {
        "operations": [
            {"operation": "drop_duplicates"},
            {"operation": "fill_missing", "column": "age", "strategy": "mean"},
        ]
    }

    apply_res = client.post(f"/api/v1/datasets/{dataset_id}/cleaning/apply", json=apply_payload)
    assert apply_res.status_code == 201
    cleaned = apply_res.json()

    # Brand new dataset ID
    assert cleaned["id"] != dataset_id
    assert "(cleaned)" in cleaned["name"]
    assert cleaned["rows"] == 10  # 1 duplicate dropped

    # Check lineage in profile
    assert "lineage" in cleaned["profile"]
    lineage = cleaned["profile"]["lineage"]
    assert lineage["parent_dataset_id"] == dataset_id
    assert lineage["operations_applied"] == 2

    # Verify original dataset is still intact
    orig_res = client.get(f"/api/v1/datasets/{dataset_id}")
    assert orig_res.status_code == 200
    assert orig_res.json()["rows"] == 11


def test_cleaning_validation_errors(client):
    """Verify error handling for invalid operations or nonexistent columns."""
    upload = client.post(
        "/api/v1/datasets",
        files={"file": ("dirty.csv", make_dirty_csv(), "text/csv")},
    )
    dataset_id = upload.json()["id"]

    # Nonexistent column
    bad_col = client.post(
        f"/api/v1/datasets/{dataset_id}/cleaning/preview",
        json={"operations": [{"operation": "drop_column", "column": "non_existent"}]},
    )
    assert bad_col.status_code == 422

    # Unsupported operation
    bad_op = client.post(
        f"/api/v1/datasets/{dataset_id}/cleaning/preview",
        json={"operations": [{"operation": "magic_clean"}]},
    )
    assert bad_op.status_code == 422
