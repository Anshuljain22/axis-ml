import json
import os
from pathlib import Path
from uuid import uuid4
import joblib
import numpy as np
import pandas as pd

try:
    import mlflow
except ImportError:  # MLflow is optional for lightweight local unit tests.
    mlflow = None

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import (
    GradientBoostingClassifier,
    GradientBoostingRegressor,
    RandomForestClassifier,
    RandomForestRegressor,
)
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    explained_variance_score,
    f1_score,
    mean_absolute_error,
    mean_absolute_percentage_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import (
    KFold,
    StratifiedKFold,
    TimeSeriesSplit,
    cross_val_score,
    train_test_split,
)
from sklearn.pipeline import Pipeline


class TrainingError(ValueError):
    pass


def train_baseline(
    csv_path: str,
    dataset_id: str,
    target_column: str,
    task_type: str,
    test_size: float,
    random_state: int,
    artifact_root: str,
    tracking_uri: str,
    *,
    model_name: str = "auto",
    split_strategy: str = "random",
    cv_folds: int = 0,
    numeric_scaler: str = "standard",
    numeric_imputer: str = "median",
    datetime_handling: str = "extract",
) -> dict:
    try:
        from app.services.dataset_schema import infer_dataset_schema, load_dataset_dataframe
        df = load_dataset_dataframe(csv_path)
    except Exception:
        try:
            df = pd.read_csv(csv_path)
            from app.services.dataset_schema import infer_dataset_schema
        except Exception as exc:
            raise TrainingError(f"Could not read dataset: {exc}") from exc

    if target_column not in df.columns:
        raise TrainingError(f"Target column '{target_column}' does not exist")
    df = df.dropna(subset=[target_column])
    if len(df) < 10:
        raise TrainingError("At least 10 rows with a non-missing target are required")

    y = df[target_column]
    X = df.drop(columns=[target_column])
    if X.shape[1] == 0:
        raise TrainingError("At least one feature column is required besides the target")

    # Inferred vs chosen task type
    inferred = "classification" if (
        y.dtype == "object"
        or y.dtype.name == "category"
        or (y.nunique() <= 10 and pd.api.types.is_integer_dtype(y))
    ) else "regression"
    chosen = inferred if task_type == "auto" else task_type
    if chosen not in {"classification", "regression"}:
        raise TrainingError("task_type must be auto, classification, or regression")
    if chosen == "classification" and y.nunique() < 2:
        raise TrainingError("Classification requires at least two target classes")
    if chosen == "classification" and y.nunique() > max(20, int(len(y) * 0.5)):
        raise TrainingError("Target looks high-cardinality for classification; choose a different target or regression")

    from app.services.pipeline import build_preprocessor

    schema = infer_dataset_schema(X)
    dt_cols = [c["name"] for c in schema["columns"] if c["logical_type"] == "datetime"]
    num_cols = [c["name"] for c in schema["columns"] if c["logical_type"] in ("numeric", "integer")]
    cat_cols = [c["name"] for c in schema["columns"] if c["name"] not in dt_cols and c["name"] not in num_cols]

    try:
        preprocessor = build_preprocessor(
            numeric_columns=num_cols,
            categorical_columns=cat_cols,
            datetime_columns=dt_cols,
            numeric_scaler=numeric_scaler,
            numeric_imputer=numeric_imputer,
            datetime_handling=datetime_handling,
        )
    except ValueError as exc:
        raise TrainingError(str(exc)) from exc

    # Model instantiation
    req_model = (model_name or "auto").lower().strip()
    if chosen == "classification":
        if req_model in ("auto", "logistic_regression", "ridge"):
            model = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=random_state)
            actual_model_name = "LogisticRegression"
        elif req_model == "random_forest":
            model = RandomForestClassifier(n_estimators=100, random_state=random_state, class_weight="balanced")
            actual_model_name = "RandomForestClassifier"
        elif req_model == "gradient_boosting":
            model = GradientBoostingClassifier(n_estimators=100, random_state=random_state)
            actual_model_name = "GradientBoostingClassifier"
        else:
            raise TrainingError(
                f"Unsupported classification model '{model_name}'. Allowed: auto, logistic_regression, random_forest, gradient_boosting"
            )
    else:  # regression
        if req_model in ("auto", "ridge"):
            model = Ridge(random_state=random_state)
            actual_model_name = "RidgeRegression"
        elif req_model == "random_forest":
            model = RandomForestRegressor(n_estimators=100, random_state=random_state)
            actual_model_name = "RandomForestRegressor"
        elif req_model == "gradient_boosting":
            model = GradientBoostingRegressor(n_estimators=100, random_state=random_state)
            actual_model_name = "GradientBoostingRegressor"
        else:
            raise TrainingError(
                f"Unsupported regression model '{model_name}'. Allowed: auto, ridge, random_forest, gradient_boosting"
            )

    # Train / Test splitting strategy
    if split_strategy == "chronological":
        if dt_cols and dt_cols[0] in X.columns:
            sort_order = pd.to_datetime(X[dt_cols[0]], errors="coerce").argsort()
            X_ordered = X.iloc[sort_order].reset_index(drop=True)
            y_ordered = y.iloc[sort_order].reset_index(drop=True)
        else:
            X_ordered = X.reset_index(drop=True)
            y_ordered = y.reset_index(drop=True)

        cutoff = int(len(X_ordered) * (1.0 - test_size))
        cutoff = max(5, min(cutoff, len(X_ordered) - 2))
        X_train, X_test = X_ordered.iloc[:cutoff], X_ordered.iloc[cutoff:]
        y_train, y_test = y_ordered.iloc[:cutoff], y_ordered.iloc[cutoff:]
    else:
        stratify = y if (chosen == "classification" and y.value_counts().min() >= 2) else None
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=stratify
        )

    pipeline = Pipeline([("preprocess", preprocessor), ("model", model)])

    # Cross-validation
    cv_summary = None
    if cv_folds and cv_folds >= 2:
        try:
            if chosen == "classification":
                cv_splitter = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=random_state)
                scoring = "accuracy"
            elif split_strategy == "chronological":
                cv_splitter = TimeSeriesSplit(n_splits=cv_folds)
                scoring = "r2"
            else:
                cv_splitter = KFold(n_splits=cv_folds, shuffle=True, random_state=random_state)
                scoring = "r2"

            raw_scores = cross_val_score(pipeline, X_train, y_train, cv=cv_splitter, scoring=scoring)
            cv_summary = {
                "metric": scoring,
                "mean": round(float(raw_scores.mean()), 4),
                "std": round(float(raw_scores.std()), 4),
                "folds": [round(float(s), 4) for s in raw_scores],
            }
        except Exception as cv_err:
            cv_summary = {"error": f"CV evaluation failed: {cv_err}"}

    # Model training
    try:
        pipeline.fit(X_train, y_train)
        pred = pipeline.predict(X_test)
    except Exception as exc:
        raise TrainingError(f"Training failed: {exc}") from exc

    # Metrics evaluation suite
    confusion_info = None
    if chosen == "classification":
        metrics = {
            "accuracy": round(float(accuracy_score(y_test, pred)), 4),
            "precision_weighted": round(float(precision_score(y_test, pred, average="weighted", zero_division=0)), 4),
            "recall_weighted": round(float(recall_score(y_test, pred, average="weighted", zero_division=0)), 4),
            "f1_weighted": round(float(f1_score(y_test, pred, average="weighted", zero_division=0)), 4),
            "f1_macro": round(float(f1_score(y_test, pred, average="macro", zero_division=0)), 4),
        }

        # Try ROC-AUC
        if hasattr(pipeline.named_steps["model"], "predict_proba"):
            try:
                probas = pipeline.predict_proba(X_test)
                if len(np.unique(y_test)) == 2:
                    metrics["roc_auc"] = round(float(roc_auc_score(y_test, probas[:, 1])), 4)
                else:
                    metrics["roc_auc"] = round(
                        float(roc_auc_score(y_test, probas, multi_class="ovr", average="weighted")), 4
                    )
            except Exception:
                pass

        # Confusion Matrix
        unique_labels = sorted(list(set(y_test).union(set(pred))))
        cm = confusion_matrix(y_test, pred, labels=unique_labels)
        confusion_info = {
            "classes": [str(c) for c in unique_labels],
            "matrix": cm.tolist(),
        }
        metrics["confusion_matrix"] = confusion_info
    else:
        mse = float(mean_squared_error(y_test, pred))
        metrics = {
            "mae": round(float(mean_absolute_error(y_test, pred)), 4),
            "rmse": round(mse ** 0.5, 4),
            "r2": round(float(r2_score(y_test, pred)), 4),
            "explained_variance": round(float(explained_variance_score(y_test, pred)), 4),
        }
        try:
            metrics["mape"] = round(float(mean_absolute_percentage_error(y_test, pred)), 4)
        except Exception:
            pass

    if cv_summary:
        metrics["cross_validation"] = cv_summary

    # Save artifacts locally
    run_id = str(uuid4())
    out_dir = Path(artifact_root) / "runs" / run_id
    out_dir.mkdir(parents=True, exist_ok=True)
    model_file = out_dir / "model.joblib"
    joblib.dump(pipeline, model_file)

    if confusion_info:
        (out_dir / "confusion_matrix.json").write_text(
            json.dumps(confusion_info, indent=2), encoding="utf-8"
        )

    try:
        transformed_feature_names = pipeline.named_steps["preprocess"].get_feature_names_out().tolist()
    except Exception:
        transformed_feature_names = []

    metadata = {
        "run_id": run_id,
        "dataset_id": dataset_id,
        "target_column": target_column,
        "task_type": chosen,
        "model_name": actual_model_name,
        "metrics": metrics,
        "parameters": {
            "model_requested": model_name,
            "split_strategy": split_strategy,
            "cv_folds": cv_folds,
            "test_size": test_size,
            "random_state": random_state,
            "feature_count": int(X.shape[1]),
            "transformed_feature_count": len(transformed_feature_names),
            "transformed_feature_names": transformed_feature_names,
            "preprocessing": {
                "numeric_scaler": numeric_scaler,
                "numeric_imputer": numeric_imputer,
                "datetime_handling": datetime_handling,
                "datetime_columns": dt_cols if datetime_handling == "extract" else [],
                "numeric_columns": num_cols,
                "categorical_columns": cat_cols,
            },
            "train_rows": int(len(X_train)),
            "test_rows": int(len(X_test)),
        },
    }
    (out_dir / "run.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    # MLflow Tracking integration
    mlflow_run_id = None
    try:
        if mlflow is None:
            raise RuntimeError(
                "MLflow is not installed in this environment; metrics and model artifact were saved locally, but remote experiment tracking was skipped."
            )
        mlflow.set_tracking_uri(tracking_uri)
        mlflow.set_experiment("pitwall-baseline")
        with mlflow.start_run(run_name=f"{actual_model_name}-{run_id[:8]}") as run:
            mlflow_run_id = run.info.run_id
            mlflow.set_tags({
                "dataset_id": dataset_id,
                "target_column": target_column,
                "task_type": chosen,
                "model_name": actual_model_name,
                "split_strategy": split_strategy,
            })
            mlflow.log_params({
                "dataset_id": dataset_id,
                "target_column": target_column,
                "task_type": chosen,
                "model": actual_model_name,
                "model_requested": model_name,
                "split_strategy": split_strategy,
                "cv_folds": cv_folds,
                "test_size": test_size,
                "random_state": random_state,
                "numeric_scaler": numeric_scaler,
                "numeric_imputer": numeric_imputer,
                "datetime_handling": datetime_handling,
            })

            # Log scalar metrics
            scalar_metrics = {}
            for k, v in metrics.items():
                if isinstance(v, (int, float)) and np.isfinite(v):
                    scalar_metrics[k] = float(v)
            if cv_summary and "mean" in cv_summary:
                scalar_metrics[f"cv_{cv_summary['metric']}_mean"] = float(cv_summary["mean"])

            mlflow.log_metrics(scalar_metrics)
            mlflow.log_artifact(str(model_file))
            mlflow.log_artifact(str(out_dir / "run.json"))
            if confusion_info:
                mlflow.log_artifact(str(out_dir / "confusion_matrix.json"))

    except Exception as exc:
        metadata["tracking_warning"] = str(exc)
        (out_dir / "run.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    return {
        **metadata,
        "artifact_path": str(model_file),
        "mlflow_run_id": mlflow_run_id,
        "tracking_warning": metadata.get("tracking_warning"),
    }
