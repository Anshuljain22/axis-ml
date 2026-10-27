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
  Cpu,
  ArrowRight
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
    <div className="animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Controls: Active Model Selector */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderLeft: '4px solid var(--ks-kinpaku)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--ks-kinpaku-tint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ks-kinpaku)',
            border: '1px solid var(--ks-kinpaku-glow)',
          }}>
            <Zap size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Active Inference Pipeline
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--ks-ink)' }}>
              {selectedRun ? `${selectedRun.model_name?.toUpperCase()} · ${selectedRun.task_type}` : 'No Model Loaded'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <select
            className="form-select"
            style={{ minWidth: 280, padding: '0.5rem 0.85rem', fontSize: '0.85rem' }}
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
                {r.model_name?.toUpperCase()} — Run {r.id.slice(0, 8)} ({r.task_type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid: Single Inference & Batch Inference */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Single Sample Predictor */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--ks-kinpaku-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ks-kinpaku)' }}>
                <Zap size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ks-ink)' }}>Single Sample Scoring</h3>
            </div>
            {sampleRows.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', gap: '0.35rem' }}
                onClick={handleLoadSampleFromDataset}
              >
                <RefreshCw size={13} />
                <span>Fill Random Row</span>
              </button>
            )}
          </div>

          {!selectedRun ? (
            <div style={{ padding: '3rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p>Train a model in Model Studio or select an active model run above to start scoring samples.</p>
            </div>
          ) : (
            <form onSubmit={handleSinglePredict} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Feature Inputs */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Feature Vector Inputs
                </div>
                <div style={{ maxHeight: 290, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', paddingRight: '0.25rem' }}>
                  {Object.keys(inputValues).map((feat) => (
                    <div key={feat} style={{ background: 'var(--ks-paper-deep)', padding: '0.6rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <label className="form-label" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                        {feat}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.85rem' }}
                        value={inputValues[feat] !== undefined ? inputValues[feat] : ''}
                        onChange={(e) => handleInputChange(feat, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', justifyContent: 'center' }}
                disabled={predicting}
              >
                {predicting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Scoring Feature Vector...</span>
                  </>
                ) : (
                  <>
                    <Play size={16} fill="currentColor" />
                    <span>Run Inference Scoring</span>
                  </>
                )}
              </button>

              {singleError && (
                <div className="badge badge-vermilion" style={{ padding: '0.6rem 0.85rem', width: '100%' }}>
                  <AlertCircle size={15} />
                  <span>{singleError}</span>
                </div>
              )}

              {/* Single Prediction Result */}
              {singleResult && (
                <div className="animate-fade-in" style={{ 
                  background: 'var(--ks-paper-deep)', 
                  padding: '1.35rem', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--border-subtle)',
                  borderLeft: '4px solid var(--ks-kinpaku)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      Predicted Target Value
                    </div>
                    <span className="badge badge-patina" style={{ fontSize: '0.7rem' }}>
                      Scored Instantly
                    </span>
                  </div>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800, color: 'var(--ks-kinpaku)', fontFamily: 'var(--font-mono)', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
                    {typeof singleResult.prediction === 'number' ? singleResult.prediction.toFixed(4) : String(singleResult.prediction)}
                  </div>

                  {/* Probabilities (if classification) */}
                  {singleResult.probabilities && (
                    <div style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ks-ink)', marginBottom: '0.65rem' }}>
                        Class Probability Distribution
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {Object.entries(singleResult.probabilities).map(([cls, prob]) => {
                          const pct = (Number(prob) * 100).toFixed(1);
                          return (
                            <div key={cls}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '0.25rem' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Class {cls}</span>
                                <strong style={{ color: 'var(--ks-ink)' }}>{pct}%</strong>
                              </div>
                              <div style={{ height: 6, background: '#e8e4dc', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--ks-kinpaku), #d99f36)', borderRadius: 3 }} />
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--ks-patina-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ks-patina)' }}>
                <Layers size={16} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--ks-ink)' }}>Batch Inference Lab</h3>
            </div>
            <span className="badge badge-gold">Vectorized Scoring</span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Payload (JSON Array of Objects)</label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Sample preview loaded
              </span>
            </div>
            <textarea
              className="form-input"
              rows={9}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', resize: 'vertical', lineHeight: 1.5 }}
              value={batchJson}
              onChange={(e) => setBatchJson(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', justifyContent: 'center' }}
            disabled={batchPredicting || !selectedRun}
            onClick={handleBatchPredict}
          >
            {batchPredicting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Vectorizing Batch Scores...</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Execute Batch Predictions</span>
              </>
            )}
          </button>

          {batchError && (
            <div className="badge badge-vermilion" style={{ padding: '0.6rem 0.85rem', width: '100%' }}>
              <AlertCircle size={15} />
              <span>{batchError}</span>
            </div>
          )}

          {/* Batch Predictions Result Table */}
          {batchResult && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="badge badge-patina">
                  Scored {batchResult.count || batchResult.predictions?.length || 0} Instances
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Latency: {batchResult.latency_ms ? `${batchResult.latency_ms.toFixed(1)}ms` : 'instant'}
                </span>
              </div>

              <div className="data-table-wrapper" style={{ maxHeight: 220 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>#</th>
                      <th>PREDICTED VALUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(batchResult.predictions || []).map((pred, pIdx) => (
                      <tr key={pIdx}>
                        <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{pIdx + 1}</td>
                        <td style={{ color: 'var(--ks-kinpaku)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>
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
