
from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator


class CleaningOperation(BaseModel):
    operation: Literal[
        "drop_duplicates",
        "drop_missing_rows",
        "fill_missing",
        "drop_column",
        "convert_type",
        "cap_outliers",
        "ffill",
        "bfill",
        "knn_impute",
        "cap_outliers_zscore",
        "rename_column",
    ]

    column: str | None = None

    strategy: Literal[
        "mean", "median", "mode", "constant"
    ] | None = None

    value: Any = None

    dtype: Literal[
        "numeric", "integer", "string", "datetime"
    ] | None = None

    multiplier: float = Field(default=1.5, gt=0)
    z_threshold: float = Field(default=3.0, gt=0)
    n_neighbors: int = Field(default=5, ge=1)
    new_name: str | None = None

    @model_validator(mode="after")
    def validate_operation_fields(self):
        if self.operation in {
            "drop_missing_rows",
            "fill_missing",
            "drop_column",
            "convert_type",
            "cap_outliers",
            "ffill",
            "bfill",
            "knn_impute",
            "cap_outliers_zscore",
            "rename_column",
        } and not self.column:
            raise ValueError(
                f"'{self.operation}' requires a column."
            )

        if self.operation == "fill_missing":
            if not self.strategy:
                raise ValueError(
                    "'fill_missing' requires a strategy."
                )
            if self.strategy == "constant" and self.value is None:
                raise ValueError(
                    "Constant filling requires a non-null value."
                )

        if self.operation == "convert_type" and not self.dtype:
            raise ValueError("'convert_type' requires a dtype.")

        if self.operation == "rename_column" and not self.new_name:
            raise ValueError("'rename_column' requires 'new_name'.")

        return self


class CleaningPreviewRequest(BaseModel):
    operations: list[CleaningOperation] = Field(
        min_length=1, max_length=50
    )
