import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Compass, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';

export default function WorkflowBar({ activeDataset, onNavigateTab }) {
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeDataset?.id) {
      setWorkflow(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    api.getWorkflowStatus(activeDataset.id)
      .then((data) => {
        if (isMounted) setWorkflow(data);
      })
      .catch((err) => {
        console.error('Failed to load workflow state:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [activeDataset?.id]);

  if (!activeDataset || !workflow) return null;

  const stageColors = {
    'RAW_INGESTED': 'var(--amber-warn)',
    'CLEANED': 'var(--cyan-neon)',
    'READY_FOR_TRAINING': 'var(--emerald-pulse)',
    'MODELS_TRAINED': 'var(--purple-telemetry)',
  };

  const getTargetTab = (action) => {
    const act = (action || '').toLowerCase();
    if (act.includes('clean') || act.includes('preprocess')) return 'cleaning';
    if (act.includes('train') || act.includes('model')) return 'models';
    if (act.includes('compare') || act.includes('eval')) return 'leaderboard';
    if (act.includes('eda') || act.includes('diagnost')) return 'eda';
    return 'datalab';
  };

  return (
    <div style={{
      margin: '1rem 1.75rem 0 1.75rem',
      padding: '0.85rem 1.25rem',
      background: 'linear-gradient(90deg, rgba(14, 20, 32, 0.95), rgba(22, 32, 52, 0.9))',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '1rem',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Current Dataset State */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(0, 229, 255, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--cyan-neon)',
          border: '1px solid rgba(0, 229, 255, 0.3)',
        }}>
          <Compass size={18} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              LIFECYCLE STATUS:
            </span>
            <span 
              className="badge" 
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                color: stageColors[workflow.status] || 'var(--text-primary)',
                border: `1px solid ${stageColors[workflow.status] || 'var(--border-subtle)'}`
              }}
            >
              <span className="pulse-dot" style={{ background: stageColors[workflow.status] || 'var(--cyan-neon)' }} />
              {workflow.status || 'INGESTED'}
            </span>
            {workflow.has_model_runs && (
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                {workflow.run_count} MODEL{workflow.run_count === 1 ? '' : 'S'} TRAINED
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
            <span style={{ fontWeight: 600 }}>{activeDataset.name}</span>
            <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
              ({activeDataset.row_count} rows × {activeDataset.column_count} cols)
            </span>
          </div>
        </div>
      </div>

      {/* Recommended Next Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ 
            fontSize: '0.7rem', 
            color: 'var(--cyan-neon)', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.3rem'
          }}>
            <Sparkles size={12} /> Recommended Action
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {workflow.recommended_action || 'Explore feature correlations in EDA Studio'}
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem', gap: '0.4rem' }}
          onClick={() => onNavigateTab(getTargetTab(workflow.recommended_action))}
        >
          <span>Execute</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
