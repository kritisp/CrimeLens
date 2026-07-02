import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Network, 
  Map, 
  Cpu, 
  FileText, 
  Settings, 
  Shield, 
  LogOut 
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/cases', icon: Briefcase, label: 'Case Details' },
    { path: '/copilot', icon: Cpu, label: 'Investigator Copilot' },
    { path: '/network', icon: Network, label: 'Network Explorer' },
    { path: '/heatmap', icon: Map, label: 'Heatmaps' },
    { path: '/chat', icon: Cpu, label: 'CrimeLens AI Chat' },
    { path: '/reports', icon: FileText, label: 'Reports' },
  ];

  const handleLogout = () => {
    // Clear credentials
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('badgeId');
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-950 flex-shrink-0 flex flex-col border-r border-slate-900 relative z-20 shadow-2xl">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-900">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-xl text-white mr-3 shadow-lg shadow-blue-500/20 border border-blue-500/20">
          <Shield size={18} className="stroke-[2.5]" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight font-display">CrimeLens AI</span>
      </div>
      
      {/* Navigation Links */}
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-3">
          Investigative Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          // Check if active (handle cases starting path as well)
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 font-medium text-sm group ${
                isActive 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
            >
              <Icon 
                size={18} 
                className={`${
                  isActive 
                    ? 'text-blue-500' 
                    : 'text-slate-500 group-hover:text-slate-400'
                } transition-colors`} 
              />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Footer / Settings & Logout */}
      <div className="p-4 border-t border-slate-900 space-y-1">
        <button 
          onClick={() => navigate('/settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm group ${
            location.pathname === '/settings'
              ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
          }`}
        >
          <Settings size={18} className="text-slate-500 group-hover:text-slate-400" />
          Settings
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/20 border border-transparent transition-all font-medium text-sm group"
        >
          <LogOut size={18} className="text-red-500/70 group-hover:text-red-400" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
