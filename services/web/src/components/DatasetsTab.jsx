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
  Database,
  Cpu,
  BarChart2,
  Sparkles
} from 'lucide-react';

export default function DatasetsTab({ 
  datasets = [], 
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
      if (onRefreshDatasets) onRefreshDatasets();
      if (res.id) setActiveDatasetId(res.id);
    } catch (err) {
      setUploadError(err.message || 'Dataset upload failed. Ensure CSV is properly formatted.');
    } finally {
      setUploading(false);
    }
  };

  const totalRows = datasets.reduce((acc, curr) => acc + (curr.rows ?? curr.row_count ?? 0), 0);
  const totalCols = datasets.reduce((acc, curr) => acc + (curr.columns ?? curr.column_count ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Banner */}
      <div style={{
        borderRadius: '10px',
        border: '1px solid var(--border-subtle)',
        background: 'var(--ks-paper-raised)',
        padding: '1.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--ks-lift-1)',
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.2rem 0.55rem',
            borderRadius: '4px',
            background: 'var(--ks-paper-deep)',
            fontSize: '0.68rem',
            fontFamily: 'var(--font-mono)',
            color: 'var(--ks-kinpaku-rich)',
            marginBottom: '0.5rem',
            fontWeight: 700,
          }}>
            <Database size={13} />
            <span>DATA LAKE REPOSITORY & INGESTION HUB</span>
          </div>
          <h2 style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            color: 'var(--ks-ink)',
            fontFamily: 'var(--font-display)',
            marginBottom: '0.35rem',
          }}>
            Dataset Registry & Schema Profiler
          </h2>
          <p style={{
            fontSize: '0.86rem',
            color: 'var(--ks-text-muted)',
            lineHeight: 1.5,
          }}>
            Ingest structured tabular datasets, perform automated statistical profiling, and feed clean feature representations into training pipelines.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={onRefreshDatasets}
            style={{ fontSize: '0.82rem', padding: '0.55rem 1rem' }}
          >
            Refresh Catalog
          </button>
          {activeDataset && (
            <button
              className="btn btn-primary"
              onClick={() => onNavigateTab('datalab')}
              style={{ fontSize: '0.82rem', padding: '0.55rem 1.15rem' }}
            >
              <span>Explore Active in Data Lab</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Top Metric Counter Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.35rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ks-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', fontWeight: 600 }}>
            REGISTERED DATASETS
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ks-ink)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
            {datasets.length}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ks-text-muted)', marginTop: '0.25rem' }}>
            Active across platform catalog
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.35rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ks-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', fontWeight: 600 }}>
            TOTAL PROFILED ROWS
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ks-ink)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
            {totalRows.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ks-text-muted)', marginTop: '0.25rem' }}>
            Across all ingested datasets
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.35rem' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--ks-text-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', fontWeight: 600 }}>
            FEATURE DIMENSIONS
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--ks-ink)', fontFamily: 'var(--font-mono)', marginTop: '0.25rem' }}>
            {totalCols.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--ks-text-muted)', marginTop: '0.25rem' }}>
            Categorical, numeric & temporal
          </div>
        </div>
      </div>

      {/* Main Grid: Upload Section & Dataset Catalog */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Upload Form */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Upload size={18} color="var(--ks-kinpaku)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ks-ink)' }}>Ingest CSV Dataset</h3>
          </div>

          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              style={{
                border: `1px dashed ${dragActive ? 'var(--ks-kinpaku)' : 'var(--ks-gray-2)'}`,
                borderRadius: '8px',
                padding: '1.75rem 1rem',
                textAlign: 'center',
                background: dragActive ? 'var(--ks-kinpaku-pale)' : 'var(--ks-paper-deep)',
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
              <FileText size={28} color={file ? 'var(--ks-kinpaku)' : 'var(--ks-text-faint)'} style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: file ? 'var(--ks-ink)' : 'var(--ks-text-muted)' }}>
                {file ? file.name : 'Click or drag CSV here to upload'}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--ks-text-faint)', marginTop: '0.25rem' }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Tabular CSV format • UTF-8 encoding'}
              </div>
            </div>

            <div>
              <label className="form-label">Dataset Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. industrial_iot_sensors"
                value={datasetName}
                onChange={(e) => setDatasetName(e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Sampling frequency, operational thresholds, baseline specs..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {uploadError && (
              <div className="badge badge-vermilion" style={{ padding: '0.5rem', width: '100%', justifyContent: 'flex-start' }}>
                <AlertCircle size={14} />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="badge badge-patina" style={{ padding: '0.5rem', width: '100%', justifyContent: 'flex-start' }}>
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
                  <span className="pulse-dot pulse-dot-patina" />
                  <span>Profiling & Ingesting...</span>
                </>
              ) : (
                <>
                  <Upload size={15} />
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
              <Database size={18} color="var(--ks-kinpaku)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--ks-ink)' }}>Platform Dataset Catalog</h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--ks-text-muted)', fontFamily: 'var(--font-mono)' }}>
              {datasets.length} Total
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {datasets.length === 0 ? (
              <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--ks-text-muted)' }}>
                <Database size={40} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
                <p>No datasets registered yet. Upload a CSV file to begin analysis.</p>
              </div>
            ) : (
              datasets.map((d) => {
                const isSelected = activeDataset?.id === d.id;
                const isDerived = !!d.parent_dataset_id;

                return (
                  <div
                    key={d.id}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem 1.5rem',
                      borderLeft: isSelected ? '4px solid var(--ks-kinpaku)' : '1px solid var(--border-subtle)',
                      background: isSelected ? 'var(--ks-kinpaku-pale)' : 'var(--ks-paper-raised)',
                      boxShadow: 'var(--ks-lift-1)',
                      borderRadius: '8px',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--ks-ink)' }}>
                            {d.name}
                          </span>
                          {isDerived ? (
                            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                              <GitFork size={10} /> CLEANED VERSION
                            </span>
                          ) : (
                            <span className="badge badge-patina" style={{ fontSize: '0.65rem' }}>
                              ORIGINAL SOURCE
                            </span>
                          )}
                          {isSelected && (
                            <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                              <CheckCircle size={10} /> ACTIVE
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--ks-text-muted)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                          File: {d.filename}
                        </div>

                        {d.description && (
                          <div style={{ fontSize: '0.84rem', color: 'var(--ks-text-muted)', marginTop: '0.4rem', lineHeight: 1.45 }}>
                            {d.description}
                          </div>
                        )}

                        {/* Metadata row */}
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '1.25rem', 
                          marginTop: '0.75rem', 
                          color: 'var(--ks-text-muted)',
                          fontSize: '0.78rem',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Layers size={13} color="var(--ks-kinpaku-rich)" />
                            <strong style={{ color: 'var(--ks-ink)' }}>{d.rows ?? d.row_count ?? 0}</strong> rows × <strong style={{ color: 'var(--ks-ink)' }}>{d.columns ?? d.column_count ?? 0}</strong> cols
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <HardDrive size={13} color="var(--ks-kinpaku-rich)" />
                            {(d.bytes ?? d.file_size_bytes) ? `${((d.bytes ?? d.file_size_bytes) / 1024).toFixed(1)} KB` : 'N/A'}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Calendar size={13} />
                            {new Date(d.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: '0.5rem', alignSelf: 'center' }}>
                        {isSelected ? (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.5rem 0.9rem', fontSize: '0.78rem' }}
                            onClick={() => onNavigateTab('datalab')}
                          >
                            <span>Inspect Lab</span>
                            <ArrowRight size={13} />
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '0.5rem 0.9rem', fontSize: '0.78rem' }}
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
