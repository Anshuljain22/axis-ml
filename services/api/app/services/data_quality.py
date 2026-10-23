import pandas as pd

def build_profile(df: pd.DataFrame) -> dict:
    columns = []
    for name in df.columns:
        series = df[name]
        sample_values = series.dropna().astype(str).head(5).tolist()
        item = {
            "name": str(name),
            "dtype": str(series.dtype),
            "missing_count": int(series.isna().sum()),
            "missing_percent": round(float(series.isna().mean() * 100), 2),
            "unique_count": int(series.nunique(dropna=True)),
            "sample_values": sample_values,
        }
        if pd.api.types.is_numeric_dtype(series):
            non_null = series.dropna()
            item["min"] = float(non_null.min()) if not non_null.empty else None
            item["max"] = float(non_null.max()) if not non_null.empty else None
            item["mean"] = float(non_null.mean()) if not non_null.empty else None
        columns.append(item)
    duplicate_rows = int(df.duplicated().sum())
    return {
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "duplicate_rows": duplicate_rows,
        "columns": columns,
    }

def build_quality_report(df: pd.DataFrame) -> dict:
    profile = build_profile(df)
    checks = [
        {"name": "No empty dataset", "passed": len(df) > 0, "details": f"{len(df)} rows"},
        {"name": "At least one column", "passed": len(df.columns) > 0, "details": f"{len(df.columns)} columns"},
        {"name": "No duplicate rows", "passed": int(df.duplicated().sum()) == 0, "details": f"{int(df.duplicated().sum())} duplicate rows"},
        {"name": "No missing values", "passed": int(df.isna().sum().sum()) == 0, "details": f"{int(df.isna().sum().sum())} missing cells"},
    ]
    return {
        "passed": sum(1 for c in checks if c["passed"]),
        "total": len(checks),
        "checks": checks,
        "missing_cells": int(df.isna().sum().sum()),
        "duplicate_rows": profile["duplicate_rows"],
    }
