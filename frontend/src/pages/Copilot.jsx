import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Cpu, 
  Sparkles, 
  Activity, 
  Phone, 
  Target, 
  Car, 
  Zap, 
  CheckCircle, 
  AlertOctagon, 
  Compass, 
  ShieldCheck, 
  TrendingUp,
  MapPin
} from 'lucide-react';

export default function Copilot() {
  const navigate = useNavigate();

  // Interactive dispatch states
  const [actions, setActions] = useState({
    cdr: false,
    anpr: false,
    dispatch: false
  });

  const handleTriggerAction = (key) => {
    setActions(prev => ({ ...prev, [key]: true }));
  };

  const cdrLogs = [
    { imei: "IMEI-849102-88-2", suspect: "Ravi 'Bouncer' Kumar", timestamp: "Oct 24, 02:22 AM", tower: "Indiranagar 100ft Rd Node", distance: "120m", correlation: "92%" },
    { imei: "IMEI-849102-88-2", suspect: "Ravi 'Bouncer' Kumar", timestamp: "Oct 20, 11:45 AM", tower: "Koramangala Sector 4 Node", distance: "95m", correlation: "89%" },
    { imei: "IMEI-991208-11-4", suspect: "Unidentified Burner B", timestamp: "Oct 24, 02:15 AM", tower: "Indiranagar 12th Main Node", distance: "40m", correlation: "78%" }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/cases/FIR-1024')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Case Details
          </button>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Investigator Copilot AI</h2>
          <p className="text-sm text-slate-500 mt-0.5">Automated pattern recognition, CDR cell tower overlaps, and tactical dispatches.</p>
        </div>
      </div>

      {/* Main split work-desk */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left Side: Analytics Feed (Spans 2 cols) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Cell Tower CDR Overlaps */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Phone size={18} className="text-blue-600" /> Cell Tower (CDR) Correlation Logs
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-150 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                    <th className="p-3 uppercase">Suspect Burner IMEI</th>
                    <th className="p-3 uppercase">Tower Location</th>
                    <th className="p-3 uppercase text-center">Proximity</th>
                    <th className="p-3 uppercase text-center">Timestamp</th>
                    <th className="p-3 uppercase text-right">AI Correlation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {cdrLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-mono text-slate-950 font-bold">{log.imei}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{log.suspect}</div>
                      </td>
                      <td className="p-3 flex items-center gap-1.5"><MapPin size={12} className="text-slate-400" /> {log.tower}</td>
                      <td className="p-3 text-center font-mono">{log.distance}</td>
                      <td className="p-3 text-center font-mono text-[10px] text-slate-500">{log.timestamp}</td>
                      <td className="p-3 text-right text-blue-600 font-bold font-mono">{log.correlation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CCTV Gait Analysis & ANPR Highway checks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Gait analysis */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Target size={16} className="text-blue-600" /> Gait & Facial Match Logs
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0"><Target size={14}/></div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Camera Node: MG-RD-04</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">Suspect Ravi Kumar (89% Gait Match)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Timestamp: 2026-10-25 14:15 PM</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ANPR Plazas */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Car size={16} className="text-blue-600" /> ANPR Checkpoint logs
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
                  <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 shrink-0"><Car size={14}/></div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Toll Plaza: NH48 Gate 3</div>
                    <div className="text-xs font-bold text-slate-800 mt-0.5">White Hyundai Creta (KA-03-MB-4432)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">Timestamp: 2026-10-24 03:45 AM</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Dispatches & Actions (1 col) */}
        <div className="xl:col-span-1 bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl space-y-6 h-fit">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-850 pb-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 border border-blue-500/20">
                <Sparkles size={16} />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight font-display">Command Dispatch</h3>
            </div>
            <span className="text-[9px] font-bold bg-slate-800 px-2 py-0.5 rounded text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
              Live Link
            </span>
          </div>

          {/* Risk Level */}
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pattern Risk Level</div>
              <div className="text-2xl font-bold text-red-400 font-display">88 / 100</div>
            </div>
            <div className="w-10 h-10 rounded-full border-4 border-slate-800 border-t-red-500 flex items-center justify-center rotate-45">
              <div className="-rotate-45 text-red-400"><Activity size={16}/></div>
            </div>
          </div>

          {/* Interactive Directives */}
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Next Actions & Directives</div>
            
            {/* Directive 1 */}
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
              <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase">Step 1: Cell Dump Lookup</div>
                <h4 className="text-xs font-bold text-white mt-1 leading-snug">Run Cellular CDR dumps at Indiranagar</h4>
              </div>
              {actions.cdr ? (
                <div className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-950/40 border border-emerald-500/35 rounded-lg text-[10px] font-bold text-emerald-400 uppercase">
                  <CheckCircle size={12} /> Query Executed
                </div>
              ) : (
                <button
                  onClick={() => handleTriggerAction('cdr')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                >
                  Execute Query
                </button>
              )}
            </div>

            {/* Directive 2 */}
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
              <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase">Step 2: ANPR Alert</div>
                <h4 className="text-xs font-bold text-white mt-1 leading-snug">Transmit ANPR Toll warnings for NH48</h4>
              </div>
              {actions.anpr ? (
                <div className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-950/40 border border-emerald-500/35 rounded-lg text-[10px] font-bold text-emerald-400 uppercase">
                  <CheckCircle size={12} /> Roadblock Dispatched
                </div>
              ) : (
                <button
                  onClick={() => handleTriggerAction('anpr')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                >
                  Transmit Alert
                </button>
              )}
            </div>

            {/* Directive 3 */}
            <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
              <div>
                <div className="text-[9px] font-bold text-slate-500 uppercase">Step 3: Tactical Warrant</div>
                <h4 className="text-xs font-bold text-white mt-1 leading-snug">Dispatch warrant team to suspect Kolar site</h4>
              </div>
              {actions.dispatch ? (
                <div className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-950/40 border border-emerald-500/35 rounded-lg text-[10px] font-bold text-emerald-400 uppercase">
                  <CheckCircle size={12} /> Team Dispatched
                </div>
              ) : (
                <button
                  onClick={() => handleTriggerAction('dispatch')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                >
                  Dispatch Team
                </button>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
