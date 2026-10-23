import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  Sliders, 
  Eye, 
  CheckCircle, 
  GitFork, 
  AlertCircle, 
  ArrowRight, 
  Trash2, 
  Sparkles,
  Layers,
  Wand2
} from 'lucide-react';

export default function CleaningPipelineTab({ 
  activeDataset, 
  onRefreshDatasets, 
  setActiveDatasetId,
  onNavigateTab
}) {
  const [inspectData, setInspectData] = useState(null);
  const [dropMissing, setDropMissing] = useState(false);
  const [imputeNumeric, setImputeNumeric] = useState('median');
  const [imputeCategorical, setImputeCategorical] = useState('mode');
  const [dropDuplicates, setDropDuplicates] = useState(true);
  const [selectedDropCols, setSelectedDropCols] = useState([]);
  const [newDatasetName, setNewDatasetName] = useState('');

  // Preview state
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState(null);
  const [previewError, setPreviewError] = useState(null);

  // Apply state
  const [applyLoading, setApplyLoading] = useState(false);
  const [applySuccess, setApplySuccess] = useState(null);
  const [applyError, setApplyError] = useState(null);

  // Pipeline Preview State
  const [pipelineScaler, setPipelineScaler] = useState('standard');
  const [pipelineNumericImputer, setPipelineNumericImputer] = useState('median');
  const [pipelinePreviewData, setPipelinePreviewData] = useState(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);

  useEffect(() => {
    if (!activeDataset?.id) return;
    setNewDatasetName(`${activeDataset.name}_cleaned`);
    setPreviewResult(null);
    setApplySuccess(null);

    api.inspectDataset(activeDataset.id)
      .then((data) => setInspectData(data))
      .catch((err) => console.error(err));
  }, [activeDataset?.id]);

  if (!activeDataset) {
    return (
      <div className="glass-panel" style={{ margin: '2rem', padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Please select a dataset to configure cleaning and transformation.</p>
      </div>
    );
  }

  const columns = inspectData?.columns || [];

  const handleToggleDropCol = (col) => {
    if (selectedDropCols.includes(col)) {
      setSelectedDropCols(selectedDropCols.filter((c) => c !== col));
    } else {
      setSelectedDropCols([...selectedDropCols, col]);
    }
  };

  const getOperationsPayload = () => {
    return {
      drop_na: dropMissing,
      impute_numeric: imputeNumeric !== 'none' ? imputeNumeric : null,
      impute_categorical: imputeCategorical !== 'none' ? imputeCategorical : null,
      drop_duplicates: dropDuplicates,
      drop_columns: selectedDropCols,
    };
  };

  const handlePreviewCleaning = async () => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await api.previewCleaning(activeDataset.id, getOperationsPayload());
      setPreviewResult(res);
    } catch (err) {
      setPreviewError(err.message || 'Failed to preview cleaning impact');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleApplyCleaning = async () => {
    setApplyLoading(true);
    setApplyError(null);
    setApplySuccess(null);
    try {
      const payload = {
        operations: getOperationsPayload(),
        new_dataset_name: newDatasetName || `${activeDataset.name}_cleaned`,
      };
      const res = await api.applyCleaning(activeDataset.id, payload);
      setApplySuccess(`Created new cleaned dataset: "${res.name}" with full lineage!`);
      await onRefreshDatasets();
      setActiveDatasetId(res.id);
    } catch (err) {
      setApplyError(err.message || 'Failed to apply cleaning operations');
    } finally {
      setApplyLoading(false);
    }
  };

  const handlePreviewPipeline = async () => {
    setPipelineLoading(true);
    try {
      const payload = {
        scaler: pipelineScaler,
        numeric_imputer: pipelineNumericImputer,
      };
      const res = await api.previewPipeline(activeDataset.id, payload);
      setPipelinePreviewData(res);
    } catch (err) {
      console.error('Pipeline preview failed:', err);
    } finally {
      setPipelineLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Cleaning Wizard Container */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 420px) 1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Cleaning Configuration Form */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Wand2 size={20} color="var(--cyan-neon)" />
            <h3>Cleaning Operations</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Target Cleaned Name */}
            <div>
              <label className="form-label">Versioned Dataset Name</label>
              <input
                type="text"
                className="form-input"
                value={newDatasetName}
                onChange={(e) => setNewDatasetName(e.target.value)}
              />
            </div>

            {/* Missing Value Handling */}
            <div style={{ background: 'rgba(14, 20, 32, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Missing Values Handling
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={dropMissing}
                    onChange={(e) => setDropMissing(e.target.checked)}
                  />
                  <span>Drop rows with missing cells (NA)</span>
                </label>

                {!dropMissing && (
                  <>
                    <div>
                      <label className="form-label">Numeric Imputation</label>
                      <select
                        className="form-select"
                        value={imputeNumeric}
                        onChange={(e) => setImputeNumeric(e.target.value)}
                      >
                        <option value="none">None (Keep NaN)</option>
                        <option value="median">Median (Robust)</option>
                        <option value="mean">Mean</option>
                        <option value="zero">Zero Fill</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Categorical Imputation</label>
                      <select
                        className="form-select"
                        value={imputeCategorical}
                        onChange={(e) => setImputeCategorical(e.target.value)}
                      >
                        <option value="none">None (Keep NaN)</option>
                        <option value="mode">Most Frequent (Mode)</option>
                        <option value="constant">Constant ("missing")</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Deduplication */}
            <div style={{ background: 'rgba(14, 20, 32, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={dropDuplicates}
                  onChange={(e) => setDropDuplicates(e.target.checked)}
                />
                <span>Drop Exact Duplicate Rows</span>
              </label>
            </div>

            {/* Columns to Exclude/Drop */}
            {columns.length > 0 && (
              <div style={{ background: 'rgba(14, 20, 32, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  Drop Columns ({selectedDropCols.length} selected)
                </div>
                <div style={{ maxHeight: 140, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {columns.map((c) => (
                    <label key={c} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedDropCols.includes(c)}
                        onChange={() => handleToggleDropCol(c)}
                      />
                      <span>{c}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={handlePreviewCleaning}
                disabled={previewLoading}
              >
                <Eye size={16} />
                <span>{previewLoading ? 'Simulating...' : 'Preview Impact'}</span>
              </button>

              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleApplyCleaning}
                disabled={applyLoading}
              >
                <GitFork size={16} />
                <span>{applyLoading ? 'Committing...' : 'Commit Version'}</span>
              </button>
            </div>

            {previewError && (
              <div className="badge badge-rose" style={{ padding: '0.5rem' }}>
                <AlertCircle size={14} />
                <span>{previewError}</span>
              </div>
            )}

            {applySuccess && (
              <div className="badge badge-emerald" style={{ padding: '0.5rem' }}>
                <CheckCircle size={14} />
                <span>{applySuccess}</span>
              </div>
            )}

            {applyError && (
              <div className="badge badge-rose" style={{ padding: '0.5rem' }}>
                <AlertCircle size={14} />
                <span>{applyError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Impact Preview Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Eye size={20} color="var(--orange-racing)" />
              <h3>Non-Destructive Simulation Impact</h3>
            </div>
            {previewResult && (
              <span className="badge badge-emerald">Simulation Verified</span>
            )}
          </div>

          {!previewResult ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Eye size={44} style={{ opacity: 0.3, margin: '0 auto 1rem auto' }} />
              <p>Configure cleaning rules on the left and click <strong>Preview Impact</strong> to inspect rows affected and memory delta without altering existing data.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Impact Counters */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ORIGINAL ROWS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                    {previewResult.original_row_count}
                  </div>
                </div>

                <div style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CLEANED ROWS</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--cyan-neon)', marginTop: '0.2rem' }}>
                    {previewResult.new_row_count}
                  </div>
                </div>

                <div style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>ROWS DROPPED</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: previewResult.rows_dropped > 0 ? 'var(--amber-warn)' : 'var(--emerald-pulse)', marginTop: '0.2rem' }}>
                    {previewResult.rows_dropped}
                  </div>
                </div>

                <div style={{ background: 'rgba(14, 20, 32, 0.7)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>COLS DROPPED</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--orange-racing)', marginTop: '0.2rem' }}>
                    {previewResult.columns_dropped?.length || 0}
                  </div>
                </div>
              </div>

              {/* Sample of Cleaned Rows */}
              {previewResult.sample_rows && previewResult.sample_rows.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                    Sample Cleaned Records Preview:
                  </div>
                  <div className="data-table-wrapper" style={{ maxHeight: 250 }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          {Object.keys(previewResult.sample_rows[0]).map((k) => (
                            <th key={k}>{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewResult.sample_rows.map((row, idx) => (
                          <tr key={idx}>
                            {Object.values(row).map((val, cIdx) => (
                              <td key={cIdx}>{val !== null && val !== undefined ? String(val) : 'null'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Preprocessing Feature Transformation Pipeline Section */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Layers size={20} color="var(--purple-telemetry)" />
            <h3>Feature Engineering & Leakage-Free Preprocessing Preview</h3>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
              value={pipelineScaler}
              onChange={(e) => setPipelineScaler(e.target.value)}
            >
              <option value="standard">StandardScaler (Z-Score)</option>
              <option value="minmax">MinMaxScaler [0, 1]</option>
              <option value="robust">RobustScaler (IQR)</option>
              <option value="none">No Scaling</option>
            </select>

            <button
              className="btn btn-secondary"
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
              onClick={handlePreviewPipeline}
              disabled={pipelineLoading}
            >
              <span>{pipelineLoading ? 'Extracting...' : 'Preview Extracted Features'}</span>
            </button>
          </div>
        </div>

        {pipelinePreviewData ? (
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Extracted cyclical temporal components (<code style={{ color: 'var(--cyan-neon)' }}>hour, day, month, dayofweek</code>) and scaled continuous numeric features:
            </div>
            <div className="data-table-wrapper" style={{ maxHeight: 220 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {pipelinePreviewData.feature_names?.map((fn) => (
                      <th key={fn}>{fn}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pipelinePreviewData.sample_transformed?.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.map((val, vIdx) => (
                        <td key={vIdx}>{typeof val === 'number' ? val.toFixed(3) : String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Click <strong>Preview Extracted Features</strong> to inspect how DateTime components and feature scaling transforms raw inputs before model fitting.
          </p>
        )}
      </div>
    </div>
  );
}
