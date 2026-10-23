# Pitwall OS — Core MVP

Pitwall OS is an AI-assisted data and ML engineering workbench. This repository starts with a real vertical slice: CSV ingestion, dataset profiling and quality checks, baseline model training, artifact persistence, and MLflow experiment tracking. The garage UI is intentionally out of scope for this milestone.

## Current capabilities

- **Interactive Engineering Workbench UI**: Full single-page dark-mode application served at `/workbench` with dataset management, Data Lab inspection, EDA studio, cleaning wizard, model training studio, experiment comparison leaderboard, and live single/batch inference tester.
- **FastAPI REST API with interactive OpenAPI docs** (`/docs`) and service metadata (`/`).
- **CSV Ingestion & Validation**: File-size, format, parsing, 500-column limit, duplicate column checks, and dataset registration with automatic schema inference.
- **Dataset Schema Persistence & Dtype Restoration**: Infers and persists logical types (`datetime`, `numeric`, `integer`, `categorical`, `boolean`, `text`) and sidecar `.schema.json` specifications to preserve rich types across CSV reloads.
- **Exploratory Data Analysis (EDA) Suite**: Numeric diagnostics, high-missingness checks, multicollinearity alerts ($|r| \ge 0.98$), standardized warnings, descriptive statistics, histogram distributions, Pearson correlation matrices, and temporal sampling analysis.
- **Reusable, Leakage-Free Preprocessing Pipeline**: `DateTimeFeatureExtractor` extracts cyclical components (`hour`, `day`, `month`, `dayofweek`, `year`) without high-cardinality one-hot explosion; configurable `ColumnTransformer` with `standard`, `minmax`, `robust`, or unscaled scalers; median or mean imputation; and pipeline preview endpoint (`/pipeline/preview`).
- **Expanded Model Training Architectures**: Support for Ridge Regression, Logistic Regression, Random Forest, and Gradient Boosting with automated hyperparameter defaults and full `Pipeline` serialization into `model.joblib`.
- **Chronological & Cross-Validation Strategies**: Leak-free time-series chronological splitting and k-fold / stratified / time-series cross-validation (`cv_folds`).
- **Comprehensive Evaluation Metrics**: MAE, RMSE, R², explained variance, MAPE for regression; accuracy, weighted/macro precision, weighted/macro recall, weighted/macro F1, ROC-AUC, and confusion matrix for classification.
- **Deep MLflow Tracking**: Automatic logging of parameters, scalar metrics, tags (`dataset_id`, `model_name`, `task_type`, `split_strategy`), model artifacts, and confusion matrix artifacts into MLflow.
- **Single & High-Throughput Batch Prediction**: `/runs/{id}/predict` and `/runs/{id}/predict-batch` with automatic probability distributions for classification and raw unscaled input handling.
- **Model Comparison & Workflow Lifecycle**: `/datasets/{id}/runs/compare` ranks and identifies the best run; `/datasets/{id}/workflow` provides status and recommended next engineering actions.
- **Automated Pytest Suite**: 38 isolated tests passing in under 6 seconds covering all services, schemas, and endpoints.

## Requirements

- Docker Desktop with Compose enabled
- Windows PowerShell / Linux terminal

## Run with Docker Desktop (Windows PowerShell)

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Wait for PostgreSQL, MLflow, and the API to start. Then open:

- **Dedicated React + Vite Frontend**: http://localhost:3001 (or http://localhost:3000)
- **Built-in Fast Workbench UI**: http://localhost:8002/workbench
- **Interactive API docs (Swagger)**: http://localhost:8002/docs
- **Service Root**: http://localhost:8002/
- **Health**: http://localhost:8002/api/v1/health
- **MLflow UI**: http://localhost:5000

### Running the Dedicated React Frontend

The React + Vite application is located in `services/web`:

```powershell
cd services/web
npm install
npm run dev
```

Stop the backend stack with `Ctrl+C`, or run `docker compose down`. Persistent database and MLflow artifact volumes remain. `docker compose down -v` deletes the persistent volumes, so use it only when you intend to reset them.

## API surface

### Core & Datasets
- `GET /` — Service metadata and workbench link
- `GET /workbench` — Interactive Workbench Web UI
- `GET /api/v1/health` — Service health check
- `POST /api/v1/datasets` — Upload and profile new CSV dataset
- `GET /api/v1/datasets` — List all registered datasets
- `GET /api/v1/datasets/{dataset_id}` — Get dataset details
- `GET /api/v1/datasets/{dataset_id}/schema` — Retrieve persisted/inferred dataset schema
- `GET /api/v1/datasets/{dataset_id}/inspect` — Inspect rows and quality metrics
- `GET /api/v1/datasets/{dataset_id}/workflow` — Retrieve dataset workflow lifecycle status

### EDA & Diagnostics
- `GET /api/v1/datasets/{dataset_id}/eda/summary` — Unified EDA summary with standardized warnings
- `GET /api/v1/datasets/{dataset_id}/eda/diagnostics` — Numeric diagnostics and collinearity checks
- `GET /api/v1/datasets/{dataset_id}/eda/statistics` — Feature summary statistics
- `GET /api/v1/datasets/{dataset_id}/eda/distributions` — Histograms and quartile distributions
- `GET /api/v1/datasets/{dataset_id}/eda/correlations` — Pairwise Pearson correlation matrix
- `GET /api/v1/datasets/{dataset_id}/eda/time-series` — Temporal cadence and sampling analysis

### Cleaning & Transformations
- `POST /api/v1/datasets/{dataset_id}/cleaning/preview` — Non-destructive cleaning impact preview
- `POST /api/v1/datasets/{dataset_id}/cleaning/apply` — Apply cleaning operations and create versioned dataset with lineage
- `POST /api/v1/datasets/{dataset_id}/pipeline/preview` — Preview transformed feature matrix and datetime extraction

### Model Training, Experiments & Inference
- `POST /api/v1/datasets/{dataset_id}/runs` — Train model pipeline (Ridge, LogReg, Random Forest, Gradient Boosting)
- `GET /api/v1/runs` — List all experiment runs
- `GET /api/v1/runs/{run_id}` — Get run details, metrics, and parameters
- `GET /api/v1/datasets/{dataset_id}/runs/compare` — Compare and rank model runs
- `POST /api/v1/runs/{run_id}/predict` — Inference on raw unscaled inputs with probabilities
- `POST /api/v1/runs/{run_id}/predict-batch` — Batch inference for up to 1,000 samples

## Run tests locally (Docker)

```powershell
docker compose exec api pytest -v
```

All 38 automated tests execute against an isolated SQLite test database with zero impact on production PostgreSQL data.
