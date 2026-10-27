import React, { useState } from 'react';
import { api } from '../api/client';
import {
  Layers,
  ScatterChart,
  ShieldAlert,
  Play,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  TrendingUp,
  Target,
  RefreshCw,
} from 'lucide-react';

export default function UnsupervisedTab({ activeDataset }) {
  const [subTab, setSubTab] = useState('clustering'); // 'clustering', 'pca', 'anomaly'

  // Clustering state
  const [clusterMethod, setClusterMethod] = useState('kmeans');
  const [nClusters, setNClusters] = useState(3);
  const [clusterLoading, setClusterLoading] = useState(false);
  const [clusterResult, setClusterResult] = useState(null);
  const [clusterError, setClusterError] = useState(null);

  // PCA state
  const [pcaComponents, setPcaComponents] = useState(2);
  const [pcaLoading, setPcaLoading] = useState(false);
  const [pcaResult, setPcaResult] = useState(null);
  const [pcaError, setPcaError] = useState(null);

  // Anomaly state
  const [anomalyMethod, setAnomalyMethod] = useState('isolation_forest');
  const [contamination, setContamination] = useState(0.05);
  const [anomalyLoading, setAnomalyLoading] = useState(false);
  const [anomalyResult, setAnomalyResult] = useState(null);
  const [anomalyError, setAnomalyError] = useState(null);

  if (!activeDataset) {
    return (
      <div className="glass-panel" style={{ margin: '2rem', padding: '3.5rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Please select a dataset from the top navigation to access the Unsupervised & Anomaly Lab.</p>
      </div>
    );
  }

  const handleRunClustering = async () => {
    setClusterLoading(true);
    setClusterError(null);
    setClusterResult(null);
    try {
      const res = await api.runClustering(activeDataset.id, {
        method: clusterMethod,
        n_clusters: parseInt(nClusters, 10),
      });
      setClusterResult(res);
    } catch (err) {
      setClusterError(err.message || 'Clustering execution failed.');
    } finally {
      setClusterLoading(false);
    }
  };

  const handleRunPca = async () => {
    setPcaLoading(true);
    setPcaError(null);
    setPcaResult(null);
    try {
      const res = await api.runPca(activeDataset.id, {
        n_components: parseInt(pcaComponents, 10),
      });
      setPcaResult(res);
    } catch (err) {
      setPcaError(err.message || 'PCA execution failed.');
    } finally {
      setPcaLoading(false);
    }
  };

  const handleRunAnomaly = async () => {
    setAnomalyLoading(true);
    setAnomalyError(null);
    setAnomalyResult(null);
    try {
      const res = await api.runAnomalyDetection(activeDataset.id, {
        method: anomalyMethod,
        contamination: parseFloat(contamination),
      });
      setAnomalyResult(res);
    } catch (err) {
      setAnomalyError(err.message || 'Anomaly detection failed.');
    } finally {
      setAnomalyLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header & Sub-Navigation */}
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: '4px solid var(--ks-kinpaku)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--radius-sm)', background: 'var(--ks-kinpaku-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ks-kinpaku)' }}>
              <Layers size={18} />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--ks-ink)' }}>Unsupervised Intelligence & Anomaly Lab</h2>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Clustering patterns, Principal Component Analysis (PCA) projection, and multivariate outlier detection.
          </p>
        </div>

        {/* Sub-Tab Navigation Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'var(--ks-paper-deep)', padding: '0.35rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <button
            className={`btn ${subTab === 'clustering' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
            onClick={() => setSubTab('clustering')}
          >
            <Layers size={14} />
            <span>Clustering Lab</span>
          </button>
          <button
            className={`btn ${subTab === 'pca' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
            onClick={() => setSubTab('pca')}
          >
            <ScatterChart size={14} />
            <span>PCA Dimensionality</span>
          </button>
          <button
            className={`btn ${subTab === 'anomaly' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
            onClick={() => setSubTab('anomaly')}
          >
            <ShieldAlert size={14} />
            <span>Anomaly & Outliers</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: CLUSTERING LAB */}
      {subTab === 'clustering' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Controls */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ks-kinpaku)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Clustering Controls
            </div>

            <div>
              <label className="form-label">Algorithm</label>
              <select
                className="form-select"
                value={clusterMethod}
                onChange={(e) => setClusterMethod(e.target.value)}
              >
                <option value="kmeans">K-Means (Centroid)</option>
                <option value="minibatch_kmeans">MiniBatch K-Means (Fast)</option>
                <option value="agglomerative">Agglomerative (Hierarchical)</option>
                <option value="gmm">Gaussian Mixture Models (Probabilistic)</option>
                <option value="dbscan">DBSCAN (Density-Based)</option>
              </select>
            </div>

            {clusterMethod !== 'dbscan' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Number of Clusters</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ks-kinpaku)', fontSize: '0.85rem' }}>k = {nClusters}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={1}
                  value={nClusters}
                  onChange={(e) => setNClusters(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--ks-kinpaku)' }}
                />
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.7rem', justifyContent: 'center' }}
              disabled={clusterLoading}
              onClick={handleRunClustering}
            >
              {clusterLoading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Computing Clusters...</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  <span>Execute Clustering</span>
                </>
              )}
            </button>

            {clusterError && (
              <div className="badge badge-vermilion" style={{ padding: '0.6rem 0.8rem' }}>
                <AlertCircle size={14} />
                <span>{clusterError}</span>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {!clusterResult ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Layers size={44} style={{ opacity: 0.3, margin: '0 auto 1rem auto', color: 'var(--ks-kinpaku)' }} />
                <p style={{ color: 'var(--ks-ink)', fontWeight: 600 }}>No clustering run executed yet</p>
                <p style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
                  Select an algorithm and cluster count on the left, then click <strong>Execute Clustering</strong>.
                </p>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Metric Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--ks-paper-deep)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>CLUSTERS FOUND</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ks-kinpaku)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                      {clusterResult.n_clusters_found}
                    </div>
                  </div>
                  {clusterResult.metrics?.silhouette_score !== undefined && clusterResult.metrics?.silhouette_score !== null && (
                    <div style={{ background: 'var(--ks-paper-deep)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>SILHOUETTE SCORE</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: clusterResult.metrics.silhouette_score > 0.4 ? 'var(--ks-patina)' : 'var(--ks-ink)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                        {clusterResult.metrics.silhouette_score}
                      </div>
                    </div>
                  )}
                  {clusterResult.metrics?.davies_bouldin_score !== undefined && clusterResult.metrics?.davies_bouldin_score !== null && (
                    <div style={{ background: 'var(--ks-paper-deep)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>DAVIES-BOULDIN</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ks-ink)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                        {clusterResult.metrics.davies_bouldin_score}
                      </div>
                    </div>
                  )}
                  {clusterResult.metrics?.inertia !== undefined && (
                    <div style={{ background: 'var(--ks-paper-deep)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>INERTIA (WCSS)</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ks-ink)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                        {clusterResult.metrics.inertia}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cluster Distribution */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Cluster Size Distribution
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    {Object.entries(clusterResult.cluster_distribution || {}).map(([cName, cInfo]) => (
                      <div key={cName} style={{ background: 'var(--ks-paper-deep)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--ks-ink)' }}>{cName}</span>
                          <span style={{ color: 'var(--ks-kinpaku)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{cInfo.percentage}%</span>
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {cInfo.count} samples
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample Records Table */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Sample Cluster Assignments (First 20 Records)
                  </div>
                  <div className="data-table-wrapper" style={{ maxHeight: '250px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: 80 }}>Sample #</th>
                          <th style={{ width: 120 }}>Cluster</th>
                          {clusterResult.features_used.slice(0, 4).map(f => <th key={f}>{f}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {clusterResult.sample_assignments.map((s, idx) => (
                          <tr key={idx}>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{idx + 1}</td>
                            <td>
                              <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>
                                Cluster {s.cluster}
                              </span>
                            </td>
                            {clusterResult.features_used.slice(0, 4).map(f => (
                              <td key={f} style={{ fontFamily: 'var(--font-mono)' }}>{s[f]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: PCA DIMENSIONALITY REDUCTION */}
      {subTab === 'pca' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Controls */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ks-kinpaku)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              PCA Configuration
            </div>

            <div>
              <label className="form-label">Principal Components</label>
              <select
                className="form-select"
                value={pcaComponents}
                onChange={(e) => setPcaComponents(e.target.value)}
              >
                <option value={2}>2 Components (2D Plane)</option>
                <option value={3}>3 Components (3D Space)</option>
                <option value={4}>4 Components</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.7rem', justifyContent: 'center' }}
              disabled={pcaLoading}
              onClick={handleRunPca}
            >
              {pcaLoading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Projecting Dimensions...</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  <span>Compute PCA Projection</span>
                </>
              )}
            </button>

            {pcaError && (
              <div className="badge badge-vermilion" style={{ padding: '0.6rem 0.8rem' }}>
                <AlertCircle size={14} />
                <span>{pcaError}</span>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {!pcaResult ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ScatterChart size={44} style={{ opacity: 0.3, margin: '0 auto 1rem auto', color: 'var(--ks-kinpaku)' }} />
                <p style={{ color: 'var(--ks-ink)', fontWeight: 600 }}>No PCA decomposition computed</p>
                <p style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
                  Click <strong>Compute PCA Projection</strong> to reduce dimensionality and view explained variance ratios.
                </p>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Total Explained Variance Banner */}
                <div style={{ background: 'var(--ks-paper-deep)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', borderLeft: '4px solid var(--ks-kinpaku)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL VARIANCE PRESERVED</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--ks-kinpaku)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                      {(pcaResult.total_explained_variance * 100).toFixed(2)}%
                    </div>
                  </div>
                  <span className="badge badge-patina">
                    {pcaResult.n_components} Components Selected
                  </span>
                </div>

                {/* Scree Plot / Variance Bars */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Explained Variance Ratio per Component
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {pcaResult.explained_variance_ratio.map((evr, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ks-ink)' }}>PC{i + 1}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ks-kinpaku)', fontWeight: 700 }}>
                            {(evr * 100).toFixed(2)}% <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Cumulative: {(pcaResult.cumulative_variance_ratio[i] * 100).toFixed(2)}%)</span>
                          </span>
                        </div>
                        <div style={{ background: '#e8e4dc', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${evr * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--ks-kinpaku), #d99f36)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Component Loadings */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Top Feature Loadings (Weights in Principal Axes)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
                    {pcaResult.components.map((c) => (
                      <div key={c.component} style={{ background: 'var(--ks-paper-deep)', padding: '0.9rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.35rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--ks-ink)' }}>{c.component}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{(c.explained_variance_ratio * 100).toFixed(1)}% var</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                          {Object.entries(c.loadings).slice(0, 4).map(([fName, loadVal]) => (
                            <div key={fName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>{fName}:</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: loadVal >= 0 ? 'var(--ks-patina)' : 'var(--ks-vermilion)' }}>
                                {loadVal > 0 ? `+${loadVal.toFixed(3)}` : loadVal.toFixed(3)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: ANOMALY & OUTLIER DETECTION */}
      {subTab === 'anomaly' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Controls */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ks-kinpaku)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Anomaly Parameters
            </div>

            <div>
              <label className="form-label">Detection Algorithm</label>
              <select
                className="form-select"
                value={anomalyMethod}
                onChange={(e) => setAnomalyMethod(e.target.value)}
              >
                <option value="isolation_forest">Isolation Forest (Tree-Based Partitioning)</option>
                <option value="local_outlier_factor">Local Outlier Factor (LOF Density)</option>
                <option value="elliptic_envelope">Elliptic Envelope (Robust Covariance)</option>
              </select>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Contamination Rate</label>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--ks-vermilion)', fontSize: '0.85rem' }}>{(contamination * 100).toFixed(1)}%</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={0.20}
                step={0.01}
                value={contamination}
                onChange={(e) => setContamination(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--ks-vermilion)' }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Estimated fraction of outliers in the dataset (1% to 20%).
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.7rem', justifyContent: 'center' }}
              disabled={anomalyLoading}
              onClick={handleRunAnomaly}
            >
              {anomalyLoading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Scanning for Outliers...</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={15} />
                  <span>Scan for Anomalies</span>
                </>
              )}
            </button>

            {anomalyError && (
              <div className="badge badge-vermilion" style={{ padding: '0.6rem 0.8rem' }}>
                <AlertCircle size={14} />
                <span>{anomalyError}</span>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {!anomalyResult ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ShieldAlert size={44} style={{ opacity: 0.3, margin: '0 auto 1rem auto', color: 'var(--ks-vermilion)' }} />
                <p style={{ color: 'var(--ks-ink)', fontWeight: 600 }}>No anomaly scan executed yet</p>
                <p style={{ fontSize: '0.82rem', marginTop: '0.35rem' }}>
                  Configure sensitivity and click <strong>Scan for Anomalies</strong> to isolate abnormal distribution points.
                </p>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Outlier Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ background: 'var(--ks-paper-deep)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOTAL ROWS</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ks-ink)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                      {anomalyResult.total_rows}
                    </div>
                  </div>

                  <div style={{ background: 'var(--ks-paper-deep)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--ks-vermilion)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ANOMALIES FOUND</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ks-vermilion)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                      {anomalyResult.anomaly_count}
                    </div>
                  </div>

                  <div style={{ background: 'var(--ks-paper-deep)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ANOMALY RATE</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--ks-kinpaku)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                      {anomalyResult.anomaly_percentage}%
                    </div>
                  </div>
                </div>

                {/* Top Anomalies Table */}
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Strongest Outliers (Ranked by Anomaly Score)
                  </div>
                  <div className="data-table-wrapper" style={{ maxHeight: '280px' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th style={{ width: 100 }}>Row Index</th>
                          <th style={{ width: 130 }}>Anomaly Score</th>
                          <th style={{ width: 100 }}>Status</th>
                          {anomalyResult.features_evaluated.slice(0, 4).map(f => <th key={f}>{f}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {anomalyResult.top_anomalies.map((item, idx) => (
                          <tr key={idx} style={{ background: item._is_outlier ? 'var(--ks-vermilion-tint)' : 'transparent' }}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--ks-ink)' }}>
                              #{item._row_index}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--ks-vermilion)', fontWeight: 600 }}>
                              {item._anomaly_score}
                            </td>
                            <td>
                              {item._is_outlier ? (
                                <span className="badge badge-vermilion" style={{ fontSize: '0.68rem' }}>
                                  Outlier
                                </span>
                              ) : (
                                <span className="badge badge-patina" style={{ fontSize: '0.68rem' }}>
                                  Normal
                                </span>
                              )}
                            </td>
                            {anomalyResult.features_evaluated.slice(0, 4).map(f => (
                              <td key={f} style={{ fontFamily: 'var(--font-mono)' }}>{item[f]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
