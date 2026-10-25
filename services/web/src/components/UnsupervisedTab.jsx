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
      <div className="glass-panel" style={{ margin: '2rem', padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Please select a dataset to access the Unsupervised & Anomaly Lab.</p>
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
      <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={22} color="var(--purple-telemetry)" />
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Unsupervised Intelligence & Anomaly Lab</h2>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Clustering patterns, Principal Component Analysis (PCA) projection, and multivariate outlier detection.
          </p>
        </div>

        {/* Sub-Tab Navigation Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(14, 20, 32, 0.7)', padding: '0.35rem', borderRadius: 'var(--radius-sm)' }}>
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
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cyan-neon)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                <label className="form-label">Number of Clusters (k = {nClusters})</label>
                <input
                  type="range"
                  min={2}
                  max={8}
                  step={1}
                  value={nClusters}
                  onChange={(e) => setNClusters(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem' }}
              disabled={clusterLoading}
              onClick={handleRunClustering}
            >
              {clusterLoading ? (
                <>
                  <span className="pulse-dot pulse-dot-orange" />
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
              <div className="badge badge-rose" style={{ padding: '0.5rem' }}>
                <AlertCircle size={14} />
                <span>{clusterError}</span>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {!clusterResult ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Layers size={48} style={{ opacity: 0.25, margin: '0 auto 1rem auto' }} />
                <p>Select algorithm and cluster count, then click <strong>Execute Clustering</strong>.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  Features are standardized and evaluated with Silhouette, Davies-Bouldin, and Calinski-Harabasz metrics.
                </p>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Metric Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CLUSTERS FOUND</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--cyan-neon)', fontFamily: 'var(--font-mono)' }}>
                      {clusterResult.n_clusters_found}
                    </div>
                  </div>
                  {clusterResult.metrics?.silhouette_score !== undefined && clusterResult.metrics?.silhouette_score !== null && (
                    <div style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SILHOUETTE SCORE</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: clusterResult.metrics.silhouette_score > 0.4 ? 'var(--emerald-neon)' : 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {clusterResult.metrics.silhouette_score}
                      </div>
                    </div>
                  )}
                  {clusterResult.metrics?.davies_bouldin_score !== undefined && clusterResult.metrics?.davies_bouldin_score !== null && (
                    <div style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>DAVIES-BOULDIN</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {clusterResult.metrics.davies_bouldin_score}
                      </div>
                    </div>
                  )}
                  {clusterResult.metrics?.inertia !== undefined && (
                    <div style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>INERTIA (WCSS)</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--orange-racing)', fontFamily: 'var(--font-mono)' }}>
                        {clusterResult.metrics.inertia}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cluster Distribution */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                    Cluster Size Distribution
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
                    {Object.entries(clusterResult.cluster_distribution || {}).map(([cName, cInfo]) => (
                      <div key={cName} style={{ background: 'rgba(14, 20, 32, 0.6)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cName}</span>
                          <span style={{ color: 'var(--cyan-neon)', fontFamily: 'var(--font-mono)' }}>{cInfo.percentage}%</span>
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {cInfo.count} samples
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sample Records Table */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                    Sample Cluster Assignments (First 20 Samples)
                  </div>
                  <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    <table className="retro-table" style={{ width: '100%', fontSize: '0.75rem' }}>
                      <thead>
                        <tr>
                          <th>Sample #</th>
                          <th>Cluster</th>
                          {clusterResult.features_used.slice(0, 4).map(f => <th key={f}>{f}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {clusterResult.sample_assignments.map((s, idx) => (
                          <tr key={idx}>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{idx + 1}</td>
                            <td>
                              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
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
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cyan-neon)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                <option value={3}>3 Components (3D Volume)</option>
                <option value={4}>4 Components</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem' }}
              disabled={pcaLoading}
              onClick={handleRunPca}
            >
              {pcaLoading ? (
                <>
                  <span className="pulse-dot pulse-dot-orange" />
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
              <div className="badge badge-rose" style={{ padding: '0.5rem' }}>
                <AlertCircle size={14} />
                <span>{pcaError}</span>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {!pcaResult ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ScatterChart size={48} style={{ opacity: 0.25, margin: '0 auto 1rem auto' }} />
                <p>Click <strong>Compute PCA Projection</strong> to reduce feature dimensionality.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  Calculates explained variance ratios, singular values, and feature loadings across orthogonal components.
                </p>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Total Explained Variance Banner */}
                <div style={{ background: 'rgba(14, 20, 32, 0.8)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOTAL VARIANCE PRESERVED</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--cyan-neon)', fontFamily: 'var(--font-mono)' }}>
                      {(pcaResult.total_explained_variance * 100).toFixed(2)}%
                    </div>
                  </div>
                  <span className="badge badge-emerald">
                    {pcaResult.n_components} Components Selected
                  </span>
                </div>

                {/* Scree Plot / Variance Bars */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                    Explained Variance Ratio per Component
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {pcaResult.explained_variance_ratio.map((evr, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>PC{i + 1}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-neon)' }}>
                            {(evr * 100).toFixed(2)}% (Cumulative: {(pcaResult.cumulative_variance_ratio[i] * 100).toFixed(2)}%)
                          </span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.06)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${evr * 100}%`, height: '100%', background: 'var(--orange-racing)', borderRadius: '4px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Component Loadings */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                    Top Feature Loadings (Weights in Principal Axes)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {pcaResult.components.map((c) => (
                      <div key={c.component} style={{ background: 'rgba(14, 20, 32, 0.6)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.3rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--cyan-neon)' }}>{c.component}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(c.explained_variance_ratio * 100).toFixed(1)}% var</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                          {Object.entries(c.loadings).slice(0, 4).map(([fName, loadVal]) => (
                            <div key={fName} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                              <span style={{ color: 'var(--text-muted)' }}>{fName}:</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: loadVal >= 0 ? 'var(--emerald-neon)' : 'var(--rose-neon)' }}>
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
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--cyan-neon)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
              <label className="form-label">Contamination Rate ({(contamination * 100).toFixed(1)}%)</label>
              <input
                type="range"
                min={0.01}
                max={0.20}
                step={0.01}
                value={contamination}
                onChange={(e) => setContamination(e.target.value)}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Estimated fraction of outliers in the dataset (1% to 20%).
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem' }}
              disabled={anomalyLoading}
              onClick={handleRunAnomaly}
            >
              {anomalyLoading ? (
                <>
                  <span className="pulse-dot pulse-dot-orange" />
                  <span>Scanning for Outliers...</span>
                </>
              ) : (
                <>
                  <ShieldAlert size={14} />
                  <span>Scan for Anomalies</span>
                </>
              )}
            </button>

            {anomalyError && (
              <div className="badge badge-rose" style={{ padding: '0.5rem' }}>
                <AlertCircle size={14} />
                <span>{anomalyError}</span>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {!anomalyResult ? (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ShieldAlert size={48} style={{ opacity: 0.25, margin: '0 auto 1rem auto' }} />
                <p>Configure sensitivity and click <strong>Scan for Anomalies</strong>.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.4rem' }}>
                  Isolates abnormal data points, sensor glitches, telemetry spikes, and distribution outliers.
                </p>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Outlier Metrics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>TOTAL ROWS</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {anomalyResult.total_rows}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ANOMALIES FOUND</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--rose-neon)', fontFamily: 'var(--font-mono)' }}>
                      {anomalyResult.anomaly_count}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ANOMALY RATE</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--orange-racing)', fontFamily: 'var(--font-mono)' }}>
                      {anomalyResult.anomaly_percentage}%
                    </div>
                  </div>
                </div>

                {/* Top Anomalies Table */}
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase' }}>
                    Strongest Outliers (Ranked by Anomaly Score)
                  </div>
                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    <table className="retro-table" style={{ width: '100%', fontSize: '0.75rem' }}>
                      <thead>
                        <tr>
                          <th>Row Index</th>
                          <th>Anomaly Score</th>
                          <th>Status</th>
                          {anomalyResult.features_evaluated.slice(0, 4).map(f => <th key={f}>{f}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {anomalyResult.top_anomalies.map((item, idx) => (
                          <tr key={idx} style={{ background: item._is_outlier ? 'rgba(255, 42, 109, 0.08)' : 'transparent' }}>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--cyan-neon)' }}>
                              #{item._row_index}
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--rose-neon)' }}>
                              {item._anomaly_score}
                            </td>
                            <td>
                              {item._is_outlier ? (
                                <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>
                                  Outlier
                                </span>
                              ) : (
                                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
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
