const RAW_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const API_BASE_URL = RAW_URL.endsWith('/api') ? RAW_URL : (RAW_URL.endsWith('/api/v1') ? RAW_URL : `${RAW_URL}/api`);

async function handleResponse(response) {
  if (!response.ok) {
    let errorDetail = 'An unexpected error occurred';
    let errorData = null;
    try {
      errorData = await response.json();
      if (errorData && typeof errorData === 'object') {
        if (errorData.error && typeof errorData.error === 'object') {
          errorDetail = errorData.error.message || errorData.detail || JSON.stringify(errorData);
        } else {
          errorDetail = errorData.detail || errorData.message || JSON.stringify(errorData);
        }
      }
    } catch {
      errorDetail = `HTTP Error ${response.status}: ${response.statusText}`;
    }
    const err = new Error(errorDetail);
    if (errorData) {
      err.data = errorData;
      err.errorDetail = errorData.error || null;
    }
    throw err;
  }
  
  if (response.status === 204) return null;
  return response.json();
}

function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  login: async (credentials) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  loginWithGoogle: async (googlePayload) => {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(googlePayload),
    });
    return handleResponse(res);
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse(res);
  },

  getCurrentUser: async (token) => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse(res);
  },

  // Projects CRUD
  getProjects: async (token) => {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse(res);
  },

  getProject: async (projectId, token) => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });
    return handleResponse(res);
  },

  createProject: async (projectData, token) => {
    const res = await fetch(`${API_BASE_URL}/projects`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(projectData),
    });
    return handleResponse(res);
  },

  updateProject: async (projectId, projectData, token) => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(projectData),
    });
    return handleResponse(res);
  },

  deleteProject: async (projectId, token) => {
    const res = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    return handleResponse(res);
  },

  // Imports
  uploadExcel: async (projectId, file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const endpoint = projectId
      ? `${API_BASE_URL}/projects/${projectId}/import/excel`
      : `${API_BASE_URL}/import/excel`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(res);
  },

  uploadJson: async (projectId, file, token) => {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const endpoint = projectId
      ? `${API_BASE_URL}/projects/${projectId}/import/json`
      : `${API_BASE_URL}/import/json`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });
    return handleResponse(res);
  },
};

export default api;
