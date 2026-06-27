import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Shield } from 'lucide-react';

export default function Navbar() {
  const location = useLocation();
  const [profile, setProfile] = useState({
    username: 'Vikram Rao',
    role: 'Investigator',
    badgeId: 'KSP-4821'
  });

  // Load profile from localStorage if present
  useEffect(() => {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('userRole');
    const badgeId = localStorage.getItem('badgeId');

    if (username || role || badgeId) {
      setProfile({
        username: username || 'Vikram Rao',
        role: role ? role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ') : 'Investigator',
        badgeId: badgeId || 'KSP-4821'
      });
    }
  }, [location]);

  // Map pathnames to dynamic header titles
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Intelligence Dashboard';
    if (path.startsWith('/cases') || path === '/case-details') return 'Case Dossier & Investigation';
    if (path === '/copilot') return 'Investigator Copilot AI';
    if (path === '/network') return 'Network Link Explorer';
    if (path === '/heatmap') return 'Geotemporal Crime Heatmaps';
    if (path === '/chat') return 'CrimeLens AI Copilot Chat';
    if (path === '/reports') return 'Analytical Briefs & Reports';
    if (path === '/settings') return 'Platform Configurations';
    return 'CrimeLens Platform';
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0 shadow-sm">
      {/* Title & Context */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight font-display">
          {getPageTitle()}
        </h1>
        <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
        <span className="text-[10px] font-bold text-slate-500 hidden sm:inline-block bg-slate-100 px-2 py-1 rounded border border-slate-200 uppercase tracking-widest">
          Secure Session
        </span>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-6 hidden md:block">
        <div className="relative group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
          <input 
            type="text" 
            placeholder="Search FIRs, suspects, or vehicle tags..." 
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs text-slate-900 placeholder-slate-400 transition-all outline-none"
          />
        </div>
      </div>

      {/* Right User Actions */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div className="relative cursor-pointer group">
          <div className="bg-slate-50 p-2 rounded-xl border border-slate-250 hover:bg-slate-100 transition-all text-slate-500 hover:text-slate-800">
            <Bell size={18} />
          </div>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        </div>
        
        <div className="h-6 w-px bg-slate-200"></div>
        
        {/* User Card */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
              Insp. {profile.username}
            </div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              {profile.role} • {profile.badgeId}
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-white font-bold text-sm tracking-wide shadow-sm group-hover:scale-105 transition-all">
            {profile.username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
