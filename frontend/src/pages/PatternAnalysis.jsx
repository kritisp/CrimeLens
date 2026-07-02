import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  ArrowLeft, 
  Sparkles, 
  ShieldAlert, 
  Cpu, 
  Activity, 
  Scale, 
  Network, 
  Clock, 
  MapPin, 
  User, 
  Car, 
  Key, 
  Compass, 
  ChevronRight, 
  Loader2, 
  FileText,
  AlertTriangle,
  Award,
  CheckCircle2,
  X
} from 'lucide-react';

export default function PatternAnalysis() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Asynchronous states
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompareCase, setSelectedCompareCase] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const targetId = id || 'FIR-1024';
    
    api.get(`/pattern/${targetId}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed fetching pattern metrics", err);
        setLoading(false);
      });
  }, [id]);

  const handleOpenComparison = (similarCase) => {
    setSelectedCompareCase(similarCase);
    setIsModalOpen(true);
  };

  const handleCloseComparison = () => {
    setIsModalOpen(false);
    setSelectedCompareCase(null);
  };

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500 gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <div className="font-mono text-sm tracking-widest uppercase animate-pulse">Running Signature Correlation Engine...</div>
      </div>
    );
  }

  const { fir, signature, similarCases, patternAnalysis, explainability } = data;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <button 
          onClick={() => navigate(`/cases/${fir.id}`)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft size={16} /> Back to Case Details
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display flex items-center gap-2">
              <Cpu className="text-blue-600 animate-pulse" size={24} /> Crime Signature & Pattern Analysis
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Explaining multi-case correlations, Modus Operandi intersections, and regional crime vectors.</p>
          </div>
          <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg uppercase tracking-wider">
            Signature Active
          </span>
        </div>
      </div>

      {/* Main 3-column split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT PANEL: Current FIR Details (3 cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest flex items-center gap-1.5">
                <FileText size={14} className="text-slate-400" /> Current Case
              </h3>
              <span className="text-[10px] font-bold text-slate-450 font-mono uppercase">{fir.id}</span>
            </div>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Crime Type</span>
                <span className="text-slate-900">{fir.type}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Occurred Time</span>
                <span className="text-slate-900 font-mono">{fir.time}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Jurisdiction</span>
                <span className="text-slate-900 truncate max-w-[120px]">{fir.location}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Target Vehicle</span>
                <span className="text-slate-900 flex items-center gap-1"><Car size={12}/> {fir.vehicle}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Entry Modus</span>
                <span className="text-slate-900 flex items-center gap-1"><Key size={12}/> {fir.entryMethod}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Escape Corridor</span>
                <span className="text-slate-900 flex items-center gap-1"><Compass size={12}/> {fir.escapeRoute}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[9px]">assigned Officer</span>
                <span className="text-slate-900 flex items-center gap-1"><User size={12}/> {fir.officer}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-center">
            <span className="inline-block text-[9px] font-bold text-slate-400 uppercase">Case Status: <span className="text-amber-600 font-bold">{fir.status}</span></span>
          </div>
        </div>

        {/* CENTER PANEL: Extracted Crime Signature (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-600 animate-pulse" /> Extracted MO Signature
            </h3>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
            Crime signatures represent the core algorithmic fingerprint extracted from raw FIR records. They define crime modus operandi matrices:
          </p>

          <div className="space-y-3">
            {[
              { label: "Crime Class", value: signature.type, color: "text-blue-700 bg-blue-50 border-blue-100" },
              { label: "Time Window", value: signature.timeWindow, color: "text-purple-700 bg-purple-50 border-purple-100" },
              { label: "Target Model", value: signature.target, color: "text-amber-700 bg-amber-50 border-amber-100" },
              { label: "Modus Operandi", value: signature.modusOperandi, color: "text-rose-700 bg-rose-50 border-rose-100" },
              { label: "Location Pattern", value: signature.locationPattern, color: "text-indigo-700 bg-indigo-50 border-indigo-100" },
              { label: "Escape Route Vector", value: signature.escapeRoute, color: "text-teal-700 bg-teal-50 border-teal-100" },
              { label: "Gang Association", value: signature.gangIndicator, color: "text-red-700 bg-red-50 border-red-100" }
            ].map((sig, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <span className="font-bold text-slate-450 uppercase text-[9px]">{sig.label}</span>
                <span className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-bold ${sig.color}`}>
                  {sig.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL: Similar Cases Found (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-950 uppercase tracking-widest flex items-center gap-1.5">
                <Scale size={14} className="text-blue-600" /> Similar Cases Located
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{similarCases.length} Matches Found</span>
            </div>

            <div className="space-y-3 pt-3">
              {similarCases.map((sc) => (
                <div key={sc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900">{sc.id}</span>
                      <span className="text-[9px] font-bold bg-white text-slate-400 px-2 py-0.5 border border-slate-200 rounded uppercase">
                        {sc.status}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-blue-600 font-mono bg-blue-50/60 border border-blue-100 px-2 py-0.5 rounded-lg">
                      {sc.match}% Match
                    </span>
                  </div>

                  {/* Match features chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {sc.features.map((feat, i) => (
                      <span key={i} className="text-[9px] font-bold text-slate-500 bg-white px-2 py-0.5 border border-slate-200 rounded flex items-center gap-1">
                        <CheckCircle2 size={10} className="text-emerald-500" /> {feat}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={() => handleOpenComparison(sc)}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 uppercase tracking-wider cursor-pointer"
                    >
                      View Comparison <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Pattern Analysis Intelligence Card & Explainability Weight Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Pattern Analysis Card (Spans 7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 text-white border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-400"></div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 border border-blue-500/20 animate-pulse">
                  <Cpu size={16} />
                </div>
                <h3 className="text-sm font-bold tracking-tight font-display">{patternAnalysis.title}</h3>
              </div>
              <span className="text-[9px] font-bold bg-slate-800/80 px-2 py-0.5 rounded text-blue-400 border border-blue-500/35 uppercase tracking-widest">
                AI Insight
              </span>
            </div>

            <div className="space-y-2.5">
              {patternAnalysis.points.map((pt, i) => (
                <div key={i} className="flex gap-2 items-start text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-2"></div>
                  <p className="text-xs font-semibold leading-relaxed">{pt}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-[9px] font-bold text-slate-500 uppercase">Conclusion Summary</div>
              <p className="text-xs text-slate-300 font-semibold leading-relaxed mt-0.5">
                {patternAnalysis.conclusion}
              </p>
            </div>
          </div>
        </div>

        {/* Explainability Weight Bars (Spans 5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Award size={18} className="text-blue-600" /> Algorithmic Matching Weights
            </h3>
            
            <div className="space-y-4">
              {[
                { label: "Crime Class Signature", val: explainability.crimeType, pct: "w-[92%]", color: "bg-blue-600" },
                { label: "Temporal Window Alignment", val: explainability.timeWindow, pct: "w-[95%]", color: "bg-purple-600" },
                { label: "Modus Operandi Indicators", val: explainability.modusOperandi, pct: "w-[97%]", color: "bg-rose-600" },
                { label: "Vehicle Class Target Group", val: explainability.vehicleType, pct: "w-[91%]", color: "bg-amber-600" },
                { label: "Geographical Proximity Radius", val: explainability.location, pct: "w-[89%]", color: "bg-indigo-600" }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{item.label}</span>
                    <span className="font-mono text-blue-600">{item.val}% Weight</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} ${item.pct} rounded-full`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-[10px] font-bold text-slate-400 mt-4 leading-relaxed border-t border-slate-100 pt-3 flex items-center gap-1">
            <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
            Matching metrics generated using KSP spatial-temporal clustering nodes.
          </div>
        </div>

      </div>

      {/* Workflow Navigation Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
        <button
          onClick={() => navigate(`/cases/${fir.id}`)}
          className="w-full sm:w-auto bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2.5 px-5 rounded-xl transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ArrowLeft size={14} /> Back to Case Details
        </button>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/copilot')}
            className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-md text-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            Open Investigator Copilot <ChevronRight size={14} />
          </button>
          <button
            onClick={() => navigate('/network')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-md shadow-blue-900/10 text-xs cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Network size={14} /> Open Network Explorer
          </button>
        </div>
      </div>

      {/* COMPARISON MODAL DIALOG DRAWER */}
      {isModalOpen && selectedCompareCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600/10 p-2 rounded-lg text-blue-600 border border-blue-100">
                  <Scale size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight font-display">Case Comparison Analyzer</h3>
                  <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Matching current case against {selectedCompareCase.id}</div>
                </div>
              </div>
              
              <button 
                onClick={handleCloseComparison}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Comparative Table */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
              
              <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-3 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                <div className="text-left">Parameter</div>
                <div>Current Case ({fir.id})</div>
                <div>Previous Case ({selectedCompareCase.id})</div>
              </div>

              <div className="space-y-3 text-xs font-semibold">
                {[
                  { label: "Crime Type", cur: fir.type, prev: selectedCompareCase.details.type, match: true },
                  { label: "Occurred Time", cur: fir.time, prev: selectedCompareCase.details.time, match: false },
                  { label: "Target vehicle", cur: fir.vehicle, prev: selectedCompareCase.details.vehicle, match: true },
                  { label: "Modus Operandi", cur: fir.entryMethod, prev: selectedCompareCase.details.entry, match: true },
                  { label: "Escape Corridor", cur: fir.escapeRoute, prev: selectedCompareCase.details.escape, match: true }
                ].map((row, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-4 p-2.5 rounded-xl border border-slate-150 hover:bg-slate-50 transition-colors text-center items-center">
                    <div className="text-left font-bold text-slate-450 uppercase text-[9px]">{row.label}</div>
                    <div className="text-slate-950">{row.cur}</div>
                    <div className="text-slate-800">{row.prev}</div>
                  </div>
                ))}
              </div>

              {/* Total Similarity Score banner */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-blue-400 uppercase">Algorithm Similarity Rating</div>
                  <p className="text-sm font-semibold text-blue-800 leading-snug mt-0.5">Highly Similar Incident Signature</p>
                </div>
                <div className="text-2xl font-bold text-blue-600 font-mono bg-white border border-blue-200 px-4 py-2 rounded-xl">
                  {selectedCompareCase.match}%
                </div>
              </div>

              {/* AI Explanation block */}
              <div className="bg-slate-50 border border-slate-200 p-4.5 rounded-2xl space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles size={12} className="text-blue-600" /> AI Explanation Digest
                </div>
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                  The two cases are highly similar because they share the same crime type, modus operandi, target vehicle, escape route, and time window. Modus operandi signal relay attacks are classified as a shared signature factor.
                </p>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={handleCloseComparison}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                Close Comparison
              </button>
              <button
                onClick={() => {
                  handleCloseComparison();
                  navigate(`/cases/${selectedCompareCase.id}`);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition-all shadow-md shadow-blue-900/10 cursor-pointer"
              >
                Inspect Case dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
