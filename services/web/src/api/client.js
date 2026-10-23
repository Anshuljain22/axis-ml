/**
 * Pitwall OS Core - API Client
 * Clean REST client interfacing with the FastAPI backend
 */

const BASE_URL = '';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = `Request failed: ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
      }
    } catch {
      // ignore json parse error
    }
    const error = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export const api = {
  // System Health
  getHealth: () => request('/api/v1/health'),

  // Datasets
  getDatasets: () => request('/api/v1/datasets'),
  getDataset: (id) => request(`/api/v1/datasets/${id}`),
  uploadDataset: async (file, name, description) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);

    const res = await fetch(`${BASE_URL}/api/v1/datasets`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },
  getSchema: (id) => request(`/api/v1/datasets/${id}/schema`),
  inspectDataset: (id) => request(`/api/v1/datasets/${id}/inspect`),
  getWorkflowStatus: (id) => request(`/api/v1/datasets/${id}/workflow`),

  // EDA Studio
  getEdaSummary: (id) => request(`/api/v1/datasets/${id}/eda/summary`),
  getDiagnostics: (id) => request(`/api/v1/datasets/${id}/eda/diagnostics`),
  getStatistics: (id) => request(`/api/v1/datasets/${id}/eda/statistics`),
  getDistributions: (id) => request(`/api/v1/datasets/${id}/eda/distributions`),
  getCorrelations: (id) => request(`/api/v1/datasets/${id}/eda/correlations`),
  getTimeSeries: (id, timeColumn) => {
    const query = timeColumn ? `?time_column=${encodeURIComponent(timeColumn)}` : '';
    return request(`/api/v1/datasets/${id}/eda/time-series${query}`);
  },

  // Cleaning & Preprocessing Pipeline
  previewCleaning: (id, operations) => {
    const payload = Array.isArray(operations) ? { operations } : (operations.operations ? operations : { operations: [operations] });
    return request(`/api/v1/datasets/${id}/cleaning/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  },
  applyCleaning: (id, payload) => request(`/api/v1/datasets/${id}/cleaning/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  previewPipeline: (id, payload) => request(`/api/v1/datasets/${id}/pipeline/preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),

  // Model Training & Experiments
  trainModel: (id, payload) => request(`/api/v1/datasets/${id}/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
  getRuns: (datasetId) => {
    const query = datasetId ? `?dataset_id=${encodeURIComponent(datasetId)}` : '';
    return request(`/api/v1/runs${query}`);
  },
  getRun: (id) => request(`/api/v1/runs/${id}`),
  compareRuns: (datasetId) => request(`/api/v1/datasets/${datasetId}/runs/compare`),

  // Live Inference
  predictSingle: (runId, inputs) => request(`/api/v1/runs/${runId}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputs),
  }),
  predictBatch: (runId, samples) => request(`/api/v1/runs/${runId}/predict-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ samples: Array.isArray(samples) ? samples : [samples] }),
  }),
};
