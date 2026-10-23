"""
Dataset schema inference, persistence, and type restoration service.

Preserves rich data types (e.g. datetime, Int64, category) across CSV reloads
and maintains transformation lineage across dataset versions.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


def infer_column_schema(series: pd.Series) -> dict[str, Any]:
    """Infer logical type, physical type, nullability, and candidates for a single column."""
    name = str(series.name)
    dtype = series.dtype
    dtype_str = str(dtype)
    non_null = series.dropna()
    total_count = len(series)
    non_null_count = len(non_null)
    nullable = bool(series.isna().any())

    # 1. Datetime detection
    is_datetime = False
    datetime_format = None
    if pd.api.types.is_datetime64_any_dtype(dtype):
        is_datetime = True
    elif (dtype_str == "object" or dtype_str.startswith("string")) and non_null_count > 0:
        # Check column name hints
        lower_name = name.lower()
        if any(token in lower_name for token in ("datetime", "timestamp", "date", "time")):
            try:
                parsed = pd.to_datetime(non_null.head(50), errors="coerce")
                if parsed.notna().mean() >= 0.8:
                    is_datetime = True
            except Exception:
                pass

    if is_datetime:
        return {
            "name": name,
            "logical_type": "datetime",
            "physical_type": "datetime64[ns]",
            "nullable": nullable,
            "datetime_format": datetime_format,
            "categories": None,
            "is_target_candidate": False,
        }

    # 2. Boolean detection
    if pd.api.types.is_bool_dtype(dtype) or (
        dtype_str in ("object", "category")
        and set(non_null.astype(str).str.lower().unique()).issubset({"true", "false", "0", "1", "yes", "no"})
    ):
        return {
            "name": name,
            "logical_type": "boolean",
            "physical_type": "boolean",
            "nullable": nullable,
            "datetime_format": None,
            "categories": None,
            "is_target_candidate": True,
        }

    # 3. Numeric detection (Integer vs Float)
    if pd.api.types.is_numeric_dtype(dtype):
        is_int = False
        if pd.api.types.is_integer_dtype(dtype):
            is_int = True
        elif non_null_count > 0 and (non_null % 1 == 0).all():
            is_int = True

        logical = "integer" if is_int else "numeric"
        physical = "Int64" if is_int else "float64"
        is_target = bool(non_null.nunique() > 1)

        return {
            "name": name,
            "logical_type": logical,
            "physical_type": physical,
            "nullable": nullable,
            "datetime_format": None,
            "categories": None,
            "is_target_candidate": is_target,
        }

    # 4. Categorical vs Text detection
    unique_count = non_null.nunique()
    if unique_count <= 50 or (total_count > 0 and unique_count / total_count <= 0.2):
        categories = sorted([str(x) for x in non_null.unique()[:100]])
        return {
            "name": name,
            "logical_type": "categorical",
            "physical_type": "category",
            "nullable": nullable,
            "datetime_format": None,
            "categories": categories,
            "is_target_candidate": bool(1 < unique_count <= 20),
        }

    return {
        "name": name,
        "logical_type": "text",
        "physical_type": "string",
        "nullable": nullable,
        "datetime_format": None,
        "categories": None,
        "is_target_candidate": False,
    }


def infer_dataset_schema(df: pd.DataFrame) -> dict[str, Any]:
    """Generate a complete schema manifest for a DataFrame."""
    columns_schema = [infer_column_schema(df[col]) for col in df.columns]

    datetime_cols = [c["name"] for c in columns_schema if c["logical_type"] == "datetime"]
    numeric_cols = [c["name"] for c in columns_schema if c["logical_type"] in ("numeric", "integer")]
    categorical_cols = [c["name"] for c in columns_schema if c["logical_type"] == "categorical"]

    return {
        "version": 1,
        "column_count": len(columns_schema),
        "columns": columns_schema,
        "datetime_columns": datetime_cols,
        "numeric_columns": numeric_cols,
        "categorical_columns": categorical_cols,
    }


def build_schema_from_cleaning(
    parent_schema: dict[str, Any] | None,
    cleaned_df: pd.DataFrame,
    operations: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    Build updated schema for a cleaned dataset, honoring explicit type conversions.
    """
    schema = infer_dataset_schema(cleaned_df)

    # Apply explicit operation overrides if convert_type was requested
    col_map = {c["name"]: c for c in schema["columns"]}
    for op in operations:
        action = op.get("operation")
        col_name = op.get("column")
        if action == "convert_type" and col_name in col_map:
            target_dtype = op.get("dtype")
            if target_dtype == "datetime":
                col_map[col_name]["logical_type"] = "datetime"
                col_map[col_name]["physical_type"] = "datetime64[ns]"
            elif target_dtype == "integer":
                col_map[col_name]["logical_type"] = "integer"
                col_map[col_name]["physical_type"] = "Int64"
            elif target_dtype == "numeric":
                col_map[col_name]["logical_type"] = "numeric"
                col_map[col_name]["physical_type"] = "float64"
            elif target_dtype == "string":
                col_map[col_name]["logical_type"] = "text"
                col_map[col_name]["physical_type"] = "string"

    # Refresh column category lists
    schema["datetime_columns"] = [c["name"] for c in schema["columns"] if c["logical_type"] == "datetime"]
    schema["numeric_columns"] = [c["name"] for c in schema["columns"] if c["logical_type"] in ("numeric", "integer")]
    schema["categorical_columns"] = [c["name"] for c in schema["columns"] if c["logical_type"] == "categorical"]

    return schema


def apply_schema_to_dataframe(df: pd.DataFrame, schema: dict[str, Any] | None) -> pd.DataFrame:
    """
    Reapply preserved schema types to a DataFrame loaded from CSV.
    Safely converts types without raising exceptions on corrupt records.
    """
    if not schema or "columns" not in schema:
        return df

    result_df = df.copy()

    for col_info in schema["columns"]:
        col_name = col_info.get("name")
        if not col_name or col_name not in result_df.columns:
            continue

        logical = col_info.get("logical_type")
        physical = col_info.get("physical_type", "")

        try:
            if logical == "datetime" or "datetime" in physical:
                result_df[col_name] = pd.to_datetime(result_df[col_name], errors="coerce")
            elif logical == "integer" or physical == "Int64":
                result_df[col_name] = pd.to_numeric(result_df[col_name], errors="coerce").astype("Int64")
            elif logical == "numeric" or "float" in physical:
                result_df[col_name] = pd.to_numeric(result_df[col_name], errors="coerce")
            elif logical == "boolean" or physical == "boolean":
                result_df[col_name] = result_df[col_name].astype("boolean")
            elif logical == "categorical":
                result_df[col_name] = result_df[col_name].astype("category")
        except Exception:
            # Fall back to original pandas series if casting fails
            pass

    return result_df


def load_dataset_dataframe(
    csv_path: str | Path,
    profile_or_schema: dict[str, Any] | None = None,
) -> pd.DataFrame:
    """
    Load a CSV dataset and faithfully restore its schema dtypes.
    Checks profile["schema"], then sidecar <path>.schema.json, then defaults to pd.read_csv.
    """
    path = Path(csv_path)
    if not path.is_file():
        raise FileNotFoundError(f"Dataset file not found: {path}")

    df = pd.read_csv(path)

    schema = None
    if isinstance(profile_or_schema, dict):
        if "schema" in profile_or_schema and isinstance(profile_or_schema["schema"], dict):
            schema = profile_or_schema["schema"]
        elif "columns" in profile_or_schema:
            schema = profile_or_schema

    # Check sidecar file if schema not passed in profile
    if schema is None:
        sidecar = path.with_suffix(".schema.json")
        if sidecar.is_file():
            try:
                schema = json.loads(sidecar.read_text(encoding="utf-8"))
            except Exception:
                pass

    if schema:
        return apply_schema_to_dataframe(df, schema)

    return df


def save_dataset_schema_sidecar(target_csv: str | Path, schema: dict[str, Any]) -> Path:
    """Write schema.json next to CSV file for filesystem durability."""
    target_path = Path(target_csv)
    sidecar_path = target_path.with_suffix(".schema.json")
    sidecar_path.write_text(json.dumps(schema, indent=2), encoding="utf-8")
    return sidecar_path
