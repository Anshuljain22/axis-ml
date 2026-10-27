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
      background: 'var(--ks-paper)',
      color: 'var(--ks-ink)',
      fontFamily: 'var(--font-sans)',
      overflow: 'hidden',
    }}>
      {/* LEFT COLUMN: Clean Warm Paper Auth Experience */}
      <div style={{
        flex: '0 0 44%',
        minWidth: '420px',
        maxWidth: '540px',
        padding: '3.25rem 3.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--ks-paper-raised)',
        zIndex: 10,
        position: 'relative',
        boxShadow: 'var(--ks-lift-1)',
      }}>
        {/* Subtle top ambient warmth */}
        <div style={{
          position: 'absolute',
          top: -80,
          left: -80,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'rgba(197, 139, 36, 0.05)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }} />

        {/* Brand Mark */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '2.5rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '8px',
              background: 'var(--ks-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(25, 24, 23, 0.15)',
              position: 'relative',
            }}>
              <div style={{
                width: 14,
                height: 14,
                borderRadius: '3px',
                background: 'var(--ks-kinpaku)',
                transform: 'rotate(45deg)',
                boxShadow: '0 0 8px rgba(197, 139, 36, 0.6)',
              }} />
            </div>
            <div>
              <div style={{
                fontSize: '1.3rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                fontFamily: 'var(--font-display)',
                color: 'var(--ks-ink)',
                lineHeight: 1.1,
              }}>
                AXIS ML
              </div>
              <div style={{
                fontSize: '0.64rem',
                letterSpacing: '0.12em',
                color: 'var(--ks-text-muted)',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                marginTop: '2px',
              }}>
                Data Science & AI Workbench
              </div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--ks-ink)',
              marginBottom: '0.45rem',
            }}>
              Authenticate to Platform
            </h1>
            <p style={{
              fontSize: '0.86rem',
              color: 'var(--ks-text-muted)',
              lineHeight: 1.55,
            }}>
              Sign in with institutional credentials or launch an instant guest session to inspect active models, diagnostics and inference pipelines.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleCredentialsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Email Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.74rem',
                fontWeight: 600,
                color: 'var(--ks-text-muted)',
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
                    color: 'var(--ks-text-faint)',
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
                    background: 'var(--ks-paper-raised)',
                    border: '1px solid var(--ks-gray-2)',
                    borderRadius: '8px',
                    color: 'var(--ks-ink)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    transition: 'all var(--transition-fast)',
                    boxShadow: 'var(--ks-track-recess)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ks-kinpaku)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(197, 139, 36, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ks-gray-2)';
                    e.currentTarget.style.boxShadow = 'var(--ks-track-recess)';
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  color: 'var(--ks-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontFamily: 'var(--font-mono)',
                }}>
                  Password
                </label>
                <a href="#reset" style={{ fontSize: '0.72rem', color: 'var(--ks-kinpaku-rich)', textDecoration: 'none', fontWeight: 600 }}>
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
                    color: 'var(--ks-text-faint)',
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
                    background: 'var(--ks-paper-raised)',
                    border: '1px solid var(--ks-gray-2)',
                    borderRadius: '8px',
                    color: 'var(--ks-ink)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    transition: 'all var(--transition-fast)',
                    boxShadow: 'var(--ks-track-recess)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ks-kinpaku)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(197, 139, 36, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--ks-gray-2)';
                    e.currentTarget.style.boxShadow = 'var(--ks-track-recess)';
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
                    color: 'var(--ks-text-muted)',
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
                fontSize: '0.74rem',
                fontWeight: 600,
                color: 'var(--ks-text-muted)',
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
                  background: 'var(--ks-paper-raised)',
                  border: '1px solid var(--ks-gray-2)',
                  borderRadius: '8px',
                  color: 'var(--ks-ink)',
                  fontSize: '0.84rem',
                  outline: 'none',
                  cursor: 'pointer',
                  boxShadow: 'var(--ks-cap-lift)',
                }}
              >
                <option value="production">
                  Production Workbench (Verified Telemetry & Champion Runs)
                </option>
                <option value="research">
                  Research & Unsupervised Anomaly Lab
                </option>
                <option value="staging">
                  Inference & Telemetry Staging Zone
                </option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                marginTop: '0.5rem',
                padding: '0.8rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
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
            color: 'var(--ks-text-faint)',
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
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.86rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              background: 'var(--ks-paper-deep)',
              border: '1px solid var(--border-medium)',
            }}
          >
            <Zap size={16} color="var(--ks-kinpaku)" />
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
          color: 'var(--ks-text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={13} color="var(--ks-patina)" />
            <span>TLS 1.3 ENCRYPTED</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span className="pulse-dot pulse-dot-patina" />
            <span>BACKEND ONLINE</span>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Telemetry & Model Zoo Showcase (Warm Beige Canvas) */}
      <div style={{
        flex: 1,
        padding: '3.25rem 3.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'var(--ks-paper-deep)',
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
                color: 'var(--ks-kinpaku-rich)',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginBottom: '0.25rem',
                fontWeight: 700,
              }}>
                Telemetry & Model Zoo
              </div>
              <h2 style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--ks-ink)',
              }}>
                Live Machine Learning Workbench
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="badge badge-muted">
                150 rows × 9 cols
              </span>
              <span className="badge badge-patina">
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
                    padding: '0.85rem 0.95rem',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--ks-paper-raised)' : 'rgba(255, 255, 255, 0.45)',
                    border: `1px solid ${isSelected ? 'var(--ks-kinpaku)' : 'var(--border-subtle)'}`,
                    color: isSelected ? 'var(--ks-ink)' : 'var(--ks-text-muted)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    boxShadow: isSelected ? 'var(--ks-lift-1)' : 'none',
                  }}
                >
                  <div style={{
                    fontSize: '0.62rem',
                    fontFamily: 'var(--font-mono)',
                    color: isSelected ? 'var(--ks-kinpaku-deep)' : 'var(--ks-text-faint)',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    marginBottom: '0.25rem',
                  }}>
                    {m.tag}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                    {m.shortName}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: isSelected ? 'var(--ks-ink)' : 'var(--ks-text-muted)', fontWeight: 600 }}>
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
            background: 'var(--ks-paper-raised)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: 'var(--ks-lift-1)',
          }}>
            {/* Model Card Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <Cpu size={16} color="var(--ks-kinpaku)" />
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ks-ink)' }}>
                    {model.name}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--ks-text-muted)' }}>
                  Task: {model.task}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--ks-ink)' }}>
                  {model.primaryMetric}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--ks-patina-deep)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  Latency: {model.latency}
                </div>
              </div>
            </div>

            {/* Dynamic Loss Convergence Curve */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--ks-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Loss Convergence & Epoch Progress
                </span>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--ks-kinpaku-deep)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <span style={{ width: 10, height: 3, background: 'var(--ks-kinpaku)', borderRadius: 2 }} /> Training Loss
                  </span>
                  <span style={{ color: 'var(--ks-patina-deep)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                    <span style={{ width: 10, height: 2, background: 'var(--ks-patina)', borderTop: '2px dashed' }} /> Validation
                  </span>
                </div>
              </div>

              <div style={{
                height: '110px',
                borderRadius: '8px',
                background: 'var(--ks-paper-deep)',
                border: '1px solid var(--border-subtle)',
                padding: '0.5rem 1rem',
                boxShadow: 'var(--ks-track-recess)',
              }}>
                <svg viewBox="0 0 400 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Grid Lines */}
                  <line x1="10" y1="20" x2="390" y2="20" stroke="rgba(25, 24, 23, 0.05)" strokeDasharray="3 3" />
                  <line x1="10" y1="50" x2="390" y2="50" stroke="rgba(25, 24, 23, 0.05)" strokeDasharray="3 3" />
                  <line x1="10" y1="80" x2="390" y2="80" stroke="rgba(25, 24, 23, 0.05)" strokeDasharray="3 3" />

                  {/* Training Loss Curve in Kinpaku Gold */}
                  <path
                    d={model.lossCurve}
                    fill="none"
                    stroke="var(--ks-kinpaku)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />

                  {/* Validation Curve in Patina Teal */}
                  <path
                    d={model.valCurve}
                    fill="none"
                    stroke="var(--ks-patina)"
                    strokeWidth="1.8"
                    strokeDasharray="4 2"
                    strokeLinecap="round"
                  />

                  {/* Focal Convergence Point */}
                  <circle
                    cx="380"
                    cy={model.id === 'gboost' ? 14 : model.id === 'rf' ? 19 : model.id === 'mlp' ? 12 : 32}
                    r="4.5"
                    fill="var(--ks-kinpaku)"
                    stroke="var(--ks-paper-raised)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* Confusion Matrix & Hyperparameters Split */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1rem' }}>
              {/* Interactive Confusion Matrix */}
              <div style={{
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--ks-paper-deep)',
                padding: '0.75rem',
              }}>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ks-text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  CONFUSION MATRIX (N=150)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                  <div style={{ padding: '0.5rem', borderRadius: '5px', background: 'var(--ks-patina-pale)', border: '1px solid var(--ks-patina-border)', color: 'var(--ks-patina-deep)' }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800 }}>{model.confusion.tp}</div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.85 }}>TP</div>
                  </div>
                  <div style={{ padding: '0.5rem', borderRadius: '5px', background: 'var(--ks-vermilion-pale)', border: '1px solid var(--ks-vermilion-border)', color: 'var(--ks-vermilion)' }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800 }}>{model.confusion.fp}</div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.85 }}>FP</div>
                  </div>
                  <div style={{ padding: '0.5rem', borderRadius: '5px', background: 'var(--ks-vermilion-pale)', border: '1px solid var(--ks-vermilion-border)', color: 'var(--ks-vermilion)' }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800 }}>{model.confusion.fn}</div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.85 }}>FN</div>
                  </div>
                  <div style={{ padding: '0.5rem', borderRadius: '5px', background: 'var(--ks-patina-pale)', border: '1px solid var(--ks-patina-border)', color: 'var(--ks-patina-deep)' }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 800 }}>{model.confusion.tn}</div>
                    <div style={{ fontSize: '0.62rem', fontWeight: 600, opacity: 0.85 }}>TN</div>
                  </div>
                </div>
              </div>

              {/* Hyperparameter Specs */}
              <div style={{
                borderRadius: '8px',
                border: '1px solid var(--border-subtle)',
                background: 'var(--ks-paper-deep)',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}>
                <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--ks-text-muted)', marginBottom: '0.4rem', fontWeight: 600 }}>
                  SERIALIZED HYPERPARAMETERS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                  {model.hyperparams.map((hp, i) => (
                    <div key={i} style={{ color: 'var(--ks-text-muted)' }}>
                      <span>{hp.key}:</span>{' '}
                      <span style={{ color: 'var(--ks-ink)', fontWeight: 700 }}>{hp.val}</span>
                    </div>
                  ))}
                </div>

                {/* Simulate Single Sample Button */}
                <button
                  type="button"
                  onClick={handleSimulateInference}
                  disabled={isSimulating}
                  className="btn btn-secondary"
                  style={{
                    marginTop: '0.65rem',
                    padding: '0.45rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontFamily: 'var(--font-mono)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    background: 'var(--ks-paper-raised)',
                  }}
                >
                  <Activity size={13} color="var(--ks-kinpaku)" />
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
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                background: 'var(--ks-patina-pale)',
                border: '1px solid var(--ks-patina-border)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                color: 'var(--ks-patina-deep)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  <CheckCircle2 size={15} />
                  <span>OUTPUT: {simResult.prediction}</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', color: 'var(--ks-ink)', fontWeight: 600 }}>
                  <span>Confidence: {simResult.confidence}</span>
                  <span style={{ color: 'var(--ks-text-muted)' }}>Latency: {simResult.latency}</span>
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
          color: 'var(--ks-text-muted)',
          fontFamily: 'var(--font-mono)',
        }}>
          <div>
            Active Pipeline: Leakage-Free ColumnTransformer • Scikit-Learn • FastAPI Backend
          </div>
          <div style={{ color: 'var(--ks-ink)', fontWeight: 600 }}>
            Ready for Session Initialization →
          </div>
        </div>
      </div>
    </div>
  );
}
