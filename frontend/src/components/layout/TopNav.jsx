import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  Undo2, 
  Redo2, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  FileSpreadsheet, 
  FileJson, 
  ChevronDown, 
  LayoutDashboard, 
  LogOut, 
  Download, 
  Trash2, 
  Copy,
  Edit2,
  FolderOpen,
  Plus,
  AlertTriangle,
  X,
  Check,
  Briefcase
} from 'lucide-react';
import { useStore } from 'zustand';
import useVsmStore from '../../store/useVsmStore';
import { useVSM } from '../../context/Context';
import { useNavigate } from '../../router/Router';

function Dropdown({ label, items, icon, headerContent }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: open ? 'rgba(255,255,255,0.15)' : 'none',
          border: 'none',
          color: open ? '#FFFFFF' : '#CBD5E1',
          padding: '5px 10px',
          fontSize: '13px',
          fontWeight: 600,
          borderRadius: 'var(--radius-md)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all var(--transition-fast)',
        }}
        onMouseEnter={e => {
          if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          e.currentTarget.style.color = '#FFFFFF';
        }}
        onMouseLeave={e => {
          if (!open) {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#CBD5E1';
          }
        }}
      >
        {icon}
        <span>{label}</span>
        <ChevronDown size={12} style={{ opacity: 0.7, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div 
          className="animate-modal-scale"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 30px rgba(15, 35, 55, 0.16)',
            minWidth: '240px',
            padding: '6px 0',
          }}
        >
          {headerContent && (
            <div style={{ padding: '6px 12px 8px', borderBottom: '1px solid var(--border-light)' }}>
              {headerContent}
            </div>
          )}

          {items.map((item, i) => (
            <React.Fragment key={i}>
              {item.divider && i > 0 && (
                <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />
              )}
              <button
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                disabled={item.disabled}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: item.active ? 'rgba(47,111,173,0.08)' : 'none',
                  border: 'none',
                  padding: '7px 14px',
                  fontSize: '13px',
                  fontWeight: item.active ? 700 : 500,
                  color: item.disabled ? 'var(--secondary-text)' : (item.active ? 'var(--vsm-blue)' : 'var(--text)'),
                  opacity: item.disabled ? 0.5 : 1,
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background var(--transition-fast)',
                }}
                onMouseEnter={e => {
                  if (!item.disabled) e.currentTarget.style.background = 'var(--hover-bg)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = item.active ? 'rgba(47,111,173,0.08)' : 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.active && <Check size={14} color="var(--vsm-blue)" />}
                {item.shortcut && !item.active && (
                  <span style={{ fontSize: '11px', color: 'var(--secondary-text)', fontWeight: 500 }}>{item.shortcut}</span>
                )}
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TopNav({ onOpenImportModal, onOpenManualModal, onOpenExportModal }) {
  const { nodes, edges, stages, selectedNodeId, deleteSelected, duplicateNode, setVsmModel } = useVsmStore();
  const { user, projects, currentProject, saveProject, saveStatus, uploadExcel, uploadJson, logout, setCurrentProject, loadProject } = useVSM();
  const navigate = useNavigate();

  const temporalStore = useVsmStore?.temporal ? useStore(useVsmStore.temporal) : {};
  const undo = temporalStore.undo || (() => {});
  const redo = temporalStore.redo || (() => {});
  const pastStates = temporalStore.pastStates || [];
  const futureStates = temporalStore.futureStates || [];

  const jsonFileInputRef = useRef(null);
  const excelFileInputRef = useRef(null);

  // Inline Title Renaming State
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');

  // UNSAVED CHANGES WARNING MODAL STATE
  const [unsavedWarning, setUnsavedWarning] = useState(null); // { action: () => void, targetName?: string }

  useEffect(() => {
    if (currentProject?.name) {
      setEditedTitle(currentProject.name);
    }
  }, [currentProject?.name]);

  // Navigation Guard Helper
  const requestNavigation = (actionFn, targetName) => {
    if (saveStatus === 'unsaved') {
      setUnsavedWarning({ action: actionFn, targetName });
    } else {
      actionFn();
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      await saveProject();
      const action = unsavedWarning?.action;
      setUnsavedWarning(null);
      if (action) action();
    } catch (err) {
      alert("Save Failed: " + err.message);
    }
  };

  const handleDiscardAndContinue = () => {
    const action = unsavedWarning?.action;
    setUnsavedWarning(null);
    if (action) action();
  };

  const handleTitleSubmit = async () => {
    setIsEditingTitle(false);
    const newName = editedTitle.trim();
    if (!newName || !currentProject || newName === currentProject.name) return;

    const updatedProj = { ...currentProject, name: newName };
    setCurrentProject(updatedProj);
    try {
      await saveProject();
    } catch (err) {
      console.error("Failed to save project rename:", err);
    }
  };

  const handleSave = async () => {
    try {
      await saveProject();
    } catch (err) {
      alert("Save Failed: " + err.message);
    }
  };

  const handleExportJson = () => {
    const data = JSON.stringify({ nodes, edges, stages, project: currentProject || { name: 'VSM Flow' } }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vsm_${currentProject?.name || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (currentProject?.id) {
      uploadJson(currentProject.id, file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          setVsmModel({
            id: data.id || Date.now().toString(),
            project: data.project || { id: 'imp', name: 'Imported VSM', product: '' },
            nodes: data.nodes || [],
            connections: data.edges || data.connections || [],
            stages: data.stages || [],
            metadata: {},
          });
        } catch {
          alert('Invalid JSON VSM file');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportExcel = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (currentProject?.id) {
      uploadExcel(currentProject.id, file);
    }
  };

  // PROJECT DROPDOWN ITEMS
  const projectMenuItems = [
    { label: 'Return to Dashboard', icon: <FolderOpen size={14} />, onClick: () => requestNavigation(() => navigate('/dashboard'), 'Dashboard') },
    { label: 'Create New Project', icon: <Plus size={14} />, divider: true, onClick: () => requestNavigation(() => onOpenManualModal?.(), 'New Project') },
    { label: 'Export PDF / PNG', icon: <Download size={14} />, divider: true, onClick: onOpenExportModal },
    { label: 'Export JSON Model', icon: <FileJson size={14} />, onClick: handleExportJson },
  ];

  // Quick Switch Sub-Items for Project Dropdown
  const projectSwitchHeader = (
    <div>
      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
        Switch Saved Project ({projects.length})
      </div>
      <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {projects.map(p => {
          const isActive = p.id === currentProject?.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                if (!isActive) {
                  requestNavigation(async () => {
                    await loadProject(p.id);
                    navigate(`/project/${p.id}`);
                  }, p.name);
                }
              }}
              style={{
                width: '100%', textAlign: 'left', padding: '5px 8px', fontSize: '12px',
                borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer',
                background: isActive ? 'rgba(47,111,173,0.12)' : 'transparent',
                fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--vsm-blue)' : 'var(--text)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <Briefcase size={12} color={isActive ? "var(--vsm-blue)" : "var(--secondary-text)"} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </div>
              {isActive && <Check size={13} color="var(--vsm-blue)" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  const editMenuItems = [
    { label: 'Undo', icon: <Undo2 size={14} />, shortcut: 'Ctrl+Z', disabled: pastStates.length === 0, onClick: undo },
    { label: 'Redo', icon: <Redo2 size={14} />, shortcut: 'Ctrl+Y', disabled: futureStates.length === 0, onClick: redo },
    { label: 'Duplicate Node', icon: <Copy size={14} />, shortcut: 'Ctrl+D', divider: true, disabled: !selectedNodeId, onClick: () => selectedNodeId && duplicateNode(selectedNodeId) },
    { label: 'Delete Selected', icon: <Trash2 size={14} />, shortcut: 'Del', disabled: !selectedNodeId, onClick: deleteSelected },
  ];

  return (
    <header style={{
      height: '48px',
      backgroundColor: 'var(--vsm-navy)',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      userSelect: 'none',
    }}>
      <input ref={jsonFileInputRef} type="file" accept=".json" onChange={handleImportJson} style={{ display: 'none' }} />
      <input ref={excelFileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: 'none' }} />

      {/* UNSAVED CHANGES WARNING MODAL */}
      {unsavedWarning && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 4000,
          backgroundColor: 'rgba(15,35,55,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            width: '100%', maxWidth: '440px', backgroundColor: '#FFFFFF',
            borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--border)', padding: '24px', position: 'relative'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', color: '#D97706' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="#D97706" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--vsm-navy)', margin: 0 }}>Unsaved Changes</h3>
                <span style={{ fontSize: '12px', color: 'var(--secondary-text)' }}>{currentProject?.name || 'Active Project'}</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5, marginBottom: '22px' }}>
              You have unsaved changes in your VSM diagram canvas. Would you like to save your changes to TiDB Cloud before leaving?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={handleSaveAndContinue}
                style={{
                  width: '100%', padding: '10px 16px', background: 'var(--vsm-navy)', color: '#FFFFFF',
                  fontWeight: 700, fontSize: '13px', borderRadius: 'var(--radius-md)', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 2px 6px rgba(22,50,79,0.2)'
                }}
              >
                <Save size={15} /> Save Changes & Continue
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleDiscardAndContinue}
                  style={{
                    flex: 1, padding: '8px 12px', background: '#FEF2F2', color: '#DC2626',
                    fontWeight: 600, fontSize: '12.5px', borderRadius: 'var(--radius-md)',
                    border: '1px solid #FECACA', cursor: 'pointer'
                  }}
                >
                  Discard Changes
                </button>

                <button
                  onClick={() => setUnsavedWarning(null)}
                  style={{
                    flex: 1, padding: '8px 12px', background: '#FFFFFF', color: 'var(--text)',
                    fontWeight: 600, fontSize: '12.5px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left Brand & Menu Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => requestNavigation(() => navigate('/dashboard'), 'Dashboard')}
          title="Return to Projects Dashboard"
          style={{
            background: 'rgba(255,255,255,0.12)', border: 'none', color: '#FFFFFF',
            padding: '5px 10px', borderRadius: 'var(--radius-md)', fontSize: '12.5px',
            fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <LayoutDashboard size={15} /> Dashboard
        </button>

        <div style={{ width: '1px', height: '18px', background: 'rgba(255,255,255,0.15)', margin: '0 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '10px' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--vsm-process) 0%, var(--vsm-blue) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={15} color="#FFFFFF" />
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>VSM Studio</span>
        </div>

        {/* RENAMED FROM 'File' TO 'Project' DROPDOWN */}
        <Dropdown 
          label="Project" 
          items={projectMenuItems} 
          headerContent={projectSwitchHeader} 
        />

        <Dropdown label="Edit" items={editMenuItems} />
      </div>

      {/* Center Editable Project Title Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isEditingTitle ? (
          <input
            type="text"
            autoFocus
            value={editedTitle}
            onChange={e => setEditedTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={e => { if (e.key === 'Enter') handleTitleSubmit(); }}
            style={{
              fontSize: '13px', fontWeight: 700, color: '#FFFFFF',
              background: 'rgba(255,255,255,0.2)', padding: '3px 8px',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--vsm-process)',
              outline: 'none', minWidth: '200px'
            }}
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              onClick={() => setIsEditingTitle(true)}
              title="Click to rename project"
              style={{
                fontSize: '13px', fontWeight: 700, color: '#F1F5F9',
                background: 'rgba(255,255,255,0.08)', padding: '4px 12px',
                borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
            >
              <span>{currentProject?.name || 'Untitled VSM Project'}</span>
              <Edit2 size={12} style={{ opacity: 0.6 }} />
            </div>
          </div>
        )}

        {/* Live Save Status Badge */}
        <div style={{ fontSize: '11.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          {saveStatus === 'saving' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(252,211,77,0.15)', padding: '3px 8px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(252,211,77,0.3)' }}>
              <Loader2 size={13} className="spinning-icon" color="#FCD34D" />
              <span style={{ color: '#FCD34D' }}>Saving to TiDB…</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <span className="pulse-dot-green" />
              <span style={{ color: '#4ADE80' }}>Saved to Cloud ✓</span>
            </div>
          )}
          {saveStatus === 'unsaved' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,0.15)', padding: '3px 8px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.3)' }}>
              <span className="pulse-dot-amber" />
              <span style={{ color: '#FBBF24' }}>Unsaved changes</span>
            </div>
          )}
          {saveStatus === 'failed' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.15)', padding: '3px 8px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertCircle size={13} color="#F87171" />
              <span style={{ color: '#F87171' }}>Save Failed</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '2px', background: 'rgba(255,255,255,0.08)', padding: '2px', borderRadius: 'var(--radius-md)' }}>
          <button
            onClick={undo}
            disabled={pastStates.length === 0}
            title="Undo (Ctrl+Z)"
            style={{
              background: 'none', border: 'none', color: pastStates.length > 0 ? '#FFFFFF' : '#64748B',
              padding: '4px 8px', borderRadius: 'var(--radius-sm)', cursor: pastStates.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={futureStates.length === 0}
            title="Redo (Ctrl+Y)"
            style={{
              background: 'none', border: 'none', color: futureStates.length > 0 ? '#FFFFFF' : '#64748B',
              padding: '4px 8px', borderRadius: 'var(--radius-sm)', cursor: futureStates.length > 0 ? 'pointer' : 'not-allowed'
            }}
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Primary Save Button */}
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          title="Save project changes to TiDB Cloud (Ctrl+S)"
          style={{
            background: saveStatus === 'unsaved' 
              ? 'linear-gradient(135deg, var(--vsm-process) 0%, #0284C7 100%)' 
              : 'var(--vsm-blue)',
            color: '#FFFFFF',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 700,
            fontSize: '12.5px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: 'none',
            cursor: saveStatus === 'saving' ? 'not-allowed' : 'pointer',
            boxShadow: saveStatus === 'unsaved' ? '0 0 14px rgba(22,169,216,0.6)' : '0 2px 6px rgba(47,111,173,0.3)',
            transition: 'all var(--transition-fast)',
            opacity: saveStatus === 'saving' ? 0.75 : 1,
          }}
          onMouseEnter={e => {
            if (saveStatus !== 'saving') {
              e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(22,169,216,0.5)';
            }
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = saveStatus === 'unsaved' ? '0 0 14px rgba(22,169,216,0.6)' : '0 2px 6px rgba(47,111,173,0.3)';
          }}
        >
          {saveStatus === 'saving' ? <Loader2 size={14} className="spinning-icon" /> : <Save size={14} />}
          {saveStatus === 'saving' ? 'Saving…' : 'Save'}
        </button>

        {/* User Profile Avatar & Logout */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', background: 'var(--vsm-navy-deep)',
              border: '1px solid rgba(255,255,255,0.2)', color: '#E2E8F0', fontWeight: 700,
              fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} title={user.name || user.email}>
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              style={{
                background: 'rgba(255,255,255,0.1)', border: 'none', color: '#CBD5E1',
                padding: '4px 8px', borderRadius: 'var(--radius-md)', fontSize: '11.5px',
                fontWeight: 600, cursor: 'pointer'
              }}
            >
              <LogOut size={13} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
