/**
 * App.jsx - Main application entry point
 * 
 * Manages:
 * - User authentication and session state
 * - Role-based routing (validator vs admin/scholar dashboards)
 * - Protected routes (requires login for all pages except login)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProjectDetailPage from './pages/ProjectDetailPage';
import UploadPage from './pages/UploadPage';
import ViewCasesPage from './pages/ViewCasesPage';
import ValidatorDashboard from './pages/ValidatorDashboard';
import ValidationPage from './pages/ValidationPage';
import { authAPI } from './api/client';
import ValidationCompletionPage from './pages/ValidationCompletionPage';
import ModuleReviewPage from './pages/ModuleReviewPage';
import CorrectionReviewPage from './pages/CorrectionReviewPage';
import ModuleDetailPage from './pages/ModuleDetailPage';
import ModuleResultsPage from './pages/ModuleResultsPage';


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
      } catch (err) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const handleLogin = async (email, password) => {
    const data = await authAPI.login(email, password);
    localStorage.setItem('token', data.access_token);
    const userData = await authAPI.getCurrentUser();
    setUser(userData);
    return userData;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route 
          path="/" 
          element={
            user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={handleLogin} />
          } 
        />

        {/* Protected Routes - Redirect to login if not authenticated */}
        {user ? (
          <>
            {/* Dashboard - Role-specific */}
            <Route 
              path="/dashboard" 
              element={
                user.role === 'validator' 
                  ? <ValidatorDashboard user={user} onLogout={handleLogout} />
                  : <Dashboard user={user} onLogout={handleLogout} />
              } 
            />
            
            {/* Validation Interface */}
            <Route path="/validate/:moduleId" element={<ValidationPage user={user} onLogout={handleLogout} />} />

            {/* Validation Completion Summary */}
            <Route path="/validation-complete/:moduleId" element={<ValidationCompletionPage user={user} onLogout={handleLogout} />} />

            {/* Project Detail */}
            <Route path="/project/:projectId" element={<ProjectDetailPage user={user} onLogout={handleLogout} />} />

            {/* Module Detail */}
            <Route path="/project/:projectId/module/:moduleId" element={<ModuleDetailPage user={user} onLogout={handleLogout} />} />

            {/* Module Results */}
            <Route path="/project/:projectId/module/:moduleId/results/:round" element={<ModuleResultsPage user={user} onLogout={handleLogout} />} />    
            
            {/* Upload */}
            <Route path="/upload/:projectId" element={<UploadPage user={user} onLogout={handleLogout} />} />

            {/* View Cases */}
            <Route path="/view-cases/:projectId" element={<ViewCasesPage user={user} onLogout={handleLogout} />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" />} />

            {/* Module Review (Scholar) */}
            <Route path="/module-review/:moduleId" element={<ModuleReviewPage user={user} onLogout={handleLogout} />} />

            {/* Correction Review (Scholar) */}
            <Route path="/review-corrections/:moduleId" element={<CorrectionReviewPage user={user} onLogout={handleLogout} />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;