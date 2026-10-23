
from typing import Any

import pandas as pd


class CleaningError(ValueError):
    """Raised when a requested cleaning operation is invalid."""


def inspect_dataframe(df: pd.DataFrame) -> dict[str, Any]:
    """Return a structured overview without changing the dataframe."""
    columns = []

    for name in df.columns:
        series = df[name]
        non_null = series.dropna()

        columns.append({
            "name": str(name),
            "dtype": str(series.dtype),
            "missing_count": int(series.isna().sum()),
            "missing_percent": round(
                float(series.isna().mean() * 100), 2
            ),
            "unique_count": int(series.nunique(dropna=True)),
            "sample_values": [
                None if pd.isna(value) else str(value)
                for value in non_null.head(5).tolist()
            ],
        })

    return {
        "rows": int(len(df)),
        "columns": int(len(df.columns)),
        "duplicate_rows": int(df.duplicated().sum()),
        "memory_usage_bytes": int(
            df.memory_usage(index=True, deep=True).sum()
        ),
        "column_details": columns,
        "preview": df.head(10).astype(object).where(
            pd.notna(df.head(10)), None
        ).to_dict(orient="records"),
    }


def preview_cleaning(
    source: pd.DataFrame,
    operations: list[dict[str, Any]],
    *,
    include_dataframe: bool = False,
) -> dict[str, Any]:
    """
    Apply requested operations to a copy.
    The source dataframe is never modified.
    """
    df = source.copy(deep=True)
    changes = []

    def require_column(column: str | None) -> str:
        if not column or column not in df.columns:
            raise CleaningError(
                f"Column '{column}' does not exist in the current dataset."
            )
        return column

    for index, operation in enumerate(operations):
        action = operation["operation"]
        column = operation.get("column")
        before_rows, before_cols = df.shape
        changed_cells = 0
        description = ""

        if action == "drop_duplicates":
            before = len(df)
            df = df.drop_duplicates().reset_index(drop=True)
            changed_cells = before - len(df)
            description = f"Removed {changed_cells} duplicate rows."

        elif action == "drop_missing_rows":
            col = require_column(column)
            before = len(df)
            df = df.dropna(subset=[col]).reset_index(drop=True)
            changed_cells = before - len(df)
            description = (
                f"Removed {changed_cells} rows missing '{col}'."
            )

        elif action == "fill_missing":
            col = require_column(column)
            strategy = operation.get("strategy")
            missing_before = int(df[col].isna().sum())

            if strategy == "mean":
                if not pd.api.types.is_numeric_dtype(df[col]):
                    raise CleaningError(
                        f"Mean requires a numeric column: '{col}'."
                    )
                fill_value = df[col].mean()
            elif strategy == "median":
                if not pd.api.types.is_numeric_dtype(df[col]):
                    raise CleaningError(
                        f"Median requires a numeric column: '{col}'."
                    )
                fill_value = df[col].median()
            elif strategy == "mode":
                modes = df[col].mode(dropna=True)
                if modes.empty:
                    raise CleaningError(
                        f"Cannot calculate mode for '{col}'."
                    )
                fill_value = modes.iloc[0]
            elif strategy == "constant":
                fill_value = operation.get("value")
                if fill_value is None:
                    raise CleaningError(
                        "The constant strategy requires a non-null value."
                    )
            else:
                raise CleaningError(
                    "Use strategy: mean, median, mode, or constant."
                )

            if pd.isna(fill_value):
                raise CleaningError(
                    f"Could not calculate a fill value for '{col}'."
                )

            df[col] = df[col].fillna(fill_value)
            changed_cells = missing_before - int(df[col].isna().sum())
            description = (
                f"Filled {changed_cells} missing values in '{col}' "
                f"using {strategy}."
            )

        elif action == "drop_column":
            col = require_column(column)
            df = df.drop(columns=[col])
            changed_cells = before_rows
            description = f"Dropped column '{col}'."

        elif action == "convert_type":
            col = require_column(column)
            target_type = operation.get("dtype")

            try:
                if target_type == "numeric":
                    df[col] = pd.to_numeric(df[col], errors="raise")
                elif target_type == "integer":
                    numeric = pd.to_numeric(df[col], errors="raise")
                    non_null = numeric.dropna()
                    if not (non_null % 1 == 0).all():
                        raise CleaningError(
                            f"Column '{col}' contains non-integer values."
                        )
                    df[col] = numeric.astype("Int64")
                elif target_type == "string":
                    df[col] = df[col].astype("string")
                elif target_type == "datetime":
                    df[col] = pd.to_datetime(df[col], errors="raise")
                else:
                    raise CleaningError(
                        "dtype must be numeric, integer, string, or datetime."
                    )
            except (ValueError, TypeError) as exc:
                raise CleaningError(
                    f"Cannot convert '{col}' to {target_type}: {exc}"
                ) from exc

            description = (
                f"Converted '{col}' to {target_type}."
            )

        elif action == "cap_outliers":
            col = require_column(column)
            if not pd.api.types.is_numeric_dtype(df[col]):
                raise CleaningError(
                    f"Outlier capping requires a numeric column: '{col}'."
                )

            multiplier = operation.get("multiplier", 1.5)
            if not isinstance(multiplier, (int, float)) or multiplier <= 0:
                raise CleaningError(
                    "Outlier multiplier must be greater than zero."
                )

            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)

            if pd.isna(q1) or pd.isna(q3):
                raise CleaningError(
                    f"Cannot calculate outlier bounds for '{col}'."
                )

            iqr = q3 - q1
            lower = q1 - multiplier * iqr
            upper = q3 + multiplier * iqr

            mask = df[col].notna() & (
                (df[col] < lower) | (df[col] > upper)
            )
            changed_cells = int(mask.sum())
            df[col] = df[col].clip(lower=lower, upper=upper)

            description = (
                f"Capped {changed_cells} outliers in '{col}' "
                f"to [{lower}, {upper}]."
            )

        else:
            raise CleaningError(
                f"Operation {index + 1}: unsupported operation '{action}'."
            )

        changes.append({
            "step": index + 1,
            "operation": action,
            "description": description,
            "rows_before": int(before_rows),
            "rows_after": int(len(df)),
            "columns_before": int(before_cols),
            "columns_after": int(len(df.columns)),
            "affected_count": int(changed_cells),
        })

    preview_df = df.head(20).astype(object).where(
        pd.notna(df.head(20)), None
    )

    result = {
        "original_shape": {
            "rows": int(len(source)),
            "columns": int(len(source.columns)),
        },
        "preview_shape": {
            "rows": int(len(df)),
            "columns": int(len(df.columns)),
        },
        "operations_applied": len(changes),
        "changes": changes,
        "remaining_missing_values": {
            str(col): int(count)
            for col, count in df.isna().sum().items()
        },
        "preview": preview_df.to_dict(orient="records"),
        "column_types": {
            str(col): str(dtype)
            for col, dtype in df.dtypes.items()
        },
    }

    if include_dataframe:
        result["_cleaned_dataframe"] = df

    return result

