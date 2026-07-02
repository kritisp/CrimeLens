import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings as SettingsIcon, 
  ArrowRight, 
  Shield, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Cpu
} from 'lucide-react';

export default function Settings() {
  const navigate = useNavigate();

  // Settings states
  const [activeRole, setActiveRole] = useState('investigator');
  const [badgeId, setBadgeId] = useState('KSP-VIKRAM');
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'investigator';
    const badge = localStorage.getItem('badgeId') || 'KSP-VIKRAM';
    setActiveRole(role);
    setBadgeId(badge);
  }, []);

  const handleRoleSwap = (roleValue) => {
    setActiveRole(roleValue);
    
    // Auto-update values
    localStorage.setItem('userRole', roleValue);
    
    let username = 'Vikram Rao';
    let badge = 'KSP-4821';
    
    if (roleValue === 'crime-analyst') {
      username = 'Ananya Sen';
      badge = 'KSP-ANALYST-09';
    } else if (roleValue === 'supervisor') {
      username = 'Cmr. Jagdish';
      badge = 'KSP-SUPERVISOR-01';
    }

    localStorage.setItem('username', username);
    localStorage.setItem('badgeId', badge);
    setBadgeId(badge);

    setToastMessage(`Clearance changed to ${roleValue.toUpperCase()}. Redirecting...`);
    
    // Redirect to dashboard after 1 second to load the new view
    setTimeout(() => {
      setToastMessage("");
      navigate('/dashboard');
    }, 1000);
  };

  const systems = [
    { id: "SYS-1", name: "Gait Model Alignment Registry", ver: "v1.4.2", state: "Operational" },
    { id: "SYS-2", name: "Spatio-Temporal Forecast Engine", ver: "v2.4.0", state: "Active" },
    { id: "SYS-3", name: "Bank Account Audit Ledger Node", ver: "v1.1.8", state: "Syncing" }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Platform Configurations</h2>
        <p className="text-sm text-slate-500 mt-0.5">Manage administrative clearances, audit profiles, and system sync logs.</p>
      </div>

      {/* Success Role Swap Toast Alert */}
      {toastMessage && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-blue-800 text-xs font-bold shadow-sm animate-pulse">
          <RefreshCw size={14} className="animate-spin text-blue-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Role Swap simulator (Spans 2 cols) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Clearance Simulator */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Shield size={16} className="text-blue-600" /> Clearance Level Simulator
            </h3>
            
            <p className="text-xs text-slate-500 font-semibold leading-relaxed">
              Toggle your security clearance role below. The platform will save this credential in your local session and immediately adapt the <strong>Mission Control Dashboard</strong> to showcase that role's tools.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { id: "investigator", label: "Investigator", desc: "Tactical active case lists & CCTV leads" },
                { id: "crime-analyst", label: "Crime Analyst", desc: "MoM trends, growth bars & district matrices" },
                { id: "supervisor", label: "Supervisor", desc: "Senior commanding logs, sign-offs & approvals" }
              ].map((roleOption) => {
                const isActive = activeRole === roleOption.id;
                return (
                  <button
                    key={roleOption.id}
                    onClick={() => handleRoleSwap(roleOption.id)}
                    className={`p-4 rounded-xl border text-left flex flex-col justify-between h-28 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-blue-50/50 border-blue-500 text-blue-800 ring-2 ring-blue-500/10' 
                        : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{roleOption.label}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase mt-1 leading-snug">{roleOption.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active System logs */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Cpu size={16} className="text-blue-600" /> State Engine Core Version Registry
            </h3>

            <div className="space-y-2">
              {systems.map((sys) => (
                <div key={sys.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                    <span className="text-xs font-bold text-slate-700">{sys.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">{sys.ver}</span>
                    <span className="text-[9px] font-bold bg-white px-2 py-0.5 border border-slate-200 rounded text-slate-500 uppercase">
                      {sys.state}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Side: Profile Details HUD (1 col) */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl space-y-5 h-fit">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 border border-blue-500/20">
               <Sparkles size={16} />
            </div>
            <h3 className="text-sm font-bold tracking-tight font-display text-white">Clearance Badge</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-850 p-3.5 rounded-xl border border-slate-800">
              <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">Clearance Rank</div>
                <div className="text-xs font-bold text-white mt-0.5 capitalize">{activeRole.replace('-', ' ')}</div>
              </div>
              <Shield size={24} className="text-blue-400" />
            </div>
            
            <div className="flex items-center justify-between bg-slate-850 p-3.5 rounded-xl border border-slate-800">
              <div>
                <div className="text-[9px] font-bold text-slate-400 uppercase">Surveillance Badge ID</div>
                <div className="text-xs font-bold text-white mt-0.5 font-mono">{badgeId}</div>
              </div>
              <AlertTriangle size={18} className="text-amber-500" />
            </div>
          </div>

          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md text-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            Launch Active Mission <ArrowRight size={14} />
          </button>
        </div>

      </div>
    </div>
  );
}
