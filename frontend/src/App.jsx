import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import CaseDetails from './pages/CaseDetails';
import Copilot from './pages/Copilot';
import NetworkExplorer from './pages/NetworkExplorer';
import Heatmaps from './pages/Heatmaps';
import AIChat from './pages/AIChat';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import PatternAnalysis from './pages/PatternAnalysis';

export default function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Layout Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Support variations of Case Details route for robustness */}
        <Route path="/cases" element={<CaseDetails />} />
        <Route path="/cases/:id" element={<CaseDetails />} />
        <Route path="/case-details" element={<CaseDetails />} />
        <Route path="/cases/:id/pattern" element={<PatternAnalysis />} />
        
        <Route path="/copilot" element={<Copilot />} />
        <Route path="/network" element={<NetworkExplorer />} />
        <Route path="/heatmap" element={<Heatmaps />} />
        <Route path="/chat" element={<AIChat />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all Redirection to Dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
