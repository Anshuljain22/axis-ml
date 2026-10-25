"""
Statistical hypothesis testing, multicollinearity (VIF), and time-series stationarity service.

Provides robust statistical evaluations for tabular datasets including:
- Normality checks (Shapiro-Wilk, D'Agostino-Pearson, skewness, kurtosis)
- Variance Inflation Factor (VIF) for multicollinearity analysis
- Time-series stationarity testing (ADF and KPSS tests with joint verdict)
- Bivariate & group hypothesis testing (T-tests, Mann-Whitney U, ANOVA, Kruskal-Wallis, Chi-Square, Levene)
- Extended correlation matrices (Spearman rank, Kendall's tau)
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from scipy import stats
from sklearn.linear_model import LinearRegression


class StatisticalTestError(ValueError):
    """Raised when statistical tests cannot be performed."""


def _clean_float(val: Any) -> float | None:
    """Convert value safely to a JSON-serializable float or None."""
    if val is None or pd.isna(val):
        return None
    try:
        f = float(val)
        if not np.isfinite(f):
            return None
        return round(f, 6)
    except (ValueError, TypeError):
        return None


def compute_normality_tests(csv_path: str, column: str | None = None) -> dict[str, Any]:
    """
    Run normality tests (Shapiro-Wilk and D'Agostino-Pearson) plus skewness and kurtosis.
    """
    path = Path(csv_path)
    if not path.is_file():
        raise StatisticalTestError("The dataset file could not be found.")

    try:
        df = pd.read_csv(path)
    except Exception as exc:
        raise StatisticalTestError(f"Could not read CSV dataset: {exc}") from exc

    if df.empty:
        raise StatisticalTestError("Cannot compute normality tests on an empty dataset.")

    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    if column:
        if column not in df.columns:
            raise StatisticalTestError(f"Column '{column}' does not exist in dataset.")
        if column not in numeric_cols:
            raise StatisticalTestError(f"Column '{column}' is not a numeric column.")
        target_cols = [column]
    else:
        target_cols = numeric_cols

    results = {}
    for col in target_cols:
        series = df[col].dropna()
        finite_series = series[np.isfinite(series)]
        n = len(finite_series)

        if n < 3:
            results[str(col)] = {
                "sample_size": n,
                "shapiro_stat": None,
                "shapiro_p_value": None,
                "is_normal_shapiro": None,
                "dagostino_stat": None,
                "dagostino_p_value": None,
                "is_normal_dagostino": None,
                "skewness": None,
                "kurtosis": None,
                "note": "Sample size too small (requires N >= 3).",
            }
            continue

        # Shapiro-Wilk (limit to 5000 samples if larger, following standard practice)
        shapiro_sample = finite_series if n <= 5000 else finite_series.sample(5000, random_state=42)
        try:
            sh_stat, sh_p = stats.shapiro(shapiro_sample)
            sh_stat, sh_p = _clean_float(sh_stat), _clean_float(sh_p)
            sh_normal = bool(sh_p >= 0.05) if sh_p is not None else None
        except Exception:
            sh_stat, sh_p, sh_normal = None, None, None

        # D'Agostino-Pearson requires n >= 8
        if n >= 8:
            try:
                da_stat, da_p = stats.normaltest(finite_series)
                da_stat, da_p = _clean_float(da_stat), _clean_float(da_p)
                da_normal = bool(da_p >= 0.05) if da_p is not None else None
            except Exception:
                da_stat, da_p, da_normal = None, None, None
        else:
            da_stat, da_p, da_normal = None, None, None

        skew_val = _clean_float(stats.skew(finite_series))
        kurt_val = _clean_float(stats.kurtosis(finite_series))

        results[str(col)] = {
            "sample_size": n,
            "shapiro_stat": sh_stat,
            "shapiro_p_value": sh_p,
            "is_normal_shapiro": sh_normal,
            "dagostino_stat": da_stat,
            "dagostino_p_value": da_p,
            "is_normal_dagostino": da_normal,
            "skewness": skew_val,
            "kurtosis": kurt_val,
            "verdict": "Likely Normal" if (sh_normal is True or da_normal is True) else "Non-Normal",
        }

    return {
        "columns_tested": len(results),
        "normality_results": results,
    }


def compute_vif(csv_path: str) -> dict[str, Any]:
    """
    Compute Variance Inflation Factor (VIF) for all numeric features.
    Flags multicollinearity: VIF < 5 (Low), 5 <= VIF < 10 (Moderate), >= 10 (High).
    """
    path = Path(csv_path)
    if not path.is_file():
        raise StatisticalTestError("The dataset file could not be found.")

    try:
        df = pd.read_csv(path)
    except Exception as exc:
        raise StatisticalTestError(f"Could not read CSV dataset: {exc}") from exc

    numeric_df = df.select_dtypes(include="number").replace([np.inf, -np.inf], np.nan)
    # Filter columns with at least 2 unique values and not all missing
    valid_cols = [c for c in numeric_df.columns if numeric_df[c].dropna().nunique() > 1]

    if len(valid_cols) < 2:
        return {
            "columns_analyzed": len(valid_cols),
            "vif_results": {},
            "high_multicollinearity_detected": False,
            "note": "At least 2 non-constant numeric columns are required to compute VIF.",
        }

    clean_data = numeric_df[valid_cols].copy()
    # Simple median imputation for VIF calculation
    for c in valid_cols:
        median_val = clean_data[c].median()
        clean_data[c] = clean_data[c].fillna(median_val if pd.notna(median_val) else 0.0)

    # Standardize data to stabilize regressions
    clean_data = (clean_data - clean_data.mean()) / clean_data.std(ddof=0).replace(0, 1)

    vif_results = {}
    high_count = 0

    for col in valid_cols:
        y_col = clean_data[col].to_numpy()
        x_cols = [c for c in valid_cols if c != col]
        X_other = clean_data[x_cols].to_numpy()

        lr = LinearRegression(fit_intercept=True)
        lr.fit(X_other, y_col)
        r2 = lr.score(X_other, y_col)

        if r2 >= 0.9999:
            vif = 999.0
            severity = "high"
        elif r2 <= 0.0:
            vif = 1.0
            severity = "low"
        else:
            vif = round(1.0 / (1.0 - r2), 4)
            severity = "high" if vif >= 10.0 else ("moderate" if vif >= 5.0 else "low")

        if severity == "high":
            high_count += 1

        vif_results[str(col)] = {
            "vif": vif,
            "r_squared": round(float(r2), 4),
            "severity": severity,
            "interpretation": (
                "Severe multicollinearity (recommend dropping or combining)"
                if severity == "high"
                else ("Moderate correlation" if severity == "moderate" else "Low multicollinearity")
            ),
        }

    return {
        "columns_analyzed": len(valid_cols),
        "vif_results": vif_results,
        "high_multicollinearity_detected": bool(high_count > 0),
        "high_vif_count": high_count,
    }


def compute_stationarity_tests(
    csv_path: str,
    datetime_column: str | None = None,
    value_column: str | None = None,
) -> dict[str, Any]:
    """
    Run Augmented Dickey-Fuller (ADF) and KPSS stationarity tests on a time series.
    """
    try:
        from statsmodels.tsa.stattools import adfuller, kpss
    except ImportError as exc:
        raise StatisticalTestError("statsmodels is required for stationarity tests.") from exc

    path = Path(csv_path)
    if not path.is_file():
        raise StatisticalTestError("The dataset file could not be found.")

    try:
        df = pd.read_csv(path)
    except Exception as exc:
        raise StatisticalTestError(f"Could not read CSV dataset: {exc}") from exc

    numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    if not numeric_cols:
        raise StatisticalTestError("No numeric columns available for stationarity testing.")

    target_val_col = value_column if (value_column and value_column in numeric_cols) else numeric_cols[0]

    # Optional datetime ordering
    if datetime_column and datetime_column in df.columns:
        df = df.sort_values(by=datetime_column).reset_index(drop=True)

    series = df[target_val_col].dropna()
    finite_series = series[np.isfinite(series)]

    if len(finite_series) < 15:
        raise StatisticalTestError("At least 15 numeric observations are required for stationarity tests.")

    # 1. ADF Test (Null Hypothesis H0: Unit root present, Non-Stationary)
    try:
        adf_res = adfuller(finite_series, autolag="AIC")
        adf_stat = _clean_float(adf_res[0])
        adf_p = _clean_float(adf_res[1])
        adf_lags = int(adf_res[2])
        adf_crit = {k: _clean_float(v) for k, v in adf_res[4].items()}
        adf_stationary = bool(adf_p < 0.05) if adf_p is not None else False
    except Exception as exc:
        adf_stat, adf_p, adf_lags, adf_crit, adf_stationary = None, None, None, {}, False

    # 2. KPSS Test (Null Hypothesis H0: Process is stationary)
    try:
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            kpss_res = kpss(finite_series, regression="c", nlags="auto")
            kpss_stat = _clean_float(kpss_res[0])
            kpss_p = _clean_float(kpss_res[1])
            kpss_crit = {k: _clean_float(v) for k, v in kpss_res[3].items()}
            kpss_stationary = bool(kpss_p >= 0.05) if kpss_p is not None else False
    except Exception:
        kpss_stat, kpss_p, kpss_crit, kpss_stationary = None, None, {}, False

    # Combined Verdict
    if adf_stationary and kpss_stationary:
        verdict = "Strictly Stationary"
        recommendation = "Series is stationary; ready for modeling without differencing."
    elif adf_stationary and not kpss_stationary:
        verdict = "Trend Stationary"
        recommendation = "Series has trend stationarity; consider detrending."
    elif not adf_stationary and kpss_stationary:
        verdict = "Difference Stationary"
        recommendation = "Series requires first-order differencing (d=1) to achieve stationarity."
    else:
        verdict = "Non-Stationary"
        recommendation = "Series is non-stationary; apply differencing or seasonal adjustment."

    return {
        "value_column": target_val_col,
        "sample_size": len(finite_series),
        "adf_test": {
            "statistic": adf_stat,
            "p_value": adf_p,
            "used_lags": adf_lags,
            "critical_values": adf_crit,
            "is_stationary": adf_stationary,
            "null_hypothesis": "Series has a unit root (non-stationary)",
            "conclusion": "Stationary (Reject H0)" if adf_stationary else "Non-Stationary (Fail to Reject H0)",
        },
        "kpss_test": {
            "statistic": kpss_stat,
            "p_value": kpss_p,
            "critical_values": kpss_crit,
            "is_stationary": kpss_stationary,
            "null_hypothesis": "Series is stationary around a deterministic trend",
            "conclusion": "Stationary (Fail to Reject H0)" if kpss_stationary else "Non-Stationary (Reject H0)",
        },
        "verdict": verdict,
        "recommendation": recommendation,
    }


def run_hypothesis_test(
    csv_path: str,
    test_type: str,
    col_a: str,
    col_b: str | None = None,
    group_col: str | None = None,
    alpha: float = 0.05,
) -> dict[str, Any]:
    """
    Execute a specified statistical hypothesis test between features or across groups.
    """
    path = Path(csv_path)
    if not path.is_file():
        raise StatisticalTestError("The dataset file could not be found.")

    try:
        df = pd.read_csv(path)
    except Exception as exc:
        raise StatisticalTestError(f"Could not read CSV dataset: {exc}") from exc

    if col_a not in df.columns:
        raise StatisticalTestError(f"Column '{col_a}' not found in dataset.")

    test_type = test_type.lower().strip()

    # Two-Sample Independent T-Test (Student or Welch)
    if test_type in ("two_sample_t_test", "welch_t_test", "mann_whitney"):
        if group_col and group_col in df.columns:
            # Grouping by a binary categorical variable
            groups = df[group_col].dropna().unique()
            if len(groups) < 2:
                raise StatisticalTestError(f"Group column '{group_col}' must have at least 2 categories.")
            samp1 = df[df[group_col] == groups[0]][col_a].dropna()
            samp2 = df[df[group_col] == groups[1]][col_a].dropna()
            label_a = f"{col_a} ({groups[0]})"
            label_b = f"{col_a} ({groups[1]})"
        elif col_b and col_b in df.columns:
            samp1 = df[col_a].dropna()
            samp2 = df[col_b].dropna()
            label_a = col_a
            label_b = col_b
        else:
            raise StatisticalTestError("Two-sample test requires either a second column ('col_b') or a 'group_col'.")

        if len(samp1) < 2 or len(samp2) < 2:
            raise StatisticalTestError("Both samples must contain at least 2 non-null observations.")

        if test_type == "two_sample_t_test":
            stat, p_val = stats.ttest_ind(samp1, samp2, equal_var=True)
            name = "Two-Sample Independent T-Test (Student's)"
        elif test_type == "welch_t_test":
            stat, p_val = stats.ttest_ind(samp1, samp2, equal_var=False)
            name = "Welch's T-Test (Unequal Variances)"
        else:
            stat, p_val = stats.mannwhitneyu(samp1, samp2)
            name = "Mann-Whitney U Test (Non-Parametric)"

        p_clean = _clean_float(p_val)
        sig = bool(p_clean < alpha) if p_clean is not None else False

        return {
            "test_name": name,
            "sample_a_label": label_a,
            "sample_b_label": label_b,
            "sample_a_size": len(samp1),
            "sample_b_size": len(samp2),
            "sample_a_mean": _clean_float(samp1.mean()),
            "sample_b_mean": _clean_float(samp2.mean()),
            "statistic": _clean_float(stat),
            "p_value": p_clean,
            "alpha": alpha,
            "significant": sig,
            "interpretation": (
                f"Statistically significant difference between '{label_a}' and '{label_b}' (p < {alpha})."
                if sig
                else f"No statistically significant difference detected (p >= {alpha})."
            ),
        }

    # One-Way ANOVA or Kruskal-Wallis
    elif test_type in ("one_way_anova", "kruskal_wallis"):
        if not group_col or group_col not in df.columns:
            raise StatisticalTestError(f"'{test_type}' requires a categorical 'group_col'.")

        grouped = [group[col_a].dropna().values for _, group in df.groupby(group_col) if len(group[col_a].dropna()) >= 2]
        if len(grouped) < 2:
            raise StatisticalTestError(f"Group column '{group_col}' must have at least 2 groups with >= 2 observations.")

        if test_type == "one_way_anova":
            stat, p_val = stats.f_oneway(*grouped)
            name = "One-Way ANOVA (F-Test)"
        else:
            stat, p_val = stats.kruskal(*grouped)
            name = "Kruskal-Wallis H-Test (Non-Parametric ANOVA)"

        p_clean = _clean_float(p_val)
        sig = bool(p_clean < alpha) if p_clean is not None else False

        return {
            "test_name": name,
            "numeric_column": col_a,
            "group_column": group_col,
            "number_of_groups": len(grouped),
            "statistic": _clean_float(stat),
            "p_value": p_clean,
            "alpha": alpha,
            "significant": sig,
            "interpretation": (
                f"Significant difference exists across groups of '{group_col}' on '{col_a}' (p < {alpha})."
                if sig
                else f"No significant group difference found (p >= {alpha})."
            ),
        }

    # Chi-Square Test of Independence
    elif test_type == "chi_square":
        if not col_b or col_b not in df.columns:
            raise StatisticalTestError("Chi-Square test requires two categorical columns ('col_a' and 'col_b').")

        contingency = pd.crosstab(df[col_a], df[col_b])
        if contingency.shape[0] < 2 or contingency.shape[1] < 2:
            raise StatisticalTestError("Contingency table must be at least 2x2.")

        chi2, p_val, dof, _ = stats.chi2_contingency(contingency)
        n = contingency.sum().sum()
        min_dim = min(contingency.shape) - 1
        cramers_v = np.sqrt(chi2 / (n * min_dim)) if (n > 0 and min_dim > 0) else 0.0

        p_clean = _clean_float(p_val)
        sig = bool(p_clean < alpha) if p_clean is not None else False

        return {
            "test_name": "Chi-Square Test of Independence",
            "column_a": col_a,
            "column_b": col_b,
            "degrees_of_freedom": int(dof),
            "statistic": _clean_float(chi2),
            "p_value": p_clean,
            "cramers_v": _clean_float(cramers_v),
            "alpha": alpha,
            "significant": sig,
            "interpretation": (
                f"Significant association between '{col_a}' and '{col_b}' (p < {alpha}, Cramér's V = {round(cramers_v, 3)})."
                if sig
                else f"No significant association between '{col_a}' and '{col_b}' (p >= {alpha})."
            ),
        }

    # Levene's Test for Homogeneity of Variances
    elif test_type == "levene_test":
        if group_col and group_col in df.columns:
            samples = [group[col_a].dropna().values for _, group in df.groupby(group_col) if len(group[col_a].dropna()) >= 2]
        elif col_b and col_b in df.columns:
            samples = [df[col_a].dropna().values, df[col_b].dropna().values]
        else:
            raise StatisticalTestError("Levene test requires either 'col_b' or 'group_col'.")

        stat, p_val = stats.levene(*samples)
        p_clean = _clean_float(p_val)
        equal_var = bool(p_clean >= alpha) if p_clean is not None else False

        return {
            "test_name": "Levene's Test for Equality of Variances",
            "statistic": _clean_float(stat),
            "p_value": p_clean,
            "alpha": alpha,
            "equal_variances_assumed": equal_var,
            "interpretation": (
                "Variances are equal across groups (homoscedasticity holds)."
                if equal_var
                else "Variances are significantly unequal (heteroscedasticity detected; use Welch's T-test)."
            ),
        }

    else:
        raise StatisticalTestError(
            f"Unsupported test '{test_type}'. Available: two_sample_t_test, welch_t_test, mann_whitney, one_way_anova, kruskal_wallis, chi_square, levene_test"
        )


def compute_correlations_extended(csv_path: str) -> dict[str, Any]:
    """
    Compute pairwise Pearson, Spearman rank, and Kendall's tau correlation matrices.
    """
    path = Path(csv_path)
    if not path.is_file():
        raise StatisticalTestError("The dataset file could not be found.")

    try:
        df = pd.read_csv(path)
    except Exception as exc:
        raise StatisticalTestError(f"Could not read CSV dataset: {exc}") from exc

    numeric_df = df.select_dtypes(include="number").replace([np.inf, -np.inf], np.nan)
    cols = [str(c) for c in numeric_df.columns if numeric_df[c].dropna().nunique() > 1]

    if len(cols) < 2:
        raise StatisticalTestError("Extended correlation requires at least 2 non-constant numeric columns.")

    pearson_mat = numeric_df[cols].corr(method="pearson").to_dict()
    spearman_mat = numeric_df[cols].corr(method="spearman").to_dict()
    kendall_mat = numeric_df[cols].corr(method="kendall").to_dict()

    # Clean floats for JSON safety
    def _clean_matrix(mat: dict) -> dict:
        return {
            c1: {c2: _clean_float(val) for c2, val in row.items()}
            for c1, row in mat.items()
        }

    return {
        "columns": cols,
        "pearson": _clean_matrix(pearson_mat),
        "spearman": _clean_matrix(spearman_mat),
        "kendall": _clean_matrix(kendall_mat),
    }
