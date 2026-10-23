import joblib
from fastapi import Body
from pathlib import Path
from uuid import uuid4
import pandas as pd
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.core.config import get_settings
from app.core.database import get_db
from app.models.entities import Dataset, ExperimentRun
from app.schemas.datasets import (
    BatchPredictRequest,
    BatchPredictResponse,
    DatasetOut,
    ModelComparisonResponse,
    PipelinePreviewRequest,
    PipelinePreviewResponse,
    RunOut,
    TrainRequest,
)
from app.services.data_quality import build_profile, build_quality_report
from app.services.pipeline import preview_pipeline_transform
from app.services.training import TrainingError, train_baseline
from app.schemas.cleaning import CleaningPreviewRequest
from app.services.cleaning import (
    CleaningError,
    inspect_dataframe,
    preview_cleaning,
)

from app.services.eda import (
    EDAError,
    build_eda_summary,
    correlation_analysis,
    descriptive_statistics,
    distribution_analysis,
    time_series_analysis,
    numeric_column_diagnostics,
)
from app.services.dataset_schema import (
    build_schema_from_cleaning,
    infer_dataset_schema,
    load_dataset_dataframe,
    save_dataset_schema_sidecar,
)

router = APIRouter(prefix="/api/v1")
settings = get_settings()


@router.get("/datasets/{dataset_id}/schema")
def get_dataset_schema(
    dataset_id: str,
    db: Session = Depends(get_db),
):
    """Return the persisted or inferred schema for a dataset."""
    dataset = db.get(Dataset, dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    schema = dataset.profile.get("schema")
    if not schema:
        try:
            df = load_dataset_dataframe(dataset.path, dataset.profile)
            schema = infer_dataset_schema(df)
        except Exception as exc:
            raise HTTPException(
                status_code=422,
                detail=f"Could not infer dataset schema: {exc}",
            ) from exc

    return {
        "dataset_id": dataset.id,
        "dataset_name": dataset.name,
        **schema,
    }


@router.get("/datasets/{dataset_id}/eda/diagnostics")
def get_dataset_numeric_diagnostics(
    dataset_id: str,
    db: Session = Depends(get_db),
):
    """Return diagnostics for numeric columns and correlations."""

    dataset = db.get(Dataset, dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    try:
        return {
            "dataset_id": dataset.id,
            "dataset_name": dataset.name,
            **numeric_column_diagnostics(dataset.path),
        }
    except EDAError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc


@router.get("/datasets/{dataset_id}/eda/summary")
def get_dataset_eda_summary(
    dataset_id: str,
    bins: int = 10,
    datetime_column: str | None = None,
    db: Session = Depends(get_db),
):
    """Return a combined exploratory data analysis report."""

    if not 1 <= bins <= 50:
        raise HTTPException(
            status_code=422,
            detail="bins must be between 1 and 50.",
        )

    dataset = db.get(Dataset, dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    try:
        return {
            "dataset_id": dataset.id,
            "dataset_name": dataset.name,
            **build_eda_summary(
                dataset.path,
                datetime_column=datetime_column,
                bins=bins,
            ),
        }
    except EDAError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

@router.get("/datasets/{dataset_id}/eda/time-series")
def get_dataset_time_series(
    dataset_id: str,
    datetime_column: str | None = None,
    db: Session = Depends(get_db),
):
    """Return temporal structure and sampling diagnostics."""

    dataset = db.get(Dataset, dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    try:
        return {
            "dataset_id": dataset.id,
            "dataset_name": dataset.name,
            **time_series_analysis(
                dataset.path,
                datetime_column=datetime_column,
            ),
        }
    except EDAError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc


@router.get("/datasets/{dataset_id}/eda/correlations")
def get_dataset_correlations(
    dataset_id: str,
    db: Session = Depends(get_db),
):
    """Return pairwise Pearson correlations for numeric columns."""

    dataset = db.get(Dataset, dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    try:
        return {
            "dataset_id": dataset.id,
            "dataset_name": dataset.name,
            **correlation_analysis(dataset.path),
        }
    except EDAError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

@router.get("/datasets/{dataset_id}/eda/statistics")
def get_dataset_statistics(
    dataset_id: str,
    db: Session = Depends(get_db),
):
    """Return descriptive statistics for a registered dataset."""

    dataset = db.get(Dataset, dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    try:
        return {
            "dataset_id": dataset.id,
            "dataset_name": dataset.name,
            **descriptive_statistics(dataset.path),
        }
    except EDAError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

@router.get("/datasets/{dataset_id}/eda/distributions")
def get_dataset_distributions(
    dataset_id: str,
    bins: int = 10,
    db: Session = Depends(get_db),
):
    """Return histogram and outlier summaries for numeric columns."""

    if not 1 <= bins <= 50:
        raise HTTPException(
            status_code=422,
            detail="bins must be between 1 and 50.",
        )

    dataset = db.get(Dataset, dataset_id)

    if dataset is None:
        raise HTTPException(
            status_code=404,
            detail="Dataset not found.",
        )

    try:
        return {
            "dataset_id": dataset.id,
            "dataset_name": dataset.name,
            **distribution_analysis(dataset.path, bins=bins),
        }
    except EDAError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc

@router.get("/datasets/{dataset_id}/inspect")
def inspect_dataset(
    dataset_id: str,
    db: Session = Depends(get_db),
):
    """Return detailed dataset information for the Data Lab."""
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id
    ).first()

    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        df = load_dataset_dataframe(dataset.path, dataset.profile)
        return {
            "dataset_id": dataset.id,
            "dataset_name": dataset.name,
            "inspection": inspect_dataframe(df),
            "schema": dataset.profile.get("schema") or infer_dataset_schema(df),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not inspect dataset: {exc}",
        ) from exc


@router.post("/datasets/{dataset_id}/cleaning/preview")
def preview_dataset_cleaning(
    dataset_id: str,
    request: CleaningPreviewRequest,
    db: Session = Depends(get_db),
):
    """
    Preview cleaning operations without saving or changing
    the original dataset.
    """
    dataset = db.query(Dataset).filter(
        Dataset.id == dataset_id
    ).first()

    if dataset is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    try:
        df = pd.read_csv(dataset.path)

        operations = [
            operation.model_dump()
            for operation in request.operations
        ]

        result = preview_cleaning(df, operations)

        return {
            "dataset_id": dataset.id,
            "dataset_name": dataset.name,
            "original_file_unchanged": True,
            **result,
        }

    except CleaningError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Cleaning preview failed: {exc}",
        ) from exc
@router.post(
    "/datasets/{dataset_id}/cleaning/apply",
    response_model=DatasetOut,
    status_code=201,
)
def apply_dataset_cleaning(
    dataset_id: str,
    request: CleaningPreviewRequest,
    db: Session = Depends(get_db),
):
    """Apply cleaning operations and register the result as a new dataset."""
    source = db.get(Dataset, dataset_id)

    if source is None:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    target: Path | None = None

    try:
        source_df = pd.read_csv(source.path)

        operations = [
            operation.model_dump()
            for operation in request.operations
        ]

        result = preview_cleaning(
            source_df,
            operations,
            include_dataframe=True,
        )

        cleaned_df = result.pop("_cleaned_dataframe")

        if cleaned_df.empty or len(cleaned_df.columns) == 0:
            raise HTTPException(
                status_code=422,
                detail="Cleaning cannot produce an empty dataset or remove all columns.",
            )

        # Store the result as a separate file; never overwrite the source.
        dataset_id_new = str(uuid4())
        root = Path(settings.artifact_dir).resolve() / "datasets"
        root.mkdir(parents=True, exist_ok=True)

        target = root / f"{dataset_id_new}.csv"
        cleaned_df.to_csv(target, index=False)

        size = target.stat().st_size

        parent_schema = source.profile.get("schema")
        cleaned_schema = build_schema_from_cleaning(
            parent_schema,
            cleaned_df,
            operations,
        )
        save_dataset_schema_sidecar(target, cleaned_schema)

        profile = build_profile(cleaned_df)
        profile["schema"] = cleaned_schema
        profile["lineage"] = {
            "parent_dataset_id": source.id,
            "operations": operations,
            "operations_applied": result["operations_applied"],
            "changes": result["changes"],
            "schema": cleaned_schema,
        }

        cleaned_dataset = Dataset(
            id=dataset_id_new,
            name=f"{source.name} (cleaned)"[:255],
            filename=f"cleaned_{source.filename}"[:255],
            path=str(target),
            bytes=size,
            rows=int(len(cleaned_df)),
            columns=int(len(cleaned_df.columns)),
            profile=profile,
            quality=build_quality_report(cleaned_df),
        )

        db.add(cleaned_dataset)
        db.commit()
        db.refresh(cleaned_dataset)

        return cleaned_dataset

    except CleaningError as exc:
        db.rollback()
        if target is not None:
            target.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    except HTTPException:
        db.rollback()
        if target is not None:
            target.unlink(missing_ok=True)
        raise

    except Exception as exc:
        db.rollback()
        if target is not None:
            target.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail=f"Could not apply cleaning operations: {exc}",
        ) from exc

@router.get("/health")
def health():
    return {"status": "ok", "service": settings.app_name, "mode": settings.environment, "note": "ML training is synchronous in this MVP; uploaded datasets and run artifacts are stored on the configured artifact volume."}

@router.post("/datasets", response_model=DatasetOut, status_code=201)
async def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=415, detail="Only .csv files are supported")
    root = Path(settings.artifact_dir).resolve() / "datasets"
    root.mkdir(parents=True, exist_ok=True)
    dataset_id = str(uuid4())
    target = root / f"{dataset_id}.csv"
    size = 0
    try:
        with target.open("wb") as dest:
            while chunk := await file.read(1024 * 1024):
                size += len(chunk)
                if size > settings.max_upload_bytes:
                    raise HTTPException(status_code=413, detail=f"CSV exceeds {settings.max_upload_bytes} byte limit")
                dest.write(chunk)
        import csv
        try:
            with target.open("r", encoding="utf-8", errors="replace") as f:
                reader = csv.reader(f)
                header = next(reader, None)
                if header and len(header) != len(set(header)):
                    raise HTTPException(status_code=422, detail="CSV contains duplicate column names")
        except HTTPException:
            raise
        except Exception:
            pass

        try:
            df = pd.read_csv(target)
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f"Could not parse CSV: {exc}") from exc
        if df.empty or len(df.columns) == 0:
            raise HTTPException(status_code=422, detail="CSV must contain at least one row and one column")
        if len(df.columns) > 500:
            raise HTTPException(status_code=422, detail="CSV exceeds the 500-column limit")
        if not df.columns.is_unique:
            raise HTTPException(status_code=422, detail="CSV contains duplicate column names")

        schema = infer_dataset_schema(df)
        save_dataset_schema_sidecar(target, schema)

        profile = build_profile(df)
        profile["schema"] = schema

        entity = Dataset(
            id=dataset_id,
            name=Path(file.filename).stem[:255],
            filename=file.filename[:255],
            path=str(target),
            bytes=size,
            rows=int(len(df)),
            columns=int(len(df.columns)),
            profile=profile,
            quality=build_quality_report(df),
        )
        db.add(entity)
        db.commit()
        db.refresh(entity)
        return entity
    except HTTPException:
        target.unlink(missing_ok=True)
        raise
    except Exception as exc:
        target.unlink(missing_ok=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Dataset ingestion failed: {exc}") from exc

@router.get("/datasets", response_model=list[DatasetOut])
def list_datasets(db: Session = Depends(get_db)):
    return db.query(Dataset).order_by(Dataset.created_at.desc()).all()

@router.get("/datasets/{dataset_id}", response_model=DatasetOut)
def get_dataset(dataset_id: str, db: Session = Depends(get_db)):
    entity = db.get(Dataset, dataset_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return entity

@router.post(
    "/datasets/{dataset_id}/pipeline/preview",
    response_model=PipelinePreviewResponse,
)
def preview_dataset_pipeline(
    dataset_id: str,
    request: PipelinePreviewRequest,
    db: Session = Depends(get_db),
):
    """
    Preview the transformed feature matrix, extracted datetime features,
    and column encodings prior to model training.
    """
    if request.numeric_scaler not in {"standard", "minmax", "robust", "none"}:
        raise HTTPException(
            status_code=422,
            detail="numeric_scaler must be one of: standard, minmax, robust, none",
        )
    if request.numeric_imputer not in {"median", "mean"}:
        raise HTTPException(
            status_code=422,
            detail="numeric_imputer must be one of: median, mean",
        )
    if request.datetime_handling not in {"extract", "ignore"}:
        raise HTTPException(
            status_code=422,
            detail="datetime_handling must be one of: extract, ignore",
        )
    if not 1 <= request.sample_rows <= 100:
        raise HTTPException(
            status_code=422,
            detail="sample_rows must be between 1 and 100",
        )

    entity = db.get(Dataset, dataset_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        df = load_dataset_dataframe(entity.path, entity.profile)
        return preview_pipeline_transform(
            df,
            request.target_column,
            numeric_scaler=request.numeric_scaler,
            numeric_imputer=request.numeric_imputer,
            datetime_handling=request.datetime_handling,
            sample_rows=request.sample_rows,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Pipeline preview failed: {exc}",
        ) from exc


@router.post("/datasets/{dataset_id}/runs", response_model=RunOut, status_code=201)
def train_dataset(dataset_id: str, request: TrainRequest, db: Session = Depends(get_db)):
    if not 0.1 <= request.test_size <= 0.5:
        raise HTTPException(status_code=422, detail="test_size must be between 0.1 and 0.5")
    if request.numeric_scaler not in {"standard", "minmax", "robust", "none"}:
        raise HTTPException(
            status_code=422,
            detail="numeric_scaler must be one of: standard, minmax, robust, none",
        )
    if request.numeric_imputer not in {"median", "mean"}:
        raise HTTPException(
            status_code=422,
            detail="numeric_imputer must be one of: median, mean",
        )
    if request.datetime_handling not in {"extract", "ignore"}:
        raise HTTPException(
            status_code=422,
            detail="datetime_handling must be one of: extract, ignore",
        )
    if request.split_strategy not in {"random", "chronological"}:
        raise HTTPException(
            status_code=422,
            detail="split_strategy must be one of: random, chronological",
        )
    if request.cv_folds != 0 and not (2 <= request.cv_folds <= 10):
        raise HTTPException(
            status_code=422,
            detail="cv_folds must be 0 (no CV) or between 2 and 10",
        )

    allowed_models = {"auto", "ridge", "logistic_regression", "random_forest", "gradient_boosting"}
    if request.model_name.lower().strip() not in allowed_models:
        raise HTTPException(
            status_code=422,
            detail=f"model_name must be one of: {', '.join(sorted(allowed_models))}",
        )

    entity = db.get(Dataset, dataset_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Dataset not found")
    try:
        result = train_baseline(
            entity.path,
            entity.id,
            request.target_column,
            request.task_type,
            request.test_size,
            request.random_state,
            settings.artifact_dir,
            settings.mlflow_tracking_uri,
            model_name=request.model_name,
            split_strategy=request.split_strategy,
            cv_folds=request.cv_folds,
            numeric_scaler=request.numeric_scaler,
            numeric_imputer=request.numeric_imputer,
            datetime_handling=request.datetime_handling,
        )
    except TrainingError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Training failed unexpectedly: {exc}") from exc
    run = ExperimentRun(
        id=result["run_id"],
        dataset_id=entity.id,
        target_column=result["target_column"],
        task_type=result["task_type"],
        model_name=result["model_name"],
        status="completed",
        metrics=result["metrics"],
        parameters=result["parameters"],
        artifact_path=result["artifact_path"],
        mlflow_run_id=result["mlflow_run_id"],
        error=result.get("tracking_warning"),
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


@router.get("/runs", response_model=list[RunOut])
def list_runs(db: Session = Depends(get_db)):
    return db.query(ExperimentRun).order_by(ExperimentRun.created_at.desc()).all()


@router.get("/runs/{run_id}", response_model=RunOut)
def get_run(run_id: str, db: Session = Depends(get_db)):
    run = db.get(ExperimentRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("/runs/{run_id}/predict")
def predict_run(
    run_id: str,
    features: dict = Body(...),
    db: Session = Depends(get_db),
):
    run = db.get(ExperimentRun, run_id)

    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run.status != "completed":
        raise HTTPException(
            status_code=409,
            detail="Only completed runs can be used for prediction",
        )

    if not run.artifact_path:
        raise HTTPException(
            status_code=404,
            detail="Model artifact path is missing",
        )

    model_path = Path(run.artifact_path)

    if not model_path.is_file():
        raise HTTPException(
            status_code=404,
            detail="Model artifact not found",
        )

    try:
        model = joblib.load(model_path)

        if "inputs" in features and isinstance(features["inputs"], dict):
            features = features["inputs"]

        expected_features = list(model.feature_names_in_)
        missing = [
            column for column in expected_features
            if column not in features
        ]

        if missing:
            raise HTTPException(
                status_code=422,
                detail={"missing_features": missing},
            )

        input_df = pd.DataFrame(
            [{column: features[column] for column in expected_features}]
        )

        prediction = model.predict(input_df)[0]
        if hasattr(prediction, "item"):
            try:
                prediction = prediction.item()
            except Exception:
                pass

        probabilities = None
        clf_model = None
        if hasattr(model, "named_steps") and "model" in model.named_steps:
            clf_model = model.named_steps["model"]
        elif hasattr(model, "predict_proba"):
            clf_model = model

        if clf_model is not None and hasattr(clf_model, "predict_proba"):
            try:
                probs = model.predict_proba(input_df)[0]
                classes = [str(c) for c in getattr(clf_model, "classes_", [])]
                if classes and len(classes) == len(probs):
                    probabilities = {c: round(float(p), 4) for c, p in zip(classes, probs)}
            except Exception:
                pass

        response = {
            "run_id": run.id,
            "model_name": run.model_name,
            "target_column": run.target_column,
            "prediction": prediction,
        }
        if probabilities is not None:
            response["probabilities"] = probabilities
        return response

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {exc}",
        ) from exc


@router.post("/runs/{run_id}/predict-batch", response_model=BatchPredictResponse)
def predict_batch_run(
    run_id: str,
    request: BatchPredictRequest,
    db: Session = Depends(get_db),
):
    """
    Run high-throughput inference on a batch of samples.
    """
    if not request.samples:
        raise HTTPException(status_code=422, detail="Samples list cannot be empty.")
    if len(request.samples) > 1000:
        raise HTTPException(status_code=422, detail="Maximum batch size is 1000 samples.")

    run = db.get(ExperimentRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.status != "completed":
        raise HTTPException(status_code=409, detail="Only completed runs can be used for prediction")
    if not run.artifact_path or not Path(run.artifact_path).is_file():
        raise HTTPException(status_code=404, detail="Model artifact not found")

    try:
        model = joblib.load(Path(run.artifact_path))
        expected_features = list(model.feature_names_in_)

        # Check for missing features across samples
        all_records = []
        for idx, sample in enumerate(request.samples):
            missing = [col for col in expected_features if col not in sample]
            if missing:
                raise HTTPException(
                    status_code=422,
                    detail={"sample_index": idx, "missing_features": missing},
                )
            all_records.append({col: sample[col] for col in expected_features})

        input_df = pd.DataFrame(all_records)
        raw_predictions = model.predict(input_df)

        clean_predictions = []
        for pred in raw_predictions:
            if hasattr(pred, "item"):
                try:
                    pred = pred.item()
                except Exception:
                    pass
            clean_predictions.append(pred)

        probabilities_list = None
        clf_model = None
        if hasattr(model, "named_steps") and "model" in model.named_steps:
            clf_model = model.named_steps["model"]
        elif hasattr(model, "predict_proba"):
            clf_model = model

        if clf_model is not None and hasattr(clf_model, "predict_proba"):
            try:
                probs_matrix = model.predict_proba(input_df)
                classes = [str(c) for c in getattr(clf_model, "classes_", [])]
                probabilities_list = []
                for row in probs_matrix:
                    probabilities_list.append({
                        c: round(float(p), 4) for c, p in zip(classes, row)
                    })
            except Exception:
                pass

        return {
            "run_id": run.id,
            "model_name": run.model_name,
            "target_column": run.target_column,
            "count": len(clean_predictions),
            "predictions": clean_predictions,
            "probabilities": probabilities_list,
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Batch prediction failed: {exc}",
        ) from exc


@router.get(
    "/datasets/{dataset_id}/runs/compare",
    response_model=ModelComparisonResponse,
)
def compare_dataset_runs(
    dataset_id: str,
    db: Session = Depends(get_db),
):
    """
    Compare and rank all completed experiment runs for a dataset.
    """
    entity = db.get(Dataset, dataset_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Dataset not found")

    runs = db.query(ExperimentRun).filter(
        ExperimentRun.dataset_id == dataset_id,
        ExperimentRun.status == "completed",
    ).all()

    if not runs:
        return {
            "dataset_id": dataset_id,
            "task_type": "unknown",
            "total_runs_evaluated": 0,
            "best_run_id": None,
            "ranking_metric": "none",
            "ranked_runs": [],
        }

    task_type = runs[0].task_type
    ranking_metric = "r2" if task_type == "regression" else "f1_weighted"

    def get_score(run: ExperimentRun) -> float:
        metrics = run.metrics or {}
        val = metrics.get(ranking_metric)
        if val is None and task_type == "classification":
            val = metrics.get("accuracy")
        try:
            return float(val) if val is not None else -float("inf")
        except Exception:
            return -float("inf")

    sorted_runs = sorted(runs, key=get_score, reverse=True)
    best_run_id = sorted_runs[0].id if sorted_runs else None

    ranked_list = []
    for rank, run in enumerate(sorted_runs, start=1):
        ranked_list.append({
            "rank": rank,
            "run_id": run.id,
            "model_name": run.model_name,
            "task_type": run.task_type,
            "target_column": run.target_column,
            "primary_score": get_score(run),
            "metrics": run.metrics,
            "parameters": run.parameters,
            "created_at": run.created_at.isoformat() if run.created_at else None,
        })

    return {
        "dataset_id": dataset_id,
        "task_type": task_type,
        "total_runs_evaluated": len(runs),
        "best_run_id": best_run_id,
        "ranking_metric": ranking_metric,
        "ranked_runs": ranked_list,
    }


@router.get("/datasets/{dataset_id}/workflow")
def get_dataset_workflow_status(
    dataset_id: str,
    db: Session = Depends(get_db),
):
    """
    Provide the unified workflow and lifecycle status of a dataset
    in the Pitwall OS workbench.
    """
    dataset = db.get(Dataset, dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    runs = db.query(ExperimentRun).filter(
        ExperimentRun.dataset_id == dataset_id,
    ).all()

    completed_runs = [r for r in runs if r.status == "completed"]
    has_lineage = bool(dataset.profile.get("lineage"))
    parent_id = dataset.profile.get("lineage", {}).get("parent_dataset_id") if has_lineage else None

    # Next action suggestion
    if not completed_runs:
        next_action = "Run baseline model training or preview cleaning in the Data Lab."
    elif len(completed_runs) == 1:
        next_action = "Train an alternative model architecture (e.g. Random Forest, Gradient Boosting) for comparison."
    else:
        next_action = "Compare experiment runs to select the best model for deployment and batch prediction."

    best_run = None
    if completed_runs:
        # Pick run with highest R2 or F1
        def eval_run(r):
            m = r.metrics or {}
            val = m.get("r2") or m.get("f1_weighted") or m.get("accuracy") or 0.0
            return float(val) if isinstance(val, (int, float)) else 0.0
        best = max(completed_runs, key=eval_run)
        best_run = {
            "run_id": best.id,
            "model_name": best.model_name,
            "metrics": best.metrics,
            "created_at": best.created_at.isoformat() if best.created_at else None,
        }

    return {
        "dataset_id": dataset.id,
        "name": dataset.name,
        "filename": dataset.filename,
        "rows": dataset.rows,
        "columns": dataset.columns,
        "is_cleaned_version": has_lineage,
        "parent_dataset_id": parent_id,
        "schema_version": dataset.profile.get("schema", {}).get("version", 1),
        "total_runs": len(runs),
        "completed_runs": len(completed_runs),
        "best_run": best_run,
        "next_recommended_action": next_action,
    }
    