import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Cpu, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Sliders, 
  Clock, 
  Shuffle, 
  Trophy, 
  Zap, 
  ExternalLink,
  Target,
  Sparkles
} from 'lucide-react';

export default function ModelStudioTab({ 
  activeDataset, 
  onNavigateTab, 
  setActiveRunId 
}) {
  const [inspectData, setInspectData] = useState(null);
  const [targetColumn, setTargetColumn] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  const [modelType, setModelType] = useState('random_forest');
  const [splitStrategy, setSplitStrategy] = useState('random');
  const [testSize, setTestSize] = useState(0.2);
  const [timeColumn, setTimeColumn] = useState('');
  const [useCrossVal, setUseCrossVal] = useState(false);
  const [cvFolds, setCvFolds] = useState(5);

  // Hyperparameters
  const [rfEstimators, setRfEstimators] = useState(100);
  const [rfMaxDepth, setRfMaxDepth] = useState(10);
  const [ridgeAlpha, setRidgeAlpha] = useState(1.0);
  const [logRegC, setLogRegC] = useState(1.0);
  const [gbLearningRate, setGbLearningRate] = useState(0.1);
  const [gbEstimators, setGbEstimators] = useState(100);

  // Preprocessing
  const [numericScaler, setNumericScaler] = useState('standard');
  const [numericImputer, setNumericImputer] = useState('median');

  // Automated Feature Selection State
  const [fsLoading, setFsLoading] = useState(false);
  const [fsResult, setFsResult] = useState(null);
  const [fsError, setFsError] = useState(null);

  // Training state
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState(null);
  const [trainError, setTrainError] = useState(null);

  useEffect(() => {
    if (!activeDataset?.id) return;
    setTrainResult(null);
    setTrainError(null);

    api.inspectDataset(activeDataset.id)
      .then((data) => {
        setInspectData(data);
        const colDetails = data?.inspection?.column_details || activeDataset?.profile?.columns || [];
        const schemaCols = Array.isArray(data?.schema?.columns) ? data.schema.columns : [];
        const cols = colDetails.length > 0
          ? colDetails.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
          : (schemaCols.length > 0 ? schemaCols.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean) : (data.columns || []));

        if (cols.length > 0) {
          // Default target to the last column
          const lastCol = cols[cols.length - 1];
          setTargetColumn(lastCol);
          setSelectedFeatures(cols.filter((c) => c !== lastCol));
        }
      })
      .catch((err) => console.error(err));
  }, [activeDataset?.id]);

  if (!activeDataset) {
    return (
      <div className="glass-panel" style={{ margin: '2rem', padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Please select a dataset to configure model training.</p>
      </div>
    );
  }

  const colDetails = inspectData?.inspection?.column_details || activeDataset?.profile?.columns || [];
  const schemaCols = Array.isArray(inspectData?.schema?.columns) ? inspectData.schema.columns : [];
  const columns = colDetails.length > 0
    ? colDetails.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean)
    : (schemaCols.length > 0 ? schemaCols.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean) : (inspectData?.columns || []));

  const handleTargetChange = (newTarget) => {
    setTargetColumn(newTarget);
    setSelectedFeatures(columns.filter((c) => c !== newTarget));
  };

  const handleToggleFeature = (col) => {
    if (selectedFeatures.includes(col)) {
      setSelectedFeatures(selectedFeatures.filter((c) => c !== col));
    } else {
      setSelectedFeatures([...selectedFeatures, col]);
    }
  };

  const handleSelectAllFeatures = () => {
    setSelectedFeatures(columns.filter((c) => c !== targetColumn));
  };

  const handleDeselectAllFeatures = () => {
    setSelectedFeatures([]);
  };

  const getHyperparams = () => {
    switch (modelType) {
      case 'ridge':
        return { alpha: Number(ridgeAlpha) };
      case 'logistic_regression':
        return { C: Number(logRegC), max_iter: 500 };
      case 'random_forest':
        return { n_estimators: Number(rfEstimators), max_depth: Number(rfMaxDepth) };
      case 'gradient_boosting':
        return { learning_rate: Number(gbLearningRate), n_estimators: Number(gbEstimators) };
      default:
        return {};
    }
  };

  const handleTrain = async () => {
    if (!targetColumn) {
      setTrainError('Please specify a target column.');
      return;
    }
    if (selectedFeatures.length === 0) {
      setTrainError('Please select at least one feature.');
      return;
    }

    setTraining(true);
    setTrainError(null);
    setTrainResult(null);

    try {
      const payload = {
        target_column: targetColumn,
        model_name: modelType || 'auto',
        task_type: 'auto',
        split_strategy: splitStrategy,
        test_size: Number(testSize),
        cv_folds: useCrossVal ? Number(cvFolds) : 0,
        numeric_scaler: numericScaler,
        numeric_imputer: numericImputer,
        datetime_handling: 'extract',
      };

      const result = await api.trainModel(activeDataset.id, payload);
      setTrainResult(result);
      if (setActiveRunId) setActiveRunId(result.id);
    } catch (err) {
      setTrainError(err.message || 'Model training failed.');
    } finally {
      setTraining(false);
    }
  };

  const handleRunFeatureSelection = async () => {
    if (!targetColumn) {
      setFsError('Please select a target column first.');
      return;
    }
    setFsLoading(true);
    setFsError(null);
    try {
      const res = await api.runFeatureSelection(activeDataset.id, {
        target_column: targetColumn,
        k: Math.max(1, Math.min(10, Math.ceil((columns.length - 1) * 0.5))),
      });
      setFsResult(res);
    } catch (err) {
      setFsError(err.message || 'Feature selection failed.');
    } finally {
      setFsLoading(false);
    }
  };

  const handleApplyRecommendedFeatures = () => {
    if (fsResult?.recommended_features) {
      setSelectedFeatures(fsResult.recommended_features);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Left Column: Configuration Controls */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Cpu size={20} color="var(--cyan-neon)" />
            <h3>Configure Training Pipeline</h3>
          </div>

          {/* Target Variable Selector */}
          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={14} color="var(--orange-racing)" />
              Target Variable (y)
            </label>
            <select
              className="form-select"
              value={targetColumn}
              onChange={(e) => handleTargetChange(e.target.value)}
              style={{ borderColor: 'var(--cyan-neon)', fontWeight: 600 }}
            >
              {columns.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Model Architecture Selector */}
          <div>
            <label className="form-label">Model Architecture</label>
            <select
              className="form-select"
              value={modelType}
              onChange={(e) => setModelType(e.target.value)}
            >
              <optgroup label="Auto / Adaptive">
                <option value="auto">Auto (Adaptive Best Practice)</option>
              </optgroup>
              <optgroup label="Linear & Regularized">
                <option value="ridge">Ridge Regression (L2 Regularized)</option>
                <option value="linear_regression">Linear Regression (OLS)</option>
                <option value="lasso">Lasso Regression (L1 Sparse)</option>
                <option value="elastic_net">ElasticNet (L1 + L2)</option>
                <option value="bayesian_ridge">Bayesian Ridge Regression</option>
                <option value="logistic_regression">Logistic Regression (Classifier)</option>
              </optgroup>
              <optgroup label="Decision Trees & Boosting Ensembles">
                <option value="random_forest">Random Forest (Bagging Ensemble)</option>
                <option value="extra_trees">Extra Trees (Extremely Randomized)</option>
                <option value="gradient_boosting">Gradient Boosting (Residual Minimization)</option>
                <option value="hist_gradient_boosting">HistGradientBoosting (Fast LightGBM-Style)</option>
                <option value="adaboost">AdaBoost (Adaptive Boosting)</option>
                <option value="decision_tree">Decision Tree (Single Tree)</option>
              </optgroup>
              <optgroup label="Distance & Support Vectors">
                <option value="svm">Support Vector Machine (SVC / SVR)</option>
                <option value="knn">K-Nearest Neighbors (KNN)</option>
              </optgroup>
              <optgroup label="Neural & Probabilistic">
                <option value="mlp">Multi-Layer Perceptron (Deep Tabular Neural Net)</option>
                <option value="naive_bayes">Gaussian Naive Bayes (Classifier)</option>
              </optgroup>
              <optgroup label="Meta-Ensembles">
                <option value="voting">Voting Ensemble (Soft / Weighted Average)</option>
                <option value="stacking">Stacking Ensemble (Multi-Level Stacking)</option>
              </optgroup>
            </select>
          </div>

          {/* Dynamic Hyperparameters Slider/Inputs */}
          <div style={{ background: 'var(--ks-paper-deep)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem', fontWeight: 600 }}>
              HYPERPARAMETER TUNING
            </div>

            {modelType === 'random_forest' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Estimators ({rfEstimators})</label>
                  <input
                    type="range"
                    min={20}
                    max={300}
                    step={10}
                    value={rfEstimators}
                    onChange={(e) => setRfEstimators(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="form-label">Max Depth ({rfMaxDepth})</label>
                  <input
                    type="range"
                    min={2}
                    max={30}
                    step={1}
                    value={rfMaxDepth}
                    onChange={(e) => setRfMaxDepth(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}

            {modelType === 'gradient_boosting' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Learning Rate ({gbLearningRate})</label>
                  <input
                    type="range"
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    value={gbLearningRate}
                    onChange={(e) => setGbLearningRate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="form-label">Estimators ({gbEstimators})</label>
                  <input
                    type="range"
                    min={20}
                    max={300}
                    step={10}
                    value={gbEstimators}
                    onChange={(e) => setGbEstimators(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            )}

            {modelType === 'ridge' && (
              <div>
                <label className="form-label">L2 Regularization Alpha ({ridgeAlpha})</label>
                <input
                  type="range"
                  min={0.01}
                  max={20}
                  step={0.1}
                  value={ridgeAlpha}
                  onChange={(e) => setRidgeAlpha(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {modelType === 'logistic_regression' && (
              <div>
                <label className="form-label">Inverse Regularization C ({logRegC})</label>
                <input
                  type="range"
                  min={0.01}
                  max={10}
                  step={0.1}
                  value={logRegC}
                  onChange={(e) => setLogRegC(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>

          {/* Validation & Split Strategy */}
          <div style={{ background: 'var(--ks-paper-deep)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem', fontWeight: 600 }}>
              SPLIT & VALIDATION STRATEGY
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="split"
                  value="random"
                  checked={splitStrategy === 'random'}
                  onChange={() => setSplitStrategy('random')}
                />
                <Shuffle size={14} />
                <span>Random Split</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="split"
                  value="chronological"
                  checked={splitStrategy === 'chronological'}
                  onChange={() => setSplitStrategy('chronological')}
                />
                <Clock size={14} />
                <span>Chronological Time-Series</span>
              </label>
            </div>

            {splitStrategy === 'chronological' ? (
              <div>
                <label className="form-label">Timestamp Column for Order</label>
                <select
                  className="form-select"
                  value={timeColumn}
                  onChange={(e) => setTimeColumn(e.target.value)}
                >
                  <option value="">Select timestamp feature...</option>
                  {columns.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="form-label">Test Split Size ({(testSize * 100).toFixed(0)}%)</label>
                <input
                  type="range"
                  min={0.1}
                  max={0.4}
                  step={0.05}
                  value={testSize}
                  onChange={(e) => setTestSize(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            {/* K-Fold Cross Validation */}
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={useCrossVal}
                  onChange={(e) => setUseCrossVal(e.target.checked)}
                />
                <span>Enable K-Fold Cross-Validation</span>
              </label>

              {useCrossVal && (
                <div style={{ marginTop: '0.5rem' }}>
                  <label className="form-label">Number of Folds</label>
                  <select
                    className="form-select"
                    value={cvFolds}
                    onChange={(e) => setCvFolds(e.target.value)}
                  >
                    <option value={3}>3 Folds</option>
                    <option value={5}>5 Folds (Standard)</option>
                    <option value={10}>10 Folds (Deep)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Feature Selection Multi-Check & Automated Assistant */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Features (X) — {selectedFeatures.length} of {columns.length - 1} Selected
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem', color: 'var(--cyan-neon)', borderColor: 'rgba(0, 229, 255, 0.3)' }}
                  onClick={handleRunFeatureSelection}
                  disabled={fsLoading || !targetColumn}
                >
                  {fsLoading ? 'Evaluating...' : '⚡ Assistant'}
                </button>
                <button type="button" className="btn btn-ghost" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={handleSelectAllFeatures}>
                  All
                </button>
                <button type="button" className="btn btn-ghost" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={handleDeselectAllFeatures}>
                  Clear
                </button>
              </div>
            </div>

            {/* Feature Selection Assistant Results */}
            {fsResult && (
              <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'var(--ks-kinpaku-pale)', border: '1px solid var(--ks-kinpaku-border)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ks-kinpaku-deep)' }}>
                    TOP RECOMMENDED FEATURES ({fsResult.recommended_feature_count})
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '0.15rem 0.5rem', fontSize: '0.7rem' }}
                    onClick={handleApplyRecommendedFeatures}
                  >
                    Apply Top {fsResult.recommended_feature_count}
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {fsResult.feature_rankings?.slice(0, 6).map((f) => (
                    <span key={f.feature} className={`badge ${f.recommended ? 'badge-cyan' : 'badge-muted'}`} style={{ fontSize: '0.7rem' }}>
                      #{f.overall_rank} {f.feature} (MI: {f.mutual_information ?? 0})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {fsError && (
              <div style={{ marginBottom: '0.5rem', color: 'var(--rose-alert)', fontSize: '0.75rem' }}>
                {fsError}
              </div>
            )}

            <div style={{ 
              maxHeight: 140, 
              overflowY: 'auto', 
              background: 'var(--ks-paper-deep)', 
              border: '1px solid var(--border-subtle)',
              padding: '0.6rem', 
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem'
            }}>
              {columns
                .filter((c) => c !== targetColumn)
                .map((col) => (
                  <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedFeatures.includes(col)}
                      onChange={() => handleToggleFeature(col)}
                    />
                    <span>{col}</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Preprocessing Pipeline (Scalers & Imputers) */}
          <div style={{ background: 'var(--ks-paper-deep)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem', fontWeight: 600 }}>
              TRANSFORMATION & IMPUTATION PIPELINE
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-label">Numeric Scaler</label>
                <select
                  className="form-select"
                  value={numericScaler}
                  onChange={(e) => setNumericScaler(e.target.value)}
                >
                  <option value="standard">Standard (Z-Score)</option>
                  <option value="minmax">Min-Max (0 to 1)</option>
                  <option value="robust">Robust (IQR)</option>
                  <option value="quantile">Quantile (Normal)</option>
                  <option value="power">Power (Yeo-Johnson)</option>
                  <option value="none">Unscaled (Raw)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Numeric Imputer</label>
                <select
                  className="form-select"
                  value={numericImputer}
                  onChange={(e) => setNumericImputer(e.target.value)}
                >
                  <option value="median">Median Imputation</option>
                  <option value="mean">Mean Imputation</option>
                  <option value="knn">KNN Imputer (k=5)</option>
                  <option value="constant">Constant (0.0)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Launch Button */}
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
            disabled={training}
            onClick={handleTrain}
          >
            {training ? (
              <>
                <span className="pulse-dot pulse-dot-orange" />
                <span>Training Pipeline & Logging to MLflow...</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Train Model Pipeline</span>
              </>
            )}
          </button>

          {trainError && (
            <div className="badge badge-rose" style={{ padding: '0.5rem' }}>
              <AlertCircle size={14} />
              <span>{trainError}</span>
            </div>
          )}
        </div>

        {/* Right Column: Training Telemetry & Real-Time Result */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Trophy size={20} color="var(--orange-racing)" />
              <h3>Training Telemetry & Metrics</h3>
            </div>
            {trainResult && (
              <span className="badge badge-emerald">Run Success</span>
            )}
          </div>

          {!trainResult ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Cpu size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
              <p>Configure model architecture on the left and click <strong>Train Model Pipeline</strong>.</p>
              <p style={{ fontSize: '0.75rem', marginTop: '0.5rem' }}>
                All trained models automatically serialize leakage-free `ColumnTransformer` scalers and register into MLflow.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Run Identification Card */}
              <div style={{ background: 'var(--ks-paper-deep)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      RUN ID: <code style={{ color: 'var(--ks-kinpaku-rich)', fontWeight: 600 }}>{trainResult.id}</code>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      {trainResult.model_name?.toUpperCase()}
                    </div>
                  </div>
                  <span className="badge badge-purple">
                    {trainResult.task_type?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Evaluation Metrics Grid */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Validation Metrics
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {Object.entries(trainResult.metrics || {})
                    .filter(([k, v]) => typeof v === 'number' && !['feature_importance', 'confusion_matrix', 'cross_validation'].includes(k))
                    .map(([metricKey, metricVal]) => (
                      <div key={metricKey} style={{ background: 'var(--ks-paper-deep)', border: '1px solid var(--border-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                          {metricKey.replace('_', ' ')}
                        </div>
                        <div style={{ 
                          fontSize: '1.35rem', 
                          fontWeight: 800, 
                          color: metricKey.includes('r2') || metricKey.includes('accuracy') || metricKey.includes('f1') ? 'var(--ks-kinpaku-rich)' : 'var(--text-primary)', 
                          fontFamily: 'var(--font-mono)',
                          marginTop: '0.2rem' 
                        }}>
                          {metricVal.toFixed(4)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Permutation Feature Importance Section */}
              {Array.isArray(trainResult.metrics?.feature_importance) && trainResult.metrics.feature_importance.length > 0 && (
                <div style={{ background: 'var(--ks-paper-deep)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--ks-kinpaku-rich)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Sparkles size={14} />
                      Permutation Feature Importance (Explainability)
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Holdout Score Impact
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {(() => {
                      const maxImp = Math.max(...trainResult.metrics.feature_importance.map(f => Math.abs(f.importance)), 0.0001);
                      return trainResult.metrics.feature_importance.map((f, i) => {
                        const pct = Math.min(100, Math.max(5, (Math.abs(f.importance) / maxImp) * 100));
                        return (
                          <div key={f.feature} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                                #{i + 1} {f.feature}
                              </span>
                              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ks-kinpaku-deep)', fontSize: '0.75rem', fontWeight: 600 }}>
                                Δ {f.importance.toFixed(4)} (±{f.std?.toFixed(4)})
                              </span>
                            </div>
                            <div style={{ background: 'var(--ks-gray)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${pct}%`,
                                  height: '100%',
                                  background: i === 0 ? 'var(--ks-kinpaku)' : 'var(--ks-patina)',
                                  borderRadius: '3px',
                                  transition: 'width 0.4s ease',
                                }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Action Buttons: Navigate to Predict or Leaderboard */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.65rem' }}
                  onClick={() => onNavigateTab('inference')}
                >
                  <Zap size={16} />
                  <span>Test Inference Cockpit</span>
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '0.65rem' }}
                  onClick={() => onNavigateTab('leaderboard')}
                >
                  <Trophy size={16} />
                  <span>View Leaderboard</span>
                </button>
              </div>

              {/* MLflow Link */}
              {trainResult.mlflow_run_id && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Logged in MLflow:</span>
                  <a
                    href={`http://localhost:5000/#/experiments/0/runs/${trainResult.mlflow_run_id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: 'var(--purple-telemetry)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                  >
                    <span>View Artifacts & Run</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
