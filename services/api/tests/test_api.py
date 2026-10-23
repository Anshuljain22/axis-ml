import io
import pandas as pd

def make_csv(rows=80):
    df = pd.DataFrame({"age": list(range(rows)), "income": [float(i * 100) for i in range(rows)], "segment": ["a" if i % 2 else "b" for i in range(rows)], "purchased": ["yes" if i % 3 else "no" for i in range(rows)]})
    return df.to_csv(index=False).encode()

def test_health(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_csv_upload_profile_and_quality(client):
    response = client.post("/api/v1/datasets", files={"file": ("customers.csv", make_csv(), "text/csv")})
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["filename"] == "customers.csv"
    assert data["rows"] == 80
    assert data["columns"] == 4
    assert data["profile"]["column_count"] == 4
    assert data["quality"]["total"] == 4
    assert client.get(f"/api/v1/datasets/{data['id']}").status_code == 200

def test_reject_non_csv(client):
    response = client.post("/api/v1/datasets", files={"file": ("notes.txt", b"hello", "text/plain")})
    assert response.status_code == 415

def test_train_baseline_and_persist_run(client):
    upload = client.post("/api/v1/datasets", files={"file": ("customers.csv", make_csv(), "text/csv")})
    dataset_id = upload.json()["id"]
    response = client.post(f"/api/v1/datasets/{dataset_id}/runs", json={"target_column": "purchased", "task_type": "classification"})
    assert response.status_code == 201, response.text
    run = response.json()
    assert run["status"] == "completed"
    assert "accuracy" in run["metrics"]
    assert run["artifact_path"].endswith("model.joblib")
    assert client.get(f"/api/v1/runs/{run['id']}").status_code == 200

def test_train_rejects_missing_target(client):
    upload = client.post("/api/v1/datasets", files={"file": ("customers.csv", make_csv(), "text/csv")})
    response = client.post(f"/api/v1/datasets/{upload.json()['id']}/runs", json={"target_column": "missing", "task_type": "classification"})
    assert response.status_code == 422

def test_reject_empty_csv(client):
    response = client.post("/api/v1/datasets", files={"file": ("empty.csv", b"", "text/csv")})
    assert response.status_code == 422

def test_reject_duplicate_columns(client):
    dup_csv = b"col_a,col_a\n1,2\n3,4\n"
    response = client.post("/api/v1/datasets", files={"file": ("dup.csv", dup_csv, "text/csv")})
    assert response.status_code == 422

def test_inspect_dataset_endpoint(client):
    upload = client.post("/api/v1/datasets", files={"file": ("customers.csv", make_csv(), "text/csv")})
    dataset_id = upload.json()["id"]
    res = client.get(f"/api/v1/datasets/{dataset_id}/inspect")
    assert res.status_code == 200
    data = res.json()
    assert data["dataset_id"] == dataset_id
    assert "inspection" in data
    assert data["inspection"]["rows"] == 80
    assert data["inspection"]["columns"] == 4

def test_dataset_not_found(client):
    res = client.get("/api/v1/datasets/nonexistent-id")
    assert res.status_code == 404

