import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { 
  TableProperties, 
  Search, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle, 
  Database,
  Calendar,
  Hash,
  Type,
  ToggleLeft
} from 'lucide-react';

export default function DataLabTab({ activeDataset }) {
  const [inspectData, setInspectData] = useState(null);
  const [schemaData, setSchemaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (!activeDataset?.id) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      api.inspectDataset(activeDataset.id),
      api.getSchema(activeDataset.id).catch(() => null),
    ])
      .then(([inspect, schema]) => {
        if (isMounted) {
          setInspectData(inspect);
          setSchemaData(schema);
        }
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Failed to inspect dataset');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [activeDataset?.id]);

  if (!activeDataset) {
    return (
      <div className="glass-panel" style={{ margin: '2rem', padding: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Please select a dataset to inspect in Data Lab.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cyan-neon)' }}>
        <span className="pulse-dot pulse-dot-cyan" style={{ width: 14, height: 14, marginRight: 8 }} />
        <span>Loading schema and inspecting records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="badge badge-rose" style={{ margin: '2rem', padding: '1rem', width: 'auto' }}>
        <AlertTriangle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  const inspection = inspectData?.inspection || {};
  const schemaObj = inspectData?.schema || schemaData || {};
  
  const schemaList = Array.isArray(schemaObj?.columns) ? schemaObj.columns : [];
  const columnDetails = inspection?.column_details || activeDataset?.profile?.columns || [];
  
  // Extract column name strings
  const columns = columnDetails.length > 0 
    ? columnDetails.map(c => typeof c === 'string' ? c : c.name).filter(Boolean)
    : schemaList.map(c => typeof c === 'string' ? c : c.name).filter(Boolean);

  const rows = inspection?.preview || inspectData?.head || inspectData?.preview || [];

  const quality = {
    row_count: inspection?.rows ?? activeDataset?.rows ?? activeDataset?.row_count ?? 0,
    column_count: inspection?.columns ?? activeDataset?.columns ?? activeDataset?.column_count ?? 0,
    missing_cells: activeDataset?.quality?.missing_cells ?? 0,
    duplicate_rows: inspection?.duplicate_rows ?? activeDataset?.quality?.duplicate_rows ?? 0,
    memory_usage_bytes: inspection?.memory_usage_bytes ?? activeDataset?.bytes ?? 0,
    missing_percentage: activeDataset?.quality?.missing_cells ? ((activeDataset.quality.missing_cells / ((activeDataset.rows || 1) * (activeDataset.columns || 1))) * 100) : 0,
  };

  const schemaCols = {};
  schemaList.forEach(c => { if (c && c.name) schemaCols[c.name] = c; });
  columnDetails.forEach(c => {
    if (typeof c === 'object' && c.name) {
      schemaCols[c.name] = {
        ...schemaCols[c.name],
        inferred_dtype: c.dtype || schemaCols[c.name]?.physical_type,
        logical_type: schemaCols[c.name]?.logical_type || (c.dtype?.includes('int') || c.dtype?.includes('float') ? 'numeric' : 'categorical'),
        null_count: c.missing_count ?? 0
      };
    }
  });

  // Filter rows based on search
  const filteredRows = rows.filter((r) => {
    if (!searchTerm) return true;
    return Object.values(r).some((val) => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const paginatedRows = filteredRows.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;

  const getTypeIcon = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('date') || t.includes('time')) return <Calendar size={13} color="var(--purple-telemetry)" />;
    if (t.includes('num') || t.includes('int') || t.includes('float')) return <Hash size={13} color="var(--cyan-neon)" />;
    if (t.includes('bool')) return <ToggleLeft size={13} color="var(--emerald-pulse)" />;
    return <Type size={13} color="var(--orange-racing)" />;
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Quality Overview KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            DATA DIMENSIONS
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--cyan-neon)', fontFamily: 'var(--font-display)', marginTop: '0.25rem' }}>
            {quality.row_count || activeDataset.row_count} × {quality.column_count || activeDataset.column_count}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {((quality.row_count || 1) * (quality.column_count || 1)).toLocaleString()} Total Cells
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            MISSING VALUES
          </div>
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: 800, 
            color: (quality.missing_cells || 0) > 0 ? 'var(--amber-warn)' : 'var(--emerald-pulse)', 
            fontFamily: 'var(--font-display)', 
            marginTop: '0.25rem' 
          }}>
            {quality.missing_cells ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            {quality.missing_percentage ? `${quality.missing_percentage.toFixed(1)}% of matrix` : '0% missing'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            DUPLICATE ROWS
          </div>
          <div style={{ 
            fontSize: '1.75rem', 
            fontWeight: 800, 
            color: (quality.duplicate_rows || 0) > 0 ? 'var(--rose-alert)' : 'var(--emerald-pulse)', 
            fontFamily: 'var(--font-display)', 
            marginTop: '0.25rem' 
          }}>
            {quality.duplicate_rows ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Exact row duplications detected
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            MEMORY USAGE
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--purple-telemetry)', fontFamily: 'var(--font-display)', marginTop: '0.25rem' }}>
            {quality.memory_usage_bytes ? `${(quality.memory_usage_bytes / 1024).toFixed(1)} KB` : 'N/A'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            In-memory DataFrame allocation
          </div>
        </div>
      </div>

      {/* Column Schema Definition Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <TableProperties size={20} color="var(--cyan-neon)" />
            <h3>Inferred Schema & Feature Types</h3>
          </div>
          <span className="badge badge-cyan">
            {columns.length} Features
          </span>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>FEATURE</th>
                <th>LOGICAL TYPE</th>
                <th>PHYSICAL DTYPE</th>
                <th>NULL COUNT</th>
                <th>SAMPLE VALUE</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((colName) => {
                const schemaInfo = schemaCols[colName] || {};
                const logicalType = schemaInfo.logical_type || 'unknown';
                const physicalDtype = schemaInfo.inferred_dtype || 'object';
                const nullCount = schemaInfo.null_count ?? '-';
                const firstRowVal = rows[0] ? String(rows[0][colName] ?? '') : '-';

                return (
                  <tr key={colName}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{colName}</td>
                    <td>
                      <span className="badge badge-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        {getTypeIcon(logicalType)}
                        <span>{logicalType.toUpperCase()}</span>
                      </span>
                    </td>
                    <td>
                      <code style={{ color: 'var(--cyan-neon)', fontSize: '0.75rem' }}>{physicalDtype}</code>
                    </td>
                    <td>
                      {nullCount > 0 ? (
                        <span style={{ color: 'var(--amber-warn)' }}>{nullCount} nulls</span>
                      ) : (
                        <span style={{ color: 'var(--emerald-pulse)' }}>0</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {firstRowVal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Records Table with Search and Pagination */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet size={20} color="var(--orange-racing)" />
            <h3>Inspected Records Preview</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: 220 }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search values..."
                className="form-input"
                style={{ paddingLeft: '1.9rem', fontSize: '0.8rem', padding: '0.45rem 0.45rem 0.45rem 1.9rem' }}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
              />
            </div>

            {/* Page Size */}
            <select
              className="form-select"
              style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
            >
              <option value={10}>10 rows</option>
              <option value={15}>15 rows</option>
              <option value={25}>25 rows</option>
              <option value={50}>50 rows</option>
            </select>
          </div>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                {columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No matching records found.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--text-muted)' }}>{page * pageSize + idx + 1}</td>
                    {columns.map((c) => (
                      <td key={c}>
                        {r[c] === null || r[c] === undefined ? (
                          <span style={{ color: 'var(--amber-warn)', fontStyle: 'italic' }}>null</span>
                        ) : (
                          String(r[c])
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <div>
            Showing {filteredRows.length > 0 ? page * pageSize + 1 : 0} to {Math.min((page + 1) * pageSize, filteredRows.length)} of {filteredRows.length} rows
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontFamily: 'var(--font-mono)' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
