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
        const cols = data.columns || [];
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

  const columns = inspectData?.columns || [];

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
        feature_columns: selectedFeatures,
        model_type: modelType,
        split_strategy: splitStrategy,
        test_size: Number(testSize),
        time_column: splitStrategy === 'chronological' ? timeColumn : null,
        cv_folds: useCrossVal ? Number(cvFolds) : null,
        hyperparameters: getHyperparams(),
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
              <optgroup label="Ensemble Models">
                <option value="random_forest">Random Forest (Robust, Non-linear)</option>
                <option value="gradient_boosting">Gradient Boosting (High Accuracy)</option>
              </optgroup>
              <optgroup label="Linear Models">
                <option value="ridge">Ridge Regression (L2 Regularized)</option>
                <option value="logistic_regression">Logistic Regression (Classification)</option>
              </optgroup>
            </select>
          </div>

          {/* Dynamic Hyperparameters Slider/Inputs */}
          <div style={{ background: 'rgba(14, 20, 32, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
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
          <div style={{ background: 'rgba(14, 20, 32, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
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

          {/* Feature Selection Multi-Check */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Features (X) — {selectedFeatures.length} of {columns.length - 1} Selected
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }} onClick={handleSelectAllFeatures}>
                  Select All
                </button>
                <button type="button" className="btn btn-ghost" style={{ padding: '0.1rem 0.4rem', fontSize: '0.7rem' }} onClick={handleDeselectAllFeatures}>
                  Clear
                </button>
              </div>
            </div>

            <div style={{ 
              maxHeight: 140, 
              overflowY: 'auto', 
              background: 'rgba(14, 20, 32, 0.6)', 
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

          {/* Launch Button */}
          <button
            className="btn btn-racing"
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
              <div style={{ background: 'rgba(14, 20, 32, 0.8)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      RUN ID: <code style={{ color: 'var(--cyan-neon)' }}>{trainResult.id}</code>
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
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
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Validation Metrics
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  {Object.entries(trainResult.metrics || {}).map(([metricKey, metricVal]) => (
                    <div key={metricKey} style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                        {metricKey}
                      </div>
                      <div style={{ 
                        fontSize: '1.35rem', 
                        fontWeight: 700, 
                        color: metricKey.includes('r2') || metricKey.includes('accuracy') || metricKey.includes('f1') ? 'var(--cyan-neon)' : 'var(--text-primary)', 
                        fontFamily: 'var(--font-mono)',
                        marginTop: '0.2rem' 
                      }}>
                        {typeof metricVal === 'number' ? metricVal.toFixed(4) : String(metricVal)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
