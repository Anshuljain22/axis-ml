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
      background: 'rgba(251, 251, 250, 0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.75rem',
      position: 'sticky',
      top: 0,
      zIndex: 30,
      boxShadow: '0 1px 2px rgba(25, 24, 23, 0.02)',
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
            color: 'var(--ks-text-faint)',
          }}
        />
        <input
          type="text"
          placeholder="Search models, datasets, metrics..."
          style={{
            width: '100%',
            padding: '0.45rem 3.5rem 0.45rem 2.3rem',
            background: 'var(--ks-paper-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '6px',
            color: 'var(--ks-ink)',
            fontSize: '0.82rem',
            fontFamily: 'var(--font-sans)',
            outline: 'none',
            transition: 'all var(--transition-fast)',
            boxShadow: 'var(--ks-track-recess)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--ks-kinpaku)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(197, 139, 36, 0.12)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
            e.currentTarget.style.boxShadow = 'var(--ks-track-recess)';
          }}
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
          background: 'var(--ks-paper-deep)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--ks-text-muted)',
          pointerEvents: 'none',
          fontWeight: 600,
        }}>
          ⌘K
        </span>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Active Dataset Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={14} color="var(--ks-kinpaku-rich)" />
          <select
            value={activeDataset?.id || ''}
            onChange={(e) => setActiveDatasetId(e.target.value)}
            style={{
              padding: '0.38rem 0.65rem',
              background: 'var(--ks-paper-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--ks-ink)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              outline: 'none',
              cursor: 'pointer',
              maxWidth: '240px',
              boxShadow: 'var(--ks-cap-lift)',
            }}
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
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
          className="btn btn-secondary"
          style={{
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <span>MLFLOW</span>
          <ExternalLink size={11} />
        </a>

        {/* System Online Badge */}
        <div className={`badge ${systemHealth ? 'badge-patina' : 'badge-vermilion'}`} style={{ padding: '0.32rem 0.6rem' }}>
          <span className={`pulse-dot ${systemHealth ? 'pulse-dot-patina' : ''}`} style={{ width: 6, height: 6 }} />
          <span>{systemHealth ? 'API ONLINE' : 'OFFLINE'}</span>
        </div>

        {/* User Profile Avatar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.2rem 0.55rem',
          borderRadius: '20px',
          background: 'var(--ks-paper-raised)',
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--ks-cap-lift)',
        }}>
          <div style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: 'var(--ks-ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.72rem',
            fontWeight: 800,
            color: 'var(--ks-paper)',
          }}>
            {currentUser?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: 'var(--ks-ink)',
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
              color: 'var(--ks-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.35rem',
              borderRadius: '6px',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ks-ink)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ks-text-muted)'; }}
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
