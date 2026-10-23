"""
Reusable, leakage-free transformation and preprocessing pipeline service.

Constructs scikit-learn ColumnTransformers with automated datetime feature extraction,
configurable numeric scaling, imputation, and categorical encoding.
Ensures transformations are fitted strictly on training splits and fully serialized
for seamless inference on raw inputs.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import MinMaxScaler, OneHotEncoder, RobustScaler, StandardScaler


class DateTimeFeatureExtractor(BaseEstimator, TransformerMixin):
    """
    Extracts numerical features (hour, day, month, dayofweek, year) from datetime columns.
    Prevents raw timestamp strings from creating high-cardinality one-hot encodings.
    """

    def __init__(
        self,
        datetime_columns: list[str] | None = None,
        features: list[str] | None = None,
    ):
        self.datetime_columns = datetime_columns or []
        self.features = features or ["hour", "day", "month", "dayofweek"]
        self.feature_names_out_: list[str] = []

    def fit(self, X: Any, y: Any = None) -> DateTimeFeatureExtractor:
        if isinstance(X, pd.DataFrame):
            cols = [c for c in self.datetime_columns if c in X.columns] or list(X.columns)
        else:
            cols = self.datetime_columns or [f"dt_{i}" for i in range(np.shape(X)[1])]

        self.feature_names_out_ = [
            f"{col}_{feat}" for col in cols for feat in self.features
        ]
        return self

    def transform(self, X: Any) -> np.ndarray:
        if isinstance(X, pd.DataFrame):
            df_x = X
        else:
            cols = self.datetime_columns if self.datetime_columns else None
            df_x = pd.DataFrame(X, columns=cols)

        cols = [c for c in self.datetime_columns if c in df_x.columns]
        if not cols:
            cols = [
                c for c in df_x.columns
                if any(t in str(c).lower() for t in ("datetime", "timestamp", "date", "time"))
            ]
        if not cols:
            cols = list(df_x.columns)

        if not cols or df_x.empty:
            return np.empty((len(df_x), 0), dtype=float)

        extracted_arrays = []
        for col in cols:
            series = pd.to_datetime(df_x[col], errors="coerce")
            for feat in self.features:
                if feat == "hour":
                    arr = series.dt.hour.fillna(-1).to_numpy(dtype=float)
                elif feat == "day":
                    arr = series.dt.day.fillna(-1).to_numpy(dtype=float)
                elif feat == "month":
                    arr = series.dt.month.fillna(-1).to_numpy(dtype=float)
                elif feat == "dayofweek":
                    arr = series.dt.dayofweek.fillna(-1).to_numpy(dtype=float)
                elif feat == "year":
                    arr = series.dt.year.fillna(-1).to_numpy(dtype=float)
                else:
                    arr = np.zeros(len(df_x), dtype=float)
                extracted_arrays.append(arr[:, np.newaxis])

        if not extracted_arrays:
            return np.empty((len(df_x), 0), dtype=float)

        return np.hstack(extracted_arrays)

    def get_feature_names_out(self, input_features: Any = None) -> np.ndarray:
        if input_features is not None and len(input_features) > 0:
            return np.array([f"{col}_{feat}" for col in input_features for feat in self.features], dtype=object)
        return np.array(self.feature_names_out_, dtype=object)


def build_preprocessor(
    numeric_columns: list[str],
    categorical_columns: list[str],
    datetime_columns: list[str],
    *,
    numeric_scaler: str = "standard",
    numeric_imputer: str = "median",
    datetime_handling: str = "extract",
) -> ColumnTransformer:
    """
    Build a leak-free ColumnTransformer according to configuration.
    """
    transformers = []

    # 1. Datetime feature extraction
    if datetime_columns and datetime_handling == "extract":
        dt_pipeline = Pipeline([
            ("extractor", DateTimeFeatureExtractor(datetime_columns=datetime_columns)),
            ("scale", StandardScaler()),
        ])
        transformers.append(("datetime", dt_pipeline, datetime_columns))

    # 2. Numeric preprocessing
    if numeric_columns:
        num_strategy = "mean" if numeric_imputer == "mean" else "median"
        num_steps: list[tuple[str, Any]] = [
            ("imputer", SimpleImputer(strategy=num_strategy)),
        ]

        if numeric_scaler == "standard":
            num_steps.append(("scale", StandardScaler()))
        elif numeric_scaler == "minmax":
            num_steps.append(("scale", MinMaxScaler()))
        elif numeric_scaler == "robust":
            num_steps.append(("scale", RobustScaler()))
        # "none" -> unscaled

        transformers.append(("numeric", Pipeline(num_steps), numeric_columns))

    # 3. Categorical preprocessing
    if categorical_columns:
        cat_pipeline = Pipeline([
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
        ])
        transformers.append(("categorical", cat_pipeline, categorical_columns))

    if not transformers:
        raise ValueError("No feature columns available to construct preprocessor.")

    return ColumnTransformer(transformers=transformers, remainder="drop", verbose_feature_names_out=False)


def preview_pipeline_transform(
    df: pd.DataFrame,
    target_column: str,
    *,
    numeric_scaler: str = "standard",
    numeric_imputer: str = "median",
    datetime_handling: str = "extract",
    sample_rows: int = 5,
) -> dict[str, Any]:
    """
    Preview the transformed features matrix and metadata without training a model.
    """
    from app.services.dataset_schema import infer_dataset_schema

    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' does not exist in dataset.")

    feature_df = df.drop(columns=[target_column])
    if feature_df.shape[1] == 0:
        raise ValueError("At least one feature column is required besides the target.")

    schema = infer_dataset_schema(feature_df)

    dt_cols = [c["name"] for c in schema["columns"] if c["logical_type"] == "datetime"]
    num_cols = [c["name"] for c in schema["columns"] if c["logical_type"] in ("numeric", "integer")]
    cat_cols = [c["name"] for c in schema["columns"] if c["name"] not in dt_cols and c["name"] not in num_cols]

    preprocessor = build_preprocessor(
        numeric_columns=num_cols,
        categorical_columns=cat_cols,
        datetime_columns=dt_cols,
        numeric_scaler=numeric_scaler,
        numeric_imputer=numeric_imputer,
        datetime_handling=datetime_handling,
    )

    transformed_arr = preprocessor.fit_transform(feature_df)
    if hasattr(transformed_arr, "toarray"):
        transformed_arr = transformed_arr.toarray()

    feature_names = preprocessor.get_feature_names_out().tolist()

    head_sample = transformed_arr[:sample_rows]
    preview_records = []
    for row in head_sample:
        preview_records.append({
            name: round(float(val), 4) if np.isfinite(val) else None
            for name, val in zip(feature_names, row)
        })

    return {
        "original_features_count": int(feature_df.shape[1]),
        "original_features": list(feature_df.columns),
        "transformed_features_count": int(transformed_arr.shape[1]),
        "transformed_feature_names": feature_names,
        "sample_preview": preview_records,
        "configuration": {
            "numeric_scaler": numeric_scaler,
            "numeric_imputer": numeric_imputer,
            "datetime_handling": datetime_handling,
            "datetime_columns_extracted": dt_cols if datetime_handling == "extract" else [],
            "numeric_columns": num_cols,
            "categorical_columns": cat_cols,
        },
    }
