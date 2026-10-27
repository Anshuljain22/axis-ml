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
      {/* 1. Impeccable Kinpaku Light Hero Banner */}
      <div style={{
        borderRadius: '12px',
        border: '1px solid var(--border-subtle)',
        background: 'linear-gradient(135deg, var(--ks-paper-raised) 0%, var(--ks-paper-deep) 100%)',
        padding: '2.25rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--ks-lift-1)',
      }}>
        {/* Subtle background gradient radial */}
        <div style={{
          position: 'absolute',
          right: -80,
          top: -80,
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'rgba(197, 139, 36, 0.06)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }} />

        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.22rem 0.6rem',
            borderRadius: '4px',
            background: 'var(--ks-paper-deep)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ks-ink)',
            marginBottom: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}>
            <span className="pulse-dot pulse-dot-patina" style={{ width: 6, height: 6 }} />
            <span>Platform Online • Production Workspace</span>
          </div>

          <h1 style={{
            fontSize: '1.95rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: 'var(--ks-ink)',
            marginBottom: '0.5rem',
            fontFamily: 'var(--font-display)',
          }}>
            Neural Data Science & Machine Learning Intelligence
          </h1>
          <p style={{
            fontSize: '0.88rem',
            color: 'var(--ks-text-muted)',
            maxWidth: '680px',
            lineHeight: 1.55,
          }}>
            Explore telemetry diagnostics, configure automated pipelines without data leakage, compare model benchmarks in MLflow, and evaluate predictions in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.85rem', flexShrink: 0 }}>
          <button
            onClick={() => onNavigateTab('models')}
            className="btn btn-primary"
            style={{
              padding: '0.75rem 1.35rem',
              borderRadius: '8px',
              fontSize: '0.86rem',
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
              padding: '0.75rem 1.35rem',
              borderRadius: '8px',
              fontSize: '0.86rem',
            }}
          >
            <span>Inspect EDA Diagnostics</span>
          </button>
        </div>
      </div>

      {/* 2. Four Quick Action Studio Cards */}
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
                background: 'var(--ks-paper-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all var(--transition-normal)',
                position: 'relative',
                boxShadow: 'var(--ks-lift-1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--ks-kinpaku)';
                e.currentTarget.style.boxShadow = 'var(--ks-lift-2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.boxShadow = 'var(--ks-lift-1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: '8px',
                  background: 'var(--ks-paper-deep)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ks-kinpaku-rich)',
                }}>
                  <Icon size={18} />
                </div>
                <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>
                  {card.badge}
                </span>
              </div>

              <div style={{
                fontSize: '0.96rem',
                fontWeight: 700,
                color: 'var(--ks-ink)',
                marginBottom: '0.25rem',
              }}>
                {card.title}
              </div>
              <div style={{
                fontSize: '0.78rem',
                color: 'var(--ks-text-muted)',
                lineHeight: 1.45,
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
        gap: '1.25rem',
      }}>
        {/* Col 1: Active Datasets */}
        <div style={{
          background: 'var(--ks-paper-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '1.35rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--ks-lift-1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} color="var(--ks-kinpaku)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ks-ink)' }}>
                Active Datasets
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('datasets')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ks-kinpaku-rich)',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ks-ink)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ks-kinpaku-rich)'; }}
            >
              Catalog →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', flex: 1 }}>
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
                  padding: '0.75rem 0.85rem',
                  borderRadius: '6px',
                  background: activeDataset?.id === d.id ? 'var(--ks-kinpaku-pale)' : 'var(--ks-paper-deep)',
                  border: `1px solid ${activeDataset?.id === d.id ? 'var(--ks-kinpaku-border)' : 'var(--border-subtle)'}`,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ks-kinpaku)'; }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = activeDataset?.id === d.id
                    ? 'var(--ks-kinpaku-border)'
                    : 'var(--border-subtle)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <FileSpreadsheet size={16} color="var(--ks-text-muted)" />
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--ks-ink)' }}>
                      {d.name}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--ks-text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {d.row_count || 150} observations • {d.column_count || 9} dimensions
                    </div>
                  </div>
                </div>
                <div className="badge badge-patina" style={{ fontSize: '0.66rem', padding: '0.15rem 0.4rem' }}>
                  Validated
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 2: Model Performance & Convergence Graph */}
        <div style={{
          background: 'var(--ks-paper-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '1.35rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--ks-lift-1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.85rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp size={16} color="var(--ks-kinpaku)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ks-ink)' }}>
                Benchmark Metrics & Convergence
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('leaderboard')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ks-kinpaku-rich)',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ks-ink)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ks-kinpaku-rich)'; }}
            >
              Leaderboard →
            </button>
          </div>

          {/* Metric Tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <div style={{
              background: 'var(--ks-paper-deep)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '0.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ks-ink)', fontFamily: 'var(--font-mono)' }}>
                0.941
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--ks-text-muted)' }}>ROC-AUC</div>
            </div>
            <div style={{
              background: 'var(--ks-kinpaku-pale)',
              border: '1px solid var(--ks-kinpaku-border)',
              borderRadius: '6px',
              padding: '0.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ks-kinpaku-deep)', fontFamily: 'var(--font-mono)' }}>
                96.4%
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--ks-kinpaku-deep)' }}>Accuracy</div>
            </div>
            <div style={{
              background: 'var(--ks-paper-deep)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '0.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ks-ink)', fontFamily: 'var(--font-mono)' }}>
                0.042
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--ks-text-muted)' }}>MAE</div>
            </div>
            <div style={{
              background: 'var(--ks-patina-pale)',
              border: '1px solid var(--ks-patina-border)',
              borderRadius: '6px',
              padding: '0.5rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ks-patina-deep)', fontFamily: 'var(--font-mono)' }}>
                1.14ms
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--ks-patina-deep)' }}>Latency</div>
            </div>
          </div>

          {/* SVG Convergence Curve */}
          <div style={{ flex: 1, minHeight: '110px', position: 'relative', background: 'var(--ks-paper-deep)', borderRadius: '8px', padding: '0.5rem', border: '1px solid var(--border-subtle)' }}>
            <svg viewBox="0 0 400 110" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <line x1="10" y1="20" x2="390" y2="20" stroke="rgba(25,24,23,0.06)" strokeDasharray="3 3" />
              <line x1="10" y1="55" x2="390" y2="55" stroke="rgba(25,24,23,0.06)" strokeDasharray="3 3" />
              <line x1="10" y1="90" x2="390" y2="90" stroke="rgba(25,24,23,0.06)" strokeDasharray="3 3" />

              <path
                d="M 10 95 Q 80 75, 140 45 T 260 25 T 390 14"
                fill="none"
                stroke="var(--ks-kinpaku)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M 10 98 Q 80 82, 140 55 T 260 35 T 390 24"
                fill="none"
                stroke="var(--ks-patina)"
                strokeWidth="1.8"
                strokeDasharray="4 2"
                strokeLinecap="round"
              />

              <circle cx="390" cy="14" r="4" fill="var(--ks-kinpaku)" stroke="var(--ks-paper-raised)" strokeWidth="1.5" />
              <circle cx="390" cy="24" r="3.5" fill="var(--ks-patina)" />
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ks-kinpaku-deep)', fontWeight: 600 }}>
                <span style={{ width: 8, height: 2, background: 'var(--ks-kinpaku)' }} /> Train Loss
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ks-patina-deep)', fontWeight: 600 }}>
                <span style={{ width: 8, height: 2, background: 'var(--ks-patina)', borderTop: '1px dashed' }} /> Validation
              </span>
            </div>
          </div>
        </div>

        {/* Col 3: Model Zoo Registry */}
        <div style={{
          background: 'var(--ks-paper-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '1.35rem',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--ks-lift-1)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FlaskConical size={16} color="var(--ks-kinpaku)" />
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--ks-ink)' }}>
                Model Zoo Registry
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('leaderboard')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ks-kinpaku-rich)',
                fontSize: '0.74rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ks-ink)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ks-kinpaku-rich)'; }}
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
                  padding: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  background: 'var(--ks-paper-deep)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--ks-ink)' }}>
                    {exp.name}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--ks-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {exp.model}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ks-ink)', fontWeight: 700 }}>
                    {exp.score}
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--ks-patina-deep)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
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
