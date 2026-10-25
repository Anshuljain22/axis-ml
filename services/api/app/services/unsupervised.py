"""
Unsupervised Learning & Anomaly Detection Service.

Provides clustering (K-Means, MiniBatch K-Means, Agglomerative, GMM, DBSCAN),
dimensionality reduction (Principal Component Analysis - PCA),
and anomaly detection (Isolation Forest, Local Outlier Factor, Elliptic Envelope)
with quantitative validation metrics (Silhouette, Davies-Bouldin, Calinski-Harabasz).
"""

from __future__ import annotations

from typing import Any
import numpy as np
import pandas as pd
from sklearn.cluster import AgglomerativeClustering, DBSCAN, KMeans, MiniBatchKMeans
from sklearn.covariance import EllipticEnvelope
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    calinski_harabasz_score,
    davies_bouldin_score,
    silhouette_score,
)
from sklearn.mixture import GaussianMixture
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler


class UnsupervisedError(ValueError):
    pass


def _to_python_native(val: Any) -> Any:
    if val is None or pd.isna(val):
        return None
    if isinstance(val, (np.floating, float)):
        return round(float(val), 4)
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.bool_, bool)):
        return bool(val)
    return str(val)


def _prepare_numeric_data(
    df: pd.DataFrame, features: list[str] | None = None
) -> tuple[np.ndarray, list[str], pd.DataFrame]:
    """Extract, impute, and standardize numeric features."""
    if features:
        valid_cols = [c for c in features if c in df.columns]
    else:
        valid_cols = df.select_dtypes(include=[np.number]).columns.tolist()

    if not valid_cols:
        raise UnsupervisedError("No numeric columns available for unsupervised modeling.")

    sub_df = df[valid_cols].copy()
    if len(sub_df) < 5:
        raise UnsupervisedError("At least 5 rows are required for unsupervised modeling.")

    # Impute missing values with median
    imputer = SimpleImputer(strategy="median")
    imputed = imputer.fit_transform(sub_df)

    # Standardize features
    scaler = StandardScaler()
    scaled = scaler.fit_transform(imputed)

    return scaled, valid_cols, sub_df


def run_clustering(
    df: pd.DataFrame,
    method: str = "kmeans",
    n_clusters: int = 3,
    features: list[str] | None = None,
    random_state: int = 42,
) -> dict[str, Any]:
    """Execute clustering algorithm and compute cluster validation metrics."""
    X_scaled, cols, sub_df = _prepare_numeric_data(df, features)
    n_samples = len(X_scaled)
    method_norm = method.lower().strip()

    if method_norm != "dbscan":
        if n_clusters < 2 or n_clusters >= n_samples:
            raise UnsupervisedError(
                f"n_clusters must be between 2 and {n_samples - 1}."
            )

    inertia = None
    if method_norm == "kmeans":
        model = KMeans(n_clusters=n_clusters, random_state=random_state, n_init="auto")
        labels = model.fit_predict(X_scaled)
        inertia = round(float(model.inertia_), 4)
    elif method_norm == "minibatch_kmeans":
        model = MiniBatchKMeans(n_clusters=n_clusters, random_state=random_state, n_init="auto")
        labels = model.fit_predict(X_scaled)
        inertia = round(float(model.inertia_), 4)
    elif method_norm == "agglomerative":
        model = AgglomerativeClustering(n_clusters=n_clusters)
        labels = model.fit_predict(X_scaled)
    elif method_norm == "gmm":
        model = GaussianMixture(n_components=n_clusters, random_state=random_state)
        labels = model.fit_predict(X_scaled)
    elif method_norm == "dbscan":
        model = DBSCAN(eps=0.8, min_samples=min(5, max(2, n_samples // 10)))
        labels = model.fit_predict(X_scaled)
    else:
        raise UnsupervisedError(
            f"Unsupported clustering method '{method}'. Allowed: kmeans, minibatch_kmeans, agglomerative, gmm, dbscan."
        )

    unique_labels = np.unique(labels)
    n_found = len(unique_labels[unique_labels != -1]) if method_norm == "dbscan" else len(unique_labels)

    # Calculate cluster validation metrics
    metrics: dict[str, float | None] = {}
    if inertia is not None:
        metrics["inertia"] = inertia

    # Silhouette and separation require at least 2 clusters and less than N clusters
    valid_mask = labels != -1
    valid_labels = labels[valid_mask]
    if len(np.unique(valid_labels)) >= 2 and len(valid_labels) > len(np.unique(valid_labels)):
        try:
            metrics["silhouette_score"] = round(
                float(silhouette_score(X_scaled[valid_mask], valid_labels)), 4
            )
        except Exception:
            metrics["silhouette_score"] = None

        try:
            metrics["davies_bouldin_score"] = round(
                float(davies_bouldin_score(X_scaled[valid_mask], valid_labels)), 4
            )
        except Exception:
            metrics["davies_bouldin_score"] = None

        try:
            metrics["calinski_harabasz_score"] = round(
                float(calinski_harabasz_score(X_scaled[valid_mask], valid_labels)), 4
            )
        except Exception:
            metrics["calinski_harabasz_score"] = None

    # Distribution counts
    cluster_counts = {}
    for lbl in unique_labels:
        count = int(np.sum(labels == lbl))
        label_name = "Noise (-1)" if lbl == -1 else f"Cluster {lbl}"
        cluster_counts[label_name] = {
            "label": int(lbl),
            "count": count,
            "percentage": round(float(count / n_samples * 100), 2),
        }

    # Sample assignments
    sample_size = min(25, n_samples)
    samples = []
    for i in range(sample_size):
        row_dict = {col: _to_python_native(sub_df[col].iloc[i]) for col in cols[:6]}
        row_dict["cluster"] = int(labels[i])
        samples.append(row_dict)

    return {
        "method": method_norm,
        "features_used": cols,
        "n_samples": n_samples,
        "n_clusters_requested": n_clusters if method_norm != "dbscan" else None,
        "n_clusters_found": n_found,
        "metrics": metrics,
        "cluster_distribution": cluster_counts,
        "sample_assignments": samples,
    }


def run_pca(
    df: pd.DataFrame,
    n_components: int = 2,
    features: list[str] | None = None,
) -> dict[str, Any]:
    """Execute Principal Component Analysis (PCA) dimensionality reduction."""
    X_scaled, cols, _ = _prepare_numeric_data(df, features)
    n_samples, n_features = X_scaled.shape

    max_comps = min(n_samples, n_features)
    k = max(1, min(n_components, max_comps))

    pca = PCA(n_components=k)
    X_projected = pca.fit_transform(X_scaled)

    evr = [round(float(v), 4) for v in pca.explained_variance_ratio_]
    cum_evr = [round(float(v), 4) for v in np.cumsum(pca.explained_variance_ratio_)]
    singular_vals = [round(float(v), 4) for v in pca.singular_values_]

    # Feature loadings per principal component
    components_info = []
    for i in range(k):
        loadings = {
            cols[j]: round(float(pca.components_[i, j]), 4) for j in range(n_features)
        }
        # Sort loadings by absolute contribution
        sorted_loadings = dict(sorted(loadings.items(), key=lambda x: abs(x[1]), reverse=True))
        components_info.append({
            "component": f"PC{i + 1}",
            "explained_variance_ratio": evr[i],
            "loadings": sorted_loadings,
        })

    # Projected sample points (up to 100 points for visualization)
    sample_size = min(100, n_samples)
    projected_points = []
    for idx in range(sample_size):
        pt = {
            "index": int(idx),
            "pc1": round(float(X_projected[idx, 0]), 4),
            "pc2": round(float(X_projected[idx, 1]), 4) if k >= 2 else 0.0,
        }
        if k >= 3:
            pt["pc3"] = round(float(X_projected[idx, 2]), 4)
        projected_points.append(pt)

    return {
        "n_components": k,
        "features_evaluated": cols,
        "total_explained_variance": round(float(np.sum(pca.explained_variance_ratio_)), 4),
        "explained_variance_ratio": evr,
        "cumulative_variance_ratio": cum_evr,
        "singular_values": singular_vals,
        "components": components_info,
        "projected_samples": projected_points,
    }


def run_anomaly_detection(
    df: pd.DataFrame,
    method: str = "isolation_forest",
    contamination: float = 0.05,
    features: list[str] | None = None,
    random_state: int = 42,
) -> dict[str, Any]:
    """Execute unsupervised anomaly and outlier detection."""
    X_scaled, cols, sub_df = _prepare_numeric_data(df, features)
    n_samples = len(X_scaled)
    method_norm = method.lower().strip()

    contamination_clamped = max(0.01, min(0.25, contamination))

    if method_norm == "isolation_forest":
        model = IsolationForest(
            contamination=contamination_clamped,
            random_state=random_state,
            n_estimators=100,
        )
        preds = model.fit_predict(X_scaled)
        scores = -model.score_samples(X_scaled)  # higher = more anomalous
    elif method_norm == "local_outlier_factor":
        k_neighbors = min(20, max(2, n_samples - 1))
        model = LocalOutlierFactor(
            n_neighbors=k_neighbors,
            contamination=contamination_clamped,
        )
        preds = model.fit_predict(X_scaled)
        scores = -model.negative_outlier_factor_  # higher = more anomalous
    elif method_norm == "elliptic_envelope":
        model = EllipticEnvelope(
            contamination=contamination_clamped,
            random_state=random_state,
        )
        preds = model.fit_predict(X_scaled)
        # Mahalanobis distances
        scores = model.mahalanobis(X_scaled)
    else:
        raise UnsupervisedError(
            f"Unsupported anomaly detection method '{method}'. Allowed: isolation_forest, local_outlier_factor, elliptic_envelope."
        )

    is_anomaly = preds == -1
    anomaly_indices = np.where(is_anomaly)[0].tolist()
    anomaly_count = int(np.sum(is_anomaly))
    anomaly_pct = round(float(anomaly_count / n_samples * 100), 2)

    # Rank anomalies by anomaly score
    ranked_indices = np.argsort(scores)[::-1]
    top_k = min(15, n_samples)
    top_anomalies = []
    for idx in ranked_indices[:top_k]:
        row_dict = {col: _to_python_native(sub_df[col].iloc[idx]) for col in cols}
        row_dict["_row_index"] = int(idx)
        row_dict["_anomaly_score"] = round(float(scores[idx]), 4)
        row_dict["_is_outlier"] = bool(is_anomaly[idx])
        top_anomalies.append(row_dict)

    return {
        "method": method_norm,
        "features_evaluated": cols,
        "total_rows": n_samples,
        "contamination": contamination_clamped,
        "anomaly_count": anomaly_count,
        "anomaly_percentage": anomaly_pct,
        "anomaly_indices": anomaly_indices,
        "top_anomalies": top_anomalies,
    }
