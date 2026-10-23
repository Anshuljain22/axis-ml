import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Trophy, 
  Crown, 
  ExternalLink, 
  Zap, 
  BarChart2, 
  Cpu, 
  Calendar, 
  AlertCircle,
  Eye,
  CheckCircle2
} from 'lucide-react';

export default function LeaderboardTab({ 
  activeDataset, 
  onNavigateTab, 
  setActiveRunId 
}) {
  const [compareData, setCompareData] = useState(null);
  const [runsList, setRunsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRun, setSelectedRun] = useState(null);

  useEffect(() => {
    if (!activeDataset?.id) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.compareRuns(activeDataset.id).catch(() => null),
      api.getRuns(activeDataset.id).catch(() => []),
    ])
      .then(([compare, runs]) => {
        if (!isMounted) return;
        setCompareData(compare);
        setRunsList(runs || []);
        if (runs && runs.length > 0) {
          // If compare has best_run_id, default to it
          const best = compare?.best_run_id 
            ? runs.find((r) => r.id === compare.best_run_id) 
            : runs[0];
          setSelectedRun(best || runs[0]);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load leaderboard');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [activeDataset?.id]);

  if (!activeDataset) {
    return (
      <div className="glass-panel" style={{ margin: '2rem', padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Please select a dataset to view model comparison leaderboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cyan-neon)' }}>
        <span className="pulse-dot pulse-dot-cyan" style={{ width: 14, height: 14, marginRight: 8 }} />
        <span>Aggregating experiment metrics and evaluating rankings...</span>
      </div>
    );
  }

  const bestRunId = compareData?.best_run_id;
  const bestRun = runsList.find((r) => r.id === bestRunId);
  const rankedRuns = compareData?.ranked_runs || runsList;

  const handleUseForInference = (runId) => {
    if (setActiveRunId) setActiveRunId(runId);
    onNavigateTab('inference');
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Best Model Banner */}
      {bestRun && (
        <div className="glass-panel" style={{ 
          padding: '1.5rem', 
          background: 'linear-gradient(90deg, rgba(255, 87, 34, 0.12), rgba(0, 229, 255, 0.12))', 
          border: '1px solid rgba(0, 229, 255, 0.4)',
          boxShadow: 'var(--shadow-glow-cyan)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffd700, #ff9100)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#050912',
                boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
              }}>
                <Crown size={28} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: 800, letterSpacing: '0.05em' }}>
                    LEADERBOARD CHAMPION
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                    {bestRun.model_name?.toUpperCase()}
                  </span>
                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                    {bestRun.task_type?.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  Top Performing Pipeline for {activeDataset.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                  Primary Metric Score: <strong style={{ color: 'var(--cyan-neon)' }}>{compareData?.best_score?.toFixed(4) || 'N/A'}</strong>
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ padding: '0.6rem 1.25rem' }}
              onClick={() => handleUseForInference(bestRun.id)}
            >
              <Zap size={16} />
              <span>Deploy to Live Inference Cockpit</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Ranked Runs Table & Detailed Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Ranked Leaderboard Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Trophy size={20} color="var(--cyan-neon)" />
              <h3>Model Experiment Leaderboard</h3>
            </div>
            <span className="badge badge-muted">
              {runsList.length} Runs
            </span>
          </div>

          {runsList.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Trophy size={40} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
              <p>No model runs recorded for this dataset yet.</p>
              <button 
                className="btn btn-racing" 
                style={{ marginTop: '1rem' }}
                onClick={() => onNavigateTab('models')}
              >
                Go to Model Studio
              </button>
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>RANK</th>
                    <th>ARCHITECTURE</th>
                    <th>PRIMARY SCORE</th>
                    <th>TASK</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedRuns.map((r, idx) => {
                    const runId = r.id || r.run_id;
                    const fullRun = runsList.find((item) => item.id === runId) || r;
                    const isChampion = runId === bestRunId;
                    const isSelected = selectedRun?.id === runId;
                    const score = r.primary_metric_value ?? (fullRun.metrics ? Object.values(fullRun.metrics)[0] : null);

                    return (
                      <tr 
                        key={runId}
                        style={{ 
                          background: isSelected ? 'rgba(0, 229, 255, 0.08)' : undefined,
                          cursor: 'pointer' 
                        }}
                        onClick={() => setSelectedRun(fullRun)}
                      >
                        <td>
                          {isChampion ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#ffd700', fontWeight: 800 }}>
                              <Crown size={14} /> #1
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>#{idx + 1}</span>
                          )}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>{fullRun.model_name || r.model_name}</span>
                            {isChampion && <span className="badge badge-orange" style={{ fontSize: '0.6rem' }}>BEST</span>}
                          </div>
                        </td>
                        <td style={{ color: 'var(--cyan-neon)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {typeof score === 'number' ? score.toFixed(4) : (score || 'N/A')}
                        </td>
                        <td>
                          <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>
                            {fullRun.task_type || 'MODEL'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRun(fullRun);
                              }}
                            >
                              Inspect
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUseForInference(runId);
                              }}
                            >
                              Predict
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected Run Deep Inspector */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <BarChart2 size={20} color="var(--orange-racing)" />
            <h3>Run Deep Inspector</h3>
          </div>

          {!selectedRun ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Select a run from the table to inspect parameters and metric breakdown.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  RUN ID
                </div>
                <code style={{ fontSize: '0.8rem', color: 'var(--cyan-neon)' }}>{selectedRun.id}</code>
              </div>

              {/* Metrics Breakdown Grid */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Scalar Metrics
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '0.5rem' }}>
                  {Object.entries(selectedRun.metrics || {}).map(([k, v]) => (
                    <div key={k} style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.6rem', borderRadius: 'var(--radius-xs)' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {k.toUpperCase()}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '0.1rem' }}>
                        {typeof v === 'number' ? v.toFixed(4) : String(v)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hyperparameters Logged */}
              {selectedRun.parameters && (
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Logged Parameters
                  </div>
                  <div style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.75rem', borderRadius: 'var(--radius-xs)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    {Object.entries(selectedRun.parameters).map(([pk, pv]) => (
                      <div key={pk} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.2rem 0' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{pk}:</span>
                        <span style={{ color: 'var(--cyan-neon)' }}>{String(pv)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MLflow Link */}
              {selectedRun.mlflow_run_id && (
                <a
                  href={`http://localhost:5000/#/experiments/0/runs/${selectedRun.mlflow_run_id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ width: '100%', fontSize: '0.8rem' }}
                >
                  <ExternalLink size={14} />
                  <span>Open Run in MLflow Artifacts UI</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
