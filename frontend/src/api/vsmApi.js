const API_BASE = '/api/v1';

async function request(path, options) {
  const res = await fetch(`${API_BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error ${res.status}: ${err}`);
  }
  return res.json();
}

export const vsmApi = {
  health: () => request('/health'),

  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/import/excel', { method: 'POST', body: formData });
  },

  importJson: (data) =>
    request('/import/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  generate: (data) =>
    request('/vsm/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  list: () => request('/vsm/'),
  get: (id) => request(`/vsm/${id}`),

  save: (id, data) =>
    request(`/vsm/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),

  delete: (id) => request(`/vsm/${id}`, { method: 'DELETE' }),

  exportPdf: async (id) => {
    const res = await fetch(`${API_BASE}/vsm/${id}/export/pdf`, { method: 'POST' });
    if (!res.ok) throw new Error('PDF export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `vsm_${id}.pdf`; a.click();
    URL.revokeObjectURL(url);
  },

  exportPng: async (id) => {
    const res = await fetch(`${API_BASE}/vsm/${id}/export/png`, { method: 'POST' });
    if (!res.ok) throw new Error('PNG export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `vsm_${id}.png`; a.click();
    URL.revokeObjectURL(url);
  },

  exportJson: (id) => request(`/vsm/${id}/export/json`),
};
