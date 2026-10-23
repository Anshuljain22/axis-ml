from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_name: str = "Pitwall OS Core API"
    environment: str = "development"
    database_url: str = "sqlite:///./pitwall.db"
    artifact_dir: str = "./artifacts"
    mlflow_tracking_uri: str = "file:./artifacts/mlruns"
    max_upload_bytes: int = 25 * 1024 * 1024
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

@lru_cache
def get_settings() -> Settings:
    return Settings()
