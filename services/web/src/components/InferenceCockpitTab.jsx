import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Zap, 
  Play, 
  Layers, 
  AlertCircle, 
  CheckCircle, 
  FileSpreadsheet, 
  Sparkles,
  RefreshCw,
  Cpu
} from 'lucide-react';

export default function InferenceCockpitTab({ 
  activeDataset, 
  activeRunId, 
  setActiveRunId 
}) {
  const [runs, setRuns] = useState([]);
  const [selectedRun, setSelectedRun] = useState(null);
  const [loadingRuns, setLoadingRuns] = useState(false);
  const [sampleRows, setSampleRows] = useState([]);

  // Single Prediction State
  const [inputValues, setInputValues] = useState({});
  const [predicting, setPredicting] = useState(false);
  const [singleResult, setSingleResult] = useState(null);
  const [singleError, setSingleError] = useState(null);

  // Batch Prediction State
  const [batchJson, setBatchJson] = useState('[]');
  const [batchPredicting, setBatchPredicting] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [batchError, setBatchError] = useState(null);

  // Load runs for current dataset or globally
  useEffect(() => {
    let isMounted = true;
    setLoadingRuns(true);
    api.getRuns(activeDataset?.id)
      .then((data) => {
        if (!isMounted) return;
        setRuns(data || []);
        if (data && data.length > 0) {
          const match = activeRunId 
            ? data.find((r) => r.id === activeRunId) 
            : data[0];
          setSelectedRun(match || data[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => {
        if (isMounted) setLoadingRuns(false);
      });

    // Also get sample rows from dataset to help pre-fill
    if (activeDataset?.id) {
      api.inspectDataset(activeDataset.id)
        .then((inspect) => {
          const previewRows = inspect?.inspection?.preview || inspect?.preview || inspect?.head || [];
          if (isMounted && previewRows.length > 0) {
            setSampleRows(previewRows);
          }
        })
        .catch(() => {});
    }

    return () => { isMounted = false; };
  }, [activeDataset?.id, activeRunId]);

  // When selected run changes, prefill input values
  useEffect(() => {
    if (!selectedRun) return;

    // Try to get feature names from run parameters or inspect data
    let features = [];
    const rawFeatures = selectedRun.parameters?.feature_columns;
    if (rawFeatures) {
      try {
        features = typeof rawFeatures === 'string' ? JSON.parse(rawFeatures) : rawFeatures;
      } catch (e) {
        features = [];
      }
    }
    if (!Array.isArray(features) || features.length === 0) {
      if (sampleRows[0]) {
        features = Object.keys(sampleRows[0]).filter(k => k !== selectedRun.parameters?.target_column);
      }
    }

    const initial = {};
    const firstSample = sampleRows[0] || {};
    features.forEach((f) => {
      initial[f] = firstSample[f] !== undefined ? firstSample[f] : 0;
    });
    setInputValues(initial);
    setSingleResult(null);

    // Also prepare a sample batch
    if (sampleRows.length > 0) {
      const batchSample = sampleRows.slice(0, 5).map(row => {
        const item = {};
        features.forEach(f => {
          if (row[f] !== undefined) item[f] = row[f];
        });
        return item;
      });
      setBatchJson(JSON.stringify(batchSample, null, 2));
    }
  }, [selectedRun, sampleRows]);

  const handleInputChange = (feature, val) => {
    setInputValues((prev) => ({
      ...prev,
      [feature]: isNaN(Number(val)) ? val : Number(val),
    }));
  };

  const handleSinglePredict = async (e) => {
    e.preventDefault();
    if (!selectedRun) return;

    setPredicting(true);
    setSingleError(null);
    setSingleResult(null);

    try {
      const res = await api.predictSingle(selectedRun.id, inputValues);
      setSingleResult(res);
    } catch (err) {
      setSingleError(err.message || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const handleBatchPredict = async () => {
    if (!selectedRun) return;

    setBatchPredicting(true);
    setBatchError(null);
    setBatchResult(null);

    try {
      const parsed = JSON.parse(batchJson);
      if (!Array.isArray(parsed)) throw new Error('Batch payload must be a JSON array of feature objects.');
      const res = await api.predictBatch(selectedRun.id, parsed);
      setBatchResult(res);
    } catch (err) {
      setBatchError(err.message || 'Batch prediction failed');
    } finally {
      setBatchPredicting(false);
    }
  };

  const handleLoadSampleFromDataset = () => {
    if (sampleRows.length === 0) return;
    const randomRow = sampleRows[Math.floor(Math.random() * sampleRows.length)];
    const updated = {};
    Object.keys(inputValues).forEach((f) => {
      if (randomRow[f] !== undefined) updated[f] = randomRow[f];
    });
    setInputValues(updated);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Controls: Active Model Selector */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(0, 229, 255, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--cyan-neon)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
          }}>
            <Zap size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              ACTIVE INFERENCE PIPELINE
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedRun ? `${selectedRun.model_name?.toUpperCase()} (${selectedRun.task_type})` : 'No Model Loaded'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            className="form-select"
            style={{ minWidth: 260, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
            value={selectedRun?.id || ''}
            onChange={(e) => {
              const run = runs.find((r) => r.id === e.target.value);
              setSelectedRun(run);
              if (setActiveRunId) setActiveRunId(run?.id);
            }}
          >
            {runs.length === 0 && <option value="">No trained models found</option>}
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.model_name?.toUpperCase()} — Run {r.id.slice(0, 8)}... ({r.task_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Single Inference & Batch Inference */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Single Sample Predictor */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Zap size={20} color="var(--cyan-neon)" />
              <h3>Single Sample Inference</h3>
            </div>
            {sampleRows.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', gap: '0.3rem' }}
                onClick={handleLoadSampleFromDataset}
              >
                <RefreshCw size={12} />
                <span>Sample Random Row</span>
              </button>
            )}
          </div>

          {!selectedRun ? (
            <p style={{ color: 'var(--text-muted)' }}>Train a model in Model Studio to start testing predictions.</p>
          ) : (
            <form onSubmit={handleSinglePredict} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Feature Inputs */}
              <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem' }}>
                {Object.keys(inputValues).map((feat) => (
                  <div key={feat}>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>{feat}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={inputValues[feat] !== undefined ? inputValues[feat] : ''}
                      onChange={(e) => handleInputChange(feat, e.target.value)}
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem' }}
                disabled={predicting}
              >
                {predicting ? (
                  <>
                    <span className="pulse-dot pulse-dot-cyan" />
                    <span>Scoring Unscaled Features...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    <span>Run Inference</span>
                  </>
                )}
              </button>

              {singleError && (
                <div className="badge badge-rose" style={{ padding: '0.5rem' }}>
                  <AlertCircle size={14} />
                  <span>{singleError}</span>
                </div>
              )}

              {/* Single Prediction Result */}
              {singleResult && (
                <div className="animate-fade-in" style={{ 
                  background: 'rgba(14, 20, 32, 0.85)', 
                  padding: '1.25rem', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-highlight)' 
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    PREDICTED OUTPUT
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cyan-neon)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                    {typeof singleResult.prediction === 'number' ? singleResult.prediction.toFixed(4) : String(singleResult.prediction)}
                  </div>

                  {/* Probabilities (if classification) */}
                  {singleResult.probabilities && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        Class Probabilities
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {Object.entries(singleResult.probabilities).map(([cls, prob]) => {
                          const pct = (Number(prob) * 100).toFixed(1);
                          return (
                            <div key={cls}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
                                <span>Class {cls}</span>
                                <strong style={{ color: 'var(--cyan-neon)' }}>{pct}%</strong>
                              </div>
                              <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan-neon), #00b0ff)', borderRadius: 3 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}
        </div>

        {/* High-Throughput Batch Inference */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Layers size={20} color="var(--orange-racing)" />
              <h3>Batch Inference Lab</h3>
            </div>
            <span className="badge badge-orange">Up to 1,000 samples</span>
          </div>

          <div>
            <label className="form-label">Instances Payload (JSON Array)</label>
            <textarea
              className="form-input"
              rows={8}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', resize: 'vertical' }}
              value={batchJson}
              onChange={(e) => setBatchJson(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            disabled={batchPredicting || !selectedRun}
            onClick={handleBatchPredict}
          >
            {batchPredicting ? (
              <>
                <span className="pulse-dot pulse-dot-orange" />
                <span>Running High-Throughput Batch Scoring...</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Execute Batch Predictions</span>
              </>
            )}
          </button>

          {batchError && (
            <div className="badge badge-rose" style={{ padding: '0.5rem' }}>
              <AlertCircle size={14} />
              <span>{batchError}</span>
            </div>
          )}

          {/* Batch Predictions Result Table */}
          {batchResult && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="badge badge-emerald">
                  Scored {batchResult.count || batchResult.predictions?.length || 0} Instances
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Latency: {batchResult.latency_ms ? `${batchResult.latency_ms.toFixed(1)}ms` : 'instant'}
                </span>
              </div>

              <div className="data-table-wrapper" style={{ maxHeight: 200 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>PREDICTED VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(batchResult.predictions || []).map((pred, pIdx) => (
                      <tr key={pIdx}>
                        <td style={{ color: 'var(--text-muted)' }}>{pIdx + 1}</td>
                        <td style={{ color: 'var(--cyan-neon)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                          {typeof pred === 'number' ? pred.toFixed(4) : String(pred)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
