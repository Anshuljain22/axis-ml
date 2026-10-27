import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Activity, 
  AlertTriangle, 
  BarChart3, 
  Grid, 
  Clock, 
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Info,
  FlaskConical,
  Zap,
  Scale
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function EdaStudioTab({ activeDataset }) {
  const [summaryData, setSummaryData] = useState(null);
  const [statsData, setStatsData] = useState(null);
  const [distData, setDistData] = useState(null);
  const [corrData, setCorrData] = useState(null);
  const [timeSeriesData, setTimeSeriesData] = useState(null);
  const [normalityData, setNormalityData] = useState(null);
  const [vifData, setVifData] = useState(null);
  const [stationarityData, setStationarityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedHistCol, setSelectedHistCol] = useState('');
  const [selectedTimeCol, setSelectedTimeCol] = useState('');

  // Interactive Hypothesis Testing state
  const [hypoTestType, setHypoTestType] = useState('two_sample_t_test');
  const [hypoColA, setHypoColA] = useState('');
  const [hypoColB, setHypoColB] = useState('');
  const [hypoGroupCol, setHypoGroupCol] = useState('');
  const [hypoLoading, setHypoLoading] = useState(false);
  const [hypoResult, setHypoResult] = useState(null);
  const [hypoError, setHypoError] = useState(null);

  useEffect(() => {
    if (!activeDataset?.id) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getEdaSummary(activeDataset.id),
      api.getStatistics(activeDataset.id),
      api.getDistributions(activeDataset.id),
      api.getCorrelations(activeDataset.id).catch(() => null),
      api.getTimeSeries(activeDataset.id).catch(() => null),
      api.getNormality(activeDataset.id).catch(() => null),
      api.getVif(activeDataset.id).catch(() => null),
      api.getStationarity(activeDataset.id).catch(() => null),
    ])
      .then(([summary, stats, dist, corr, ts, norm, vif, stationarity]) => {
        if (!isMounted) return;
        setSummaryData(summary);
        setStatsData(stats);
        setDistData(dist);
        setCorrData(corr);
        setTimeSeriesData(ts);
        setNormalityData(norm);
        setVifData(vif);
        setStationarityData(stationarity);

        const distCols = Object.keys(dist?.distributions || {});
        if (distCols.length > 0) {
          setSelectedHistCol(distCols[0]);
          setHypoColA(distCols[0]);
          if (distCols.length > 1) {
            setHypoColB(distCols[1]);
          }
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to load EDA suite');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [activeDataset?.id]);

  const handleRunHypoTest = async () => {
    if (!hypoColA) {
      setHypoError('Variable A is required.');
      return;
    }
    setHypoLoading(true);
    setHypoError(null);
    setHypoResult(null);

    try {
      const res = await api.runHypothesisTest(activeDataset.id, {
        test_type: hypoTestType,
        col_a: hypoColA,
        col_b: hypoColB || null,
        group_col: hypoGroupCol || null,
        alpha: 0.05,
      });
      setHypoResult(res);
    } catch (err) {
      setHypoError(err.message || 'Hypothesis test execution failed.');
    } finally {
      setHypoLoading(false);
    }
  };

  if (!activeDataset) {
    return (
      <div className="glass-panel" style={{ margin: '2rem', padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Please select a dataset to inspect EDA.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cyan-neon)' }}>
        <span className="pulse-dot pulse-dot-cyan" style={{ width: 14, height: 14, marginRight: 8 }} />
        <span>Running statistical profiling and telemetry diagnostics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="badge badge-rose" style={{ margin: '2rem', padding: '1rem', width: 'auto' }}>
        <AlertTriangle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  const warnings = summaryData?.warnings || [];
  const diagnostics = summaryData?.diagnostics || {};
  const statsCols = statsData?.statistics || {};
  const distributions = distData?.distributions || {};
  const correlationMatrix = corrData?.correlation_matrix || {};
  const corrCols = Object.keys(correlationMatrix);

  const safeNum = (val, decimals = 2) => {
    if (val === null || val === undefined || val === '') return '-';
    const num = Number(val);
    return isNaN(num) ? String(val) : num.toFixed(decimals);
  };

  // Selected Histogram Data
  const currentDist = selectedHistCol ? distributions[selectedHistCol] : null;
  const histLabels = currentDist?.bins?.map((b) => {
    if (typeof b === 'object' && b !== null && b.lower !== undefined) {
      return `${Number(b.lower).toFixed(1)} - ${Number(b.upper).toFixed(1)}`;
    }
    return String(b);
  }) || [];
  const histCounts = currentDist?.bins?.map((b) => {
    if (typeof b === 'object' && b !== null && b.count !== undefined) {
      return b.count;
    }
    return Number(b);
  }) || currentDist?.counts || [];

  const chartData = {
    labels: histLabels,
    datasets: [
      {
        label: `Frequency of ${selectedHistCol}`,
        data: histCounts,
        backgroundColor: 'rgba(197, 139, 36, 0.75)',
        borderColor: '#c58b24',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: '#c58b24',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#ffffff',
        titleColor: '#191817',
        bodyColor: '#2c2927',
        borderColor: 'rgba(25, 24, 23, 0.16)',
        borderWidth: 1,
        padding: 10,
        boxShadow: '0 4px 12px rgba(25, 24, 23, 0.1)',
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(25, 24, 23, 0.05)' },
        ticks: { color: '#68635c', font: { family: 'JetBrains Mono', size: 10 } },
      },
      y: {
        grid: { color: 'rgba(25, 24, 23, 0.05)' },
        ticks: { color: '#68635c', font: { family: 'JetBrains Mono', size: 10 } },
      },
    },
  };

  // Helper for correlation color scale in light kinpaku palette
  const getCorrStyle = (val) => {
    if (val === null || val === undefined || isNaN(val)) {
      return { background: 'var(--ks-paper-deep)', color: 'var(--text-muted)' };
    }
    const r = Math.min(1, Math.max(-1, val));
    if (r > 0.7) return { background: '#fef3c7', color: '#854d0e', fontWeight: 700 };
    if (r > 0.3) return { background: '#fef9c3', color: '#a16207', fontWeight: 600 };
    if (r < -0.7) return { background: '#ffedd5', color: '#9a3412', fontWeight: 700 };
    if (r < -0.3) return { background: '#fff7ed', color: '#c2410c', fontWeight: 600 };
    return { background: 'var(--ks-paper-deep)', color: 'var(--text-secondary)' };
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Telemetry Health & Warnings Banner */}
      <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', borderLeft: warnings.length > 0 ? '4px solid var(--amber-warn)' : '4px solid var(--emerald-pulse)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {warnings.length > 0 ? (
              <AlertTriangle size={20} color="var(--amber-warn)" />
            ) : (
              <CheckCircle2 size={20} color="var(--emerald-pulse)" />
            )}
            <h3>Data Quality & Telemetry Diagnostics</h3>
          </div>
          <span className={`badge ${warnings.length > 0 ? 'badge-amber' : 'badge-emerald'}`}>
            {warnings.length} {warnings.length === 1 ? 'Notice' : 'Notices'}
          </span>
        </div>

        {warnings.length === 0 ? (
          <p style={{ color: 'var(--emerald-pulse)', fontSize: '0.875rem' }}>
            All numeric features pass collinearity and missingness thresholds. Zero severe multicollinearity alerts.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {warnings.map((w, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                fontSize: '0.85rem', 
                color: 'var(--amber-warn)',
                background: 'rgba(255, 171, 0, 0.08)',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-xs)',
              }}>
                <Info size={14} />
                <span>{typeof w === 'string' ? w : w.message || JSON.stringify(w)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Grid: Interactive Distribution Chart & Descriptive Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Histogram Distribution Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <BarChart3 size={20} color="var(--cyan-neon)" />
              <h3>Feature Distribution Histogram</h3>
            </div>

            <select
              className="form-select"
              style={{ width: 'auto', minWidth: 160, padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              value={selectedHistCol}
              onChange={(e) => setSelectedHistCol(e.target.value)}
            >
              {Object.keys(distributions).map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>

          {currentDist ? (
            <div>
              <div style={{ height: 260, position: 'relative' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>

              {/* Distribution Stats Pills */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                <span className="badge badge-muted">MIN: {safeNum(currentDist.min)}</span>
                <span className="badge badge-muted">25%: {safeNum(currentDist.q25)}</span>
                <span className="badge badge-cyan">MEDIAN: {safeNum(currentDist.median)}</span>
                <span className="badge badge-muted">75%: {safeNum(currentDist.q75)}</span>
                <span className="badge badge-muted">MAX: {safeNum(currentDist.max)}</span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              No numeric distributions available.
            </div>
          )}
        </div>

        {/* Feature Summary Statistics Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <TrendingUp size={20} color="var(--orange-racing)" />
            <h3>Summary Statistics</h3>
          </div>

          <div className="data-table-wrapper" style={{ maxHeight: 330 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>FEATURE</th>
                  <th>MEAN</th>
                  <th>STD</th>
                  <th>MIN</th>
                  <th>MAX</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(statsCols).map(([col, s]) => (
                  <tr key={col}>
                    <td style={{ fontWeight: 600 }}>{col}</td>
                    <td style={{ color: 'var(--cyan-neon)' }}>{safeNum(s?.mean)}</td>
                    <td>{safeNum(s?.std)}</td>
                    <td>{safeNum(s?.min)}</td>
                    <td>{safeNum(s?.max)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pearson Correlation Heatmap */}
      {corrCols.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Grid size={20} color="var(--purple-telemetry)" />
              <h3>Pairwise Pearson Correlation Matrix</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, background: 'rgba(255, 87, 34, 0.4)', borderRadius: 2 }} />
                Negative (-1.0)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 10, height: 10, background: 'rgba(0, 229, 255, 0.4)', borderRadius: 2 }} />
                Positive (+1.0)
              </span>
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>FEATURE</th>
                  {corrCols.map((col) => (
                    <th key={col} style={{ textAlign: 'center' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {corrCols.map((rowCol) => (
                  <tr key={rowCol}>
                    <td style={{ fontWeight: 600 }}>{rowCol}</td>
                    {corrCols.map((colCol) => {
                      const val = correlationMatrix[rowCol]?.[colCol];
                      return (
                        <td
                          key={colCol}
                          style={{
                            textAlign: 'center',
                            ...getCorrStyle(val),
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8rem',
                          }}
                        >
                          {val !== undefined && val !== null ? safeNum(val, 2) : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Temporal Cadence & Time-Series Diagnostics */}
      {timeSeriesData && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Clock size={20} color="var(--cyan-neon)" />
            <h3>Temporal Cadence & Sampling Analysis</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--ks-paper-deep)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                INFERRED CADENCE / FREQUENCY
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ks-ink)', fontFamily: 'var(--font-display)', marginTop: '0.2rem' }}>
                {timeSeriesData.inferred_frequency || 'Regular / Hourly (1h)'}
              </div>
            </div>

            <div style={{ background: 'var(--ks-paper-deep)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                TEMPORAL GAPS DETECTED
              </div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 800, 
                color: (timeSeriesData.gap_count || 0) > 0 ? 'var(--ks-vermilion)' : 'var(--ks-patina)', 
                fontFamily: 'var(--font-display)', 
                marginTop: '0.2rem' 
              }}>
                {timeSeriesData.gap_count ?? 0}
              </div>
            </div>

            <div style={{ background: 'var(--ks-paper-deep)', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                SAMPLE TIME WINDOW
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '0.4rem' }}>
                Start: {timeSeriesData.start_timestamp ? new Date(timeSeriesData.start_timestamp).toLocaleString() : 'N/A'}<br/>
                End: {timeSeriesData.end_timestamp ? new Date(timeSeriesData.end_timestamp).toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistical Lab: Normality & Multicollinearity (VIF) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        {/* Normality Tests */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <FlaskConical size={20} color="var(--cyan-neon)" />
            <h3>Feature Normality Diagnostics</h3>
          </div>
          {normalityData?.normality_results && Object.keys(normalityData.normality_results).length > 0 ? (
            <div className="data-table-wrapper" style={{ maxHeight: 280 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>FEATURE</th>
                    <th>SHAPIRO P</th>
                    <th>SKEW</th>
                    <th>KURTOSIS</th>
                    <th>VERDICT</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(normalityData.normality_results).map(([col, res]) => (
                    <tr key={col}>
                      <td style={{ fontWeight: 600 }}>{col}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {res.shapiro_p_value !== null ? safeNum(res.shapiro_p_value, 4) : 'N/A'}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{safeNum(res.skewness, 2)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{safeNum(res.kurtosis, 2)}</td>
                      <td>
                        <span className={`badge ${res.verdict === 'Likely Normal' ? 'badge-emerald' : 'badge-muted'}`}>
                          {res.verdict}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No numeric columns available for normality checks.</p>
          )}
        </div>

        {/* Multicollinearity (VIF) */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Scale size={20} color="var(--orange-racing)" />
              <h3>Multicollinearity (VIF)</h3>
            </div>
            {vifData?.high_multicollinearity_detected && (
              <span className="badge badge-amber">
                ⚠️ High VIF Detected ({vifData.high_vif_count})
              </span>
            )}
          </div>
          {vifData?.vif_results && Object.keys(vifData.vif_results).length > 0 ? (
            <div className="data-table-wrapper" style={{ maxHeight: 280 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>FEATURE</th>
                    <th>VIF SCORE</th>
                    <th>R²</th>
                    <th>SEVERITY</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(vifData.vif_results).map(([col, res]) => (
                    <tr key={col}>
                      <td style={{ fontWeight: 600 }}>{col}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: res.severity === 'high' ? 'var(--rose-alert)' : (res.severity === 'moderate' ? 'var(--amber-warn)' : 'var(--cyan-neon)') }}>
                        {res.vif}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{safeNum(res.r_squared, 3)}</td>
                      <td>
                        <span className={`badge ${res.severity === 'high' ? 'badge-rose' : (res.severity === 'moderate' ? 'badge-amber' : 'badge-emerald')}`}>
                          {res.severity.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Requires at least 2 non-constant numeric columns.</p>
          )}
        </div>
      </div>

      {/* Time-Series Stationarity (ADF & KPSS Tests) */}
      {stationarityData && stationarityData.adf_test && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <TrendingUp size={20} color="var(--emerald-pulse)" />
              <h3>Time-Series Stationarity (ADF & KPSS Tests)</h3>
            </div>
            <span className={`badge ${stationarityData.verdict.includes('Stationary') && !stationarityData.verdict.includes('Non') ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
              {stationarityData.verdict}
            </span>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Evaluated on series <strong style={{ color: 'var(--cyan-neon)' }}>{stationarityData.value_column}</strong> (N={stationarityData.sample_size}): {stationarityData.recommendation}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {/* ADF Card */}
            <div style={{ background: 'var(--ks-paper-deep)', border: '1px solid var(--border-subtle)', padding: '1.2rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>AUGMENTED DICKEY-FULLER (ADF)</span>
                <span className={`badge ${stationarityData.adf_test.is_stationary ? 'badge-emerald' : 'badge-rose'}`}>
                  {stationarityData.adf_test.conclusion}
                </span>
              </div>
              <div style={{ marginTop: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                <div>ADF Statistic: <span style={{ color: 'var(--ks-ink)', fontWeight: 700 }}>{stationarityData.adf_test.statistic ?? 'N/A'}</span></div>
                <div>p-value: <span style={{ color: 'var(--ks-patina-deep)', fontWeight: 700 }}>{stationarityData.adf_test.p_value ?? 'N/A'}</span></div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Critical (5%): {stationarityData.adf_test.critical_values?.['5%'] ?? 'N/A'}
                </div>
              </div>
            </div>

            {/* KPSS Card */}
            <div style={{ background: 'var(--ks-paper-deep)', border: '1px solid var(--border-subtle)', padding: '1.2rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>KPSS TEST</span>
                <span className={`badge ${stationarityData.kpss_test.is_stationary ? 'badge-emerald' : 'badge-rose'}`}>
                  {stationarityData.kpss_test.conclusion}
                </span>
              </div>
              <div style={{ marginTop: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                <div>KPSS Statistic: <span style={{ color: 'var(--ks-ink)', fontWeight: 700 }}>{stationarityData.kpss_test.statistic ?? 'N/A'}</span></div>
                <div>p-value: <span style={{ color: 'var(--ks-patina-deep)', fontWeight: 700 }}>{stationarityData.kpss_test.p_value ?? 'N/A'}</span></div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Critical (5%): {stationarityData.kpss_test.critical_values?.['5%'] ?? 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Hypothesis Testing Suite */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <FlaskConical size={20} color="var(--purple-telemetry)" />
          <h3>Interactive Statistical Hypothesis Testing</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
              TEST TYPE
            </label>
            <select
              className="select-field"
              value={hypoTestType}
              onChange={(e) => setHypoTestType(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="two_sample_t_test">Two-Sample T-Test (Independent)</option>
              <option value="welch_t_test">Welch's T-Test (Unequal Variances)</option>
              <option value="mann_whitney">Mann-Whitney U Test (Non-Parametric)</option>
              <option value="one_way_anova">One-Way ANOVA (Grouped F-Test)</option>
              <option value="kruskal_wallis">Kruskal-Wallis H-Test</option>
              <option value="chi_square">Chi-Square Test (Independence)</option>
              <option value="levene_test">Levene's Test (Equality of Variances)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
              VARIABLE A
            </label>
            <select
              className="select-field"
              value={hypoColA}
              onChange={(e) => setHypoColA(e.target.value)}
              style={{ width: '100%' }}
            >
              {(summaryData?.column_summary || []).map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {!['one_way_anova', 'kruskal_wallis'].includes(hypoTestType) && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                VARIABLE B (OPTIONAL / COMPARISON)
              </label>
              <select
                className="select-field"
                value={hypoColB}
                onChange={(e) => setHypoColB(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- None (Use Group Col) --</option>
                {(summaryData?.column_summary || []).map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {['two_sample_t_test', 'welch_t_test', 'mann_whitney', 'one_way_anova', 'kruskal_wallis', 'levene_test'].includes(hypoTestType) && (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                GROUPING VARIABLE (CATEGORICAL)
              </label>
              <select
                className="select-field"
                value={hypoGroupCol}
                onChange={(e) => setHypoGroupCol(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- None --</option>
                {(summaryData?.column_summary || []).map((c) => (
                  <option key={c.name} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <button
              className="btn btn-primary"
              onClick={handleRunHypoTest}
              disabled={hypoLoading || !hypoColA}
              style={{ width: '100%', height: '40px' }}
            >
              {hypoLoading ? 'Testing...' : 'Execute Test ⚡'}
            </button>
          </div>
        </div>

        {hypoError && (
          <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(255, 23, 68, 0.15)', border: '1px solid var(--rose-alert)', borderRadius: 'var(--radius-sm)', color: 'var(--rose-alert)', fontSize: '0.85rem' }}>
            {hypoError}
          </div>
        )}

        {hypoResult && (
          <div style={{ marginTop: '1.25rem', padding: '1.2rem', background: 'var(--ks-paper-deep)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--ks-ink)', fontSize: '1rem' }}>
                {hypoResult.test_name}
              </div>
              <span className={`badge ${hypoResult.significant ? 'badge-rose' : 'badge-emerald'}`}>
                {hypoResult.significant ? 'REJECT NULL HYPOTHESIS (p < 0.05)' : 'FAIL TO REJECT (p >= 0.05)'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              <div>Statistic: <strong style={{ color: 'var(--ks-ink)' }}>{hypoResult.statistic ?? 'N/A'}</strong></div>
              <div>p-value: <strong style={{ color: 'var(--ks-patina-deep)' }}>{hypoResult.p_value ?? 'N/A'}</strong></div>
              {hypoResult.cramers_v !== undefined && <div>Cramér's V: <strong>{hypoResult.cramers_v}</strong></div>}
              {hypoResult.degrees_of_freedom !== undefined && <div>DOF: <strong>{hypoResult.degrees_of_freedom}</strong></div>}
            </div>

            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
              📌 <strong>Conclusion:</strong> {hypoResult.interpretation}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
