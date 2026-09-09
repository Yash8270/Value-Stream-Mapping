import React, { useState, useRef } from 'react';
import { useVSM } from '../../context/Context';
import useVsmStore from '../../store/useVsmStore';
import { useNavigate } from '../../router/Router';
import ImportValidationErrorModal from '../common/ImportValidationErrorModal';
import UploadProgressModal from '../common/UploadProgressModal';
import { 
  Plus, 
  FileSpreadsheet, 
  FileJson, 
  Edit3, 
  FolderOpen, 
  Trash2, 
  ArrowRight, 
  LogOut, 
  Clock, 
  Activity,
  Loader2,
  X,
  Save,
  Edit2,
  Layers,
  Sparkles
} from 'lucide-react';

export default function ProjectsDashboard({ onOpenManualWizard }) {
  const { 
    user, 
    projects, 
    loading, 
    logout, 
    loadProject, 
    createProject, 
    deleteProject,
    uploadExcel,
    uploadJson,
    loadProjects,
    importValidationError,
    setImportValidationError
  } = useVSM();

  const setVsmModel = useVsmStore(s => s.setVsmModel);
  const navigate = useNavigate();

  const excelInputRef = useRef(null);
  const jsonInputRef = useRef(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createMode, setCreateMode] = useState('manual'); // 'manual' | 'excel' | 'json'
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  // Upload progress modal state
  const [uploadProgressState, setUploadProgressState] = useState({ isOpen: false, fileName: '', type: 'EXCEL' });

  // Edit / Rename Project Modal State
  const [editProjModal, setEditProjModal] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const handleCreateManual = async () => {
    const name = newProjName.trim() || 'Untitled VSM Project';
    const emptyModel = {
      id: Date.now().toString(),
      project: { id: 'manual', name, product: 'Manufacturing Line' },
      nodes: [],
      connections: [],
      stages: [],
      metadata: { created_via: 'manual' }
    };

    try {
      const proj = await createProject({ 
        name, 
        description: newProjDesc.trim(), 
        sourceType: 'MANUAL', 
        initialModel: emptyModel 
      });
      setVsmModel(emptyModel);
      setNewProjName('');
      setNewProjDesc('');
      setIsCreateModalOpen(false);
      navigate(`/project/${proj.id}`);
    } catch (err) {
      alert('Failed to create project: ' + err.message);
    }
  };

  const handleOpenProject = async (projId) => {
    try {
      await loadProject(projId);
      navigate(`/project/${projId}`);
    } catch (err) {
      alert('Failed to load project: ' + err.message);
    }
  };

  const handleDeleteProject = async (e, projId, name) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete project "${name}"?`)) {
      try {
        await deleteProject(projId);
      } catch (err) {
        alert('Failed to delete project: ' + err.message);
      }
    }
  };

  const handleOpenEditModal = (e, proj) => {
    e.stopPropagation();
    setEditProjModal(proj);
    setEditName(proj.name || '');
    setEditDesc(proj.description || '');
  };

  const handleSaveEditModal = async () => {
    if (!editProjModal || !editName.trim()) return;
    try {
      const { api } = await import('../../context/Api');
      const token = localStorage.getItem('vsm_auth_token');
      await api.updateProject(editProjModal.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        current_model: editProjModal.current_model || {}
      }, token);

      setEditProjModal(null);
      await loadProjects();
    } catch (err) {
      alert('Failed to update project: ' + err.message);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgressState({ isOpen: true, fileName: file.name, type: 'EXCEL' });

    try {
      const rawName = file.name.replace(/\.[^/.]+$/, '');
      const cleanName = rawName.replace(/[_]/g, ' ').replace(/\s+/g, ' ');

      const proj = await createProject({ 
        name: cleanName, 
        description: newProjDesc.trim() || 'Imported from Excel workbook',
        sourceType: 'EXCEL' 
      });
      const res = await uploadExcel(proj.id, file);
      if (res && res.success) {
        setTimeout(() => {
          setUploadProgressState({ isOpen: false, fileName: '', type: 'EXCEL' });
          setIsCreateModalOpen(false);
          navigate(`/project/${proj.id}`);
        }, 1500);
      } else {
        setUploadProgressState({ isOpen: false, fileName: '', type: 'EXCEL' });
      }
    } catch (err) {
      setUploadProgressState({ isOpen: false, fileName: '', type: 'EXCEL' });
      console.error("Excel Import Error:", err);
    } finally {
      e.target.value = '';
    }
  };

  const handleJsonUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgressState({ isOpen: true, fileName: file.name, type: 'JSON' });

    try {
      const rawName = file.name.replace(/\.[^/.]+$/, '');
      const cleanName = rawName.replace(/[_]/g, ' ').replace(/\s+/g, ' ');

      const proj = await createProject({ 
        name: cleanName, 
        description: newProjDesc.trim() || 'Imported from JSON model',
        sourceType: 'JSON' 
      });
      const res = await uploadJson(proj.id, file);
      if (res && res.success) {
        setTimeout(() => {
          setUploadProgressState({ isOpen: false, fileName: '', type: 'JSON' });
          setIsCreateModalOpen(false);
          navigate(`/project/${proj.id}`);
        }, 1500);
      } else {
        setUploadProgressState({ isOpen: false, fileName: '', type: 'JSON' });
      }
    } catch (err) {
      setUploadProgressState({ isOpen: false, fileName: '', type: 'JSON' });
      console.error("JSON Import Error:", err);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
      color: 'var(--text)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <input ref={excelInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} style={{ display: 'none' }} />
      <input ref={jsonInputRef} type="file" accept=".json" onChange={handleJsonUpload} style={{ display: 'none' }} />

      {/* ANIMATED UPLOAD PROGRESS MODAL */}
      <UploadProgressModal
        isOpen={uploadProgressState.isOpen}
        fileName={uploadProgressState.fileName}
        type={uploadProgressState.type}
      />

      {/* IMPORT VALIDATION ERROR MODAL */}
      <ImportValidationErrorModal
        isOpen={!!importValidationError}
        onClose={() => setImportValidationError(null)}
        errorDetail={importValidationError}
      />

      {/* CREATE NEW PROJECT MODAL */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          backgroundColor: 'rgba(15,35,55,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          animation: 'fadeIn 180ms ease forwards',
        }}>
          <div style={{
            width: '100%', maxWidth: '530px', backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)', padding: '30px', position: 'relative',
            animation: 'modalScale 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--vsm-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-md)', background: 'rgba(47,111,173,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} color="var(--vsm-blue)" />
                </div>
                Create New VSM Project
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer', padding: '4px', borderRadius: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Animated Tab Switcher */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '22px', background: '#EDF2F7', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
              <button
                onClick={() => setCreateMode('manual')}
                style={{
                  flex: 1, padding: '9px 12px', fontSize: '12.5px', fontWeight: 700, borderRadius: 'var(--radius-md)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: createMode === 'manual' ? '#FFFFFF' : 'transparent',
                  color: createMode === 'manual' ? 'var(--vsm-navy)' : 'var(--secondary-text)',
                  boxShadow: createMode === 'manual' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <Edit3 size={14} /> Blank Diagram
              </button>
              <button
                onClick={() => setCreateMode('excel')}
                style={{
                  flex: 1, padding: '9px 12px', fontSize: '12.5px', fontWeight: 700, borderRadius: 'var(--radius-md)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: createMode === 'excel' ? '#FFFFFF' : 'transparent',
                  color: createMode === 'excel' ? 'var(--vsm-process)' : 'var(--secondary-text)',
                  boxShadow: createMode === 'excel' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <FileSpreadsheet size={14} /> Upload Excel
              </button>
              <button
                onClick={() => setCreateMode('json')}
                style={{
                  flex: 1, padding: '9px 12px', fontSize: '12.5px', fontWeight: 700, borderRadius: 'var(--radius-md)',
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: createMode === 'json' ? '#FFFFFF' : 'transparent',
                  color: createMode === 'json' ? 'var(--vsm-navy)' : 'var(--secondary-text)',
                  boxShadow: createMode === 'json' ? 'var(--shadow-sm)' : 'none',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <FileJson size={14} /> Upload JSON
              </button>
            </div>

            {/* Mode 1: Blank Manual Project */}
            {createMode === 'manual' && (
              <div className="animate-fade-in">
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>Project Name</label>
                  <input
                    type="text"
                    autoFocus
                    value={newProjName}
                    onChange={e => setNewProjName(e.target.value)}
                    placeholder="e.g. Fibre-Q Assembly Line VSM"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '22px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={newProjDesc}
                    onChange={e => setNewProjDesc(e.target.value)}
                    placeholder="e.g. Subassembly processes, cycle times, and WIP inventory flow"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button onClick={() => setIsCreateModalOpen(false)} style={{ padding: '9px 16px', border: '1px solid var(--border)', background: '#FFFFFF', borderRadius: 'var(--radius-md)' }}>
                    Cancel
                  </button>
                  <button onClick={handleCreateManual} style={{ padding: '9px 20px', background: 'var(--vsm-navy)', color: '#FFFFFF', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(22,50,79,0.25)' }}>
                    Create Blank VSM <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Upload Excel */}
            {createMode === 'excel' && (
              <div className="animate-fade-in" style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(22,169,216,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'
                }}>
                  <FileSpreadsheet size={32} color="var(--vsm-process)" className="float-icon" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--vsm-navy)', marginBottom: '6px' }}>Select Excel Workbook (.xlsx, .xls)</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--secondary-text)', marginBottom: '22px', maxWidth: '380px', margin: '0 auto 22px' }}>
                  FastAPI will automatically parse and validate your process rows, flow order, and WIP inventory before generating the diagram.
                </p>
                <button
                  onClick={() => excelInputRef.current?.click()}
                  style={{
                    padding: '11px 24px', background: 'var(--vsm-process)', color: '#FFFFFF',
                    fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(22,169,216,0.35)',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <FileSpreadsheet size={16} /> Choose Excel File & Parse →
                </button>
              </div>
            )}

            {/* Mode 3: Upload JSON */}
            {createMode === 'json' && (
              <div className="animate-fade-in" style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(22,50,79,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px'
                }}>
                  <FileJson size={32} color="var(--vsm-navy)" className="float-icon" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--vsm-navy)', marginBottom: '6px' }}>Select JSON Model File (.json)</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--secondary-text)', marginBottom: '22px', maxWidth: '380px', margin: '0 auto 22px' }}>
                  Import an existing serialized VSM diagram JSON file directly into your TiDB Cloud project workspace.
                </p>
                <button
                  onClick={() => jsonInputRef.current?.click()}
                  style={{
                    padding: '11px 24px', background: 'var(--vsm-navy)', color: '#FFFFFF',
                    fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 14px rgba(22,50,79,0.3)',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <FileJson size={16} /> Choose JSON File & Import →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT / RENAME PROJECT MODAL */}
      {editProjModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          backgroundColor: 'rgba(15,35,55,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
          animation: 'fadeIn 180ms ease forwards',
        }}>
          <div style={{
            width: '100%', maxWidth: '470px', backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)', padding: '26px', position: 'relative',
            animation: 'modalScale 220ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--vsm-navy)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit2 size={18} color="var(--vsm-blue)" /> Edit Project Details
              </div>
              <button onClick={() => setEditProjModal(null)} style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>Project Name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Project Name (e.g. Fibre-Q Manufacturing Line)"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '6px' }}>Description / Notes (Optional)</label>
              <textarea
                rows={3}
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder="Add optional notes or description..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '13px', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setEditProjModal(null)} style={{ padding: '8px 14px', border: '1px solid var(--border)', background: '#FFFFFF', borderRadius: 'var(--radius-md)' }}>
                Cancel
              </button>
              <button onClick={handleSaveEditModal} style={{ padding: '8px 18px', background: 'var(--vsm-navy)', color: '#FFFFFF', fontWeight: 700, borderRadius: 'var(--radius-md)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 6px rgba(22,50,79,0.2)' }}>
                <Save size={14} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <header style={{
        height: '56px',
        backgroundColor: 'var(--vsm-navy)',
        color: '#FFFFFF',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 10px rgba(15,35,55,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--vsm-process) 0%, var(--vsm-blue) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(22,169,216,0.3)',
          }}>
            <Activity size={18} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em' }}>VSM Studio</span>
          <span style={{ color: '#64748B', fontSize: '14px' }}>/</span>
          <span style={{ fontSize: '13.5px', color: '#CBD5E1', fontWeight: 500 }}>Projects Dashboard</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#E2E8F0' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', background: 'var(--vsm-navy-deep)',
              border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '11px',
            }}>
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <span>{user?.name || user?.email}</span>
          </div>

          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px',
              borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.1)',
              color: '#FFFFFF', fontSize: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
              transition: 'background var(--transition-fast)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main style={{ flex: 1, maxWidth: '1120px', width: '100%', margin: '0 auto', padding: '36px 24px' }}>
        {/* Title & Top Action Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--vsm-navy)', marginBottom: '4px', letterSpacing: '-0.02em' }}>
              My VSM Projects
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--secondary-text)' }}>
              Select any project from your workspace to open and edit its interactive Value Stream Mapping diagram.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              padding: '11px 20px', borderRadius: 'var(--radius-lg)', background: 'var(--vsm-navy)',
              color: '#FFFFFF', fontWeight: 700, fontSize: '13.5px', border: 'none',
              display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(22,50,79,0.3)',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(22,50,79,0.38)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,50,79,0.3)';
            }}
          >
            <Plus size={18} /> Create New Project
          </button>
        </div>

        {/* Saved Projects List Grid / Skeleton Loader */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px' }}>
            Projects Workspace ({projects.length})
          </div>

          {loading && projects.length === 0 ? (
            /* Modern Shimmering Skeleton Project Cards */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton-card">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                      <div className="skeleton-box" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-md)' }} />
                      <div className="skeleton-box" style={{ width: '60%', height: '18px' }} />
                    </div>
                    <div className="skeleton-box" style={{ width: '90%', height: '12px', marginBottom: '8px' }} />
                    <div className="skeleton-box" style={{ width: '65%', height: '12px' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '16px' }}>
                    <div className="skeleton-box" style={{ width: '80px', height: '13px' }} />
                    <div className="skeleton-box" style={{ width: '110px', height: '13px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (projects.length === 0) ? (
            /* Animated Empty State */
            <div style={{
              padding: '56px 24px', backgroundColor: '#FFFFFF', borderRadius: 'var(--radius-xl)',
              border: '1px dashed var(--border)', textAlign: 'center', boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%', background: '#F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px'
              }}>
                <FolderOpen size={34} color="var(--secondary-text)" className="float-icon" />
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--vsm-navy)', marginBottom: '6px' }}>No projects in workspace</div>
              <div style={{ fontSize: '13px', color: 'var(--secondary-text)', marginBottom: '22px', maxWidth: '400px', margin: '0 auto 22px' }}>
                Start a fresh blank VSM diagram, upload an Excel workbook, or import a JSON serialized model.
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                style={{
                  padding: '10px 22px', background: 'var(--vsm-navy)', color: '#FFFFFF',
                  fontWeight: 700, fontSize: '13px', borderRadius: 'var(--radius-md)', border: 'none', cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(22,50,79,0.2)'
                }}
              >
                + Create New Project
              </button>
            </div>
          ) : (
            /* Animated Interactive Cards Grid */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
              {projects.map((proj, idx) => {
                const updatedDate = proj.updated_at ? new Date(proj.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';

                return (
                  <div
                    key={proj.id}
                    onClick={() => handleOpenProject(proj.id)}
                    className="hover-card animate-slide-up"
                    style={{
                      backgroundColor: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)',
                      padding: '22px', boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px',
                      animationDelay: `${idx * 55}ms`,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <div style={{
                            width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
                            background: 'rgba(47,111,173,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Layers size={15} color="var(--vsm-blue)" />
                          </div>
                          <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--vsm-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {proj.name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                          <button
                            onClick={e => handleOpenEditModal(e, proj)}
                            title="Edit Project Details"
                            style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', padding: '5px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--vsm-blue)'; e.currentTarget.style.background = 'var(--hover-bg)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--secondary-text)'; e.currentTarget.style.background = 'none'; }}
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            onClick={e => handleDeleteProject(e, proj.id, proj.name)}
                            title="Delete Project"
                            style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', padding: '5px', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--error)'; e.currentTarget.style.background = '#FEE2E2'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--secondary-text)'; e.currentTarget.style.background = 'none'; }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {proj.description ? (
                        <p style={{ fontSize: '12.5px', color: 'var(--secondary-text)', marginBottom: '14px', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {proj.description}
                        </p>
                      ) : (
                        <p style={{ fontSize: '12px', color: 'var(--secondary-text)', opacity: 0.65, marginBottom: '14px', fontStyle: 'italic' }}>
                          Click to open interactive VSM diagram canvas
                        </p>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--secondary-text)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {updatedDate}
                      </div>

                      <span style={{ fontWeight: 700, color: 'var(--vsm-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        Show VSM Diagram <ArrowRight size={13} />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
