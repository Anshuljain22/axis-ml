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
  Info
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedHistCol, setSelectedHistCol] = useState('');
  const [selectedTimeCol, setSelectedTimeCol] = useState('');

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
    ])
      .then(([summary, stats, dist, corr, ts]) => {
        if (!isMounted) return;
        setSummaryData(summary);
        setStatsData(stats);
        setDistData(dist);
        setCorrData(corr);
        setTimeSeriesData(ts);

        const distCols = Object.keys(dist?.distributions || {});
        if (distCols.length > 0) {
          setSelectedHistCol(distCols[0]);
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
  const histLabels = currentDist?.bins?.slice(0, -1).map((b, i) => {
    const nextVal = currentDist.bins ? currentDist.bins[i + 1] : null;
    return `${safeNum(b, 1)} - ${safeNum(nextVal, 1)}`;
  }) || [];
  const histCounts = currentDist?.counts || [];

  const chartData = {
    labels: histLabels,
    datasets: [
      {
        label: `Frequency of ${selectedHistCol}`,
        data: histCounts,
        backgroundColor: 'rgba(0, 229, 255, 0.65)',
        borderColor: '#00e5ff',
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(255, 87, 34, 0.85)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(14, 20, 32, 0.95)',
        titleColor: '#00e5ff',
        bodyColor: '#f3f6fc',
        borderColor: 'rgba(0, 229, 255, 0.3)',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#8c9ba5', font: { family: 'JetBrains Mono', size: 10 } },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#8c9ba5', font: { family: 'JetBrains Mono', size: 10 } },
      },
    },
  };

  // Helper for correlation color scale
  const getCorrStyle = (val) => {
    if (val === null || val === undefined || isNaN(val)) {
      return { background: 'rgba(255, 255, 255, 0.03)', color: 'var(--text-muted)' };
    }
    const r = Math.min(1, Math.max(-1, val));
    if (r > 0.8) return { background: 'rgba(0, 229, 255, 0.35)', color: '#00e5ff', fontWeight: 700 };
    if (r > 0.4) return { background: 'rgba(0, 229, 255, 0.15)', color: '#e0f7fa' };
    if (r < -0.8) return { background: 'rgba(255, 87, 34, 0.35)', color: '#ff5722', fontWeight: 700 };
    if (r < -0.4) return { background: 'rgba(255, 87, 34, 0.15)', color: '#ffebee' };
    return { background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-secondary)' };
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
            <div style={{ background: 'rgba(14, 20, 32, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                INFERRED CADENCE / FREQUENCY
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--cyan-neon)', fontFamily: 'var(--font-display)', marginTop: '0.2rem' }}>
                {timeSeriesData.inferred_frequency || 'Regular / Hourly (1h)'}
              </div>
            </div>

            <div style={{ background: 'rgba(14, 20, 32, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                TEMPORAL GAPS DETECTED
              </div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 800, 
                color: (timeSeriesData.gap_count || 0) > 0 ? 'var(--amber-warn)' : 'var(--emerald-pulse)', 
                fontFamily: 'var(--font-display)', 
                marginTop: '0.2rem' 
              }}>
                {timeSeriesData.gap_count ?? 0}
              </div>
            </div>

            <div style={{ background: 'rgba(14, 20, 32, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
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
    </div>
  );
}
