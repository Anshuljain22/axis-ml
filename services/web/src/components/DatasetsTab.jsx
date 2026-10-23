import React, { useState } from 'react';
import { api } from '../api/client';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Calendar, 
  Layers, 
  HardDrive, 
  ArrowRight,
  GitFork,
  AlertCircle,
  Database
} from 'lucide-react';

export default function DatasetsTab({ 
  datasets, 
  activeDataset, 
  setActiveDatasetId, 
  onRefreshDatasets,
  onNavigateTab
}) {
  const [file, setFile] = useState(null);
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!datasetName) {
        setDatasetName(droppedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!datasetName) {
        setDatasetName(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await api.uploadDataset(file, datasetName, description);
      setUploadSuccess(`Dataset "${res.name}" successfully registered and profiled!`);
      setFile(null);
      setDatasetName('');
      setDescription('');
      await onRefreshDatasets();
      setActiveDatasetId(res.id);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload dataset.');
    } finally {
      setUploading(false);
    }
  };

  const totalRows = datasets.reduce((acc, d) => acc + (d.row_count || 0), 0);
  const totalCols = datasets.reduce((acc, d) => acc + (d.column_count || 0), 0);

  const [showCarBanner, setShowCarBanner] = useState(false);

  return (
    <div className="animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 16-Bit Pixel Art F1 Pitwall Hero Showcase */}
      <div className="pixel-banner-hero" style={{ height: 260, position: 'relative' }}>
        <img
          src={showCarBanner ? '/pixel_car.jpg' : '/pixel_pitwall.jpg'}
          alt="Pixel Art F1 Pitwall Telemetry"
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.88 }}
        />
        {/* Overlay Retro Telemetry HUD */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to right, rgba(6, 8, 14, 0.95) 0%, rgba(6, 8, 14, 0.6) 45%, transparent 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.6rem' }}>
                {showCarBanner ? '★ NITRO GRAND PRIX ON TRACK ★' : '★ 16-BIT F1 PITWALL RACE CONTROL ★'}
              </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.55rem' }}>
                LIVE TELEMETRY STREAM
              </span>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '0.65rem', padding: '0.25rem 0.65rem' }}
              onClick={() => setShowCarBanner(!showCarBanner)}
            >
              {showCarBanner ? 'SWITCH TO PITWALL COMMAND' : 'SWITCH TO GRAND PRIX CAR'}
            </button>
          </div>

          <div>
            <h2 style={{
              fontFamily: "'Silkscreen', 'Press Start 2P', monospace",
              fontSize: '1.5rem',
              color: '#00f0ff',
              textShadow: '2px 2px 0px #000, 0 0 12px rgba(0, 240, 255, 0.7)',
              letterSpacing: '0.05em',
            }}>
              {showCarBanner ? 'TELEMETRY: NITRO 16-BIT F1' : 'SUZUKA RACE CONTROL • PITWALL'}
            </h2>
            <p style={{
              fontFamily: "'VT323', monospace",
              fontSize: '1.25rem',
              color: '#ffd700',
              marginTop: '0.2rem',
              letterSpacing: '0.04em',
            }}>
              FASTAPI ENGINE :8002 • MLFLOW SERVER :5000 • POSTGRES TELEMETRY VAULT :5432
            </p>
          </div>
        </div>
      </div>

      {/* Top Telemetry KPI Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            REGISTERED DATASETS
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--cyan-neon)', fontFamily: 'var(--font-display)', marginTop: '0.25rem' }}>
            {datasets.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Active across PostgreSQL catalog
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            TOTAL PROFILED ROWS
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--orange-racing)', fontFamily: 'var(--font-display)', marginTop: '0.25rem' }}>
            {totalRows.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Across all ingested telemetry batches
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            FEATURE DIMENSIONS
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--emerald-pulse)', fontFamily: 'var(--font-display)', marginTop: '0.25rem' }}>
            {totalCols.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Categorical, numeric & temporal
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Section & Dataset Catalog */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Upload Form */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Upload size={20} color="var(--cyan-neon)" />
            <h3>Ingest CSV Dataset</h3>
          </div>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `2px dashed ${dragActive ? 'var(--cyan-neon)' : 'rgba(255, 255, 255, 0.15)'}`,
                borderRadius: 'var(--radius-sm)',
                padding: '1.75rem 1rem',
                textAlign: 'center',
                background: dragActive ? 'rgba(0, 229, 255, 0.08)' : 'rgba(14, 20, 32, 0.5)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
              onClick={() => document.getElementById('csvFileInput').click()}
            >
              <input
                id="csvFileInput"
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <FileText size={32} color={file ? 'var(--cyan-neon)' : 'var(--text-muted)'} style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: file ? 'var(--cyan-neon)' : 'var(--text-primary)' }}>
                {file ? file.name : 'Click or drag CSV here to upload'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Up to 500 columns • UTF-8 CSV'}
              </div>
            </div>

            <div>
              <label className="form-label">Dataset Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. telemetry_session_silverstone"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Session notes, track temp, setup baseline..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {uploadError && (
              <div className="badge badge-rose" style={{ padding: '0.5rem', width: '100%', justifyContent: 'flex-start' }}>
                <AlertCircle size={14} />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="badge badge-emerald" style={{ padding: '0.5rem', width: '100%', justifyContent: 'flex-start' }}>
                <CheckCircle size={14} />
                <span>{uploadSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!file || uploading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {uploading ? (
                <>
                  <span className="pulse-dot pulse-dot-cyan" />
                  <span>Profiling & Ingesting...</span>
                </>
              ) : (
                <>
                  <Upload size={16} />
                  <span>Register & Profile Dataset</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Dataset Catalog */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Database size={20} color="var(--orange-racing)" />
              <h3>Dataset Catalog</h3>
            </div>
            <button className="btn btn-secondary" onClick={onRefreshDatasets} style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
              Refresh Catalog
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {datasets.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Database size={48} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
                <p>No datasets registered yet. Upload a CSV file to get started.</p>
              </div>
            ) : (
              datasets.map((d) => {
                const isSelected = activeDataset?.id === d.id;
                const isDerived = !!d.parent_dataset_id;

                return (
                  <div
                    key={d.id}
                    className={`glass-panel ${isSelected ? '' : 'glass-panel-interactive'}`}
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderLeft: isSelected ? '4px solid var(--cyan-neon)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'rgba(20, 32, 54, 0.85)' : 'var(--bg-card)',
                      boxShadow: isSelected ? 'var(--shadow-card), var(--shadow-glow-cyan)' : 'var(--shadow-card)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {d.name}
                          </span>
                          {isDerived ? (
                            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                              <GitFork size={10} /> CLEANED VERSION
                            </span>
                          ) : (
                            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                              ORIGINAL SOURCE
                            </span>
                          )}
                          {isSelected && (
                            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                              <CheckCircle size={10} /> ACTIVE
                            </span>
                          )}
                        </div>

                        {d.description && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                            {d.description}
                          </div>
                        )}

                        {/* Metadata row */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1.25rem', 
                          marginTop: '0.75rem', 
                          color: 'var(--text-muted)',
                          fontSize: '0.8rem',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Layers size={14} color="var(--cyan-neon)" />
                            <strong style={{ color: 'var(--text-primary)' }}>{d.row_count}</strong> rows × <strong style={{ color: 'var(--text-primary)' }}>{d.column_count}</strong> cols
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <HardDrive size={14} color="var(--orange-racing)" />
                            {d.file_size_bytes ? `${(d.file_size_bytes / 1024).toFixed(1)} KB` : 'N/A'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={14} />
                            {new Date(d.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Action button */}
                      <div>
                        {isSelected ? (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem' }}
                            onClick={() => onNavigateTab('datalab')}
                          >
                            <span>Inspect Lab</span>
                            <ArrowRight size={14} />
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 0.9rem', fontSize: '0.8rem' }}
                            onClick={() => setActiveDatasetId(d.id)}
                          >
                            Select Dataset
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
