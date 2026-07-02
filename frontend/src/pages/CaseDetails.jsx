import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  ArrowLeft, 
  ArrowRight,
  AlertOctagon, 
  Network, 
  FileText, 
  Car, 
  User, 
  Shield, 
  Clock, 
  MapPin, 
  Scale, 
  Video, 
  Activity, 
  Sparkles, 
  Target, 
  Bot, 
  Link2, 
  Zap, 
  Loader2,
  FileCheck
} from 'lucide-react';

export default function CaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Asynchronous states
  const [caseItem, setCaseItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Fetch case by ID, defaulting to FIR-1024 if none in URL
    const targetId = id || 'FIR-1024';
    api.get(`/cases/${targetId}`)
      .then(res => {
        if (res.data) {
          setCaseItem(res.data);
        } else {
          setError(`Case with ID ${targetId} not found.`);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching case details", err);
        setError("Failed to fetch case dossier.");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500 gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <div className="font-mono text-sm tracking-widest uppercase animate-pulse">Retrieving Security Dossier...</div>
      </div>
    );
  }

  if (error || !caseItem) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4">
        <AlertOctagon size={48} className="text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Access Denied / Error</h3>
        <p className="text-slate-500 text-sm">{error || "Could not find case record."}</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-sm"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const c = caseItem;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      
      {/* Navigation and Top Header */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-4 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-md uppercase tracking-wider flex items-center gap-1.5 ${
                c.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <AlertOctagon size={14}/> Priority: {c.priority}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md uppercase tracking-wider flex items-center gap-1.5">
                <Network size={14}/> {c.category}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight font-display">{c.title}</h2>
          </div>
          
          <div className="text-left sm:text-right bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm inline-block">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Case ID</div>
            <div className="text-xl font-mono font-bold text-slate-950">{c.id}</div>
          </div>
        </div>
      </div>

      {/* Split Layout Container */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT SECTION: FIR Information & Timeline (Spans 2 cols) */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* General Information Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-blue-600" /> General Information
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Crime Type</div>
                <div className="font-semibold text-slate-950 text-sm flex items-center gap-1.5">
                  <Car size={16} className="text-slate-500"/> {c.type}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Victim</div>
                <div className="font-semibold text-slate-950 text-sm flex items-center gap-1.5">
                  <User size={16} className="text-slate-500"/> {c.victim || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Officer</div>
                <div className="font-semibold text-slate-950 text-sm flex items-center gap-1.5">
                  <Shield size={16} className="text-slate-500"/> {c.officer}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date / Time</div>
                <div className="font-semibold text-slate-950 text-sm flex items-center gap-1.5">
                  <Clock size={16} className="text-slate-500"/> {c.date}, {c.time}
                </div>
              </div>
              <div className="col-span-2 md:col-span-4">
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Incident Location</div>
                 <div className="font-semibold text-slate-950 text-sm flex items-center gap-1.5">
                    <MapPin size={16} className="text-slate-500"/> {c.location}
                 </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileCheck size={18} className="text-blue-600" /> Incident Description
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              {c.description}
            </p>
          </div>

          {/* Evidence collected */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Scale size={18} className="text-blue-600" /> Evidence Collected
            </h2>
            {c.evidence && c.evidence.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {c.evidence.map(ev => (
                  <div key={ev.id} className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600 h-fit border border-blue-100">
                      {ev.type === 'Video' ? <Video size={16}/> : <FileText size={16}/>}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900">{ev.type}</div>
                      <div className="text-xs text-slate-500 mt-0.5 font-medium">{ev.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                No physical evidence logs cataloged. Upload files in Copilot.
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Activity size={18} className="text-blue-600" /> Investigation Timeline
            </h2>
            {c.timeline && c.timeline.length > 0 ? (
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-2">
                {c.timeline.map((item) => (
                  <div key={item.id} className="relative pl-6">
                    <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-blue-500 shadow-sm ring-4 ring-white"></div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1.5">
                      <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-1 sm:mt-0 w-fit">
                        {item.date} • {item.time}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs font-semibold">
                Timeline logs not initialized.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION: Investigator Copilot Panel (Spans 1 col) */}
        <div className="xl:col-span-1">
          <div className="bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden sticky top-24">
            
            {/* Copilot Header */}
            <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 border border-blue-500/20">
                    <Sparkles size={18} />
                 </div>
                 <h2 className="text-base font-bold text-white tracking-tight font-display">Investigator Copilot</h2>
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold bg-slate-850 px-2 py-1 rounded-md text-emerald-400 border border-emerald-500/30">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div> Live
               </div>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Risk Score */}
              <div className="flex items-center justify-between bg-slate-850 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pattern Risk Score</div>
                  <div className="text-2xl font-bold text-red-400 font-display">{c.copilot.riskScore} / 100</div>
                </div>
                <div className="w-11 h-11 rounded-full border-4 border-slate-800 border-t-red-500 flex items-center justify-center rotate-45">
                   <div className="-rotate-45 text-red-400"><Target size={18}/></div>
                </div>
              </div>

              {/* AI Summary */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Bot size={14} /> AI Analysis Summary
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-blue-950/40 p-3 rounded-lg border border-blue-900/40">
                  {c.copilot.aiSummary}
                </p>
              </div>

              {/* Grid: Category & Organized Crime */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Category</div>
                  <div className="text-xs font-bold text-white truncate">{c.copilot.crimeCategory}</div>
                </div>
                <div className="bg-slate-850 p-3 rounded-xl border border-slate-800">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Organized Crime Link</div>
                  <div className="text-xs font-bold text-amber-400">{c.copilot.organizedCrimeLikelihood} Probable</div>
                </div>
              </div>

              {/* Likely Suspects */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Likely Suspects</h3>
                <div className="space-y-2">
                  {c.copilot.suspects.map((suspect, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-850/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-200">{suspect.name}</span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-400">{suspect.match} Match</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Network Graph Preview */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  Network Link Preview
                  <button onClick={() => navigate('/network')} className="text-blue-400 hover:text-blue-300 flex items-center gap-1 normal-case text-[10px] font-semibold cursor-pointer">
                    Expand Graph <ArrowRight size={12}/>
                  </button>
                </h3>
                <div 
                  onClick={() => navigate('/network')}
                  className="bg-slate-950 rounded-xl h-24 border border-slate-800/80 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer"
                >
                   <Network size={28} className="text-slate-600 mb-1 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
                   <div className="text-[10px] font-bold text-slate-400">6 Connected Nodes Detected</div>
                   
                   {/* Design grid lines */}
                   <div className="absolute top-1/2 left-1/4 w-10 h-[1px] bg-slate-800 -rotate-45 origin-left"></div>
                   <div className="absolute top-1/2 right-1/4 w-10 h-[1px] bg-slate-800 rotate-45 origin-right"></div>
                </div>
              </div>

              {/* Similar Cases */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Similar Cases</h3>
                <div className="flex flex-wrap gap-2">
                  {c.copilot.similarCases.map((caseTag, idx) => {
                    // Extract ID e.g., "FIR-0982 (Koramangala)" -> "FIR-0982"
                    const cleanedId = caseTag.split(' ')[0];
                    return (
                      <span 
                        key={idx} 
                        onClick={() => navigate(`/cases/${cleanedId}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-300 cursor-pointer hover:bg-slate-850 hover:text-white transition-colors"
                      >
                        <Link2 size={10}/> {caseTag}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">AI Recommendations</h3>
                <ul className="space-y-2">
                  {c.copilot.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex gap-2 items-start">
                      <div className="mt-0.5 shrink-0"><Zap size={13} className="text-amber-400" /></div>
                      <span className="text-xs text-slate-300 leading-relaxed font-semibold">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

             {/* Bottom Actions */}
             <div className="p-4 bg-slate-850 border-t border-slate-800/80 space-y-2.5">
                <button 
                  onClick={() => navigate(`/cases/${c.id}/pattern`)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-blue-900/10 text-xs cursor-pointer"
                >
                  <Cpu size={14} /> Analyze Crime Signature
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => navigate('/copilot')}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-850 hover:bg-slate-750 text-white font-semibold py-2 rounded-xl transition-all border border-slate-800 text-[10px] cursor-pointer"
                  >
                     Copilot
                  </button>
                  <button 
                    onClick={() => navigate('/chat')}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-850 hover:bg-slate-750 text-white font-semibold py-2 rounded-xl transition-all border border-slate-800 text-[10px] cursor-pointer"
                  >
                     AI Chat
                  </button>
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// Inline Cpu SVG icon fallback
const Cpu = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className} {...props}>
    <rect width="16" height="16" x="4" y="4" rx="2" />
    <rect width="6" height="6" x="9" y="9" rx="1" />
    <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
  </svg>
);
