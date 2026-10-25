from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DatasetOut(BaseModel):
    id: str
    name: str
    filename: str
    bytes: int
    rows: int
    columns: int
    profile: dict
    quality: dict
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TrainRequest(BaseModel):
    target_column: str
    task_type: str = "auto"  # auto, classification, regression
    model_name: str = "auto"  # auto, ridge, logistic_regression, random_forest, gradient_boosting
    split_strategy: str = "random"  # random, chronological
    test_size: float = 0.2
    random_state: int = 42
    cv_folds: int = 0  # 0 or 2..10
    numeric_scaler: str = "standard"  # standard, minmax, robust, none
    numeric_imputer: str = "median"   # median, mean
    datetime_handling: str = "extract" # extract, ignore


class PipelinePreviewRequest(BaseModel):
    target_column: str
    numeric_scaler: str = "standard"
    numeric_imputer: str = "median"
    datetime_handling: str = "extract"
    sample_rows: int = 5


class PipelinePreviewResponse(BaseModel):
    original_features_count: int
    original_features: list[str]
    transformed_features_count: int
    transformed_feature_names: list[str]
    sample_preview: list[dict]
    configuration: dict


class BatchPredictRequest(BaseModel):
    samples: list[dict]


class BatchPredictResponse(BaseModel):
    run_id: str
    model_name: str
    target_column: str
    count: int
    predictions: list
    probabilities: list | None = None


class ModelComparisonResponse(BaseModel):
    dataset_id: str | None
    task_type: str
    total_runs_evaluated: int
    best_run_id: str | None
    ranking_metric: str
    ranked_runs: list[dict]


class RunOut(BaseModel):
    id: str
    dataset_id: str
    target_column: str
    task_type: str
    model_name: str
    status: str
    metrics: dict
    parameters: dict
    artifact_path: str | None
    mlflow_run_id: str | None
    error: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class HypothesisTestRequest(BaseModel):
    test_type: str
    col_a: str
    col_b: str | None = None
    group_col: str | None = None
    alpha: float = 0.05


class FeatureSelectionRequest(BaseModel):
    target_column: str
    k: int | None = None


class ClusteringRequest(BaseModel):
    method: str = "kmeans"
    n_clusters: int = 3
    features: list[str] | None = None


class PcaRequest(BaseModel):
    n_components: int = 2
    features: list[str] | None = None


class AnomalyDetectionRequest(BaseModel):
    method: str = "isolation_forest"
    contamination: float = 0.05
    features: list[str] | None = None

