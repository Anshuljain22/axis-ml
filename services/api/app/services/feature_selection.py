"""
Automated feature selection, ranking, and importance service.

Leverages:
- Mutual Information (scikit-learn mutual_info_regression / mutual_info_classif)
- Univariate Statistical F-Scores and p-values (f_regression / f_classif)
- Recursive Feature Elimination (RFE) with linear estimators
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.feature_selection import (
    RFE,
    f_classif,
    f_regression,
    mutual_info_classif,
    mutual_info_regression,
)
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.preprocessing import OneHotEncoder, StandardScaler


class FeatureSelectionError(ValueError):
    """Raised when feature selection cannot be performed."""


def _clean_float(val: Any) -> float | None:
    if val is None or pd.isna(val):
        return None
    try:
        f = float(val)
        if not np.isfinite(f):
            return None
        return round(f, 6)
    except (ValueError, TypeError):
        return None


def analyze_feature_importance_and_selection(
    csv_path: str,
    target_column: str,
    k: int | None = None,
    random_state: int = 42,
) -> dict[str, Any]:
    """
    Evaluate feature importance using Mutual Information, ANOVA/Regression F-scores, and RFE.
    """
    path = Path(csv_path)
    if not path.is_file():
        raise FeatureSelectionError("The dataset file could not be found.")

    try:
        df = pd.read_csv(path)
    except Exception as exc:
        raise FeatureSelectionError(f"Could not read CSV dataset: {exc}") from exc

    if target_column not in df.columns:
        raise FeatureSelectionError(f"Target column '{target_column}' does not exist in dataset.")

    df_clean = df.dropna(subset=[target_column]).copy()
    if len(df_clean) < 10:
        raise FeatureSelectionError("At least 10 observations with non-missing target are required.")

    y = df_clean[target_column]
    X_raw = df_clean.drop(columns=[target_column])

    if X_raw.shape[1] == 0:
        raise FeatureSelectionError("At least one candidate feature is required.")

    # Determine task type
    is_classification = bool(
        y.dtype == "object"
        or str(y.dtype).startswith("category")
        or str(y.dtype).startswith("bool")
        or (pd.api.types.is_numeric_dtype(y) and y.nunique() <= 10)
    )

    if is_classification and y.nunique() < 2:
        raise FeatureSelectionError("Classification requires at least 2 distinct target classes.")

    # Feature encoding and preprocessing for selection algorithms
    numeric_cols = [c for c in X_raw.columns if pd.api.types.is_numeric_dtype(X_raw[c])]
    categorical_cols = [c for c in X_raw.columns if c not in numeric_cols]

    processed_dfs = []
    col_mapping = {}  # encoded feature name -> original column name

    if numeric_cols:
        num_imputer = SimpleImputer(strategy="median")
        num_imputed = num_imputer.fit_transform(X_raw[numeric_cols])
        num_scaled = StandardScaler().fit_transform(num_imputed)
        df_num = pd.DataFrame(num_scaled, columns=numeric_cols, index=df_clean.index)
        processed_dfs.append(df_num)
        for col in numeric_cols:
            col_mapping[col] = col

    if categorical_cols:
        cat_imputer = SimpleImputer(strategy="most_frequent")
        cat_imputed = cat_imputer.fit_transform(X_raw[categorical_cols])
        ohe = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
        cat_encoded = ohe.fit_transform(cat_imputed)
        encoded_names = ohe.get_feature_names_out(categorical_cols)
        df_cat = pd.DataFrame(cat_encoded, columns=encoded_names, index=df_clean.index)
        processed_dfs.append(df_cat)
        for orig in categorical_cols:
            for enc in encoded_names:
                if enc.startswith(f"{orig}_"):
                    col_mapping[enc] = orig

    if not processed_dfs:
        raise FeatureSelectionError("No valid features could be preprocessed for selection.")

    X_processed = pd.concat(processed_dfs, axis=1)

    # 1. Mutual Information Scores
    try:
        if is_classification:
            mi_scores = mutual_info_classif(X_processed, y, random_state=random_state)
        else:
            mi_scores = mutual_info_regression(X_processed, y, random_state=random_state)
    except Exception:
        mi_scores = np.zeros(X_processed.shape[1])

    # 2. Univariate F-Test (ANOVA for classification, Pearson F-test for regression)
    try:
        if is_classification:
            f_stats, p_values = f_classif(X_processed, y)
        else:
            f_stats, p_values = f_regression(X_processed, y)
    except Exception:
        f_stats = np.zeros(X_processed.shape[1])
        p_values = np.ones(X_processed.shape[1])

    # 3. Recursive Feature Elimination (RFE)
    try:
        estimator = LogisticRegression(max_iter=1000, random_state=random_state) if is_classification else Ridge(random_state=random_state)
        n_features_to_select = max(1, min(10, int(np.ceil(X_processed.shape[1] * 0.5))))
        rfe = RFE(estimator, n_features_to_select=n_features_to_select)
        rfe.fit(X_processed, y)
        rfe_ranks = rfe.ranking_
    except Exception:
        rfe_ranks = np.ones(X_processed.shape[1], dtype=int)

    # Aggregate scores back to original candidate columns
    orig_features = list(X_raw.columns)
    aggregated_results = []

    for orig in orig_features:
        matched_encoded_indices = [
            i for i, enc_name in enumerate(X_processed.columns)
            if col_mapping.get(enc_name) == orig
        ]

        if not matched_encoded_indices:
            continue

        # Use maximum mutual info and F-stat among encoded dummies
        max_mi = float(np.max([mi_scores[i] for i in matched_encoded_indices]))
        max_f = float(np.max([f_stats[i] if np.isfinite(f_stats[i]) else 0.0 for i in matched_encoded_indices]))
        min_p = float(np.min([p_values[i] if np.isfinite(p_values[i]) else 1.0 for i in matched_encoded_indices]))
        best_rfe_rank = int(np.min([rfe_ranks[i] for i in matched_encoded_indices]))

        aggregated_results.append({
            "feature": str(orig),
            "mutual_information": _clean_float(max_mi),
            "f_statistic": _clean_float(max_f),
            "p_value": _clean_float(min_p),
            "rfe_rank": best_rfe_rank,
            "raw_score": max_mi + (np.log1p(max_f) / 10.0),
        })

    # Sort by overall importance score descending
    aggregated_results.sort(key=lambda x: (x["rfe_rank"], -x["raw_score"]))

    total_cols = len(aggregated_results)
    cutoff_k = k if (k is not None and 1 <= k <= total_cols) else max(1, min(10, int(np.ceil(total_cols * 0.6))))

    recommended_features = [res["feature"] for res in aggregated_results[:cutoff_k]]
    for idx, item in enumerate(aggregated_results):
        item["recommended"] = bool(idx < cutoff_k)
        item["overall_rank"] = idx + 1
        item.pop("raw_score", None)

    return {
        "target_column": target_column,
        "task_type": "classification" if is_classification else "regression",
        "total_features_evaluated": total_cols,
        "recommended_feature_count": len(recommended_features),
        "recommended_features": recommended_features,
        "feature_rankings": aggregated_results,
    }
