import React, { useState, useEffect } from 'react';
import TopNav from './TopNav';
import ViewSwitcher from './ViewSwitcher';
import LeftToolbar from './LeftToolbar';
import RightProperties from './RightProperties';
import VSMCanvas from '../canvas/VSMCanvas';
import VSMTimeline from '../timeline/VSMTimeline';
import ImportModal from '../common/ImportModal';
import ManualInputModal from '../common/ManualInputModal';
import ExportModal from '../common/ExportModal';
import WelcomeScreen from '../common/WelcomeScreen';
import Notification from '../common/Notification';
import AuthPage from '../auth/AuthPage';
import ImportValidationErrorModal from '../common/ImportValidationErrorModal';
import useVsmStore from '../../store/useVsmStore';
import { useVSM } from '../../context/Context';
import { useParams, useNavigate } from '../../router/Router';

export default function MainLayout() {
  const { deleteSelected, stages, nodes } = useVsmStore();
  const { isAuthenticated, currentProject, loadProject, importValidationError, setImportValidationError, loading } = useVSM();
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Auto load project from URL parameter if not loaded
  useEffect(() => {
    if (projectId && currentProject?.id !== projectId && isAuthenticated) {
      loadProject(projectId).catch(err => {
        console.error("Failed to load project from URL route:", err);
        navigate('/dashboard');
      });
    }
  }, [projectId, currentProject?.id, isAuthenticated, loadProject, navigate]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected]);

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const hasNoData = (!stages || stages.length === 0) && (!nodes || nodes.length === 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      {/* Top Header Navbar */}
      <TopNav
        onOpenImportModal={() => setIsImportOpen(true)}
        onOpenManualModal={() => setIsManualOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenDashboard={() => navigate('/dashboard')}
      />

      {/* Secondary Stage Bar */}
      <ViewSwitcher />

      {/* Main Canvas & Tool Panels Container */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
        {/* Collapsible Left Toolbar */}
        <LeftToolbar />

        {/* Center Canvas & Resizable Wave Timeline Area */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minWidth: 0, position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <VSMCanvas />
          </div>

          {/* Resizable Rectangular Wave Timeline */}
          <VSMTimeline />
        </div>

        {/* Right Inspector Properties Panel */}
        <RightProperties />
      </div>

      {/* Canvas Loading Overlay */}
      {loading && !currentProject && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1500,
          backgroundColor: 'rgba(248, 250, 252, 0.82)',
          backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '14px',
          animation: 'fadeIn 180ms ease forwards'
        }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--vsm-navy) 0%, var(--vsm-blue) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(22, 50, 79, 0.25)',
          }}>
            <Loader2 size={24} color="#FFFFFF" className="spinning-icon" />
          </div>
          <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--vsm-navy)', letterSpacing: '-0.01em' }}>
            Loading VSM Diagram…
          </span>
        </div>
      )}

      {/* Welcome Overlay (Only if empty canvas, no active project, and not loading) */}
      {hasNoData && !currentProject && !loading && (
        <WelcomeScreen
          onOpenImportModal={() => setIsImportOpen(true)}
          onOpenManualModal={() => setIsManualOpen(true)}
        />
      )}

      {/* Import Validation Error Modal */}
      <ImportValidationErrorModal
        isOpen={!!importValidationError}
        onClose={() => setImportValidationError(null)}
        errorDetail={importValidationError}
      />

      <ImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <ManualInputModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />
      <Notification notifications={notifications} onCloseNotification={(id) => setNotifications(n => n.filter(x => x.id !== id))} />
    </div>
  );
}
