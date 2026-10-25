# AXIS ML — Core Data Science & AI Engineering Workbench

AXIS ML (formerly Pitwall OS Core) is an enterprise AI-assisted data science and machine learning engineering workbench. Built with a minimalist **Obsidian & Pure Titanium** design system, it provides end-to-end data lifecycle capabilities: tabular CSV ingestion, schema inference, exploratory data analysis with statistical hypothesis testing, interactive data cleaning, feature engineering, supervised model training across 18+ algorithms, unsupervised anomaly & clustering labs, MLflow experiment tracking, and real-time inference serving.

---

## Key Capabilities

- **Minimalist Obsidian & Pure Titanium Interface**:
  - Deep obsidian base (`#090a0f`), subtle micro-borders, and crisp titanium typography (`#f8fafc`).
  - Interactive **Front Authorization Page** with credentials, 1-click guest access, and an interactive Model Zoo featuring live loss convergence curves, confusion matrices, and real-time inference simulations.
- **Enterprise Dataset Registry & Ingestion**:
  - Ingestion validation, automatic logical type inference (`datetime`, `numeric`, `integer`, `categorical`, `boolean`, `text`), and `.schema.json` sidecar specifications.
  - Pre-seeded with authentic industrial telemetry (`industrial_iot_sensors.csv`) and enterprise subscription analytics (`saas_customer_churn.csv`).
- **Exploratory Data Analysis (EDA) & Statistical Lab**:
  - **Normality Testing**: Shapiro-Wilk & D'Agostino-Pearson omnibus tests, skewness, kurtosis, and automated normality verdicts.
  - **Multicollinearity Diagnostics**: Variance Inflation Factor (VIF), $R^2$, and severity ratings per feature.
  - **Time-Series Stationarity**: Augmented Dickey-Fuller (ADF) and KPSS tests with critical value thresholds.
  - **Extended Correlations**: Pearson, Spearman rank, and Kendall's tau correlation matrices.
  - **Hypothesis Testing**: Two-sample independent T-test, Welch's T-test, Mann-Whitney U, One-Way ANOVA, Kruskal-Wallis H, Chi-square test of independence, and Levene's variance homogeneity test.
- **Automated Feature Selection Assistant**:
  - Mutual Information rankings, ANOVA/Regression F-statistics, and Recursive Feature Elimination (RFE) with 1-click feature selection into Model Studio.
- **Non-Destructive Cleaning Engine**:
  - Forward fill (`ffill`), backward fill (`bfill`), KNN imputation (`knn_impute`), Z-score outlier capping (`cap_outliers_zscore`), and column renaming (`rename_column`) alongside IQR capping, constant/mean/median filling, and deduplication.
- **Leakage-Free Preprocessing Pipelines**:
  - `DateTimeFeatureExtractor` extracts cyclical components; configurable `ColumnTransformer` with `standard`, `minmax`, `robust`, `quantile`, and `power` (Yeo-Johnson) scalers; `median`, `mean`, `knn`, and `constant` imputation; and `/pipeline/preview` endpoints.
- **Supervised Model Zoo & Training Workbench**:
  - Support for Ridge, Linear Regression, Lasso, ElasticNet, Bayesian Ridge, Logistic Regression, Decision Tree, Random Forest, Extra Trees, Gradient Boosting, HistGradientBoosting, AdaBoost, SVM/SVC/SVR, KNN, Gaussian Naive Bayes, Multi-Layer Perceptron (MLP Neural Net), Voting, and Stacking ensembles with full `Pipeline` serialization into `model.joblib`.
  - Permutation feature importance computed on holdout test partitions and logged to MLflow artifacts.
- **Unsupervised Learning & Anomaly Lab**:
  - **Clustering**: K-Means, MiniBatch K-Means, Agglomerative Hierarchical, Gaussian Mixture Models (GMM), and DBSCAN with Silhouette, Davies-Bouldin, and Calinski-Harabasz metrics.
  - **PCA Dimensionality Reduction**: Orthogonal principal component projections, explained variance ratios, cumulative variance scree curves, and feature loading weights.
  - **Anomaly & Outlier Detection**: Isolation Forest, Local Outlier Factor (LOF), and Elliptic Envelope with configurable contamination rates.
- **Inference Cockpit & Evaluation Leaderboard**:
  - Single-record real-time prediction and high-throughput batch scoring (`/runs/{id}/predict` and `/runs/{id}/predict-batch`).
  - Model comparison and ranking via `/datasets/{id}/runs/compare`.
- **Deep MLflow Tracking**:
  - Automatic logging of hyperparameters, scalar metrics, tags (`dataset_id`, `model_name`, `task_type`), model artifacts, and confusion matrices into MLflow.
- **Automated Pytest Suite**: 51 comprehensive tests covering all services, schemas, statistical tests, feature selection, unsupervised algorithms, model zoo, and endpoints.

---

## Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Docker Desktop (optional, for PostgreSQL + MLflow containers)

### 1. Backend Service (FastAPI)
```powershell
cd services/api
.\.venv\Scripts\Activate.ps1
pip install -e .
python -m uvicorn app.main:app --host 0.0.0.0 --port 8002
```
Interactive OpenAPI documentation is available at `http://localhost:8002/docs`.

### 2. Frontend Application (React + Vite)
```powershell
cd services/web
npm install
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 3. Running Automated Tests
```powershell
cd services/api
.\.venv\Scripts\python.exe -m pytest -v
```
To run the production frontend build check:
```powershell
cd services/web
npm run build
```

---

## Project Structure

```
pitwall-os-core/
├── services/
│   ├── api/                      # FastAPI Backend
│   │   ├── app/
│   │   │   ├── api/routes.py     # 29 REST endpoints
│   │   │   ├── core/             # Configuration & Database
│   │   │   ├── models/           # SQLAlchemy Entities (Dataset, ExperimentRun)
│   │   │   ├── schemas/          # Pydantic Schemas
│   │   │   └── services/         # EDA, Cleaning, Training, Feature Selection, Unsupervised
│   │   ├── tests/                # 51 Isolated Pytest Suites
│   │   └── pyproject.toml        # Dependencies & Packaging
│   └── web/                      # React 19 + Vite 8 SPA
│       ├── src/
│       │   ├── api/client.js     # Axios API Client
│       │   ├── components/       # Studio Tabs (Login, Home, Datasets, DataLab, EDA, Models, Unsupervised, Leaderboard, Inference)
│       │   ├── App.jsx           # Root Auth State & Studio Routing
│       │   └── index.css         # Obsidian & Pure Titanium Design System
│       └── index.html            # Entry HTML & Modern Typography (Inter, Outfit, JetBrains Mono)
└── README.md
```
