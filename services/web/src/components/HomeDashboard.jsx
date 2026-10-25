import React from 'react';
import {
  Database,
  BarChart2,
  Cpu,
  Rocket,
  ChevronRight,
  TrendingUp,
  FlaskConical,
  Zap,
  Activity,
  CheckCircle,
  FileSpreadsheet,
  ArrowRight,
  Layers,
} from 'lucide-react';

export default function HomeDashboard({
  datasets = [],
  activeDataset,
  setActiveDatasetId,
  onNavigateTab,
}) {
  const actionCards = [
    {
      id: 'datasets',
      title: 'Datasets & Ingestion',
      desc: 'Active registry & CSV ingestion',
      icon: Database,
      tab: 'datasets',
      badge: '2 READY',
    },
    {
      id: 'eda',
      title: 'EDA Studio',
      desc: 'Distributions, VIF & normality tests',
      icon: BarChart2,
      tab: 'eda',
      badge: '9 FEATURES',
    },
    {
      id: 'models',
      title: 'Model Training',
      desc: 'Ensembles, neural nets & validation',
      icon: Cpu,
      tab: 'models',
      badge: 'MLFLOW ACTIVE',
    },
    {
      id: 'inference',
      title: 'Deploy & Predict',
      desc: 'Real-time single & batch inference',
      icon: Rocket,
      tab: 'inference',
      badge: 'P99: 1.18ms',
    },
  ];

  const experiments = [
    { name: 'Gradient Boosting', model: 'GBoost', status: 'Champion', score: 'ROC: 0.982' },
    { name: 'Random Forest', model: 'RandomForest', status: 'Validated', score: 'Acc: 94.8%' },
    { name: 'Ridge Regression', model: 'Ridge (L2)', status: 'Active', score: 'MAE: 0.076' },
    { name: 'Neural Net (MLP)', model: 'MLPClassifier', status: 'Converged', score: 'Loss: 0.028' },
    { name: 'Isolation Forest', model: 'Outlier Lab', status: 'Profiled', score: 'Outliers: 7' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.75rem' }}>
      {/* 1. Minimalist Obsidian Hero Banner */}
      <div style={{
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%), var(--bg-surface)',
        padding: '2rem 2.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle background gradient radial */}
        <div style={{
          position: 'absolute',
          right: -100,
          top: -100,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.03)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }} />

        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            color: '#f8fafc',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint-sage)' }} />
            <span>Platform Online • Production Workspace</span>
          </div>

          <h1 style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#f8fafc',
            marginBottom: '0.45rem',
            fontFamily: 'var(--font-display)',
          }}>
            Neural Data Science & Machine Learning Intelligence
          </h1>
          <p style={{
            fontSize: '0.86rem',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            lineHeight: 1.5,
          }}>
            Explore telemetry diagnostics, configure automated pipelines without data leakage, compare model benchmarks in MLflow, and evaluate predictions in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
          <button
            onClick={() => onNavigateTab('models')}
            className="btn btn-primary"
            style={{
              padding: '0.7rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>Launch Training Run</span>
            <ArrowRight size={15} />
          </button>
          <button
            onClick={() => onNavigateTab('eda')}
            className="btn btn-secondary"
            style={{
              padding: '0.7rem 1.25rem',
              borderRadius: '8px',
              fontSize: '0.84rem',
            }}
          >
            <span>Inspect EDA Diagnostics</span>
          </button>
        </div>
      </div>

      {/* 2. Four Minimalist Quick Action Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1rem',
      }}>
        {actionCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => onNavigateTab(card.tab)}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '1.2rem',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background = 'var(--bg-surface)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f8fafc',
                }}>
                  <Icon size={18} />
                </div>
                <span style={{
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-subtle)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '4px',
                }}>
                  {card.badge}
                </span>
              </div>

              <div style={{
                fontSize: '0.94rem',
                fontWeight: 700,
                color: '#f8fafc',
                marginBottom: '0.25rem',
              }}>
                {card.title}
              </div>
              <div style={{
                fontSize: '0.76rem',
                color: 'var(--text-muted)',
                lineHeight: 1.4,
              }}>
                {card.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Three-Column Minimalist Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.25fr 1fr',
        gap: '1rem',
      }}>
        {/* Col 1: Active Datasets */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} color="#94a3b8" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                Active Datasets
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('datasets')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Catalog →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
            {datasets.map((d) => (
              <div
                key={d.id}
                onClick={() => {
                  setActiveDatasetId(d.id);
                  onNavigateTab('datalab');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.7rem 0.85rem',
                  borderRadius: '6px',
                  background: activeDataset?.id === d.id ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.015)',
                  border: `1px solid ${activeDataset?.id === d.id ? 'rgba(255, 255, 255, 0.2)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = activeDataset?.id === d.id
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileSpreadsheet size={16} color="var(--text-muted)" />
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {d.row_count || 150} observations • {d.column_count || 9} dimensions
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: '0.66rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--mint-sage)',
                  padding: '0.15rem 0.4rem',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.1)',
                }}>
                  Validated
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 2: Model Performance & Convergence Graph */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} color="#94a3b8" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                Benchmark Metrics & Convergence
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('leaderboard')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Leaderboard →
            </button>
          </div>

          {/* Metric Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '0.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                0.941
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>ROC-AUC</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '0.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                96.4%
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Accuracy</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '0.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                0.042
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>MAE</div>
            </div>
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '0.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                1.14ms
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Latency</div>
            </div>
          </div>

          {/* SVG Convergence Curve */}
          <div style={{ flex: 1, minHeight: '110px', position: 'relative' }}>
            <svg viewBox="0 0 400 110" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <line x1="10" y1="20" x2="390" y2="20" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <line x1="10" y1="55" x2="390" y2="55" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
              <line x1="10" y1="90" x2="390" y2="90" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />

              <path
                d="M 10 95 Q 80 75, 140 45 T 260 25 T 390 14"
                fill="none"
                stroke="#f8fafc"
                strokeWidth="2"
              />
              <path
                d="M 10 98 Q 80 82, 140 55 T 260 35 T 390 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              <circle cx="390" cy="14" r="3.5" fill="#f8fafc" />
              <circle cx="390" cy="24" r="3" fill="#64748b" />
            </svg>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '1rem',
              fontSize: '0.66rem',
              fontFamily: 'var(--font-mono)',
              marginTop: '4px',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f8fafc' }}>
                <span style={{ width: 8, height: 2, background: '#f8fafc' }} /> Train Loss
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                <span style={{ width: 8, height: 2, background: '#64748b', borderTop: '1px dashed' }} /> Validation
              </span>
            </div>
          </div>
        </div>

        {/* Col 3: Model Zoo Registry */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FlaskConical size={16} color="#94a3b8" />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f8fafc' }}>
                Model Zoo Registry
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('leaderboard')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              Runs →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', flex: 1 }}>
            {experiments.map((exp, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
                    {exp.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {exp.model}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: '#f8fafc', fontWeight: 600 }}>
                    {exp.score}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--mint-sage)', fontFamily: 'var(--font-mono)' }}>
                    {exp.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
