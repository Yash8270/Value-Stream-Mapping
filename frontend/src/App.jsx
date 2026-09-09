import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { BrowserRouter, Routes, Route, Navigate } from './router/Router';
import MainLayout from './components/layout/MainLayout';
import ProjectsDashboard from './components/dashboard/ProjectsDashboard';
import AuthPage from './components/auth/AuthPage';
import TopProgressBar from './components/common/TopProgressBar';
import { useVSM } from './context/Context';
import '@xyflow/react/dist/style.css';
import './index.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useVSM();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicAuthRoute({ children }) {
  const { isAuthenticated } = useVSM();
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <ReactFlowProvider>
        {/* Global Loading / Progress Bar */}
        <TopProgressBar />

        <Routes>
          {/* Public Authentication Route */}
          <Route
            path="/login"
            element={
              <PublicAuthRoute>
                <AuthPage />
              </PublicAuthRoute>
            }
          />

          {/* Protected Dashboard & Project Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProjectsDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <ProjectsDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/project/:projectId"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ReactFlowProvider>
    </BrowserRouter>
  );
}

export default App;
