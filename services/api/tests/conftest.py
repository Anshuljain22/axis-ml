import os
import tempfile
from pathlib import Path
import pytest

# Configure settings before importing the app/database modules (which are module singletons).
_TEST_ROOT = Path(tempfile.mkdtemp(prefix="pitwall-test-"))
os.environ["DATABASE_URL"] = f"sqlite:///{(_TEST_ROOT / 'test.db').as_posix()}"
os.environ["ARTIFACT_DIR"] = str(_TEST_ROOT / "artifacts")
os.environ["MLFLOW_TRACKING_URI"] = f"file:{(_TEST_ROOT / 'mlruns').as_posix()}"

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine

@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)
