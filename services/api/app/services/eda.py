
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


class EDAError(ValueError):
    """Raised when exploratory analysis cannot be performed."""


def _clean_float(val: Any) -> float | None:
    """Safely convert value to finite float or None for JSON serialization."""
    if val is None or pd.isna(val):
        return None
    try:
        f = float(val)
        if not np.isfinite(f):
            return None
        return f
    except (ValueError, TypeError):
        return None


def descriptive_statistics(csv_path: str) -> dict:
    """Generate descriptive statistics for a registered CSV dataset."""

    path = Path(csv_path)

    if not path.is_file():
        raise EDAError("The dataset file could not be found.")

    try:
        df = pd.read_csv(path)
    except (OSError, UnicodeDecodeError, pd.errors.ParserError) as exc:
        raise EDAError("The dataset could not be read as a valid CSV file.") from exc

    if df.empty:
        raise EDAError("Cannot calculate statistics for an empty dataset.")

    if len(df.columns) == 0:
        raise EDAError("The dataset has no columns.")

    numeric_df = df.select_dtypes(include="number")
    statistics = {}

    if not numeric_df.empty:
        summary = numeric_df.describe().transpose()

        for column in summary.index:
            row = summary.loc[column]
            statistics[str(column)] = {
                "count": int(row["count"]),
                "mean": _clean_float(row["mean"]),
                "std": _clean_float(row["std"]),
                "min": _clean_float(row["min"]),
                "q25": _clean_float(row["25%"]),
                "median": _clean_float(row["50%"]),
                "q75": _clean_float(row["75%"]),
                "max": _clean_float(row["max"]),
            }

    column_summary = []

    for column in df.columns:
        series = df[column]
        column_summary.append(
            {
                "name": str(column),
                "dtype": str(series.dtype),
                "non_null_count": int(series.count()),
                "missing_count": int(series.isna().sum()),
                "missing_percentage": round(
                    float(series.isna().mean() * 100), 2
                ),
                "unique_count": int(series.nunique(dropna=True)),
            }
        )

    return {
        "dataset": {
            "rows": int(len(df)),
            "columns": int(len(df.columns)),
            "duplicate_rows": int(df.duplicated().sum()),
            "memory_usage_bytes": int(
                df.memory_usage(index=True, deep=True).sum()
            ),
        },
        "numeric_statistics": statistics,
        "column_summary": column_summary,
    }

def distribution_analysis(csv_path: str, bins: int = 10) -> dict:
    """Generate histogram bins and IQR-based outlier summaries."""

    from pathlib import Path

    import pandas as pd

    if not 1 <= bins <= 50:
        raise EDAError("bins must be between 1 and 50.")

    path = Path(csv_path)

    if not path.is_file():
        raise EDAError("The dataset file could not be found.")

    try:
        df = pd.read_csv(path)
    except (OSError, UnicodeDecodeError, pd.errors.ParserError) as exc:
        raise EDAError("The dataset could not be read as a valid CSV file.") from exc

    if df.empty or len(df.columns) == 0:
        raise EDAError("Cannot analyze an empty dataset.")

    numeric_df = df.select_dtypes(include="number")
    distributions = {}

    for column in numeric_df.columns:
        series = numeric_df[column].dropna()
        finite_series = series[np.isfinite(series)]

        if finite_series.empty:
            distributions[str(column)] = {
                "count": 0,
                "missing_count": int(numeric_df[column].isna().sum()),
                "mean": None,
                "median": None,
                "bins": [],
                "outliers": {
                    "lower_bound": None,
                    "upper_bound": None,
                    "count": 0,
                },
            }
            continue

        counts, edges = np.histogram(
            finite_series.to_numpy(),
            bins=min(bins, max(1, int(finite_series.nunique()))),
        )

        q1 = _clean_float(finite_series.quantile(0.25))
        q3 = _clean_float(finite_series.quantile(0.75))
        if q1 is not None and q3 is not None:
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            outlier_count = int(
                ((finite_series < lower_bound) | (finite_series > upper_bound)).sum()
            )
        else:
            lower_bound = None
            upper_bound = None
            outlier_count = 0

        histogram_bins = [
            {
                "lower": _clean_float(edges[i]),
                "upper": _clean_float(edges[i + 1]),
                "count": int(counts[i]),
            }
            for i in range(len(counts))
        ]

        distributions[str(column)] = {
            "count": int(finite_series.count()),
            "missing_count": int(numeric_df[column].isna().sum()),
            "mean": _clean_float(finite_series.mean()),
            "median": _clean_float(finite_series.median()),
            "bins": histogram_bins,
            "outliers": {
                "lower_bound": _clean_float(lower_bound),
                "upper_bound": _clean_float(upper_bound),
                "count": outlier_count,
            },
        }

    return {
        "rows": int(len(df)),
        "numeric_columns_analyzed": len(distributions),
        "requested_bins": bins,
        "distributions": distributions,
    }

def correlation_analysis(csv_path: str) -> dict:
    """Calculate pairwise Pearson correlations for numeric columns."""

    from pathlib import Path

    import pandas as pd

    path = Path(csv_path)

    if not path.is_file():
        raise EDAError("The dataset file could not be found.")

    try:
        df = pd.read_csv(path)
    except (OSError, UnicodeDecodeError, pd.errors.ParserError) as exc:
        raise EDAError("The dataset could not be read as a valid CSV file.") from exc

    if df.empty or len(df.columns) == 0:
        raise EDAError("Cannot analyze an empty dataset.")

    numeric_df = df.select_dtypes(include="number")
    columns = [str(column) for column in numeric_df.columns]

    if len(columns) < 2:
        raise EDAError(
            "Correlation analysis requires at least two numeric columns."
        )

    matrix = numeric_df.corr(method="pearson", min_periods=2)

    correlations = {}

    for column in columns:
        correlations[column] = {}

        for other_column in columns:
            value = matrix.loc[column, other_column]
            correlations[column][other_column] = (
                round(float(value), 6) if pd.notna(value) else None
            )

    return {
        "rows": int(len(df)),
        "numeric_columns_analyzed": len(columns),
        "method": "pearson",
        "correlations": correlations,
    }

def time_series_analysis(
    csv_path: str,
    datetime_column: str | None = None,
) -> dict:
    """Inspect timestamps, ordering, intervals, and time-series gaps."""

    from pathlib import Path

    import pandas as pd

    path = Path(csv_path)

    if not path.is_file():
        raise EDAError("The dataset file could not be found.")

    try:
        df = pd.read_csv(path)
    except (OSError, UnicodeDecodeError, pd.errors.ParserError) as exc:
        raise EDAError("The dataset could not be read as a valid CSV file.") from exc

    if df.empty or len(df.columns) == 0:
        raise EDAError("Cannot analyze an empty dataset.")

    # Use an explicitly requested column, or identify a likely datetime column.
    if datetime_column is None:
        candidates = [
            str(column)
            for column in df.columns
            if any(
                token in str(column).lower()
                for token in ("datetime", "timestamp", "date", "time")
            )
        ]
        if candidates:
            datetime_column = candidates[0]
        else:
            # Fall back to string/object columns that can be parsed as timestamps.
            for column in df.columns:
                col_type = df[column].dtype
                if col_type == "object" or getattr(col_type, "name", "") in ("string", "category"):
                    parsed = pd.to_datetime(df[column], errors="coerce")
                    if parsed.notna().mean() >= 0.8:
                        datetime_column = str(column)
                        break

    if datetime_column is None or datetime_column not in df.columns:
        raise EDAError(
            "Could not identify a datetime column. Specify a valid datetime column."
        )

    original = df[datetime_column]
    timestamps = pd.to_datetime(original, errors="coerce")

    invalid_count = int(timestamps.isna().sum())
    valid = timestamps.dropna()

    if valid.empty:
        raise EDAError(
            f"Column '{datetime_column}' contains no valid timestamps."
        )

    differences = valid.sort_values().diff().dropna()
    interval_counts = differences.value_counts()

    if interval_counts.empty:
        most_common_interval = None
        most_common_interval_seconds = None
        interval_consistency = None
    else:
        most_common_interval = interval_counts.index[0]
        most_common_interval_seconds = int(
            most_common_interval.total_seconds()
        )
        interval_consistency = round(
            float(interval_counts.iloc[0] / len(differences)),
            4,
        )

    sorted_chronologically = bool(valid.is_monotonic_increasing)
    duplicate_timestamp_count = int(valid.duplicated().sum())

    # Report gaps relative to the most common positive interval.
    gap_count = 0
    if most_common_interval is not None and most_common_interval_seconds and most_common_interval_seconds > 0:
        gap_count = int((differences > most_common_interval).sum())

    return {
        "rows": int(len(df)),
        "datetime_column": datetime_column,
        "valid_timestamp_count": int(valid.count()),
        "invalid_timestamp_count": invalid_count,
        "earliest_timestamp": valid.min().isoformat(),
        "latest_timestamp": valid.max().isoformat(),
        "chronologically_sorted": sorted_chronologically,
        "duplicate_timestamp_count": duplicate_timestamp_count,
        "most_common_interval_seconds": most_common_interval_seconds,
        "interval_consistency": interval_consistency,
        "gaps_larger_than_common_interval": gap_count,
    }

def build_eda_summary(
    csv_path: str,
    datetime_column: str | None = None,
    bins: int = 10,
) -> dict:
    """Combine descriptive, distribution, correlation, and time-series analysis."""

    statistics = descriptive_statistics(csv_path)
    distributions = distribution_analysis(csv_path, bins=bins)
    correlations = correlation_analysis(csv_path)

    warnings = []

    dataset_info = statistics["dataset"]
    column_summary = statistics["column_summary"]

    # Data quality warnings
    if dataset_info["duplicate_rows"] > 0:
        warnings.append({
            "type": "duplicate_rows",
            "severity": "warning",
            "column": None,
            "columns": None,
            "message": (
                f'{dataset_info["duplicate_rows"]} duplicate rows were found.'
            ),
        })

    missing_total = sum(
        column["missing_count"] for column in column_summary
    )

    if missing_total > 0:
        warnings.append({
            "type": "missing_values",
            "severity": "warning",
            "column": None,
            "columns": None,
            "message": f"{missing_total} missing cell values were found.",
        })

    # Calculate numeric column diagnostics
    diagnostics = numeric_column_diagnostics(csv_path)

    # Time-series analysis is optional for datasets without a usable
    # datetime column. A failure here should not hide successful EDA results.
    time_series = None

    try:
        time_series = time_series_analysis(
            csv_path,
            datetime_column=datetime_column,
        )

        if time_series["invalid_timestamp_count"] > 0:
            warnings.append({
                "type": "invalid_timestamps",
                "severity": "warning",
                "column": time_series["datetime_column"],
                "columns": [time_series["datetime_column"]],
                "message": (
                    f'{time_series["invalid_timestamp_count"]} rows have '
                    "invalid timestamps."
                ),
            })

        if time_series["duplicate_timestamp_count"] > 0:
            warnings.append({
                "type": "duplicate_timestamps",
                "severity": "warning",
                "column": time_series["datetime_column"],
                "columns": [time_series["datetime_column"]],
                "message": (
                    f'{time_series["duplicate_timestamp_count"]} duplicate '
                    "timestamps were found."
                ),
            })

        if time_series["gaps_larger_than_common_interval"] > 0:
            warnings.append({
                "type": "timestamp_gaps",
                "severity": "info",
                "column": time_series["datetime_column"],
                "columns": [time_series["datetime_column"]],
                "message": (
                    f'{time_series["gaps_larger_than_common_interval"]} '
                    "intervals exceed the most common sampling interval."
                ),
            })

    except EDAError as exc:
        warnings.append({
            "type": "time_series_unavailable",
            "severity": "info",
            "column": None,
            "columns": None,
            "message": str(exc),
        })

    for column in diagnostics["constant_columns"]:
        warnings.append({
            "type": "constant_column",
            "severity": "warning",
            "column": str(column),
            "columns": [str(column)],
            "message": (
                f"Column '{column}' contains only one "
                "unique non-null value."
            ),
        })

    for column in diagnostics["insufficient_data_columns"]:
        warnings.append({
            "type": "insufficient_numeric_data",
            "severity": "warning",
            "column": str(column),
            "columns": [str(column)],
            "message": (
                f"Column '{column}' has insufficient numeric data."
            ),
        })

    for item in diagnostics.get("high_missing_columns", []):
        warnings.append({
            "type": "high_missingness",
            "severity": "warning",
            "column": item["column"],
            "columns": [item["column"]],
            "message": (
                f"Column '{item['column']}' has {item['missing_percentage']}% "
                "missing numeric values."
            ),
        })

    for pair in diagnostics.get("high_correlation_pairs", []):
        warnings.append({
            "type": "high_correlation",
            "severity": "info",
            "column": None,
            "columns": [pair["column_a"], pair["column_b"]],
            "message": (
                f"Columns '{pair['column_a']}' and '{pair['column_b']}' "
                f"have a very strong correlation of {pair['correlation']}."
            ),
        })

    for pair in diagnostics["undefined_correlation_pairs"]:
        warnings.append({
            "type": "undefined_correlation",
            "severity": "warning",
            "column": None,
            "columns": [pair["column_a"], pair["column_b"]],
            "message": (
                f"Correlation between '{pair['column_a']}' and "
                f"'{pair['column_b']}' is undefined."
            ),
        })

    return {
        "dataset": dataset_info,
        "column_summary": column_summary,
        "numeric_statistics": statistics["numeric_statistics"],
        "distributions": distributions["distributions"],
        "correlations": correlations["correlations"],
        "numeric_diagnostics": diagnostics,
        "time_series": time_series,
        "warnings": warnings,
    }


def numeric_column_diagnostics(csv_path: str) -> dict:
    """Report constant columns, high missingness, high correlations, and undefined pairwise correlations."""

    path = Path(csv_path)

    if not path.is_file():
        raise EDAError("The dataset file could not be found.")

    try:
        df = pd.read_csv(path)
    except (OSError, UnicodeDecodeError, pd.errors.ParserError) as exc:
        raise EDAError("The dataset could not be read as a valid CSV file.") from exc

    if df.empty or len(df.columns) == 0:
        raise EDAError("Cannot analyze an empty dataset.")

    # Filter out non-finite infs to prevent runtime warnings in correlations
    numeric_df = df.select_dtypes(include="number").replace([float("inf"), float("-inf")], float("nan"))

    constant_columns = []
    insufficient_columns = []
    high_missing_columns = []

    for column in numeric_df.columns:
        series = numeric_df[column]
        values = series.dropna()
        unique_count = int(values.nunique())

        if unique_count == 1:
            constant_columns.append(str(column))
        elif unique_count < 2:
            insufficient_columns.append(str(column))

        # Identify columns with >= 50% missing values
        missing_pct = round(float(series.isna().mean() * 100), 2)
        if missing_pct >= 50.0:
            high_missing_columns.append({
                "column": str(column),
                "missing_percentage": missing_pct,
            })

    matrix = numeric_df.corr(method="pearson", min_periods=2)
    undefined_pairs = []
    high_correlation_pairs = []

    cols = list(matrix.columns)
    for i, col_a in enumerate(cols):
        for col_b in cols[i + 1:]:
            val = matrix.loc[col_a, col_b]
            if pd.isna(val):
                undefined_pairs.append({
                    "column_a": str(col_a),
                    "column_b": str(col_b),
                    "reason": "Correlation is undefined for these columns.",
                })
            elif abs(float(val)) >= 0.98:
                high_correlation_pairs.append({
                    "column_a": str(col_a),
                    "column_b": str(col_b),
                    "correlation": round(float(val), 4),
                })

    return {
        "numeric_columns_analyzed": int(len(numeric_df.columns)),
        "constant_columns": constant_columns,
        "insufficient_data_columns": insufficient_columns,
        "high_missing_columns": high_missing_columns,
        "high_correlation_pairs": high_correlation_pairs,
        "undefined_correlation_pairs": undefined_pairs,
    }
