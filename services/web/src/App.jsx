import React, { useState, useEffect } from 'react';
import { api } from './api/client';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomeDashboard from './components/HomeDashboard';
import DatasetsTab from './components/DatasetsTab';
import DataLabTab from './components/DataLabTab';
import EdaStudioTab from './components/EdaStudioTab';
import CleaningPipelineTab from './components/CleaningPipelineTab';
import ModelStudioTab from './components/ModelStudioTab';
import UnsupervisedTab from './components/UnsupervisedTab';
import LeaderboardTab from './components/LeaderboardTab';
import InferenceCockpitTab from './components/InferenceCockpitTab';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('axis_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('axis_user') || 'Scientist';
  });
  const [activeTab, setActiveTab] = useState('home');
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState('');
  const [activeRunId, setActiveRunId] = useState('');
  const [systemHealth, setSystemHealth] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const handleLoginSuccess = ({ user }) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem('axis_auth', 'true');
    localStorage.setItem('axis_user', user);
  };

  const handleSignOut = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('axis_auth');
    localStorage.removeItem('axis_user');
  };

  // Check health and load datasets
  const fetchDatasets = async () => {
    try {
      const data = await api.getDatasets();
      setDatasets(data || []);
      if (data && data.length > 0 && !activeDatasetId) {
        setActiveDatasetId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load datasets:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    api.getHealth()
      .then(() => {
        if (isMounted) setSystemHealth(true);
      })
      .catch(() => {
        if (isMounted) setSystemHealth(false);
      });

    fetchDatasets().finally(() => {
      if (isMounted) setInitialLoading(false);
    });

    return () => { isMounted = false; };
  }, []);

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || null;

  // Front Page: Minimalist Split-Screen Authentication with Interactive Model Zoo
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Authenticated Workbench View
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'var(--bg-base)',
      color: 'var(--text-primary)',
    }}>
      {/* 1. Left Vertical Minimalist Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        datasetsCount={datasets.length}
        currentUser={currentUser}
        onSignOut={handleSignOut}
      />

      {/* 2. Main Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        position: 'relative',
      }}>
        {/* Subtle Top Accent Strip */}
        <div className="neon-top-strip" />

        {/* Minimalist Top Header Bar */}
        <TopBar
          activeDataset={activeDataset}
          datasets={datasets}
          setActiveDatasetId={setActiveDatasetId}
          systemHealth={systemHealth}
          currentUser={currentUser}
          onSignOut={handleSignOut}
        />

        {/* Dynamic Studio & Dashboard Views */}
        <main style={{
          flex: 1,
          width: '100%',
          maxWidth: '1680px',
          margin: '0 auto',
          position: 'relative',
        }}>
          {activeTab === 'home' && (
            <HomeDashboard
              datasets={datasets}
              activeDataset={activeDataset}
              setActiveDatasetId={setActiveDatasetId}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'datasets' && (
            <div style={{ padding: '1.25rem' }}>
              <DatasetsTab
                datasets={datasets}
                activeDataset={activeDataset}
                setActiveDatasetId={setActiveDatasetId}
                onRefreshDatasets={fetchDatasets}
                onNavigateTab={setActiveTab}
              />
            </div>
          )}

          {activeTab === 'datalab' && (
            <div style={{ padding: '1.25rem' }}>
              <DataLabTab
                activeDataset={activeDataset}
              />
            </div>
          )}

          {activeTab === 'eda' && (
            <div style={{ padding: '1.25rem' }}>
              <EdaStudioTab
                activeDataset={activeDataset}
              />
            </div>
          )}

          {activeTab === 'cleaning' && (
            <div style={{ padding: '1.25rem' }}>
              <CleaningPipelineTab
                activeDataset={activeDataset}
                onRefreshDatasets={fetchDatasets}
                setActiveDatasetId={setActiveDatasetId}
                onNavigateTab={setActiveTab}
              />
            </div>
          )}

          {activeTab === 'models' && (
            <div style={{ padding: '1.25rem' }}>
              <ModelStudioTab
                activeDataset={activeDataset}
                onNavigateTab={setActiveTab}
                setActiveRunId={setActiveRunId}
              />
            </div>
          )}

          {activeTab === 'unsupervised' && (
            <div style={{ padding: '1.25rem' }}>
              <UnsupervisedTab
                activeDataset={activeDataset}
              />
            </div>
          )}

          {activeTab === 'leaderboard' && (
            <div style={{ padding: '1.25rem' }}>
              <LeaderboardTab
                activeDataset={activeDataset}
                onNavigateTab={setActiveTab}
                setActiveRunId={setActiveRunId}
              />
            </div>
          )}

          {activeTab === 'inference' && (
            <div style={{ padding: '1.25rem' }}>
              <InferenceCockpitTab
                activeDataset={activeDataset}
                activeRunId={activeRunId}
                setActiveRunId={setActiveRunId}
              />
            </div>
          )}
        </main>

        {/* Minimalist Footer */}
        <footer style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          padding: '1rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          background: 'var(--bg-sidebar)',
        }}>
          <div>
            <span>AXIS ML • DATA SCIENCE & INTELLIGENCE WORKBENCH</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>BACKEND: FASTAPI :8002</span>
            <span>TRACKING: MLFLOW :5000</span>
            <span>DATABASE: POSTGRESQL :5432</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
