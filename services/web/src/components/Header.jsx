import React from 'react';
import { 
  Database, 
  TableProperties, 
  Activity, 
  Sliders, 
  Cpu, 
  Trophy, 
  Zap, 
  ExternalLink,
  Server,
  Gamepad2,
  Sparkles
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  activeDataset, 
  datasets = [], 
  setActiveDatasetId,
  systemHealth,
  theme,
  setTheme
}) {
  const tabs = [
    { id: 'datasets', label: 'Datasets', icon: Database, badge: datasets.length },
    { id: 'datalab', label: 'Data Lab', icon: TableProperties, disabled: !activeDataset },
    { id: 'eda', label: 'EDA Studio', icon: Activity, disabled: !activeDataset },
    { id: 'cleaning', label: 'Cleaning & Pipeline', icon: Sliders, disabled: !activeDataset },
    { id: 'models', label: 'Model Studio', icon: Cpu, disabled: !activeDataset },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, disabled: !activeDataset },
    { id: 'inference', label: 'Inference Cockpit', icon: Zap },
  ];

  const isPixel = theme === 'pixel';

  return (
    <>
      {/* Top Checkered Racing Strip */}
      <div className="pixel-checkered-strip" />

      <header style={{
        background: isPixel ? '#0a0f1a' : 'rgba(10, 14, 23, 0.92)',
        backdropFilter: isPixel ? 'none' : 'blur(16px)',
        borderBottom: isPixel ? '3px solid #000' : '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '0.65rem 1.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}>
        {/* Top Brand Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: isPixel ? 0 : 'var(--radius-sm)',
              background: 'linear-gradient(135deg, var(--orange-racing), var(--cyan-neon))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: isPixel ? '0.9rem' : '1.1rem',
              color: '#050912',
              border: isPixel ? '2px solid #000' : 'none',
              boxShadow: isPixel ? '3px 3px 0px #000' : '0 0 16px rgba(255, 87, 34, 0.45)',
              fontFamily: isPixel ? "'Press Start 2P', monospace" : 'var(--font-display)',
            }}>
              PW
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ 
                  fontFamily: isPixel ? "'Press Start 2P', monospace" : 'var(--font-display)', 
                  fontSize: isPixel ? '0.95rem' : '1.25rem', 
                  fontWeight: 800, 
                  letterSpacing: isPixel ? '0.08em' : '0.04em',
                  color: isPixel ? '#00f0ff' : 'var(--text-primary)',
                  textShadow: isPixel ? '2px 2px 0px #000, 0 0 10px rgba(0, 240, 255, 0.6)' : 'none',
                }}>
                  PITWALL OS
                </span>
                <span className="badge badge-orange" style={{ fontSize: isPixel ? '0.5rem' : '0.65rem' }}>
                  {isPixel ? '16-BIT F1' : 'CORE v1.0'}
                </span>
              </div>
              <div style={{ 
                fontSize: isPixel ? '0.85rem' : '0.75rem', 
                color: 'var(--text-secondary)', 
                fontFamily: isPixel ? "'VT323', monospace" : 'var(--font-sans)',
                letterSpacing: isPixel ? '0.05em' : '0.02em' 
              }}>
                {isPixel ? '★ RETRO F1 GRAND PRIX TELEMETRY & ML RACE CONTROL ★' : 'High-Precision ML Engineering & Telemetry Workbench'}
              </div>
            </div>
          </div>

          {/* Global Telemetry Controls & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Theme Toggle Button */}
            <button
              className="btn btn-secondary"
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: isPixel ? '0.6rem' : '0.75rem',
                border: isPixel ? '2px solid #ffd700' : '1px solid var(--border-subtle)',
                color: isPixel ? '#ffd700' : 'var(--cyan-neon)',
              }}
              onClick={() => setTheme(isPixel ? 'cyber' : 'pixel')}
              title="Toggle Retro Pixel F1 vs Cyber Workbench theme"
            >
              <Gamepad2 size={14} />
              <span>{isPixel ? 'THEME: PIXEL F1 🕹️' : 'THEME: CYBER 🏎️'}</span>
            </button>

            {/* Active Dataset Selector Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                DATASET:
              </span>
              <select
                className="form-select"
                style={{ 
                  padding: '0.35rem 0.75rem', 
                  fontSize: isPixel ? '0.95rem' : '0.8rem', 
                  minWidth: 190,
                  borderColor: activeDataset ? 'var(--cyan-neon)' : 'var(--border-subtle)',
                  background: 'rgba(18, 26, 42, 0.9)',
                  color: activeDataset ? 'var(--cyan-neon)' : 'var(--text-secondary)'
                }}
                value={activeDataset ? activeDataset.id : ''}
                onChange={(e) => setActiveDatasetId(e.target.value)}
              >
                <option value="" disabled>Select dataset...</option>
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.row_count} rows)
                  </option>
                ))}
              </select>
            </div>

            {/* MLflow Link */}
            <a
              href="http://localhost:5000"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: isPixel ? '0.6rem' : '0.75rem', gap: '0.35rem' }}
              title="Open MLflow Tracking UI"
            >
              <Server size={14} color="var(--purple-telemetry)" />
              <span>MLFLOW</span>
              <ExternalLink size={12} />
            </a>

            {/* Backend Status Pill */}
            <div className="badge badge-emerald" style={{ padding: '0.35rem 0.65rem', gap: '0.45rem' }}>
              <span className="pulse-dot pulse-dot-emerald" />
              <span>API {systemHealth ? 'ONLINE' : 'LINKING...'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          overflowX: 'auto',
          borderTop: isPixel ? '2px solid #000' : '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '0.5rem',
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = tab.disabled;

            return (
              <button
                key={tab.id}
                disabled={isDisabled}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: isPixel ? '0.4rem 0.75rem' : '0.5rem 1rem',
                  borderRadius: isPixel ? 0 : 'var(--radius-sm)',
                  background: isActive 
                    ? (isPixel ? '#00f0ff' : 'rgba(0, 229, 255, 0.12)') 
                    : 'transparent',
                  border: isPixel 
                    ? (isActive ? '2px solid #000' : '2px solid transparent') 
                    : (isActive ? '1px solid rgba(0, 229, 255, 0.4)' : '1px solid transparent'),
                  color: isActive 
                    ? (isPixel ? '#000' : 'var(--cyan-neon)') 
                    : isDisabled 
                      ? 'var(--text-dim)' 
                      : 'var(--text-secondary)',
                  fontSize: isPixel ? '0.65rem' : '0.85rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition-fast)',
                  boxShadow: isPixel && isActive ? '3px 3px 0px #000' : 'none',
                  whiteSpace: 'nowrap',
                  fontFamily: isPixel ? "'Silkscreen', monospace" : 'var(--font-sans)',
                  textTransform: isPixel ? 'uppercase' : 'none',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span style={{
                    background: isActive ? (isPixel ? '#000' : 'var(--cyan-neon)') : 'rgba(255, 255, 255, 0.1)',
                    color: isActive ? (isPixel ? '#00f0ff' : '#050912') : 'var(--text-muted)',
                    borderRadius: isPixel ? 0 : 10,
                    fontSize: isPixel ? '0.55rem' : '0.7rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.4rem',
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>
    </>
  );
}
