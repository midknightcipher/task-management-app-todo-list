import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from './store/hooks';

import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import ProjectsPage from './pages/ProjectsPage';
import AllTasksPage from './pages/AllTasksPage';
import MyTasksPage from './pages/MyTasksPage';
import TeamPage from './pages/TeamPage';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/projects"  element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} />
      <Route path="/all-tasks" element={<ProtectedRoute><AllTasksPage /></ProtectedRoute>} />
      <Route path="/my-tasks"  element={<ProtectedRoute><MyTasksPage /></ProtectedRoute>} />
      <Route path="/team"      element={<ProtectedRoute><TeamPage /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Router>
);

export default App;