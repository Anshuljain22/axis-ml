import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import Header from './components/Header';
import WorkflowBar from './components/WorkflowBar';
import DatasetsTab from './components/DatasetsTab';
import DataLabTab from './components/DataLabTab';
import EdaStudioTab from './components/EdaStudioTab';
import CleaningPipelineTab from './components/CleaningPipelineTab';
import ModelStudioTab from './components/ModelStudioTab';
import LeaderboardTab from './components/LeaderboardTab';
import InferenceCockpitTab from './components/InferenceCockpitTab';

export default function App() {
  const [theme, setTheme] = useState('pixel');
  const [activeTab, setActiveTab] = useState('datasets');
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState('');
  const [activeRunId, setActiveRunId] = useState('');
  const [systemHealth, setSystemHealth] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Sync theme with HTML data attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Check health and load datasets
  const fetchDatasets = async () => {
    try {
      const data = await api.getDatasets();
      setDatasets(data || []);
      // If no active dataset selected yet and data has items, select the first
      if (data && data.length > 0 && !activeDatasetId) {
        setActiveDatasetId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Check health
    api.getHealth()
      .then(() => {
        if (isMounted) setSystemHealth(true);
      })
      .catch(() => {
        if (isMounted) setSystemHealth(false);
      });

    // Load initial datasets
    fetchDatasets().finally(() => {
      if (isMounted) setInitialLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeDataset={activeDataset}
        datasets={datasets}
        setActiveDatasetId={setActiveDatasetId}
        systemHealth={systemHealth}
        theme={theme}
        setTheme={setTheme}
      />

      {/* AI Engineering Workflow & Lifecycle Advisor */}
      <WorkflowBar
        activeDataset={activeDataset}
        onNavigateTab={(targetTab) => setActiveTab(targetTab)}
      />

      {/* Main Tab Content View */}
      <main style={{ flex: 1, maxWidth: 1600, width: '100%', margin: '0 auto' }}>
        {activeTab === 'datasets' && (
          <DatasetsTab
            datasets={datasets}
            activeDataset={activeDataset}
            setActiveDatasetId={setActiveDatasetId}
            onRefreshDatasets={fetchDatasets}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'datalab' && (
          <DataLabTab
            activeDataset={activeDataset}
          />
        )}

        {activeTab === 'eda' && (
          <EdaStudioTab
            activeDataset={activeDataset}
          />
        )}

        {activeTab === 'cleaning' && (
          <CleaningPipelineTab
            activeDataset={activeDataset}
            onRefreshDatasets={fetchDatasets}
            setActiveDatasetId={setActiveDatasetId}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'models' && (
          <ModelStudioTab
            activeDataset={activeDataset}
            onNavigateTab={setActiveTab}
            setActiveRunId={setActiveRunId}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            activeDataset={activeDataset}
            onNavigateTab={setActiveTab}
            setActiveRunId={setActiveRunId}
          />
        )}

        {activeTab === 'inference' && (
          <InferenceCockpitTab
            activeDataset={activeDataset}
            activeRunId={activeRunId}
            setActiveRunId={setActiveRunId}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        background: 'rgba(7, 9, 14, 0.9)',
      }}>
        <div>
          <span>PITWALL OS CORE • HIGH-PRECISION TELEMETRY & ML WORKBENCH</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>BACKEND: FASTAPI :8002</span>
          <span>TRACKING: MLFLOW :5000</span>
          <span>DATABASE: POSTGRESQL :5432</span>
        </div>
      </footer>
    </div>
  );
}
