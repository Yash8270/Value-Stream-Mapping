import React, { useContext, useState, useEffect, useCallback } from 'react';
import ConnectContext from './Connectcontext';
import { api } from './Api';
import useVsmStore from '../store/useVsmStore';

export const VSMContext = ConnectContext;
export { ConnectContext };

export const useVSM = () => {
  const context = useContext(ConnectContext);
  if (!context) {
    throw new Error('useVSM must be used within a VSMProvider');
  }
  return context;
};

export function VSMProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('vsm_auth_token') || null);
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProjectState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved' | 'failed'
  const [importStatus, setImportStatus] = useState('idle'); // 'idle' | 'uploading' | 'completed' | 'failed'
  const [importValidationError, setImportValidationError] = useState(null); // Structured error object

  const { setVsmModel, nodes, edges, stages, project: storeProject } = useVsmStore();

  const isAuthenticated = !!token && !!user;

  // Initialize auth user on mount or token change
  useEffect(() => {
    if (token) {
      localStorage.setItem('vsm_auth_token', token);
      api.getCurrentUser(token)
        .then(u => {
          setUser(u);
        })
        .catch(err => {
          console.error("Auth check failed:", err);
          logout();
        });
    } else {
      localStorage.removeItem('vsm_auth_token');
      setUser(null);
      setProjects([]);
    }
  }, [token]);

  // Load user projects when authenticated
  const loadProjects = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProjects(token);
      setProjects(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      loadProjects();
    }
  }, [isAuthenticated, loadProjects]);

  // AUTH ACTIONS
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(credentials);
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googlePayload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loginWithGoogle(googlePayload);
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.register(userData);
      setToken(res.access_token);
      setUser(res.user);
      return res.user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setProjects([]);
    setCurrentProjectState(null);
    localStorage.removeItem('vsm_auth_token');
  };

  // PROJECT ACTIONS
  const loadProject = async (projectId) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const proj = await api.getProject(projectId, token);
      setCurrentProjectState(proj);

      let modelData = proj.current_model;
      if (typeof modelData === 'string') {
        try {
          modelData = JSON.parse(modelData);
        } catch {
          // Keep as is
        }
      }

      if (modelData) {
        setVsmModel(modelData);
      }
      setSaveStatus('saved');
      return proj;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createProject = async ({ name, description, sourceType = 'MANUAL', initialModel }) => {
    if (!token) throw new Error("Must be logged in to create a project");
    setLoading(true);
    setError(null);
    try {
      const defaultModel = initialModel || {
        id: Date.now().toString(),
        project: { id: 'new', name, product: 'Manufacturing Line' },
        nodes: [],
        connections: [],
        stages: [],
        metadata: {}
      };

      const proj = await api.createProject({
        name,
        description,
        source_type: sourceType,
        initial_model: defaultModel
      }, token);

      setCurrentProjectState(proj);
      setVsmModel(proj.current_model || defaultModel);
      setSaveStatus('saved');
      
      await loadProjects();
      return proj;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveProject = async () => {
    if (!currentProject || !token) {
      setSaveStatus('saving');
      const draft = { nodes, edges, stages, project: storeProject || { name: 'Draft' } };
      localStorage.setItem('vsm_draft', JSON.stringify(draft));
      setSaveStatus('saved');
      return;
    }

    setSaveStatus('saving');
    try {
      const updatedModel = {
        id: currentProject.id,
        project: { id: currentProject.id, name: currentProject.name, product: storeProject?.product || 'Line' },
        nodes,
        connections: edges,
        stages,
        metadata: { last_saved: new Date().toISOString() }
      };

      const updatedProj = await api.updateProject(currentProject.id, {
        name: currentProject.name,
        description: currentProject.description,
        current_model: updatedModel
      }, token);

      setCurrentProjectState(updatedProj);
      setSaveStatus('saved');
      await loadProjects();
    } catch (err) {
      setSaveStatus('failed');
      setError(err.message);
      throw err;
    }
  };

  const deleteProject = async (projectId) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await api.deleteProject(projectId, token);
      if (currentProject?.id === projectId) {
        setCurrentProjectState(null);
      }
      await loadProjects();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // IMPORTS
  const uploadExcel = async (projectId, file) => {
    setImportStatus('uploading');
    setError(null);
    setImportValidationError(null);
    try {
      const res = await api.uploadExcel(projectId, file, token);
      if (res.success && res.vsm) {
        setVsmModel(res.vsm);
        if (projectId) {
          await loadProject(projectId);
        }
        setImportStatus('completed');
      } else {
        setImportStatus('failed');
        if (res.error) setImportValidationError(res.error);
        setError(res.error?.message || res.errors?.[0] || 'Excel parse failed');
      }
      return res;
    } catch (err) {
      setImportStatus('failed');
      const errDetail = err.errorDetail || err.data?.error || null;
      if (errDetail) {
        setImportValidationError(errDetail);
      }
      setError(err.message);
      throw err;
    }
  };

  const uploadJson = async (projectId, file) => {
    setImportStatus('uploading');
    setError(null);
    setImportValidationError(null);
    try {
      const res = await api.uploadJson(projectId, file, token);
      if (res.success && res.vsm) {
        setVsmModel(res.vsm);
        if (projectId) {
          await loadProject(projectId);
        }
        setImportStatus('completed');
      } else {
        setImportStatus('failed');
        if (res.error) setImportValidationError(res.error);
        setError(res.error?.message || res.errors?.[0] || 'JSON parse failed');
      }
      return res;
    } catch (err) {
      setImportStatus('failed');
      const errDetail = err.errorDetail || err.data?.error || null;
      if (errDetail) {
        setImportValidationError(errDetail);
      }
      setError(err.message);
      throw err;
    }
  };

  const setCurrentProject = (proj) => {
    setCurrentProjectState(proj);
    if (proj?.current_model) {
      let modelData = proj.current_model;
      if (typeof modelData === 'string') {
        try {
          modelData = JSON.parse(modelData);
        } catch {
          // Keep as is
        }
      }
      setVsmModel(modelData);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    projects,
    currentProject,
    loading,
    error,
    saveStatus,
    importStatus,
    importValidationError,
    setImportValidationError,
    login,
    loginWithGoogle,
    register,
    logout,
    loadProjects,
    loadProject,
    createProject,
    saveProject,
    deleteProject,
    uploadExcel,
    uploadJson,
    setCurrentProject,
    clearError: () => { setError(null); setImportValidationError(null); },
  };

  return (
    <ConnectContext.Provider value={value}>
      {children}
    </ConnectContext.Provider>
  );
}

export const ConnectContextProvider = VSMProvider;

