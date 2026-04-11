import React, { useEffect } from 'react';
/* Deploy Marker: 2026-04-10-SYNC-V7-FINAL */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext.jsx';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import HRDashboard from './pages/HRDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = React.useContext(AuthContext);
  
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}-dashboard`} replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Admin Routes */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* HR Routes */}
      <Route path="/hr-dashboard" element={
        <ProtectedRoute allowedRoles={['hr']}>
          <HRDashboard />
        </ProtectedRoute>
      } />

      {/* Employee Routes */}
      <Route path="/employee-dashboard" element={
        <ProtectedRoute allowedRoles={['employee']}>
          <EmployeeDashboard />
        </ProtectedRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

import { SocketProvider } from './context/SocketContext';

/* Deploy Marker: 2026-04-10-LOP-FORCE-DEPLOY-STABLE-V4 */

function App() {
  useEffect(() => {
    console.log('🚀 FIC Production Bridge Initialized');
    console.log('📍 Current Origin:', window.location.origin);
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <AppRoutes />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}


export default App;
