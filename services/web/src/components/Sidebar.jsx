import React from 'react';
import {
  Home,
  Database,
  Table,
  BarChart2,
  SlidersHorizontal,
  Cpu,
  FlaskConical,
  Layers,
  Rocket,
  LogOut,
  Shield,
  Activity,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  datasetsCount = 0,
  currentUser = 'Scientist',
  onSignOut,
}) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'datasets', label: 'Datasets', icon: Database, badge: datasetsCount > 0 ? datasetsCount : null },
    { id: 'datalab', label: 'Data Lab', icon: Table },
    { id: 'eda', label: 'EDA Studio', icon: BarChart2 },
    { id: 'cleaning', label: 'Preprocessing', icon: SlidersHorizontal },
    { id: 'models', label: 'Model Training', icon: Cpu },
    { id: 'leaderboard', label: 'Experiments', icon: FlaskConical },
    { id: 'unsupervised', label: 'Unsupervised', icon: Layers },
    { id: 'inference', label: 'Deploy & Predict', icon: Rocket },
  ];

  return (
    <aside style={{
      width: '240px',
      minWidth: '240px',
      background: 'var(--bg-sidebar)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      position: 'sticky',
      top: 0,
      padding: '1.25rem 0.85rem',
      zIndex: 40,
    }}>
      {/* Brand Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.25rem 0.5rem 1.25rem 0.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '1rem',
      }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '8px',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 0 16px rgba(255, 255, 255, 0.12)',
        }}>
          <div style={{
            width: 12,
            height: 12,
            borderRadius: '2px',
            background: '#090a0f',
            transform: 'rotate(45deg)',
          }} />
        </div>
        <div>
          <div style={{
            fontSize: '1.15rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            color: '#f8fafc',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}>
            AXIS ML
          </div>
          <div style={{
            fontSize: '0.62rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginTop: '2px',
          }}>
            Data Science & AI
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                background: isActive
                  ? 'rgba(255, 255, 255, 0.08)'
                  : 'transparent',
                color: isActive ? '#f8fafc' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.86rem',
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-fast)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  e.currentTarget.style.color = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: '25%',
                  bottom: '25%',
                  width: '3px',
                  borderRadius: '0 3px 3px 0',
                  background: '#f8fafc',
                }} />
              )}
              <Icon
                size={17}
                color={isActive ? '#f8fafc' : 'var(--text-muted)'}
                style={{ flexShrink: 0 }}
              />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-mono)',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#f8fafc',
                  fontWeight: 700,
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Session Card & Sign Out Button */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
      }}>
        <div style={{
          padding: '0.65rem 0.75rem',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f8fafc' }}>
              {currentUser}
            </span>
            <span style={{
              fontSize: '0.62rem',
              fontFamily: 'var(--font-mono)',
              padding: '0.1rem 0.4rem',
              borderRadius: '4px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: 'var(--mint-sage)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}>
              Active
            </span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Workspace: Production
          </div>
        </div>

        {onSignOut && (
          <button
            onClick={onSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              borderRadius: '6px',
              background: 'transparent',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '0.76rem',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f8fafc';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <LogOut size={13} />
            <span>Sign Out to Auth Page</span>
          </button>
        )}
      </div>
    </aside>
  );
}
