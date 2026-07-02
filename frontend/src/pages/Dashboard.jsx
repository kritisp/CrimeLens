import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  AlertTriangle, 
  Briefcase, 
  FileText, 
  Map, 
  Network, 
  ShieldAlert, 
  Activity, 
  Calendar, 
  ArrowUpRight, 
  ArrowRight, 
  Target, 
  Crosshair, 
  MessageSquare, 
  FileBarChart, 
  UserSearch,
  MapPin,
  Shield,
  Loader2,
  TrendingUp,
  Cpu,
  Zap,
  Clock,
  CheckCircle2,
  Award,
  Users
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Dynamic role determination
  const [role, setRole] = useState('investigator'); // investigator, crime-analyst, supervisor

  // Asynchronous page datasets
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [cases, setCases] = useState([]);
  const [findings, setFindings] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Supervisor-specific state for interactive approvals
  const [directives, setDirectives] = useState([
    { id: "DIR-APPROVE-1", caseId: "FIR-1024", title: "ANPR Border Checkpoint Dispatch", desc: "Authorize high-priority highway checkpoints scan for getaway white Creta KA-03-MB-4432.", approved: false },
    { id: "DIR-APPROVE-2", caseId: "FIR-2031", title: "Bidar Bank Account Lock", desc: "Request bank lock directives for 4 suspect money splitting shell accounts.", approved: false }
  ]);

  useEffect(() => {
    // Get clearance role from local authentication state
    const userRole = localStorage.getItem('userRole') || 'investigator';
    setRole(userRole);

    // Fetch required datasets
    Promise.all([
      api.get('/stats'),
      api.get('/alerts'),
      api.get('/cases'),
      api.get('/recent-findings'),
      api.get('/heatmap/districts') // Used for district overview
    ]).then(([statsRes, alertsRes, casesRes, findingsRes, distRes]) => {
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
      setCases(casesRes.data);
      setFindings(findingsRes.data);
      setDistricts(distRes.data);
      setLoading(false);
    }).catch(err => {
      console.error("Failed loading data registries for dashboard", err);
      setLoading(false);
    });
  }, []);

  const handleApproveDirective = (id) => {
    setDirectives(prev => prev.map(dir => dir.id === id ? { ...dir, approved: true } : dir));
  };

  // Helper to map finding types to icons
  const getFindingIcon = (type) => {
    switch (type) {
      case 'CCTV Analysis': return Target;
      case 'Financial Intel': return Network;
      case 'CDR Pattern': return Activity;
      default: return Calendar;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500 gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <div className="font-mono text-sm tracking-widest uppercase animate-pulse">Syncing Intelligence Network...</div>
      </div>
    );
  }

  // --- SUB-VIEW 1: INVESTIGATOR DASHBOARD ---
  const renderInvestigatorDashboard = () => {
    const currentStats = stats || { todayFirs: 0, openCases: 0, solvedCases: 0, repeatOffenders: 0 };
    const mainAlert = alerts[0] || { title: 'No critical alerts', description: 'Network scan complete.', priority: 'LOW', confidence: '0%' };

    return (
      <div className="space-y-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Today's FIRs", value: currentStats.todayFirs, icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Open Cases", value: currentStats.openCases, icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Solved (MTD)", value: currentStats.solvedCases, icon: ShieldAlert, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Repeat Offenders", value: currentStats.repeatOffenders, icon: Crosshair, color: "text-purple-600", bg: "bg-purple-50" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 hover:shadow-md transition-all">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</div>
                <div className="text-3xl font-bold text-slate-900 tracking-tight font-display">{stat.value}</div>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={22} />
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: AI Alerts | Heatmap | Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* AI Alert Card */}
          <div className="lg:col-span-6 bg-white border border-red-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-400"></div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-red-50 p-2 rounded-lg text-red-600 border border-red-100">
                      <AlertTriangle size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 font-display">Critical AI Alert</h2>
                  </div>
                  <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-md uppercase tracking-wider border border-red-100">
                    Priority: {mainAlert.priority}
                  </span>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-tight">
                    {mainAlert.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4 leading-relaxed font-medium">
                    {mainAlert.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500 bg-white py-2 px-3 rounded-lg border border-slate-200 inline-flex shadow-sm">
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <Network size={14} /> 6 Linked FIRs
                    </span>
                    <div className="w-px h-4 bg-slate-250"></div>
                    <span className="flex items-center gap-1.5 text-emerald-600">
                      <Target size={14} /> {mainAlert.confidence} Confidence
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => navigate('/cases/FIR-1024')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shadow-slate-950/10 group cursor-pointer"
              >
                Open Investigation
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Mini Heatmap */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
                <MapPin size={18} className="text-blue-600" /> Crime Heatmap
              </h2>
              
              <div className="bg-slate-50 rounded-xl mb-4 relative overflow-hidden border border-slate-200 flex items-center justify-center h-44">
                 <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #000 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                 <div className="absolute top-1/4 left-1/4 w-14 h-14 bg-red-500/30 rounded-full blur-xl"></div>
                 <div className="absolute bottom-1/3 right-1/4 w-20 h-20 bg-amber-500/20 rounded-full blur-xl"></div>
                 <div className="absolute top-1/2 left-1/2 w-10 h-10 bg-rose-500/40 rounded-full blur-md"></div>
                 <Map size={44} className="text-slate-300 relative z-10" strokeWidth={1.5} />
              </div>
            </div>

            <button 
              onClick={() => navigate('/heatmap')}
              className="w-full bg-white border-2 border-slate-200 hover:border-blue-500 hover:text-blue-600 text-slate-700 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              Open Heatmap
              <ArrowUpRight size={16} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
              <Activity size={18} className="text-blue-600" /> Quick Actions
            </h2>
            
            <div className="flex-1 flex flex-col justify-center gap-3">
              <button 
                onClick={() => navigate('/chat')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-transparent hover:border-blue-200 transition-all text-left cursor-pointer"
              >
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <div className="font-bold text-sm">Ask CrimeLens AI</div>
                  <div className="text-[10px] text-blue-600/70 font-semibold uppercase tracking-wider">Natural language query</div>
                </div>
              </button>
              <button 
                onClick={() => navigate('/reports')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all text-left cursor-pointer"
              >
                <div className="bg-slate-200 p-2 rounded-lg text-slate-600">
                  <FileBarChart size={16} />
                </div>
                <div>
                  <div className="font-bold text-sm">Generate Report</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Daily intelligence brief</div>
                </div>
              </button>
              <button 
                onClick={() => navigate('/copilot')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all text-left cursor-pointer"
              >
                <div className="bg-slate-200 p-2 rounded-lg text-slate-600">
                  <UserSearch size={16} />
                </div>
                <div>
                  <div className="font-bold text-sm">Search Criminal</div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Dossier lookup</div>
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Row 3: Active Cases | Recent Findings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Active Cases */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase size={18} className="text-blue-600" /> My Active Cases
              </h2>
              <button 
                onClick={() => navigate('/cases')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline uppercase tracking-wider"
              >
                View All
              </button>
            </div>
            <div className="p-4 flex-1">
              <div className="space-y-3">
                {cases.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm bg-white transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 border border-slate-150 transition-colors">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-sm font-bold text-slate-900">{c.id}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">{c.type}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                          <MapPin size={12} className="text-slate-400" /> {c.location} • Status: <span className="text-amber-600 font-bold">{c.status}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => navigate(`/cases/${c.id}`)}
                      className="px-4 py-2 bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-bold rounded-lg border border-slate-200 hover:border-slate-900 transition-colors cursor-pointer"
                    >
                      Open
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Findings */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Cpu size={18} className="text-blue-600" /> Recent AI Findings
              </h2>
            </div>
            <div className="p-0 flex-1">
              <div className="divide-y divide-slate-100">
                {findings.map((finding) => {
                  const Icon = getFindingIcon(finding.type);
                  return (
                    <div key={finding.id} className="flex gap-4 p-5 hover:bg-slate-50 transition-colors">
                      <div className="mt-0.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50/50 flex items-center justify-center text-blue-600 border border-blue-100">
                          <Icon size={14} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{finding.type}</span>
                          <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                            <Calendar size={12}/> {finding.time}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 leading-snug">{finding.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // --- SUB-VIEW 2: CRIME ANALYST DASHBOARD ---
  const renderAnalystDashboard = () => {
    return (
      <div className="space-y-6">
        
        {/* Row 1: AI Forecasts & Heatmap Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* AI Hotspots Forecast (Spans 2 cols) */}
          <div className="lg:col-span-2 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative p-6 flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-400"></div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 border border-blue-500/20 animate-pulse">
                    <Cpu size={18} />
                  </div>
                  <h3 className="text-base font-bold tracking-tight font-display">AI Geotemp Forecasts (Next 7 Days)</h3>
                </div>
                <span className="text-[10px] font-bold bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-500/20 uppercase tracking-wider">
                  Model V2.4 Active
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-red-400 uppercase tracking-wide">
                    <span>High Probability Zone</span>
                    <Clock size={12} />
                  </div>
                  <div className="text-sm font-bold text-white leading-tight">Bengaluru East Corridor (NH48)</div>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                    Projections suggest a <span className="text-red-400 font-bold">+14% increase</span> in keyless bypass thefts during peak hours (02:00 AM - 04:00 AM).
                  </p>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                    <span>Cluster Anomaly flagged</span>
                    <TrendingUp size={12} />
                  </div>
                  <div className="text-sm font-bold text-white leading-tight">Bidar Town ATM Splits</div>
                  <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                    Crypto splitting transaction anomalies projected to spike <span className="text-amber-400 font-bold">+22% MoM</span> in border divisions.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-6 border-t border-slate-800/80 mt-4">
              <button 
                onClick={() => navigate('/heatmap')}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Map size={14} /> Open Geotemp Map
              </button>
              <button 
                onClick={() => navigate('/reports')}
                className="flex-1 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold py-2.5 rounded-xl transition-all border border-slate-850 text-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileBarChart size={14} /> Generate Trend Docket
              </button>
            </div>
          </div>

          {/* Quick Analyst Actions (Spans 1 col) */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Shield size={16} className="text-blue-600" /> Analytical Modules
              </h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed mb-4">
                Use advanced forensic toolkits to parse multi-jurisdictional records and compile prosecutor briefings.
              </p>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => navigate('/network')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-slate-200 p-2 rounded-lg text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Network size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Network Link Explorer</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Analyze offender links</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button 
                onClick={() => navigate('/chat')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="bg-slate-200 p-2 rounded-lg text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <MessageSquare size={14} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Forensics AI Chat</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Natural language audit</div>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

        </div>

        {/* Row 2: District Caseload Grid & Crime Growth Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* District Caseload Registry (Spans 8 cols) */}
          <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" /> District Caseload Matrix
              </h3>
            </div>
            
            <div className="p-5 overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-150 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                    <th className="p-3 uppercase">District Division</th>
                    <th className="p-3 uppercase text-center">Active Cases</th>
                    <th className="p-3 uppercase text-center">Solved (MTD)</th>
                    <th className="p-3 uppercase text-right">Clearance Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                  {districts.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-950">{d.name}</td>
                      <td className="p-3 text-center font-mono">{d.radius > 30 ? 28 : (d.radius > 25 ? 11 : 4)}</td>
                      <td className="p-3 text-center font-mono">{d.radius > 30 ? 114 : (d.radius > 25 ? 24 : 9)}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                          d.radius > 30 
                            ? 'text-red-600 bg-red-50 border-red-100' 
                            : 'text-emerald-600 bg-emerald-50 border-emerald-100'
                        }`}>
                          {d.radius > 30 ? 'CRITICAL RISK' : 'STABLE'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Crime Trend Charts (Spans 4 cols) */}
          <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-blue-600" /> Incident Projections (MoM)
              </h3>
              
              <div className="space-y-4">
                {[
                  { label: "Cyber Extortion", trend: "+22.4%", pct: "w-[85%]", color: "bg-red-500", text: "text-red-600" },
                  { label: "Vehicle Theft", trend: "+14.2%", pct: "w-[65%]", color: "bg-orange-500", text: "text-orange-600" },
                  { label: "Financial Fraud", trend: "+8.7%", pct: "w-[45%]", color: "bg-amber-500", text: "text-amber-600" },
                  { label: "Narcotics Smuggling", trend: "-2.1%", pct: "w-[20%]", color: "bg-emerald-500", text: "text-emerald-600" }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-700">
                      <span>{item.label}</span>
                      <span className={item.text}>{item.trend}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} ${item.pct} rounded-full`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-[10px] font-bold text-slate-400 mt-6 leading-relaxed border-t border-slate-100 pt-3 flex items-center gap-1">
              <Zap size={11} className="text-blue-500 shrink-0" />
              Projections updated based on MoM highway sensor feeds.
            </div>
          </div>

        </div>

      </div>
    );
  };

  // --- SUB-VIEW 3: COMMANDING / SENIOR OFFICERS DASHBOARD ---
  const renderSupervisorDashboard = () => {
    // Mock investigator roster data
    const investigators = [
      { name: "Insp. Vikram Rao", role: "Indiranagar Division", active: 8, solved: 44, rate: "84.6%", performance: "Excellent" },
      { name: "SI Kavitha R.", role: "Mangaluru Coastal Division", active: 5, solved: 18, rate: "78.2%", performance: "On Track" },
      { name: "DySP Anand Sen", role: "Mysuru Division", active: 3, solved: 29, rate: "90.6%", performance: "Excellent" },
      { name: "Insp. Raghavendra", role: "Hubballi Division", active: 6, solved: 14, rate: "70.0%", performance: "Needs Audit" }
    ];

    return (
      <div className="space-y-6">
        
        {/* State-wide command overview stats (Row 1) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Overall Resolution Rate", value: "77.2%", icon: Award, color: "text-emerald-600", bg: "bg-emerald-50", comment: "+2.4% vs last month" },
            { label: "Total Active Caseload", value: "48 Cases", icon: Users, color: "text-blue-600", bg: "bg-blue-50", comment: "Avg 4.2 per division" },
            { label: "Directives Awaiting Action", value: directives.filter(d => !d.approved).length + " Pending", icon: AlertTriangle, color: "text-rose-600", bg: "bg-rose-50", comment: "Requires supervision sign-off" },
            { label: "Division Threat Index", value: "Critical Level", icon: ShieldAlert, color: "text-purple-600", bg: "bg-purple-50", comment: "7 active high threat alerts" },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-200 hover:shadow-md transition-all">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight font-display">{stat.value}</div>
                <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wide">{stat.comment}</div>
              </div>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={22} />
              </div>
            </div>
          ))}
        </div>

        {/* Row 2: Command Directives Approvals & Investigator performance */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Command Directive Approvals (Spans 6 cols) */}
          <div className="xl:col-span-6 bg-slate-900 text-white border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-400"></div>
            
            <div className="p-6 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-red-500/20 p-2 rounded-lg text-red-400 border border-red-500/20">
                  <AlertTriangle size={18} />
                </div>
                <h3 className="text-sm font-bold tracking-tight font-display">Command Directive Approvals</h3>
              </div>
              <span className="text-[9px] font-bold bg-slate-800/80 px-2.5 py-1 rounded text-red-400 border border-red-500/30 uppercase tracking-widest animate-pulse">
                Action Required
              </span>
            </div>

            <div className="p-5 flex-1 space-y-4 overflow-y-auto max-h-[310px]">
              {directives.map(dir => (
                <div key={dir.id} className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Case ID Reference: {dir.caseId}</div>
                      <h4 className="text-xs font-bold text-white mt-1 leading-snug">{dir.title}</h4>
                      <p className="text-[10px] text-slate-450 mt-1 leading-relaxed font-semibold">{dir.desc}</p>
                    </div>
                    {dir.approved ? (
                      <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 bg-emerald-950/40 text-emerald-400 border border-emerald-500/35 rounded-lg text-[9px] font-bold uppercase tracking-wider">
                        <CheckCircle2 size={10} /> Authorized
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApproveDirective(dir.id)}
                        className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                      >
                        Sign Directive
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Investigating Officers Performance (Spans 6 cols) */}
          <div className="xl:col-span-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users size={18} className="text-blue-600" /> KSP Investigator Performance
              </h3>
            </div>
            
            <div className="p-4 flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-150 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold text-[10px]">
                    <th className="p-2.5 uppercase">Officer</th>
                    <th className="p-2.5 uppercase text-center">Active Caseload</th>
                    <th className="p-2.5 uppercase text-center">Resolved (MTD)</th>
                    <th className="p-2.5 uppercase text-center font-mono">Conviction Rate</th>
                    <th className="p-2.5 uppercase text-right">Audit Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold text-[11px]">
                  {investigators.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5">
                        <div className="font-bold text-slate-950">{inv.name}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">{inv.role}</div>
                      </td>
                      <td className="p-2.5 text-center font-mono">{inv.active}</td>
                      <td className="p-2.5 text-center font-mono">{inv.solved}</td>
                      <td className="p-2.5 text-center font-mono text-blue-600">{inv.rate}</td>
                      <td className="p-2.5 text-right">
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                          inv.performance === 'Excellent' 
                            ? 'text-emerald-600 bg-emerald-50 border-emerald-100' 
                            : (inv.performance === 'Needs Audit' ? 'text-red-600 bg-red-50 border-red-100' : 'text-slate-650 bg-slate-50 border-slate-200')
                        }`}>
                          {inv.performance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Row 3: District Case Load Matrix & Reports access */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Jurisdictional Caseload Summary (Spans 8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin size={18} className="text-blue-600" /> Jurisdictional Overview
              </h3>
              <button onClick={() => navigate('/heatmap')} className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase">Geotemp Radar</button>
            </div>
            
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {districts.map((d, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl hover:border-blue-300 transition-colors">
                  <div className="text-[10px] font-bold text-slate-400 uppercase truncate">{d.name.split(' ')[0]}</div>
                  <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
                    {d.radius > 30 ? 28 : (d.radius > 25 ? 11 : 4)}
                    <span className="text-xs font-bold text-slate-400 ml-1">Cases</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Commander Tools launcher (Spans 4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3">Commander Tools</h3>
            <div className="space-y-2">
              <button 
                onClick={() => navigate('/reports')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileBarChart size={14} className="text-blue-600" />
                  <span>Generate District Crime Briefs</span>
                </div>
                <ArrowRight size={12} />
              </button>
              <button 
                onClick={() => navigate('/chat')}
                className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-blue-600" />
                  <span>AI Dialogue Audits</span>
                </div>
                <ArrowRight size={12} />
              </button>
            </div>
          </div>

        </div>

      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Header displaying Clearance Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">
            {role === 'crime-analyst' && 'Crime Analyst Workspace'}
            {role === 'supervisor' && 'Commanding Officer Workspace'}
            {role !== 'crime-analyst' && role !== 'supervisor' && 'Intelligence Mission Control'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {role === 'crime-analyst' && 'AI-powered Spatio-Temporal Forensics & Trend Projections.'}
            {role === 'supervisor' && 'State-Wide Caseload Auditing & Command Directives.'}
            {role !== 'crime-analyst' && role !== 'supervisor' && 'Real-time analytical overview and active investigation control.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold bg-slate-950 text-white px-2.5 py-1 rounded border border-slate-800 uppercase tracking-widest">
            Clearance: {role.replace('-', ' ')}
          </span>
        </div>
      </div>

      {/* Role-based view switch */}
      {role === 'crime-analyst' && renderAnalystDashboard()}
      {role === 'supervisor' && renderSupervisorDashboard()}
      {role !== 'crime-analyst' && role !== 'supervisor' && renderInvestigatorDashboard()}

    </div>
  );
}
