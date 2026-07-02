import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle,
  Clock,
  TrendingUp,
  Map,
  Shield,
  Loader2,
  Calendar,
  User,
  AlertTriangle
} from 'lucide-react';

export default function Reports() {
  const navigate = useNavigate();

  // Asynchronous states
  const [reportType, setReportType] = useState("investigation"); // investigation, district, trend, timeline
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Load report data from API
  useEffect(() => {
    setLoading(true);
    let endpoint = '/reports/investigation';
    if (reportType === 'district') endpoint = '/reports/district';
    else if (reportType === 'trend') endpoint = '/reports/trend';
    else if (reportType === 'timeline') endpoint = '/reports/timeline';

    api.get(endpoint)
      .then(res => {
        setReportData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed fetching reports data", err);
        setLoading(false);
      });
  }, [reportType]);

  const handleGenerateReport = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
    }, 800); // 800ms compilation delay
  };

  const handleDownload = () => {
    setDownloading(true);
    setDownloadSuccess(false);
    
    setTimeout(() => {
      setDownloading(false);
      setDownloadSuccess(true);
      // Trigger native browser print which creates print preview/PDF save!
      window.print();
      
      // Clear success alert after 4 seconds
      setTimeout(() => {
        setDownloadSuccess(false);
      }, 4000);
    }, 1200); // 1.2s download prep delay
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500 gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <div className="font-mono text-sm tracking-widest uppercase animate-pulse">Retrieving Report Matrix...</div>
      </div>
    );
  }

  const reportTypes = [
    { id: "investigation", label: "Investigation Report", icon: FileText, desc: "Detailed case files & evidence" },
    { id: "district", label: "District Crime Report", icon: Map, desc: "Caseload rates by jurisdiction" },
    { id: "trend", label: "Crime Trend Report", icon: TrendingUp, desc: "MoM projections & peak hours" },
    { id: "timeline", label: "Case Timeline Report", icon: Clock, desc: "Milestones & audit tracking" }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display text-print-hide">Analytical Briefs & Reports</h2>
          <p className="text-sm text-slate-500 mt-0.5 text-print-hide">Compile, preview, and download official intelligence briefs and print-ready dossiers.</p>
        </div>
      </div>

      {/* Main split work-desk */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Configuration panel (1 col) */}
        <div className="lg:col-span-1 space-y-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-print-hide">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Shield size={14} className="text-blue-600" /> Compile Options
            </h3>
          </div>

          {/* Report types list */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Report Type</div>
            <div className="space-y-2">
              {reportTypes.map((t) => {
                const Icon = t.icon;
                const isActive = reportType === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setReportData(null);
                      setReportType(t.id);
                    }}
                    className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left border ${
                      isActive 
                        ? 'bg-blue-50/55 border-blue-500 text-blue-800' 
                        : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <Icon size={18} className={`mt-0.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-455'}`} />
                    <div>
                      <div className="font-bold text-xs">{t.label}</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-px bg-slate-100 my-4"></div>

          {/* Generation controls */}
          <button 
            onClick={handleGenerateReport}
            disabled={generating}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-all shadow-md text-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {generating ? (
              <>
                <Loader2 size={14} className="animate-spin text-white" />
                Compiling brief...
              </>
            ) : (
              <>
                <Sparkles size={14} /> Generate Official Brief
              </>
            )}
          </button>
        </div>

        {/* Right Side: A4 Page Preview (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Action floating header */}
          <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm text-print-hide">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="text-xs font-bold text-slate-700 uppercase">Docket Preview (Standard A4 Format)</span>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-900/10 text-xs cursor-pointer flex items-center gap-2 disabled:opacity-75"
            >
              {downloading ? (
                <>
                  <Loader2 size={13} className="animate-spin text-white" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download size={13} /> Download Official PDF / Print
                </>
              )}
            </button>
          </div>

          {/* Success download Alert */}
          {downloadSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold shadow-sm animate-in fade-in duration-300 text-print-hide">
              <CheckCircle size={16} className="text-emerald-600 shrink-0" />
              <span>Official docket generated successfully! Opening print dialog...</span>
            </div>
          )}

          {/* Actual A4 Page Sheet */}
          <div className="bg-white border border-slate-300/80 shadow-2xl p-12 max-w-[800px] mx-auto min-h-[1050px] text-slate-900 flex flex-col justify-between font-serif relative">
            
            {/* Background State Emblem watermark */}
            <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center pointer-events-none select-none">
              <Shield size={400} />
            </div>

            {/* Document Header */}
            <div>
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
                <div>
                  <h4 className="font-bold text-xs tracking-widest uppercase">Government of Karnataka</h4>
                  <h5 className="font-bold text-[10px] tracking-wide text-slate-500 uppercase mt-0.5">Department of Police • Intelligence Division</h5>
                  <h6 className="font-bold text-[9px] tracking-widest text-slate-450 uppercase mt-0.5">State Crime Records Registry</h6>
                </div>
                <div className="text-right">
                  <span className="border border-slate-900 px-3 py-1 font-sans text-[8px] font-bold uppercase tracking-widest bg-slate-50">
                    {reportData?.classification || "CONFIDENTIAL // KSP SENSITIVE"}
                  </span>
                  <div className="font-mono text-[8px] text-slate-400 mt-2 font-bold uppercase">Docket: KSP-RPT-2026-0831</div>
                </div>
              </div>

              {/* Title Block */}
              <div className="mb-6 font-sans">
                <h3 className="text-xl font-bold tracking-tight text-slate-950 font-display">
                  {reportData?.title || "Crime Records Briefing"}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 p-3.5 rounded-xl mt-4 text-[10px] font-semibold text-slate-600">
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[8px]">Compiled On</span>
                    <span className="text-slate-900 font-mono">{reportData?.dateGenerated}</span>
                  </div>
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[8px]">Requesting Officer</span>
                    <span className="text-slate-900 font-mono">Insp. Vikram Rao</span>
                  </div>
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[8px]">Requesting Division</span>
                    <span className="text-slate-900 font-mono">Crime Branch KSP</span>
                  </div>
                  <div>
                    <span className="block font-bold text-slate-400 uppercase text-[8px]">Clearance Level</span>
                    <span className="text-slate-900 font-mono">Class-II Access</span>
                  </div>
                </div>
              </div>

              {/* DYNAMIC REPORT CONTENT BODIES */}

              {/* 1. INVESTIGATION REPORT */}
              {reportType === 'investigation' && reportData && (
                <div className="space-y-6 font-sans">
                  
                  {/* Summary Block */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-1 mb-2 tracking-wider">Executive Summary</h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold">{reportData.summary}</p>
                  </div>

                  {/* Risk Profile */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-1 mb-3 tracking-wider">AI Risk Index & Classification</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                        <span className="block font-bold text-slate-450 uppercase text-[8px]">Pattern Risk Rating</span>
                        <span className="text-base font-bold text-red-600 mt-0.5 block">{reportData.riskAudit.riskScore}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                        <span className="block font-bold text-slate-450 uppercase text-[8px]">Pattern Category</span>
                        <span className="text-xs font-bold text-slate-900 mt-0.5 block truncate">{reportData.riskAudit.riskCategory}</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-center">
                        <span className="block font-bold text-slate-450 uppercase text-[8px]">Syndicate Likelihood</span>
                        <span className="text-base font-bold text-blue-600 mt-0.5 block">{reportData.riskAudit.likelihood}</span>
                      </div>
                    </div>
                  </div>

                  {/* Evidence Matrix */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-1 mb-2 tracking-wider">Physical & Cellular Evidence Catalog</h4>
                    <table className="w-full text-left text-[10px] border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <th className="p-2.5 font-bold uppercase">Evidence Type</th>
                          <th className="p-2.5 font-bold uppercase">Incident Parameters & Logs</th>
                          <th className="p-2.5 font-bold uppercase">Catalog Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {reportData.evidence.map((ev, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 font-medium">
                            <td className="p-2.5 font-bold text-slate-900">{ev.type}</td>
                            <td className="p-2.5">{ev.description}</td>
                            <td className="p-2.5 font-mono text-[9px]">{ev.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

              {/* 2. DISTRICT CRIME REPORT */}
              {reportType === 'district' && reportData && (
                <div className="space-y-6 font-sans">
                  
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-1 mb-3 tracking-wider">District Analysis (Past 30 Days)</h4>
                    <table className="w-full text-left text-[10px] border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <th className="p-2.5 font-bold uppercase">District Division</th>
                          <th className="p-2.5 font-bold uppercase text-center">Active Cases</th>
                          <th className="p-2.5 font-bold uppercase text-center">Solved Cases</th>
                          <th className="p-2.5 font-bold uppercase text-center">Offenders</th>
                          <th className="p-2.5 font-bold uppercase text-right">Risk Index</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                        {reportData.districts.map((d, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{d.name}</td>
                            <td className="p-2.5 text-center font-mono">{d.active}</td>
                            <td className="p-2.5 text-center font-mono">{d.solved}</td>
                            <td className="p-2.5 text-center font-mono">{d.repeatOffenders}</td>
                            <td className={`p-2.5 text-right font-bold ${
                              d.risk === 'CRITICAL' ? 'text-red-600' : (d.risk === 'HIGH' ? 'text-orange-600' : 'text-slate-600')
                            }`}>{d.risk}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary aggregate */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Aggregate State Totals</h5>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">State Active cases</span>
                        <span className="text-sm font-bold text-slate-900 mt-0.5 block">{reportData.totalSummary.totalActive} Active</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">State Solved cases</span>
                        <span className="text-sm font-bold text-slate-900 mt-0.5 block">{reportData.totalSummary.totalSolved} Solved</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">Resolution Ratio</span>
                        <span className="text-sm font-bold text-emerald-600 mt-0.5 block">{reportData.totalSummary.resolvedRate}</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* 3. CRIME TREND REPORT */}
              {reportType === 'trend' && reportData && (
                <div className="space-y-6 font-sans">
                  
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-1 mb-2 tracking-wider">Executive Trend summary</h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-semibold">{reportData.summary}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-1 mb-3 tracking-wider">Incident Vectors & peak Hours</h4>
                    <table className="w-full text-left text-[10px] border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <th className="p-2.5 font-bold uppercase">Crime Vector</th>
                          <th className="p-2.5 font-bold uppercase">Monthly Trend</th>
                          <th className="p-2.5 font-bold uppercase">Risk Rating</th>
                          <th className="p-2.5 font-bold uppercase text-right">Peak Offense Hours</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                        {reportData.trends.map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 font-bold text-slate-900">{t.category}</td>
                            <td className="p-2.5 font-mono text-emerald-600">{t.trend}</td>
                            <td className={`p-2.5 font-bold ${t.riskLevel === 'HIGH' ? 'text-red-600' : 'text-slate-600'}`}>
                              {t.riskLevel}
                            </td>
                            <td className="p-2.5 text-right font-mono text-[9px] text-slate-500">{t.peakHours}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Hotzones */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-1 mb-2.5 tracking-wider">Primary Geotemp Hotspots Flagged</h4>
                    <div className="flex flex-wrap gap-2">
                      {reportData.hotZones.map((z, idx) => (
                        <span key={idx} className="bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-800 rounded-lg">
                          {z}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* 4. CASE TIMELINE REPORT */}
              {reportType === 'timeline' && reportData && (
                <div className="space-y-6 font-sans">
                  
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase border-b border-slate-100 pb-1 mb-2 tracking-wider">Investigative Milestone Log</h4>
                    <table className="w-full text-left text-[10px] border border-slate-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <th className="p-2.5 font-bold uppercase text-center w-12">Step</th>
                          <th className="p-2.5 font-bold uppercase">Timestamp</th>
                          <th className="p-2.5 font-bold uppercase">Milestone</th>
                          <th className="p-2.5 font-bold uppercase text-right">Audit details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                        {reportData.milestones.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 text-center font-bold text-slate-500">{m.step}</td>
                            <td className="p-2.5 font-mono text-[9px] text-slate-400">{m.date}</td>
                            <td className="p-2.5 font-bold text-slate-950">{m.title}</td>
                            <td className="p-2.5 text-right text-slate-500 font-medium max-w-[220px]">{m.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

            </div>

            {/* Document Footer */}
            <div className="border-t border-slate-300 pt-6 mt-8 font-sans">
              <div className="flex justify-between items-end text-[9px] text-slate-450">
                <div className="space-y-1">
                  <div className="font-bold uppercase tracking-wider text-slate-600">Verification Registry SHA-256</div>
                  <div className="font-mono text-[8px] lowercase font-bold text-slate-400">
                    ksp-sha256:7b91ca94f8e0283c11d2e4821a8bf92b0c1e7d23d4f828a211bc92a832
                  </div>
                </div>
                
                <div className="text-right space-y-4">
                  <div className="h-0.5 w-32 bg-slate-350 ml-auto"></div>
                  <div className="font-bold uppercase tracking-widest text-slate-700">Director of Intelligence, KSP</div>
                </div>
              </div>

              <div className="text-center text-[7px] text-slate-400 font-bold uppercase tracking-widest mt-6 border-t border-slate-100 pt-3">
                Law Enforcement Sensitive — Unauthorized duplication is punishable under the IT Act 2000.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
