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
    AdaBoostClassifier,
    AdaBoostRegressor,
    ExtraTreesClassifier,
    ExtraTreesRegressor,
    GradientBoostingClassifier,
    GradientBoostingRegressor,
    HistGradientBoostingClassifier,
    HistGradientBoostingRegressor,
    RandomForestClassifier,
    RandomForestRegressor,
    StackingClassifier,
    StackingRegressor,
    VotingClassifier,
    VotingRegressor,
)
from sklearn.inspection import permutation_importance
from sklearn.linear_model import (
    BayesianRidge,
    ElasticNet,
    Lasso,
    LinearRegression,
    LogisticRegression,
    Ridge,
)
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    brier_score_loss,
    cohen_kappa_score,
    confusion_matrix,
    explained_variance_score,
    f1_score,
    log_loss,
    matthews_corrcoef,
    max_error,
    mean_absolute_error,
    mean_absolute_percentage_error,
    mean_squared_error,
    median_absolute_error,
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
from sklearn.naive_bayes import GaussianNB
from sklearn.neighbors import KNeighborsClassifier, KNeighborsRegressor
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.pipeline import Pipeline
from sklearn.svm import SVC, SVR
from sklearn.tree import DecisionTreeClassifier, DecisionTreeRegressor


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
        if req_model in ("auto", "logistic_regression", "logistic", "ridge"):
            model = LogisticRegression(max_iter=1000, class_weight="balanced", random_state=random_state)
            actual_model_name = "LogisticRegression"
        elif req_model == "decision_tree":
            model = DecisionTreeClassifier(random_state=random_state, class_weight="balanced")
            actual_model_name = "DecisionTreeClassifier"
        elif req_model == "random_forest":
            model = RandomForestClassifier(n_estimators=100, random_state=random_state, class_weight="balanced")
            actual_model_name = "RandomForestClassifier"
        elif req_model == "extra_trees":
            model = ExtraTreesClassifier(n_estimators=100, random_state=random_state, class_weight="balanced")
            actual_model_name = "ExtraTreesClassifier"
        elif req_model == "gradient_boosting":
            model = GradientBoostingClassifier(n_estimators=100, random_state=random_state)
            actual_model_name = "GradientBoostingClassifier"
        elif req_model == "hist_gradient_boosting":
            model = HistGradientBoostingClassifier(random_state=random_state, class_weight="balanced")
            actual_model_name = "HistGradientBoostingClassifier"
        elif req_model == "adaboost":
            model = AdaBoostClassifier(random_state=random_state)
            actual_model_name = "AdaBoostClassifier"
        elif req_model in ("svm", "svc"):
            model = SVC(probability=True, class_weight="balanced", random_state=random_state)
            actual_model_name = "SupportVectorClassifier"
        elif req_model == "knn":
            n_neighbors = min(5, max(1, len(X) - 1))
            model = KNeighborsClassifier(n_neighbors=n_neighbors)
            actual_model_name = "KNeighborsClassifier"
        elif req_model == "naive_bayes":
            model = GaussianNB()
            actual_model_name = "GaussianNaiveBayes"
        elif req_model == "mlp":
            model = MLPClassifier(hidden_layer_sizes=(64, 32), max_iter=500, early_stopping=False, random_state=random_state)
            actual_model_name = "MultiLayerPerceptronClassifier"
        elif req_model == "voting":
            estimators = [
                ("lr", LogisticRegression(max_iter=500, random_state=random_state)),
                ("rf", RandomForestClassifier(n_estimators=50, random_state=random_state)),
                ("gnb", GaussianNB()),
            ]
            model = VotingClassifier(estimators=estimators, voting="soft")
            actual_model_name = "VotingClassifier"
        elif req_model == "stacking":
            estimators = [
                ("lr", LogisticRegression(max_iter=500, random_state=random_state)),
                ("rf", RandomForestClassifier(n_estimators=50, random_state=random_state)),
            ]
            model = StackingClassifier(estimators=estimators, final_estimator=LogisticRegression(random_state=random_state))
            actual_model_name = "StackingClassifier"
        else:
            raise TrainingError(
                f"Unsupported classification model '{model_name}'. Allowed: auto, logistic_regression, decision_tree, random_forest, extra_trees, gradient_boosting, hist_gradient_boosting, adaboost, svm, knn, naive_bayes, mlp, voting, stacking"
            )
    else:  # regression
        if req_model in ("auto", "ridge"):
            model = Ridge(random_state=random_state)
            actual_model_name = "RidgeRegression"
        elif req_model in ("linear_regression", "linear"):
            model = LinearRegression()
            actual_model_name = "LinearRegression"
        elif req_model == "lasso":
            model = Lasso(random_state=random_state)
            actual_model_name = "LassoRegression"
        elif req_model == "elastic_net":
            model = ElasticNet(random_state=random_state)
            actual_model_name = "ElasticNetRegression"
        elif req_model == "bayesian_ridge":
            model = BayesianRidge()
            actual_model_name = "BayesianRidgeRegression"
        elif req_model == "decision_tree":
            model = DecisionTreeRegressor(random_state=random_state)
            actual_model_name = "DecisionTreeRegressor"
        elif req_model == "random_forest":
            model = RandomForestRegressor(n_estimators=100, random_state=random_state)
            actual_model_name = "RandomForestRegressor"
        elif req_model == "extra_trees":
            model = ExtraTreesRegressor(n_estimators=100, random_state=random_state)
            actual_model_name = "ExtraTreesRegressor"
        elif req_model == "gradient_boosting":
            model = GradientBoostingRegressor(n_estimators=100, random_state=random_state)
            actual_model_name = "GradientBoostingRegressor"
        elif req_model == "hist_gradient_boosting":
            model = HistGradientBoostingRegressor(random_state=random_state)
            actual_model_name = "HistGradientBoostingRegressor"
        elif req_model == "adaboost":
            model = AdaBoostRegressor(random_state=random_state)
            actual_model_name = "AdaBoostRegressor"
        elif req_model in ("svr", "svm"):
            model = SVR()
            actual_model_name = "SupportVectorRegressor"
        elif req_model == "knn":
            n_neighbors = min(5, max(1, len(X) - 1))
            model = KNeighborsRegressor(n_neighbors=n_neighbors)
            actual_model_name = "KNeighborsRegressor"
        elif req_model == "mlp":
            model = MLPRegressor(hidden_layer_sizes=(64, 32), max_iter=500, early_stopping=True, random_state=random_state)
            actual_model_name = "MultiLayerPerceptronRegressor"
        elif req_model == "voting":
            estimators = [
                ("ridge", Ridge(random_state=random_state)),
                ("rf", RandomForestRegressor(n_estimators=50, random_state=random_state)),
                ("gbr", GradientBoostingRegressor(n_estimators=50, random_state=random_state)),
            ]
            model = VotingRegressor(estimators=estimators)
            actual_model_name = "VotingRegressor"
        elif req_model == "stacking":
            estimators = [
                ("ridge", Ridge(random_state=random_state)),
                ("rf", RandomForestRegressor(n_estimators=50, random_state=random_state)),
            ]
            model = StackingRegressor(estimators=estimators, final_estimator=Ridge(random_state=random_state))
            actual_model_name = "StackingRegressor"
        else:
            raise TrainingError(
                f"Unsupported regression model '{model_name}'. Allowed: auto, ridge, linear_regression, lasso, elastic_net, bayesian_ridge, decision_tree, random_forest, extra_trees, gradient_boosting, hist_gradient_boosting, adaboost, svr, knn, mlp, voting, stacking"
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
            "balanced_accuracy": round(float(balanced_accuracy_score(y_test, pred)), 4),
            "precision_weighted": round(float(precision_score(y_test, pred, average="weighted", zero_division=0)), 4),
            "recall_weighted": round(float(recall_score(y_test, pred, average="weighted", zero_division=0)), 4),
            "f1_weighted": round(float(f1_score(y_test, pred, average="weighted", zero_division=0)), 4),
            "f1_macro": round(float(f1_score(y_test, pred, average="macro", zero_division=0)), 4),
            "mcc": round(float(matthews_corrcoef(y_test, pred)), 4),
            "cohen_kappa": round(float(cohen_kappa_score(y_test, pred)), 4),
        }

        # Try ROC-AUC, Brier score, and Log Loss
        if hasattr(pipeline.named_steps["model"], "predict_proba"):
            try:
                probas = pipeline.predict_proba(X_test)
                if len(np.unique(y_test)) == 2:
                    metrics["roc_auc"] = round(float(roc_auc_score(y_test, probas[:, 1])), 4)
                    pos_label = np.unique(y_test)[-1]
                    metrics["brier_score"] = round(float(brier_score_loss(y_test == pos_label, probas[:, 1])), 4)
                else:
                    metrics["roc_auc"] = round(
                        float(roc_auc_score(y_test, probas, multi_class="ovr", average="weighted")), 4
                    )
                try:
                    metrics["log_loss"] = round(float(log_loss(y_test, probas)), 4)
                except Exception:
                    pass
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
        r2_val = float(r2_score(y_test, pred))
        n_samples = len(y_test)
        n_features = X.shape[1]
        adj_r2 = r2_val
        if n_samples > n_features + 1:
            adj_r2 = 1.0 - (1.0 - r2_val) * ((n_samples - 1) / (n_samples - n_features - 1))

        metrics = {
            "mae": round(float(mean_absolute_error(y_test, pred)), 4),
            "rmse": round(mse ** 0.5, 4),
            "r2": round(r2_val, 4),
            "adjusted_r2": round(float(adj_r2), 4),
            "explained_variance": round(float(explained_variance_score(y_test, pred)), 4),
            "median_ae": round(float(median_absolute_error(y_test, pred)), 4),
            "max_error": round(float(max_error(y_test, pred)), 4),
        }
        try:
            metrics["mape"] = round(float(mean_absolute_percentage_error(y_test, pred)), 4)
        except Exception:
            pass

    if cv_summary:
        metrics["cross_validation"] = cv_summary

    # Permutation Feature Importance
    feature_importance_list = []
    try:
        perm_scoring = "r2" if chosen == "regression" else "accuracy"
        perm_res = permutation_importance(
            pipeline,
            X_test,
            y_test,
            n_repeats=min(5, max(2, len(X_test))),
            random_state=random_state,
            scoring=perm_scoring,
        )
        for col_idx, col_name in enumerate(X.columns):
            imp_mean = float(perm_res.importances_mean[col_idx])
            imp_std = float(perm_res.importances_std[col_idx])
            feature_importance_list.append({
                "feature": col_name,
                "importance": round(imp_mean, 5),
                "std": round(imp_std, 5),
            })
        feature_importance_list.sort(key=lambda x: x["importance"], reverse=True)
    except Exception:
        pass

    if feature_importance_list:
        metrics["feature_importance"] = feature_importance_list

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
    if feature_importance_list:
        (out_dir / "feature_importance.json").write_text(
            json.dumps(feature_importance_list, indent=2), encoding="utf-8"
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
            if feature_importance_list:
                mlflow.log_artifact(str(out_dir / "feature_importance.json"))

    except Exception as exc:
        metadata["tracking_warning"] = str(exc)
        (out_dir / "run.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")

    return {
        **metadata,
        "artifact_path": str(model_file),
        "mlflow_run_id": mlflow_run_id,
        "tracking_warning": metadata.get("tracking_warning"),
    }
