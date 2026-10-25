import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Zap,
  ArrowRight,
  Shield,
  Layers,
  Cpu,
  TrendingUp,
  Activity,
  CheckCircle2,
  Database,
  Eye,
  EyeOff,
  Sparkles,
} from 'lucide-react';

const MODEL_PREVIEWS = {
  gboost: {
    id: 'gboost',
    name: 'Gradient Boosting Ensemble',
    shortName: 'Gradient Boosting',
    tag: 'CHAMPION MODEL',
    task: 'Binary Classification & Probability',
    accuracy: '96.4%',
    primaryMetric: 'ROC-AUC: 0.982',
    f1Score: '0.963',
    latency: '1.14 ms',
    hyperparams: [
      { key: 'n_estimators', val: '120' },
      { key: 'learning_rate', val: '0.05' },
      { key: 'max_depth', val: '6' },
      { key: 'subsample', val: '0.85' },
    ],
    confusion: { tp: 72, fp: 2, fn: 3, tn: 73 },
    lossCurve: 'M 20 85 Q 80 65, 140 40 T 260 22 T 380 14',
    valCurve: 'M 20 90 Q 80 72, 140 48 T 260 30 T 380 22',
  },
  rf: {
    id: 'rf',
    name: 'Random Forest Classifier',
    shortName: 'Random Forest',
    tag: 'BAGGING ENSEMBLE',
    task: 'Multi-Tree Bagging',
    accuracy: '94.8%',
    primaryMetric: 'Accuracy: 94.8%',
    f1Score: '0.946',
    latency: '1.42 ms',
    hyperparams: [
      { key: 'n_estimators', val: '100' },
      { key: 'max_depth', val: '10' },
      { key: 'min_samples_split', val: '4' },
      { key: 'criterion', val: 'gini' },
    ],
    confusion: { tp: 70, fp: 4, fn: 4, tn: 72 },
    lossCurve: 'M 20 88 Q 80 70, 140 45 T 260 28 T 380 19',
    valCurve: 'M 20 92 Q 80 75, 140 52 T 260 36 T 380 28',
  },
  mlp: {
    id: 'mlp',
    name: 'Deep Neural Net (MLP)',
    shortName: 'Neural Net (MLP)',
    tag: 'DEEP ARCHITECTURE',
    task: 'Nonlinear Latent Projection',
    accuracy: '93.2%',
    primaryMetric: 'Cross-Entropy: 0.048',
    f1Score: '0.931',
    latency: '2.05 ms',
    hyperparams: [
      { key: 'hidden_layers', val: '(64, 32)' },
      { key: 'activation', val: 'relu' },
      { key: 'optimizer', val: 'adam' },
      { key: 'early_stopping', val: 'false' },
    ],
    confusion: { tp: 68, fp: 5, fn: 5, tn: 72 },
    lossCurve: 'M 20 95 Q 80 60, 140 32 T 260 18 T 380 12',
    valCurve: 'M 20 95 Q 80 68, 140 42 T 260 26 T 380 20',
  },
  ridge: {
    id: 'ridge',
    name: 'Ridge Regularized L2',
    shortName: 'Ridge Regression',
    tag: 'LINEAR L2',
    task: 'Continuous Target Estimation',
    accuracy: 'R²: 0.887',
    primaryMetric: 'MAE: 0.076',
    f1Score: 'RMSE: 0.128',
    latency: '0.45 ms',
    hyperparams: [
      { key: 'alpha (L2)', val: '1.0' },
      { key: 'solver', val: 'auto' },
      { key: 'fit_intercept', val: 'true' },
      { key: 'normalize', val: 'z-score' },
    ],
    confusion: { tp: 66, fp: 6, fn: 7, tn: 71 },
    lossCurve: 'M 20 80 Q 80 68, 140 50 T 260 38 T 380 32',
    valCurve: 'M 20 85 Q 80 72, 140 56 T 260 44 T 380 39',
  },
};

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('scientist@axis.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [workspace, setWorkspace] = useState('production');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gboost');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const model = MODEL_PREVIEWS[selectedModel];

  const handleCredentialsSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess({
      user: email.split('@')[0] || 'Scientist',
      role: workspace,
      authType: 'credentials',
    });
  };

  const handleGuestDemo = () => {
    onLoginSuccess({
      user: 'Guest Scientist',
      role: 'demo-full-access',
      authType: 'guest',
    });
  };

  const handleSimulateInference = () => {
    setIsSimulating(true);
    setSimResult(null);
    setTimeout(() => {
      setIsSimulating(false);
      setSimResult({
        prediction: selectedModel === 'ridge' ? 'Power: 48.24 MW' : 'CLASS_1 (OPTIMAL_OPERATION)',
        confidence: '99.42%',
        latency: model.latency,
      });
    }, 450);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden',
    }}>
      {/* LEFT COLUMN: Minimalist Login & Authentication Form */}
      <div style={{
        flex: '0 0 46%',
        minWidth: '420px',
        maxWidth: '560px',
        padding: '3rem 3.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        zIndex: 10,
        position: 'relative',
      }}>
        {/* Subtle top ambient glow */}
        <div style={{
          position: 'absolute',
          top: -80,
          left: -80,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.03)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />

        {/* Brand Mark */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '8px',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.15)',
            }}>
              <div style={{
                width: 14,
                height: 14,
                borderRadius: '3px',
                background: '#090a0f',
                transform: 'rotate(45deg)',
              }} />
            </div>
            <div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                fontFamily: 'var(--font-display)',
                color: '#f8fafc',
              }}>
                AXIS ML
              </div>
              <div style={{
                fontSize: '0.62rem',
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
              }}>
                Neural Data Science & AI Workbench
              </div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: '#f8fafc',
              marginBottom: '0.5rem',
            }}>
              Authenticate to Platform
            </h1>
            <p style={{
              fontSize: '0.85rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}>
              Sign in with institutional credentials or launch an instant guest session to explore the active models and telemetry pipelines.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {/* Email Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-mono)',
              }}>
                Work Email / Username
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.9rem 0.7rem 2.5rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.06)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontFamily: 'var(--font-mono)',
                }}>
                  Password
                </label>
                <a href="#reset" style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
                  Forgot?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.7rem 2.5rem 0.7rem 2.5rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    outline: 'none',
                    transition: 'all var(--transition-fast)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.35)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.06)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.8rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Target Environment / Workspace Selector */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-mono)',
              }}>
                Target Workspace
              </label>
              <select
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '0.84rem',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="production" style={{ background: '#12151c' }}>
                  Production Workbench (Verified Telemetry & Champion Runs)
                </option>
                <option value="research" style={{ background: '#12151c' }}>
                  Research & Unsupervised Anomaly Lab
                </option>
                <option value="staging" style={{ background: '#12151c' }}>
                  Inference & Telemetry Staging Zone
                </option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn"
              style={{
                marginTop: '0.5rem',
                background: '#f8fafc',
                color: '#090a0f',
                fontWeight: 700,
                fontSize: '0.88rem',
                padding: '0.75rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(255, 255, 255, 0.12)',
                transition: 'all var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e2e8f0';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span>Sign In with Credentials</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            margin: '1.5rem 0',
            color: 'var(--text-dim)',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
            <span>or instant exploration</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          </div>

          {/* 1-Click Guest Exploration Button */}
          <button
            type="button"
            onClick={handleGuestDemo}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#f8fafc',
              fontSize: '0.86rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
            }}
          >
            <Zap size={16} color="#38bdf8" />
            <span>Explore as Guest / Launch Demo</span>
          </button>
        </div>

        {/* Footer Security Badges */}
        <div style={{
          paddingTop: '2rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={13} color="var(--mint-sage)" />
            <span>TLS 1.3 ENCRYPTED</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--mint-sage)' }} />
            <span>BACKEND ONLINE</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Data Science & Model Zoo Showcase */}
      <div style={{
        flex: 1,
        padding: '3rem 3.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'radial-gradient(ellipse 70% 50% at 75% 20%, rgba(255, 255, 255, 0.03) 0%, transparent 70%), var(--bg-base)',
        position: 'relative',
        overflowY: 'auto',
      }}>
        {/* Top Telemetry Header */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <div style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
              }}>
                Telemetry & Model Zoo
              </div>
              <h2 style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: '#f8fafc',
              }}>
                Live Machine Learning Workbench
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}>
                150 rows × 9 cols
              </span>
              <span style={{
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: 'var(--mint-sage)',
                fontWeight: 600,
              }}>
                ● P99: 1.18 ms
              </span>
            </div>
          </div>

          {/* Model Zoo Selector Tabs */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '0.65rem',
            marginBottom: '1.5rem',
          }}>
            {Object.values(MODEL_PREVIEWS).map((m) => {
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${isSelected ? 'rgba(255, 255, 255, 0.3)' : 'var(--border-subtle)'}`,
                    color: isSelected ? '#f8fafc' : 'var(--text-secondary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{
                    fontSize: '0.62rem',
                    fontFamily: 'var(--font-mono)',
                    color: isSelected ? '#38bdf8' : 'var(--text-muted)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    marginBottom: '0.2rem',
                  }}>
                    {m.tag}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {m.shortName}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: isSelected ? '#f8fafc' : 'var(--text-muted)' }}>
                    {m.accuracy}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Model Interactive Inspection Card */}
          <div style={{
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            background: 'rgba(255, 255, 255, 0.025)',
            backdropFilter: 'blur(16px)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            {/* Model Card Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <Cpu size={16} color="#f8fafc" />
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
                    {model.name}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Task: {model.task}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#f8fafc' }}>
                  {model.primaryMetric}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Latency: {model.latency}
                </div>
              </div>
            </div>

            {/* Dynamic Loss Convergence Curve */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Loss Convergence & Epoch Progress
                </span>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 8, height: 2, background: '#f8fafc' }} /> Training Loss
                  </span>
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: 8, height: 2, background: '#94a3b8', borderTop: '1px dashed' }} /> Validation
                  </span>
                </div>
              </div>

              <div style={{
                height: '110px',
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border-subtle)',
                padding: '0.5rem 1rem',
              }}>
                <svg viewBox="0 0 400 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Grid Lines */}
                  <line x1="10" y1="20" x2="390" y2="20" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <line x1="10" y1="50" x2="390" y2="50" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <line x1="10" y1="80" x2="390" y2="80" stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />

                  {/* Training Loss Curve */}
                  <path
                    d={model.lossCurve}
                    fill="none"
                    stroke="#f8fafc"
                    strokeWidth="2"
                  />

                  {/* Validation Curve */}
                  <path
                    d={model.valCurve}
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                  />

                  {/* Focal Convergence Point */}
                  <circle cx="380" cy={model.id === 'gboost' ? 14 : model.id === 'rf' ? 19 : model.id === 'mlp' ? 12 : 32} r="4" fill="#f8fafc" stroke="#090a0f" strokeWidth="2" />
                </svg>
              </div>
            </div>

            {/* Confusion Matrix & Hyperparameters Split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1rem' }}>
              {/* Interactive Confusion Matrix */}
              <div style={{
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '0.75rem',
              }}>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  CONFUSION MATRIX (N=150)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  <div style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: '#f8fafc' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{model.confusion.tp}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>TP</div>
                  </div>
                  <div style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{model.confusion.fp}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>FP</div>
                  </div>
                  <div style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{model.confusion.fn}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>FN</div>
                  </div>
                  <div style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: '#f8fafc' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{model.confusion.tn}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>TN</div>
                  </div>
                </div>
              </div>

              {/* Hyperparameter Specs */}
              <div style={{
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  SERIALIZED HYPERPARAMETERS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                  {model.hyperparams.map((hp, i) => (
                    <div key={i} style={{ color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{hp.key}:</span>{' '}
                      <span style={{ color: '#f8fafc', fontWeight: 600 }}>{hp.val}</span>
                    </div>
                  ))}
                </div>

                {/* Simulate Single Sample Button */}
                <button
                  type="button"
                  onClick={handleSimulateInference}
                  disabled={isSimulating}
                  style={{
                    marginTop: '0.65rem',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#f8fafc',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <Activity size={13} color="#38bdf8" />
                  <span>{isSimulating ? 'Simulating inference...' : '▶ Simulate Real-Time Inference'}</span>
                </button>
              </div>
            </div>

            {/* Simulation Result Badge */}
            {simResult && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0.85rem',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--mint-sage)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={15} />
                  <span>OUTPUT: {simResult.prediction}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', color: '#f8fafc' }}>
                  <span>Confidence: {simResult.confidence}</span>
                  <span style={{ color: 'var(--text-muted)' }}>Latency: {simResult.latency}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Platform Architecture Note */}
        <div style={{
          marginTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.74rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          <div>
            Active Pipeline: Leakage-Free ColumnTransformer • Scikit-Learn • FastAPI Backend
          </div>
          <div style={{ color: '#f8fafc' }}>
            Ready for Session Initialization →
          </div>
        </div>
      </div>
    </div>
  );
}
