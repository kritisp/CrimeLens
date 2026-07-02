import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function DashboardLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Basic session validation for professional experience
    const username = localStorage.getItem('username');
    if (!username) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content pane */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Header Topbar */}
        <Navbar />

        {/* Scrollable Container with Slide-in animation for views */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8">
          <div className="max-w-[1500px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
