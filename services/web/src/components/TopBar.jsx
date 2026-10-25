import React from 'react';
import {
  Search,
  Bell,
  ExternalLink,
  Database,
  LogOut,
} from 'lucide-react';

export default function TopBar({
  activeDataset,
  datasets = [],
  setActiveDatasetId,
  systemHealth = true,
  currentUser = 'Scientist',
  onSignOut,
}) {
  return (
    <header style={{
      height: '60px',
      borderBottom: '1px solid var(--border-subtle)',
      background: 'rgba(9, 10, 15, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      {/* Search Input Box */}
      <div style={{
        position: 'relative',
        width: '360px',
        maxWidth: '45%',
      }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: '0.85rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
        <input
          type="text"
          placeholder="Search models, datasets, metrics..."
          style={{
            width: '100%',
            padding: '0.5rem 3.5rem 0.5rem 2.3rem',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            color: '#f8fafc',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            transition: 'border-color var(--transition-fast)',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
        />
        <span style={{
          position: 'absolute',
          right: '0.65rem',
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: '0.62rem',
          fontFamily: 'var(--font-mono)',
          padding: '0.12rem 0.35rem',
          borderRadius: '4px',
          background: 'rgba(255, 255, 255, 0.06)',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
        }}>
          ⌘K
        </span>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Active Dataset Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={14} color="#94a3b8" />
          <select
            value={activeDataset?.id || ''}
            onChange={(e) => setActiveDatasetId(e.target.value)}
            style={{
              padding: '0.4rem 0.65rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: '#f8fafc',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '240px',
            }}
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id} style={{ background: '#0e1015' }}>
                {d.name} ({d.rows ?? d.row_count ?? 0} rows)
              </option>
            ))}
          </select>
        </div>

        {/* MLflow Link */}
        <a
          href="http://localhost:5000"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.03)',
            color: 'var(--text-secondary)',
            fontSize: '0.76rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f8fafc';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          <span>MLFLOW</span>
          <ExternalLink size={11} />
        </a>

        {/* System Online Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.72rem',
          fontFamily: 'var(--font-mono)',
          color: systemHealth ? 'var(--mint-sage)' : 'var(--rose-alert)',
          padding: '0.3rem 0.55rem',
          borderRadius: '6px',
          background: systemHealth ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
          border: `1px solid ${systemHealth ? 'rgba(16, 185, 129, 0.25)' : 'rgba(244, 63, 94, 0.25)'}`,
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: systemHealth ? 'var(--mint-sage)' : 'var(--rose-alert)',
          }} />
          <span>{systemHealth ? 'API ONLINE' : 'OFFLINE'}</span>
        </div>

        {/* User Profile Avatar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.2rem 0.5rem',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: '#090a0f',
          }}>
            {currentUser?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#f8fafc',
          }}>
            {currentUser}
          </span>
        </div>

        {/* Sign Out Button */}
        {onSignOut && (
          <button
            onClick={onSignOut}
            title="Sign Out to Authorization Page"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.35rem',
              borderRadius: '6px',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f8fafc'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
