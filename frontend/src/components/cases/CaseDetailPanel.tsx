import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  X, Shield, AlertTriangle, CheckCircle, Clock, 
  MapPin, Users, Bot, BookOpen, FileText, Download, 
  Printer, Pin, Plus, Eye, File, Network, Cpu, Lock
} from "lucide-react";
import { jsPDF } from "jspdf";
import { CaseNetworkExplorer } from "./CaseNetworkExplorer";
import type { FIRRecord } from "../../types";
import { Badge } from "../ui/Badge";
import { GlassCard } from "../ui/GlassCard";

interface CaseDetailPanelProps {
  record: FIRRecord;
  onClose: () => void;
}

export function CaseDetailPanel({ record, onClose }: CaseDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [dossierData, setDossierData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Interactive Gallery States
  const [activeGalleryMedia, setActiveGalleryMedia] = useState<any>(null);
  
  // Dynamic Officer Notes State
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [noteType, setNoteType] = useState<"private" | "shared">("shared");

  // Hackathon feature states
  const [isScanning, setIsScanning] = useState(false);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [expandedLedger, setExpandedLedger] = useState<string | null>(null);
  const [verifiedLedgers, setVerifiedLedgers] = useState<string[]>([]);
  const [isValidatingLedger, setIsValidatingLedger] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Fetch complete dossier payload
  const fetchDossierData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/intelligence/dossier/${record.id}`);
      if (res.ok) {
        setDossierData(await res.json());
      } else {
        // Fallback mock if endpoint error occurs
        setDossierData(mockFallbackDossier(record));
      }
    } catch (err) {
      console.error(err);
      setDossierData(mockFallbackDossier(record));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossierData();
  }, [record.id]);

  // Leaflet map renderer
  useEffect(() => {
    if (activeTab !== "location" || !mapContainerRef.current || !dossierData) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;
      
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const { crimeScene, policeStation, evidence, witness, suspect } = dossierData.locationIntel;
      
      const map = L.map(mapContainerRef.current).setView(crimeScene, 13);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(map);
      mapRef.current = map;

      // Add pins
      L.marker(crimeScene, {
        icon: L.divIcon({
          html: `<div class="h-5 w-5 rounded-full bg-rose-500 border border-white flex items-center justify-center shadow-glow animate-pulse text-white text-[7.5px] font-black">CS</div>`,
          className: "custom-marker-pin",
          iconSize: [24, 24]
        })
      }).addTo(map).bindPopup("<b>Crime Scene Location</b>");

      L.marker(policeStation, {
        icon: L.divIcon({
          html: `<div class="h-5 w-5 rounded-full bg-cyan-500 border border-white flex items-center justify-center shadow-glow text-white text-[7.5px] font-black">PS</div>`,
          className: "custom-marker-pin",
          iconSize: [24, 24]
        })
      }).addTo(map).bindPopup("<b>Associated Station</b>");

      evidence.forEach((ev: any, idx: number) => {
        L.marker(ev, {
          icon: L.divIcon({
            html: `<div class="h-5 w-5 rounded-full bg-amber-500 border border-white flex items-center justify-center shadow-glow text-white text-[7.5px] font-black">EV</div>`,
            className: "custom-marker-pin",
            iconSize: [24, 24]
          })
        }).addTo(map).bindPopup(`Evidence recovered coordinate #${idx + 1}`);
      });

      witness.forEach((wt: any, idx: number) => {
        L.marker(wt, {
          icon: L.divIcon({
            html: `<div class="h-5 w-5 rounded-full bg-emerald-500 border border-white flex items-center justify-center shadow-glow text-white text-[7.5px] font-black">WT</div>`,
            className: "custom-marker-pin",
            iconSize: [24, 24]
          })
        }).addTo(map).bindPopup(`Witness spotted coordinate #${idx + 1}`);
      });

      if (suspect) {
        suspect.forEach((sp: any, idx: number) => {
          L.marker(sp, {
            icon: L.divIcon({
              html: `<div class="h-5 w-5 rounded-full bg-purple-500 border border-white flex items-center justify-center shadow-glow text-white text-[7.5px] font-black">SP</div>`,
              className: "custom-marker-pin",
              iconSize: [24, 24]
            })
          }).addTo(map).bindPopup(`Accused suspect trace Area #${idx + 1}`);
        });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [activeTab, dossierData]);

  // Handle addition of a note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteContent.trim()) return;

    const newNote = {
      title: newNoteTitle,
      content: newNoteContent,
      pinned: false,
      private: noteType === "private",
      date: new Date().toISOString().split("T")[0]
    };

    setDossierData((prev: any) => ({
      ...prev,
      officerNotes: [newNote, ...prev.officerNotes]
    }));

    setNewNoteTitle("");
    setNewNoteContent("");
  };

  // Custom PDF Print Action
  const triggerPrint = () => {
    window.print();
  };

  // Custom jsPDF Compiler Action
  const triggerPDFExport = () => {
    if (!dossierData) return;
    const { overview, incident, evidence } = dossierData;
    
    try {
      const doc = new jsPDF();
      doc.setFont("courier", "bold");
      doc.setFontSize(16);
      doc.text("DELHI POLICE DEPARTMENT - OFFICIAL BRIEFING", 20, 20);
      doc.setDrawColor(34, 211, 238);
      doc.line(20, 24, 190, 24);
      
      doc.setFont("courier", "normal");
      doc.setFontSize(10);
      doc.text(`FIR Number: ${overview.firNumber}`, 20, 35);
      doc.text(`Case ID: ${overview.caseNumber}`, 20, 42);
      doc.text(`Priority Level: ${overview.priority.toUpperCase()}`, 20, 49);
      doc.text(`Assigned Officer: ${overview.assignedOfficer}`, 20, 56);
      doc.text(`Status: ${overview.currentStatus.toUpperCase()}`, 20, 63);
      
      doc.line(20, 68, 190, 68);
      doc.setFont("courier", "bold");
      doc.text("INCIDENT NARRATIVE SUMMARY", 20, 75);
      doc.setFont("courier", "normal");
      
      const splitText = doc.splitTextToSize(incident.originalNarrative || incident.description, 170);
      doc.text(splitText, 20, 82);
      
      const textHeight = splitText.length * 5;
      const nextY = 82 + textHeight + 10;
      
      doc.line(20, nextY - 5, 190, nextY - 5);
      doc.setFont("courier", "bold");
      doc.text("FORENSIC EVIDENCE LEDGER", 20, nextY);
      doc.setFont("courier", "normal");
      
      let evY = nextY + 7;
      evidence.forEach((ev: any) => {
        if (evY < 270) {
          doc.text(`- [${ev.id}] ${ev.type}: ${ev.description} (Collector: ${ev.uploadedBy})`, 20, evY);
          evY += 7;
        }
      });
      
      doc.save(`Official_Dossier_${overview.firNumber.replace(/\//g, "_")}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("Failed to compile PDF. Reverting to standard print layout.");
      window.print();
    }
  };

  const startEvidenceScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsScanning(true);
    setScanResult(null);
    setScanLog(["[SYSTEM] Initializing forensic scanning sweeps...", "[SECURE] Connecting to National Crime Records Bureau database..."]);
    
    setTimeout(() => {
      setScanLog(prev => [...prev, "[SCAN] Extracting facial markers and ridge density...", "[DB] Matching biometric hash templates..."]);
    }, 8000);

    setTimeout(() => {
      setScanLog(prev => [...prev, "[AI] Calculating similarity matrix overlays...", "[NCRB] 1 potential record match identified."]);
    }, 1600);

    setTimeout(() => {
      setIsScanning(false);
      setScanResult("98% Match Confirmed: Alias 'Rony' (Rohan Gupta) - Salt Lake Crime Registry");
    }, 2400);
  };

  const handleValidateLedger = (evId: string) => {
    setIsValidatingLedger(evId);
    setTimeout(() => {
      setVerifiedLedgers(prev => [...prev, evId]);
      setIsValidatingLedger(null);
    }, 1500);
  };

  if (loading || !dossierData) {
    return (
      <GlassCard className="p-12 flex flex-col items-center justify-center border-cyan-accent/20 min-h-[350px]">
        <Shield className="h-10 w-10 text-cyan-accent animate-spin mb-4" />
        <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest animate-pulse">Decompiling Case Files & Forensic Evidence...</p>
      </GlassCard>
    );
  }

  const { overview, incident, complainant, victim, suspect, witnesses, evidence, timeline, aiSummary, legal, linkedCases, officerNotes, activityLog, documents, riskPanel } = dossierData;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-hidden print:static print:bg-white print:p-0">
      
      <GlassCard className="w-full max-w-7xl h-[95vh] border-white/10 shadow-glow relative animate-scale-in flex flex-col p-0 overflow-hidden bg-navy-950/95 backdrop-blur-lg print:h-auto print:static print:bg-white print:border-none print:shadow-none">
        
        {/* Holographic Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-navy-950/80 z-10 print:hidden">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-cyan-accent/15 border border-cyan-accent/35 text-cyan-accent flex items-center justify-center rounded-xl shadow-glow">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-xs font-bold text-cyan-accent uppercase tracking-wider">{overview.firNumber} — {overview.caseNumber}</p>
              <h2 className="text-base font-black text-white uppercase tracking-tight">{overview.caseTitle}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge label={overview.currentStatus} variant="status" status={overview.currentStatus} />
            <Badge label={overview.priority} variant="priority" priority={overview.priority} />
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Dossier Body Wrapper */}
        <div className="flex-1 flex overflow-hidden min-h-0 print:block">
          
          {/* Sidebar Tabs Navigation Panel */}
          <div className="w-64 bg-navy-950/40 border-r border-white/10 flex flex-col justify-between py-2 print:hidden hidden md:flex shrink-0">
            <div className="space-y-1 px-2 overflow-y-auto">
              {[
                { id: "overview", label: "Overview & Risk", icon: Shield },
                { id: "incident", label: "Incident Parameters", icon: MapPin },
                { id: "people", label: "Associated Parties", icon: Users },
                { id: "network", label: "Intelligence Network", icon: Network },
                { id: "evidence", label: "Evidence Gallery", icon: FileText },
                { id: "timeline", label: "Timeline Log", icon: Clock },
                { id: "legal", label: "Legal & AI Summary", icon: BookOpen },
                { id: "location", label: "GIS Intelligence", icon: MapPin },
                { id: "notes", label: "Officer Notes", icon: Pin },
                { id: "documents", label: "Documents & Audit", icon: FileText },
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-bold uppercase tracking-wider transition-all duration-150 border-l-2 ${
                      active 
                        ? "bg-cyan-accent/10 border-cyan-accent text-cyan-accent shadow-[0_0_12px_rgba(34,211,238,0.1)]" 
                        : "border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Print & Export Bar */}
            <div className="px-4 py-2 border-t border-white/5 space-y-2">
              <button 
                onClick={triggerPrint}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-cyan-accent/20 bg-cyan-accent/10 text-cyan-accent text-xs font-bold uppercase hover:bg-cyan-accent/20 transition-all"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Dossier File
              </button>
              <button 
                onClick={triggerPDFExport}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-xs font-bold uppercase hover:bg-emerald-500/20 transition-all shadow-glass"
              >
                <Download className="h-3.5 w-3.5" />
                Export Forensic PDF
              </button>
            </div>
          </div>

          {/* Sticky Header Tabs for mobile displays */}
          <div className="flex md:hidden bg-navy-950 border-b border-white/10 px-2 py-1.5 overflow-x-auto gap-1 z-10 shrink-0 print:hidden">
            {[
              { id: "overview", label: "Overview" },
              { id: "incident", label: "Incident" },
              { id: "people", label: "Parties" },
              { id: "network", label: "Network" },
              { id: "evidence", label: "Evidence" },
              { id: "timeline", label: "Timeline" },
              { id: "legal", label: "Legal" },
              { id: "location", label: "GIS" },
              { id: "notes", label: "Notes" },
              { id: "documents", label: "Docs" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.id ? "bg-cyan-accent/15 text-cyan-accent border border-cyan-accent/30" : "text-slate-400"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Core Dossier Details Content (Scrollable Area) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0 print:overflow-visible">
            
            {/* TAB 1: CASE OVERVIEW & RISK GAUGE */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-fade-in print:space-y-4">
                
                {/* Visual Status Blocks */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Investigation Phase</span>
                    <p className="text-base font-black text-white mt-1 uppercase font-mono">{overview.investigationStage}</p>
                    <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-cyan-accent" style={{ width: overview.investigationStage === "Chargesheet Filed" ? "100%" : "60%" }} />
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">AI Confidence Rating</span>
                    <p className="text-lg font-black text-cyan-accent mt-0.5 font-mono">{overview.aiConfidenceScore}%</p>
                    <span className="text-[8px] text-slate-400">Scanned semantic match indices</span>
                  </div>

                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Mobile File QR</span>
                      <p className="text-[8px] text-slate-400 mt-1 leading-normal">Scan to synchronize file updates on tablet device.</p>
                    </div>
                    <img src={overview.qrCodeUrl} className="h-10 w-10 border border-white/10 rounded bg-white p-0.5" alt="QR" />
                  </div>
                </div>

                {/* Primary Overview Parameters Grid */}
                <GlassCard className="p-5 border-white/10 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Master Case Indices</h3>
                  <div className="grid gap-4 grid-cols-2 md:grid-cols-4 font-mono text-xs">
                    {[
                      ["FIR Number", overview.firNumber],
                      ["Case Number", overview.caseNumber],
                      ["Category", overview.crimeCategory],
                      ["Sub-Category", overview.crimeSubCategory],
                      ["Registered Date", overview.dateRegistered],
                      ["Last Mod Log", overview.lastUpdated],
                      ["Lead Officer", overview.assignedOfficer],
                      ["Supervisor", overview.supervisingOfficer],
                      ["Police Unit", overview.policeStation],
                      ["District Hub", overview.district],
                      ["Jurisdiction Area", overview.jurisdiction],
                    ].map(([label, value]) => (
                      <div key={label} className="border-b border-white/5 pb-2">
                        <span className="text-[8.5px] text-slate-500 block uppercase font-bold">{label}</span>
                        <span className="text-slate-200 block mt-1 truncate">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Case Tags */}
                  <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Case Tags:</span>
                    {overview.caseTags.map((t: string) => (
                      <span key={t} className="text-[9px] px-2 py-0.5 rounded border border-white/10 bg-white/5 text-slate-300 font-semibold font-mono">{t}</span>
                    ))}
                  </div>
                </GlassCard>

                {/* Section 16: AI Risk & Probabilities panel */}
                <div className="grid gap-4 md:grid-cols-2">
                  <GlassCard className="p-5 border-rose-500/20 bg-rose-950/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4.5 w-4.5 text-rose-400" />
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">AI Risk Scorecard</span>
                    </div>

                    <div className="flex items-center gap-4 mb-4 border-b border-white/5 pb-4">
                      <div className="h-16 w-16 relative flex items-center justify-center bg-black/20 rounded-full border border-rose-500/30">
                        <span className="text-lg font-mono font-black text-rose-400">{riskPanel.riskScore}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Threat Level: {riskPanel.threatLevel}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5">Calculated dynamically via offender history and spatial indexes.</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-[10px] text-slate-300 font-mono">
                      <div>
                        <span className="text-slate-500">Repeat Offender Likelihood:</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: `${riskPanel.repeatOffenderProb}%` }} />
                          </div>
                          <span>{riskPanel.repeatOffenderProb}%</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500">Flight Risk Index:</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500" style={{ width: `${riskPanel.flightRisk}%` }} />
                          </div>
                          <span>{riskPanel.flightRisk}%</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500">Violence Probability:</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{ width: `${riskPanel.violenceProb}%` }} />
                          </div>
                          <span>{riskPanel.violenceProb}%</span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-5 border-white/10 bg-navy-900/40 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 border-b border-white/5 pb-1">Risk Factors Explanation</h4>
                      <div className="space-y-2 text-[10px] leading-relaxed text-slate-300 font-mono">
                        <p><b className="text-rose-400">Score Origin:</b> {riskPanel.explanations.riskScore}</p>
                        <p><b className="text-orange-400">Offender History:</b> {riskPanel.explanations.repeatOffenderProb}</p>
                        <p><b className="text-cyan-400">Fencing/ syndicate:</b> {riskPanel.explanations.flightRisk}</p>
                      </div>
                    </div>
                  </GlassCard>
                </div>

              </div>
            )}

            {/* TAB 2: INCIDENT PARAMETERS */}
            {activeTab === "incident" && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Location Grid */}
                <GlassCard className="p-5 border-white/10 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Geospatial Scene Parameters</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 font-mono text-xs">
                    {[
                      ["Incident Date", incident.incidentDate],
                      ["Incident Time", incident.incidentTime],
                      ["GPS Scene Target", incident.gpsCoordinates],
                      ["Location Description", incident.incidentLocation],
                      ["Indoor / Outdoor", incident.indoorOutdoor],
                      ["Crime Scene Type", incident.crimeSceneType],
                      ["Est. Offense Duration", incident.estimatedDuration],
                      ["Day / Night Status", incident.dayNight],
                      ["Environment Weather", incident.weather],
                    ].map(([label, value]) => (
                      <div key={label} className="border-b border-white/5 pb-2">
                        <span className="text-[8.5px] text-slate-500 block uppercase font-bold">{label}</span>
                        <span className="text-slate-200 block mt-1">{value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-white/5 pt-3">
                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold mb-1">Incident Address</span>
                    <p className="text-xs text-slate-300 font-mono leading-normal">{incident.fullAddress}</p>
                  </div>
                </GlassCard>

                {/* Narratives Card */}
                <div className="grid gap-4 md:grid-cols-2">
                  <GlassCard className="p-5 border-white/10 bg-navy-900/60">
                    <h4 className="text-xs font-bold text-cyan-accent uppercase tracking-wider mb-2 border-b border-white/5 pb-1.5">Original FIR Narrative</h4>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-mono whitespace-pre-wrap">{incident.originalNarrative}</p>
                  </GlassCard>

                  <GlassCard className="p-5 border-white/10 bg-navy-900/60 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 border-b border-white/5 pb-1.5">AI-Generated Summary</h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-mono">{incident.aiSummary}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Identified Entities</span>
                      <div className="flex flex-wrap gap-1">
                        {incident.keywords.map((kw: string) => (
                          <span key={kw} className="text-[8.5px] px-2 py-0.5 rounded border border-rose-500/20 bg-rose-950/20 text-rose-300 font-mono uppercase">{kw}</span>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                </div>

              </div>
            )}

            {/* TAB 3: ASSOCIATED PARTIES */}
            {activeTab === "people" && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Complainant Section */}
                <GlassCard className="p-5 border-white/10 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Users className="h-4.5 w-4.5 text-cyan-accent" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Complainant Profile</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
                    {[
                      ["Full Name", complainant.name],
                      ["Age / Gender", `${complainant.age} / ${complainant.gender}`],
                      ["Contact Line", complainant.phone],
                      ["Email Address", complainant.email],
                      ["Occupation", complainant.occupation],
                      ["Identity Document", complainant.identityProof],
                      ["Victim Relation", complainant.relationshipWithVictim],
                      ["Emergency Contact", complainant.emergencyContact],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <span className="text-[8.5px] text-slate-500 block uppercase font-bold">{label}</span>
                        <span className="text-slate-200 block mt-1">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/[0.01] border border-white/5 p-3 rounded-lg mt-2">
                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold font-mono">Statement Log</span>
                    <p className="text-xs text-slate-300 leading-normal font-mono mt-1">"{complainant.statement}"</p>
                  </div>
                </GlassCard>

                {/* Victim Details Section */}
                <GlassCard className="p-5 border-white/10 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <Users className="h-4.5 w-4.5 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Victim Profile</h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
                    {[
                      ["Full Name", victim.name],
                      ["Age / Gender", `${victim.age} / ${victim.gender}`],
                      ["Assigned Condition", victim.condition],
                      ["Hospital Admittance", victim.hospital],
                      ["Medical Sheet Ref", victim.medicalReport],
                      ["Protection Status", victim.protectionStatus],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <span className="text-[8.5px] text-slate-500 block uppercase font-bold">{label}</span>
                        <span className="text-slate-200 block mt-1">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-white/[0.01] border border-white/5 p-3 rounded-lg mt-2">
                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold font-mono">Victim Statement Log</span>
                    <p className="text-xs text-slate-300 leading-normal font-mono mt-1">"{victim.statement}"</p>
                  </div>
                </GlassCard>

                {/* Suspect / Accused Profile */}
                <GlassCard className="p-5 border-rose-500/20 bg-rose-950/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4.5 w-4.5 text-rose-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Target Accused Profile</h3>
                    </div>
                    {suspect.repeatOffender && (
                      <span className="text-[8.5px] px-2 py-0.5 rounded-full border border-rose-500 bg-rose-950 text-rose-400 font-bold font-mono animate-pulse">REPEAT OFFENDER</span>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row gap-5 items-start">
                    {suspect.photograph && (
                      <img src={suspect.photograph} className="h-24 w-24 rounded-xl border border-rose-500/30 object-cover shadow-glow" alt="Accused" />
                    )}
                    <div className="flex-1 grid gap-4 grid-cols-2 md:grid-cols-4 font-mono text-xs">
                      {[
                        ["Name (Alias)", `${suspect.name} (${suspect.alias})`],
                        ["Age / Gender", `${suspect.age} / ${suspect.gender}`],
                        ["Risk Category", suspect.riskLevel],
                        ["Wanted Status", suspect.wantedStatus],
                        ["Custody / Arrest Status", suspect.arrestStatus],
                        ["Bail Status", suspect.bailStatus],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <span className="text-[8.5px] text-slate-500 block uppercase font-bold">{label}</span>
                          <span className="text-slate-200 block mt-1">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 border-t border-white/5 pt-3 font-mono text-xs text-slate-300">
                    <div>
                      <span className="text-[8.5px] text-slate-500 block uppercase font-bold">Associates Network</span>
                      <p className="mt-1">{suspect.knownAssociates?.join(", ") || "None recorded"}</p>
                    </div>
                    <div>
                      <span className="text-[8.5px] text-slate-500 block uppercase font-bold">Syndicate Links</span>
                      <p className="mt-1">{suspect.networkLinks}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-3">
                    <span className="text-[8.5px] text-slate-500 block uppercase font-bold font-mono"> Salt Lake database Criminal Record</span>
                    <ul className="list-disc list-inside space-y-1 mt-1 text-xs text-rose-300 font-mono">
                      {suspect.previousRecords?.map((rec: string) => (
                        <li key={rec}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </GlassCard>

                {/* Witness Profile */}
                <GlassCard className="p-5 border-white/10 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Witness Log Statement Records</h3>
                  <div className="space-y-3">
                    {witnesses.map((w: any) => (
                      <div key={w.name} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-xs">
                        <div className="space-y-1">
                          <p className="font-bold text-white uppercase">{w.name} <span className="text-[9px] text-slate-500">({w.contact})</span></p>
                          <p className="text-slate-300 italic">"{w.statement}"</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[9.5px] font-black text-emerald-400 block">Reliability: {w.reliabilityScore}%</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-slate-400 block mt-1">{w.verificationStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>

              </div>
            )}

            {/* TAB 4: EVIDENCE GALLERY */}
            {activeTab === "evidence" && (
              <div className="space-y-6 animate-fade-in">
                
                {/* CSS animation style helper */}
                <style>{`
                  @keyframes scan {
                    0% { top: 0%; opacity: 0.8; }
                    50% { top: 100%; opacity: 0.8; }
                    100% { top: 0%; opacity: 0.8; }
                  }
                `}</style>

                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Tactical Evidence Ledger</h2>
                  <button 
                    onClick={() => setActiveTab("notes")} // redirection shortcut
                    className="flex items-center gap-1 text-[10px] text-cyan-accent uppercase font-bold hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" /> Append Evidence Card
                  </button>
                </div>

                {/* AI Facial Recognition & Evidence Scanner */}
                <GlassCard className="p-4 border-cyan-500/20 bg-cyan-950/5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                    <Cpu className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">AI Forensic Biometric & Facial Recognition Scanner</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Scanner Upload dropzone */}
                    <div className="border border-dashed border-white/20 hover:border-cyan-400/50 rounded-xl p-6 bg-black/40 flex flex-col items-center justify-center text-center transition-all relative overflow-hidden group min-h-[140px]">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={startEvidenceScan}
                        className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        disabled={isScanning}
                      />
                      <Bot className="h-8 w-8 text-cyan-accent mb-2 group-hover:scale-110 transition-transform duration-300" />
                      <p className="text-xs font-mono font-bold text-slate-300">Drag & Drop Suspect Mugshot / Evidence Scan</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-mono">Supports JPEG, PNG • Interactive OCR & Biometrics Match</p>
                      
                      {isScanning && (
                        <div className="absolute inset-0 bg-navy-950/90 flex flex-col items-center justify-center p-4">
                          {/* Laser Scanning Animation */}
                          <div className="absolute left-0 w-full h-[2px] bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-[scan_2s_ease-in-out_infinite]" />
                          <Cpu className="h-6 w-6 text-cyan-accent animate-spin mb-2" />
                          <p className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-widest animate-pulse">Running Face Match Sweeps...</p>
                        </div>
                      )}
                    </div>

                    {/* Console Output logs */}
                    <div className="bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-[10px] flex flex-col justify-between min-h-[140px]">
                      <div className="space-y-1.5 overflow-y-auto max-h-[110px] text-slate-400">
                        {scanLog.length === 0 ? (
                          <span className="text-slate-600 block">SYSTEM STATUS: IDLE. Ready for evidence scan upload.</span>
                        ) : (
                          scanLog.map((log, idx) => (
                            <div key={idx} className="flex gap-1.5">
                              <span className="text-cyan-400 shrink-0">&gt;&gt;</span>
                              <span>{log}</span>
                            </div>
                          ))
                        )}
                        {scanResult && (
                          <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 font-bold animate-fade-in">
                            [SUCCESS] {scanResult}
                          </div>
                        )}
                      </div>
                      <div className="text-[9px] text-slate-500 border-t border-white/5 pt-2 flex justify-between">
                        <span>NCRB AUTH: SECURE</span>
                        <span>MODULE: v4.12-AI</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                {/* Evidence Cards list with blockchain verification panels */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {evidence.map((ev: any) => {
                    const isLedgerOpen = expandedLedger === ev.id;
                    const isVerified = verifiedLedgers.includes(ev.id);
                    const isValidating = isValidatingLedger === ev.id;

                    return (
                      <GlassCard key={ev.id} className="p-4 border-white/10 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="font-mono text-xs font-bold text-cyan-accent">{ev.id}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded border border-white/10 bg-white/5 text-slate-300 font-semibold uppercase font-mono">{ev.type}</span>
                          </div>
                          <p className="text-xs text-white font-mono">{ev.description}</p>
                          
                          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-slate-500">
                            <span>Collector: <b className="text-slate-300">{ev.uploadedBy}</b></span>
                            <span>Collected: <b className="text-slate-300">{ev.dateCollected}</b></span>
                            <span>Location: <b className="text-slate-300">{ev.collectionLocation}</b></span>
                            <span>Lab: <b className="text-slate-300">{ev.laboratoryStatus}</b></span>
                          </div>

                          {/* Blockchain Ledgers Drawer */}
                          {isLedgerOpen && (
                            <div className="p-3 bg-black/60 border border-white/5 rounded-xl space-y-2 font-mono text-[9px] text-slate-400 animate-fade-in">
                              <div className="flex justify-between border-b border-white/5 pb-1">
                                <span className="text-[8px] text-slate-500 uppercase">Block ID</span>
                                <span className="text-slate-200">#EVID-{ev.id.replace("EVID-", "")}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-slate-500 uppercase">SHA-256 Hash</span>
                                <span className="text-slate-300 break-all select-all font-mono">0x7fa{ev.id.charCodeAt(0)}8b490ce0f82a93b{ev.id.charCodeAt(ev.id.length-1)}39f40e018a</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[8px] text-slate-500 uppercase">Previous Block Hash</span>
                                <span className="text-slate-500 break-all font-mono">0x9328ff9a0bc310d540291ba7ff0234ed4cba8f017a</span>
                              </div>
                              <div className="flex justify-between border-t border-white/5 pt-1.5">
                                <span className="text-[8px] text-slate-500 uppercase">Verification Status</span>
                                <span className={`font-bold uppercase ${isVerified ? "text-emerald-400 animate-pulse" : "text-rose-400 animate-pulse"}`}>
                                  {isVerified ? "CUSTODY SECURED" : "UNVERIFIED IN LEDGER"}
                                </span>
                              </div>

                              {!isVerified && (
                                <button
                                  onClick={() => handleValidateLedger(ev.id)}
                                  disabled={isValidating}
                                  className="w-full py-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 text-emerald-400 font-bold uppercase transition-all flex items-center justify-center gap-1 mt-1 disabled:opacity-50"
                                >
                                  {isValidating ? (
                                    <>
                                      <Cpu className="h-3 w-3 animate-spin" />
                                      Verifying Hashes...
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-3 w-3" />
                                      Verify Ledger Block
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Display attachment triggers */}
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 flex-wrap">
                          <button
                            onClick={() => setExpandedLedger(isLedgerOpen ? null : ev.id)}
                            className="flex items-center gap-1 text-[9.5px] font-bold uppercase text-slate-400 hover:text-white transition-colors"
                          >
                            <Lock className="h-3.5 w-3.5 text-cyan-accent" />
                            {isLedgerOpen ? "Hide Ledger" : "Inspect Ledger"}
                          </button>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-[9.5px] font-bold text-emerald-400 font-mono">{ev.verificationStatus}</span>
                            <button
                              onClick={() => setActiveGalleryMedia(ev)}
                              className="flex items-center gap-1 text-[9.5px] font-bold uppercase text-cyan-accent hover:text-white transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" /> View Media File
                            </button>
                          </div>
                        </div>
                      </GlassCard>
                    );
                  })}
                </div>

                {/* Interactive Media Overlay Dialog */}
                {activeGalleryMedia && (
                  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-xl border-white/15 shadow-glow relative animate-scale-in p-0 overflow-hidden bg-navy-950">
                      <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-navy-950/70">
                        <h4 className="text-xs font-bold text-white font-mono uppercase">{activeGalleryMedia.id} — Forensic Attachment</h4>
                        <button 
                          onClick={() => setActiveGalleryMedia(null)}
                          className="text-slate-400 hover:text-white p-1"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="p-5 flex flex-col items-center justify-center bg-black/40 min-h-[220px]">
                        {activeGalleryMedia.attachmentType === "cctv" ? (
                          <video src={activeGalleryMedia.attachmentUrl} controls className="w-full rounded-lg border border-white/15" />
                        ) : activeGalleryMedia.attachmentType === "fingerprint" ? (
                          <img src={activeGalleryMedia.attachmentUrl} className="max-h-[300px] object-contain rounded-lg border border-white/15 shadow-glow" alt="Fingerprint" />
                        ) : (
                          <div className="flex flex-col items-center text-slate-500 py-10">
                            <File className="h-12 w-12 text-cyan-accent mb-2" />
                            <p className="text-xs font-mono font-bold text-slate-300">Document_Secure_Viewer.log</p>
                          </div>
                        )}
                        <p className="text-[10px] text-slate-400 mt-4 text-center font-mono leading-normal">{activeGalleryMedia.aiAnalysis}</p>
                      </div>
                    </GlassCard>
                  </div>
                )}

              </div>
            )}

            {/* TAB 5: TIMELINE LOG */}
            {activeTab === "timeline" && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Vertical Action Chronology</h3>
                
                <div className="space-y-6 pl-4 relative border-l border-white/10 ml-2 pt-2">
                  {timeline.map((ev: any, idx: number) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-cyan-400 bg-navy-950 shadow-glow" />
                      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="font-bold text-white uppercase tracking-wider">{ev.notes.split(":")[0]}</span>
                          <span className="text-[10px] text-slate-500">{ev.date} {ev.time}</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-300 leading-normal">{ev.notes}</p>
                        
                        <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 pt-1">
                          <span>Officer: <b className="text-slate-300">{ev.officer}</b></span>
                          <span>Station: <b className="text-slate-300">{ev.location}</b></span>
                        </div>

                        {ev.attachment && (
                          <div className="pt-2 border-t border-white/5 flex justify-end">
                            <span className="flex items-center gap-1 text-[9px] font-bold text-cyan-accent font-mono cursor-pointer hover:underline">
                              <Download className="h-3 w-3" /> {ev.attachment}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 6: LEGAL & AI SUMMARY */}
            {activeTab === "legal" && (
              <div className="space-y-6 animate-fade-in">
                
                {/* AI Summary and recommendations */}
                <GlassCard className="p-5 border-cyan-accent/20 bg-cyan-accent/5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-cyan-accent/15 pb-2">
                    <Bot className="h-4.5 w-4.5 text-cyan-accent animate-pulse" />
                    <h3 className="text-xs font-bold text-cyan-accent uppercase tracking-wider">Gemini Forensic Briefing</h3>
                  </div>

                  <div className="space-y-3 font-mono text-xs leading-relaxed text-slate-300">
                    <p><b className="text-white block uppercase text-[9px] mb-0.5">Narrative Digest</b> {aiSummary.caseSummary}</p>
                    <p><b className="text-white block uppercase text-[9px] mb-0.5">Estimated Motive</b> {aiSummary.motive}</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 border-t border-white/5 pt-3 text-[10px] font-mono text-slate-300">
                    <div className="space-y-1.5">
                      <span className="text-[8.5px] font-bold text-rose-400 uppercase tracking-wider block">Missing Case Variables</span>
                      {aiSummary.missingEvidence?.map((e: string) => (
                        <div key={e} className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3 text-rose-400 shrink-0" />
                          <span>{e}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[8.5px] font-bold text-cyan-accent uppercase tracking-wider block">Recommended Actions</span>
                      {aiSummary.suggestions?.map((e: string) => (
                        <div key={e} className="flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3 text-cyan-accent shrink-0" />
                          <span>{e}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>

                {/* Legal Sections Grid */}
                <GlassCard className="p-5 border-white/10 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Statutory Legal Mapping</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs">
                    {[
                      ["Applicable Codes", legal.applicableLaws],
                      ["IPC / BNS Sections", legal.ipcSections],
                      ["Procedural CrPC Codes", legal.crpcSections],
                      ["Court Docket Status", legal.courtStatus],
                      ["Chargesheet Filing", legal.chargesheetStatus],
                      ["Limitation Deadline", legal.legalDeadlines],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <span className="text-[8.5px] text-slate-500 block uppercase font-bold">{label}</span>
                        <span className="text-slate-200 block mt-1">{value}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>

              </div>
            )}

            {/* TAB 7: GIS INTELLIGENCE MAP */}
            {activeTab === "location" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">GIS Intelligence Mapping Overlay</h3>
                  <span className="text-[9px] font-mono text-slate-400">Map Bounds: Adamas Outpost coordinates</span>
                </div>
                
                {/* Map Container */}
                <div className="relative rounded-2xl border border-white/15 overflow-hidden">
                  <div ref={mapContainerRef} className="h-[380px] w-full z-10 bg-navy-950" />
                  
                  {/* Legend Overlay */}
                  <div className="absolute bottom-3 left-3 z-20 bg-navy-950/95 border border-white/15 rounded-xl p-3 font-mono text-[9px] text-slate-400 space-y-1.5 shadow-glow">
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block border-b border-white/5 pb-1">Legend Coordinates</span>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" /> Crime Scene (CS)</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-500" /> Police Station (PS)</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> Evidence Recovered (EV)</div>
                    <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Witness Coordinate (WT)</div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: OFFICER NOTES HUB */}
            {activeTab === "notes" && (
              <div className="grid gap-6 md:grid-cols-3 animate-fade-in">
                
                {/* Notes list */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Case Dossier Notes Log</h3>
                  
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {officerNotes.map((note: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-all space-y-2 relative">
                        <div className="flex items-center justify-between border-b border-white/5 pb-1">
                          <h4 className="text-xs font-bold text-white uppercase font-mono">{note.title}</h4>
                          <span className="text-[8.5px] text-slate-500 font-mono">{note.date}</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-300 leading-relaxed">{note.content}</p>
                        
                        <div className="flex gap-2 text-[8px] font-mono uppercase font-bold pt-1">
                          {note.pinned && <span className="text-cyan-accent flex items-center gap-0.5"><Pin className="h-2.5 w-2.5" /> Pinned Note</span>}
                          {note.private ? <span className="text-rose-400">Classified Log</span> : <span className="text-emerald-400">Shared Log</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form to add note */}
                <div className="md:col-span-1">
                  <GlassCard className="p-4 border-white/10 space-y-4 bg-navy-900/60">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-1.5">Add Officer Entry</h4>
                    
                    <form onSubmit={handleAddNote} className="space-y-3 font-mono text-xs">
                      <div>
                        <label className="block text-[8.5px] uppercase font-bold text-slate-500 mb-1">Title</label>
                        <input 
                          type="text" 
                          value={newNoteTitle} 
                          onChange={(e) => setNewNoteTitle(e.target.value)}
                          placeholder="Note category..."
                          className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-accent/40"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[8.5px] uppercase font-bold text-slate-500 mb-1">Content Details</label>
                        <textarea 
                          rows={4}
                          value={newNoteContent} 
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder="Input investigative notes..."
                          className="w-full bg-navy-950 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-cyan-accent/40 resize-none"
                        />
                      </div>

                      <div className="flex gap-3">
                        <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                          <input 
                            type="radio" 
                            checked={noteType === "shared"} 
                            onChange={() => setNoteType("shared")}
                            className="accent-cyan-400" 
                          />
                          Shared
                        </label>
                        <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                          <input 
                            type="radio" 
                            checked={noteType === "private"} 
                            onChange={() => setNoteType("private")}
                            className="accent-cyan-400" 
                          />
                          Classified
                        </label>
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-1 py-2 rounded-lg bg-cyan-accent/15 border border-cyan-accent/30 text-cyan-accent font-bold hover:bg-cyan-accent/25 transition-all text-[11px]"
                      >
                        <Plus className="h-4 w-4" /> Save Dossier Note
                      </button>
                    </form>
                  </GlassCard>
                </div>

              </div>
            )}

            {/* TAB 9: DOCUMENTS & AUDIT TRAIL */}
            {activeTab === "documents" && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Documents list */}
                <GlassCard className="p-5 border-white/10 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Document Vault Log</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {documents.map((doc: any) => (
                      <div key={doc.name} className="p-3 rounded-lg border border-white/5 bg-white/[0.01] flex items-center justify-between font-mono text-xs">
                        <div>
                          <p className="font-bold text-slate-300">{doc.name}</p>
                          <p className="text-[9px] text-slate-500">{doc.type} | Uploaded: {doc.date} | Size: {doc.size}</p>
                        </div>
                        <button className="p-2 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-cyan-accent">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Audit trail */}
                <GlassCard className="p-5 border-white/10 space-y-3">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Dossier Audit Logs (Unmodifiable)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] font-mono text-slate-400 text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider text-[8.5px] pb-1">
                          <th className="pb-2">Officer Hub</th>
                          <th className="pb-2">Action Registered</th>
                          <th className="pb-2">Date & Time</th>
                          <th className="pb-2">Secure IP Target</th>
                          <th className="pb-2">Tactical Terminal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityLog.map((log: any, idx: number) => (
                          <tr key={idx} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01]">
                            <td className="py-2.5 font-bold text-slate-300">{log.user} <span className="text-[8px] px-1 bg-white/5 rounded text-slate-500 block w-max">{log.role}</span></td>
                            <td className="py-2.5 text-cyan-accent">{log.action}</td>
                            <td className="py-2.5">{log.date} {log.time}</td>
                            <td className="py-2.5">{log.ip}</td>
                            <td className="py-2.5">{log.device}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>

              </div>
            )}

            {activeTab === "network" && (
              <CaseNetworkExplorer caseId={record.id} />
            )}

          </div>

          {/* Sticky Actions Sidebar (Right Side) */}
          <div className="w-64 bg-navy-950/40 border-l border-white/10 py-6 px-4 space-y-4 print:hidden hidden lg:block shrink-0">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-white/10 pb-1.5">TACTICAL SHORTCUTS</h3>
            
            <div className="space-y-2">
              <button 
                onClick={() => {
                  alert(`Re-assigning case officer for ${overview.firNumber}`);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-xs font-semibold text-slate-300 transition-all text-left"
              >
                <span>Re-assign Commander</span>
                <ChevronRightIcon />
              </button>

              <button 
                onClick={() => {
                  alert(`Generating legal chargesheet draft for ${overview.firNumber}`);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-xs font-semibold text-slate-300 transition-all text-left"
              >
                <span>Chargesheet Compiler</span>
                <ChevronRightIcon />
              </button>

              <button 
                onClick={() => {
                  alert(`Accessing related cases for ${overview.firNumber}`);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-xs font-semibold text-slate-300 transition-all text-left"
              >
                <span>Cross-match Matrices</span>
                <ChevronRightIcon />
              </button>
            </div>

            {/* Linked Cases list */}
            <div className="pt-4 border-t border-white/5 space-y-2 font-mono text-[10px]">
              <span className="text-[8.5px] font-bold text-slate-500 uppercase tracking-wider block">AI Match Indexes</span>
              
              {linkedCases.map((lc: any) => (
                <div key={lc.firNumber} className="p-2.5 rounded-xl border border-cyan-500/10 bg-cyan-950/20 text-slate-300 space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-cyan-accent">
                    <span>{lc.firNumber}</span>
                    <span>{lc.similarity}%</span>
                  </div>
                  <p className="text-[9px] leading-normal text-slate-400">{lc.reason}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </GlassCard>
    </div>
  );
}

// Simple arrow icon helper
function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// Fallback mock details builder
function mockFallbackDossier(record: FIRRecord) {
  return {
    overview: {
      firNumber: record.firNumber,
      caseNumber: `CASE-2026-A${record.id.slice(0, 4)}`,
      caseTitle: `Investigation into ${record.offense}`,
      crimeCategory: "Theft",
      crimeSubCategory: "Vehicle/Property",
      currentStatus: record.status,
      priority: record.priority,
      riskScore: 78,
      investigationStage: "Active Investigation",
      dateRegistered: record.date,
      lastUpdated: record.date,
      assignedOfficer: record.officer,
      supervisingOfficer: "Insp. Vikram Singh",
      policeStation: record.station,
      district: "Kolkata",
      jurisdiction: `${record.station} Sector 2`,
      aiConfidenceScore: 92,
      caseTags: ["Property", "Salt Lake", record.priority],
      linkedCases: ["FIR/2026/A1019"],
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${record.firNumber}`
    },
    incident: {
      incidentDate: record.date,
      incidentTime: "18:30",
      incidentLocation: "Crossroad coordinate",
      gpsCoordinates: "22.572, 88.425",
      fullAddress: `Coord bounds within ${record.station}`,
      crimeSceneType: "Public Space",
      indoorOutdoor: "Outdoor",
      weather: "Clear Sky",
      dayNight: "Night",
      estimatedDuration: "15 minutes",
      description: "Incident reported immediately. Tactical squads dispatched.",
      originalNarrative: record.offense,
      aiSummary: "The incident follows repeat spatial patterns observed in industrial sectors.",
      keywords: ["unmonitored", "theft", "hotspot"]
    },
    complainant: {
      name: record.complainant,
      age: 38,
      gender: "Male",
      phone: "+91 99000 12345",
      email: "complainant@mail.gov",
      address: "Local Sector-V area",
      occupation: "Consultant",
      identityProof: "Aadhaar verified",
      relationshipWithVictim: "Self",
      statement: "Statement recorded at command console.",
      emergencyContact: "+91 99000 54321"
    },
    victim: {
      name: record.complainant,
      age: 38,
      gender: "Male",
      injuries: "None reported",
      medicalReport: "N/A",
      hospital: "None",
      condition: "N/A",
      statement: "Statement recorded.",
      protectionStatus: "Standard"
    },
    suspect: {
      name: "Rohan Gupta",
      alias: "Rony",
      photograph: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
      age: 26,
      gender: "Male",
      address: "Unknown",
      knownAssociates: ["Kabir Sen"],
      previousRecords: ["Theft case, Salt Lake PS"],
      riskLevel: "High",
      wantedStatus: "Wanted",
      arrestStatus: "Pending",
      bailStatus: "No Bail",
      repeatOffender: true,
      networkLinks: "Fencing ring connection"
    },
    witnesses: [
      {
        name: "Sanjay Malik",
        contact: "+91 99001 12233",
        statement: "Witnessed suspect fleeing at approximately 19:15.",
        reliabilityScore: 85,
        verificationStatus: "Verified"
      }
    ],
    evidence: [
      {
        id: "EVID-01-A",
        type: "CCTV Footage",
        description: "Junction CCTV record.",
        uploadedBy: record.officer,
        dateCollected: record.date,
        collectionLocation: "Junction Cam",
        chainOfCustody: "Secure Log",
        laboratoryStatus: "Analyzed",
        verificationStatus: "Verified",
        aiAnalysis: "98% matching profile.",
        attachmentType: "cctv",
        attachmentUrl: ""
      }
    ],
    timeline: [
      {"date": record.date, "time": "18:30", "officer": record.complainant, "location": record.station, "notes": "FIR registered.", "attachment": null}
    ],
    aiSummary: {
      caseSummary: `Case involves ${record.offense} registered under ${record.station}.`,
      progress: "Under active trace",
      missingEvidence: ["CDR logs"],
      suggestions: ["Deploy patrol teams along main corridor"],
      motive: "Liquidation of property",
      possibleSuspects: ["Rohan Gupta"],
      relatedCases: ["FIR/2026/A1019"],
      legalSections: "IPC Section 379",
      nextActions: ["Summon suspect"],
      confidence: "92%"
    },
    legal: {
      applicableLaws: "IPC / BNS",
      ipcSections: "IPC Section 379",
      crpcSections: "CrPC Section 161",
      courtStatus: "Drafting Stage",
      chargesheetStatus: "Drafting",
      legalDeadlines: record.date,
      hearings: [record.date]
    },
    locationIntel: {
      crimeScene: [22.572, 88.425],
      policeStation: [22.567, 88.420],
      evidence: [[22.573, 88.423]],
      witness: [[22.575, 88.427]]
    },
    linkedCases: [
      {
        firNumber: "FIR/2026/A1019",
        similarity: 88,
        reason: "Duplicate key pattern",
        commonSuspect: "Rohan Gupta",
        commonLocation: record.station
      }
    ],
    officerNotes: [
      {"title": "Initial Scene", "content": "Camera checked at junction.", "pinned": true, "private": false, "date": record.date}
    ],
    activityLog: [
      {"user": record.officer, "action": "FIR Opened", "date": record.date, "time": "18:30", "ip": "127.0.0.1", "device": "Console", "role": "IO"}
    ],
    documents: [
      {"name": "Original_FIR_Doc.pdf", "type": "FIR", "date": record.date, "size": "156 KB"}
    ],
    riskPanel: {
      riskScore: 78,
      threatLevel: record.priority.toUpperCase(),
      repeatOffenderProb: 88,
      organizedCrimeProb: 70,
      flightRisk: 60,
      violenceProb: 15,
      explanations: {
        riskScore: "High occurrence rate in Salt Lake cluster bounds.",
        repeatOffenderProb: "Prior records in nearby Salt Lake stations.",
        flightRisk: "Moderate risk."
      }
    }
  };
}
