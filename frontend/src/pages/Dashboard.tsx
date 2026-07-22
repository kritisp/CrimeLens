import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { 
  Shield, AlertTriangle, Bot, MapPin, 
  Layers, TrendingUp, RefreshCw, 
  FileText, X, Clock, CheckCircle, Cpu, 
  Send, AlertCircle, BookOpen, ArrowUpRight
} from "lucide-react";
import { QuickActions } from "../components/dashboard/QuickActions";
import { FIRFiltersPanel } from "../components/dashboard/FIRFiltersPanel";
import { RecentFIRTable } from "../components/dashboard/RecentFIRTable";
import { SearchBar } from "../components/dashboard/SearchBar";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { GlassCard } from "../components/ui/GlassCard";
import { quickActions, recentFIRs } from "../data/mockData";
import type { FIRPriority, FIRStatus } from "../types";


interface FIRRecord {
  id: string;
  firNumber: string;
  complainant: string;
  offense: string;
  station: string;
  officer: string;
  date: string;
  status: string;
  priority: string;
  latitude: number;
  longitude: number;
  district: string;
  ward: string;
  crimeCategory: string;
  severity: string;
  riskScore: number;
}

interface Hotspot {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  totalCrimes: number;
  mostCommonCrime: string;
  lastIncident: string;
  avgMonthlyIncrease: number;
  hotspotScore: number;
  riskLevel: string;
  radius: number;
}

interface BriefingData {
  highestCrimeDistrict: string;
  fastestGrowingHotspot: string;
  crimesIncreasingWeek: string[];
  crimesDecreasingMonth: string[];
  suggestedPatrolLocations: any[];
  recommendedPoliceDeployment: string;
  mostActiveOfficer: string;
  highPriorityInvestigations: any[];
  geminiSummary: string;
}



interface CrimeSignature {
  id: string;
  name: string;
  category: string;
  confidenceScore: number;
  similarityPercentage: number;
  description: string;
  matchingCases: string[];
  aiExplanation: string;
  moDetails: {
    time: string;
    location: string;
    weapons: string;
    vehicle: string;
    suspect: string;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  data?: {
    type: "chart" | "table";
    chartType?: "bar" | "pie";
    title: string;
    seriesName?: string;
    xAxisKey?: string;
    yAxisKey?: string;
    headers?: string[];
    keys?: string[];
    items: any[];
  } | null;
}

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function Dashboard() {
  const navigate = useNavigate();
  const miniMapContainerRef = useRef<HTMLDivElement>(null);
  const miniMapRef = useRef<L.Map | null>(null);

  // General States
  const [activeTab, setActiveTab] = useState<"dashboard" | "signatures" | "chat" | "copilot">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilters, setStatusFilters] = useState<FIRStatus[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<FIRPriority[]>([]);
  
  // Data States
  const [records, setRecords] = useState<FIRRecord[]>(() => {
    return recentFIRs.map((r, idx) => ({
      ...r,
      latitude: 22.572 + (idx * 0.005),
      longitude: 88.425 + (idx * 0.005),
      district: "Kolkata",
      ward: "Ward 2",
      crimeCategory: "Theft",
      severity: r.priority,
      riskScore: r.priority === "critical" ? 90 : r.priority === "high" ? 70 : 40
    }));
  });
  
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [loading, setLoading] = useState(false);

  // Modal Details Overlay State
  const [activeDetailCard, setActiveDetailCard] = useState<string | null>(null);



  // Crime Signature States
  const [signatures, setSignatures] = useState<CrimeSignature[]>([]);
  const [selectedSignature, setSelectedSignature] = useState<CrimeSignature | null>(null);

  // Copilot States
  const [selectedCopilotCaseId, setSelectedCopilotCaseId] = useState("");
  const [copilotData, setCopilotData] = useState<any>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [stepsCompleted, setStepsCompleted] = useState<Record<string, boolean>>({});

  // Chatbot States
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "AI Command Assistant online. You can ask me to analyze workload, query hotspots, display theft statistics, or pull weekly summaries." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Calculations for dashboard
  const stats = useMemo(() => {
    const active = records.filter(r => r.status === "pending" || r.status === "investigating").length;
    const critical = records.filter(r => r.priority === "critical").length;
    const solved = records.filter(r => r.status === "solved").length;
    
    return {
      totalFIRs: records.length,
      activeCases: active,
      criticalCases: critical,
      solvedCases: solved,
      activeHotspots: hotspots.length || 3,
      highestRiskDistrict: briefing?.highestCrimeDistrict || "Bidhannagar",
      crimeDensityToday: records.filter(r => {
        const rDate = new Date(r.date);
        const today = new Date();
        return rDate.toDateString() === today.toDateString();
      }).length
    };
  }, [records, hotspots, briefing]);

  // Fetch Dashboard & Modulate Data
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [mapRes, hotRes, briefRes, sigRes] = await Promise.all([
        fetch("/api/v1/intelligence/map"),
        fetch("/api/v1/intelligence/hotspots"),
        fetch("/api/v1/intelligence/briefing"),
        fetch("/api/v1/intelligence/signatures")
      ]);

      if (mapRes.ok) {
        const data = await mapRes.json();
        if (data.length > 0) {
          setRecords(data);
          // Set default copilot selection to first case
          if (data[0] && !selectedCopilotCaseId) {
            setSelectedCopilotCaseId(data[0].id);
          }
        }
      }
      if (hotRes.ok) setHotspots(await hotRes.json());
      if (briefRes.ok) setBriefing(await briefRes.json());
      if (sigRes.ok) {
        const data = await sigRes.json();
        setSignatures(data);
        if (data[0]) setSelectedSignature(data[0]);
      }
    } catch (err) {
      console.error("Dashboard failed to sync live API data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch Copilot case details
  const fetchCopilotData = async (caseId: string) => {
    if (!caseId) return;
    setCopilotLoading(true);
    try {
      const res = await fetch(`/api/v1/intelligence/copilot/${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setCopilotData(data);
        // Initialize step check states
        const initialChecks: Record<string, boolean> = {};
        data.suggestedSteps?.forEach((step: string, idx: number) => {
          initialChecks[step] = idx === 0; // mark first complete as mock
        });
        setStepsCompleted(initialChecks);
      }
    } catch (err) {
      console.error("Failed to load Copilot data:", err);
    } finally {
      setCopilotLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCopilotCaseId) {
      fetchCopilotData(selectedCopilotCaseId);
    }
  }, [selectedCopilotCaseId]);

  // Initialize Mini Map once
  useEffect(() => {
    if (!miniMapContainerRef.current || miniMapRef.current) return;

    const miniMap = L.map(miniMapContainerRef.current, {
      center: [22.60, 88.45],
      zoom: 9.5,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png").addTo(miniMap);
    miniMapRef.current = miniMap;

    return () => {
      miniMap.remove();
      miniMapRef.current = null;
    };
  }, []);

  // Update Mini Map Markers and view
  useEffect(() => {
    const map = miniMapRef.current;
    if (!map) return;

    // Clear old LayerGroups
    map.eachLayer(layer => {
      if (layer instanceof L.LayerGroup) {
        map.removeLayer(layer);
      }
    });

    const miniMarkerLayer = L.layerGroup();
    records.forEach(r => {
      if (!r.latitude || !r.longitude) return;
      
      const glowColor = r.priority === "critical" ? "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : 
                        r.priority === "high" ? "bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]" : 
                        "bg-cyan-400 shadow-glow";

      const dotIcon = L.divIcon({
        html: `<div class="h-2.5 w-2.5 rounded-full ${glowColor}"></div>`,
        className: "mini-dot-marker",
        iconSize: [10, 10],
        iconAnchor: [5, 5]
      });

      const marker = L.marker([r.latitude, r.longitude], { icon: dotIcon });
      miniMarkerLayer.addLayer(marker);
    });

    miniMarkerLayer.addTo(map);

    if (records.length > 0) {
      const validCoords = records.filter(r => r.latitude && r.longitude);
      if (validCoords.length > 0) {
        const avgLat = validCoords.reduce((sum, r) => sum + r.latitude, 0) / validCoords.length;
        const avgLng = validCoords.reduce((sum, r) => sum + r.longitude, 0) / validCoords.length;
        map.setView([avgLat, avgLng], 10);
      }
    }

    if (activeTab === "dashboard") {
      setTimeout(() => {
        map.invalidateSize();
      }, 50);
    }
  }, [records, activeTab]);

  // Chat message submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/v1/intelligence/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, {
          role: "assistant",
          content: data.message,
          data: data.data
        }]);
      } else {
        setChatMessages(prev => [...prev, { role: "assistant", content: "Error: AI command systems failed to respond." }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: "assistant", content: "Network error linking to chat engine." }]);
    } finally {
      setChatLoading(false);
    }
  };



  // Map priorities/statuses for RecentTable compatibility
  const mappedRecordsForTable = records.map(r => ({
    ...r,
    priority: r.priority as FIRPriority,
    status: r.status as FIRStatus
  }));

  // Toggle checklist steps
  const toggleStep = (step: string) => {
    setStepsCompleted(prev => ({
      ...prev,
      [step]: !prev[step]
    }));
  };

  return (
    <DashboardLayout mainClassName="h-screen overflow-y-auto">
      <div className="space-y-6 pb-12">
        
        {/* Holographic Header Command Panel */}
        <div className="glass border border-white/10 px-6 py-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 bg-navy-950/70 backdrop-blur-md shadow-glow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-cyan-accent/15 border border-cyan-accent/35 text-cyan-accent flex items-center justify-center rounded-xl animate-pulse shadow-glow">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Police Intelligence Command Center
                <span className="text-[9px] px-2 py-0.5 rounded-full border border-cyan-400 bg-cyan-950 text-cyan-400 font-mono animate-pulse">AI-Active</span>
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Joint Tactical Operations & Predictive Analytics Control Hub</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block border-r border-white/10 pr-3">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">System Clock</p>
              <p className="text-xs font-mono font-bold text-white uppercase">{new Date().toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' })} IST</p>
            </div>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:border-cyan-accent/25 hover:text-white transition-all shadow-glass"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync Intelligence
            </button>
          </div>
        </div>

        {/* Tactical Tab Navigation Bar */}
        <div className="flex flex-wrap gap-2 border-b border-white/10 pb-1">
          {[
            { id: "dashboard", label: "Command Center", icon: Shield },
            { id: "signatures", label: "Signature Engine", icon: Cpu },
            { id: "copilot", label: "Investigator Copilot", icon: FileText },
            { id: "chat", label: "AI Advisor", icon: Bot },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border-t-2 ${
                  active 
                    ? "bg-navy-950/60 border-cyan-accent text-cyan-accent shadow-[0_-4px_12px_rgba(34,211,238,0.15)]" 
                    : "border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Rendering */}
        
        {/* TAB 1: COMMAND DASHBOARD */}
        <div className={activeTab === "dashboard" ? "space-y-6 animate-fade-in" : "hidden"}>
            
            {/* Top Animated Statistics Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div 
                onClick={() => setActiveDetailCard("active_cases")}
                className="glass p-5 rounded-2xl flex items-center justify-between border border-white/10 hover:border-cyan-accent/30 hover:scale-[1.01] hover:shadow-glow cursor-pointer transition-all duration-300"
              >
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Investigations</p>
                  <h3 className="mt-2 text-3xl font-black text-white font-mono">{stats.activeCases}</h3>
                  <p className="text-[9px] text-emerald-400 mt-1 flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Live active status</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-accent/15 border border-cyan-accent/25 text-cyan-accent shadow-glow">
                  <Shield className="h-6 w-6" />
                </div>
              </div>

              <div 
                onClick={() => setActiveDetailCard("critical_cases")}
                className="glass p-5 rounded-2xl flex items-center justify-between border border-white/10 hover:border-rose-500/30 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] cursor-pointer transition-all duration-300"
              >
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Critical Priority Flags</p>
                  <h3 className="mt-2 text-3xl font-black text-rose-400 font-mono">{stats.criticalCases}</h3>
                  <p className="text-[9px] text-rose-400 mt-1">Requires immediate patrol</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/25 text-rose-400 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse">
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>

              <div 
                onClick={() => setActiveDetailCard("solved_cases")}
                className="glass p-5 rounded-2xl flex items-center justify-between border border-white/10 hover:border-emerald-500/30 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer transition-all duration-300"
              >
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Solved Cases (CS Filed)</p>
                  <h3 className="mt-2 text-3xl font-black text-emerald-400 font-mono">{stats.solvedCases}</h3>
                  <p className="text-[9px] text-emerald-400 mt-1">Final reports submitted</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>

              <div 
                onClick={() => setActiveDetailCard("hotspots")}
                className="glass p-5 rounded-2xl flex items-center justify-between border border-white/10 hover:border-pink-500/30 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(236,72,153,0.2)] cursor-pointer transition-all duration-300"
              >
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Emerging Hotspots</p>
                  <h3 className="mt-2 text-3xl font-black text-white font-mono">{stats.activeHotspots}</h3>
                  <p className="text-[9px] text-slate-400 mt-1">DBSCAN Density Clusters</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-500/15 border border-pink-500/25 text-pink-400">
                  <MapPin className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div>
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Operational Shortlinks
              </h2>
              <QuickActions actions={quickActions} />
            </div>

            {/* Two-Column Dashboard Layout */}
            <div className="grid gap-6 lg:grid-cols-3">
              
              {/* Left Column: Case Search and Recent FIR list */}
              <div className="space-y-6 lg:col-span-2">
                <div>
                  <h2 className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Live Case Directory
                  </h2>
                  <SearchBar
                    onSearch={setSearchQuery}
                    onFiltersClick={() => setShowFilters((prev) => !prev)}
                    filtersActive={showFilters || statusFilters.length > 0 || priorityFilters.length > 0}
                  />
                </div>

                {showFilters && (
                  <FIRFiltersPanel
                    statusFilters={statusFilters}
                    priorityFilters={priorityFilters}
                    onToggleStatus={(status) => setStatusFilters((prev) => toggleValue(prev, status))}
                    onTogglePriority={(priority) => setPriorityFilters((prev) => toggleValue(prev, priority))}
                  />
                )}

                <RecentFIRTable
                  records={mappedRecordsForTable}
                  searchQuery={searchQuery}
                  statusFilters={statusFilters}
                  priorityFilters={priorityFilters}
                  onSelectRecord={(id) => navigate(`/cases/${id}`)}
                />
              </div>

              {/* Right Column: Tactical Maps & AI Control Center Alerts */}
              <div className="space-y-6 lg:col-span-1">
                
                {/* Mini Heatmap Preview Card */}
                <GlassCard className="overflow-hidden flex flex-col p-0 h-[280px]">
                  <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-cyan-accent animate-pulse" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Live Control Map Preview</span>
                    </div>
                    <a 
                      href="/crime-intelligence" 
                      className="text-[10px] text-cyan-accent font-semibold hover:underline flex items-center gap-0.5"
                    >
                      Maximize Map &rarr;
                    </a>
                  </div>
                  <div className="relative flex-1 bg-navy-950 min-h-[160px]">
                    <div ref={miniMapContainerRef} className="absolute inset-0 h-full w-full z-10" />
                    <div className="absolute bottom-2 left-2 z-20 bg-navy-900/90 border border-white/10 rounded px-2 py-0.5 text-[8.5px] text-slate-400 font-mono">
                      Location Target: Kolkata PS Bounds
                    </div>
                  </div>
                </GlassCard>

                {/* AI Alerts Card */}
                <GlassCard className="p-5 relative overflow-hidden flex flex-col min-h-[250px]">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-accent/5 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="h-4.5 w-4.5 text-cyan-accent animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Active Threat Advisors</span>
                  </div>
                  
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {/* Hardcoded dynamic Alerts matching prompt requirements */}
                    <div className="flex gap-3 items-start border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/25 shadow-glow">
                        <AlertTriangle className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-rose-300">🚨 Theft increased 37% this week</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Evening crime alerts triggered at Adamas Outpost sector bounds.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/25">
                        <AlertCircle className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-orange-300">🚨 Repeat offender detected</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">Suspect Rohan Gupta linked to co-occurring incidents near Barasat.</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start border-b border-white/5 pb-2.5 last:border-0 last:pb-0">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-cyan-300">🚨 Similar Modus Operandi discovered</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">UPI Fraud Case matched Signature SIG-7740 (IT Corridor Sector V).</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[9px] uppercase tracking-wider text-slate-500">
                    <span>Tactical Deployment Status:</span>
                    <span className="text-cyan-accent font-bold">Standard alerts clear</span>
                  </div>
                </GlassCard>

              </div>
            </div>

            {/* Modal Detail Overlay Card Drawer */}
            {activeDetailCard && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <GlassCard className="w-full max-w-2xl border-white/15 shadow-glow relative animate-scale-in max-h-[85vh] overflow-y-auto flex flex-col p-0">
                  <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-navy-950/70">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Shield className="h-4.5 w-4.5 text-cyan-accent" />
                      {activeDetailCard === "active_cases" ? "Active Cases Directory" :
                       activeDetailCard === "critical_cases" ? "Critical Priority Warnings" :
                       activeDetailCard === "solved_cases" ? "Solved Investigations Log" :
                       "Geospatial Hotspots Log"}
                    </h3>
                    <button 
                      onClick={() => setActiveDetailCard(null)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto space-y-4">
                    {activeDetailCard === "active_cases" && (
                      <div className="space-y-2">
                        {records.filter(r => r.status === "pending" || r.status === "investigating").slice(0, 8).map(r => (
                          <div
                            key={r.id}
                            onClick={() => navigate(`/cases/${r.id}`)}
                            className="p-3 rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-between cursor-pointer hover:border-cyan-accent/30 hover:bg-cyan-accent/5 transition-all"
                          >
                            <div>
                              <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5 hover:underline">
                                {r.firNumber} <ArrowUpRight className="h-3 w-3 text-cyan-accent" />
                              </p>
                              <p className="text-[10px] text-slate-400">{r.offense} — Assigned: {r.officer}</p>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded border border-cyan-400 bg-cyan-950/80 text-cyan-400 uppercase font-mono">{r.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeDetailCard === "critical_cases" && (
                      <div className="space-y-2">
                        {records.filter(r => r.priority === "critical").map(r => (
                          <div
                            key={r.id}
                            onClick={() => navigate(`/cases/${r.id}`)}
                            className="p-3 rounded-lg border border-rose-500/20 bg-rose-950/20 flex items-center justify-between cursor-pointer hover:border-rose-500/40 hover:bg-rose-950/40 transition-all"
                          >
                            <div>
                              <p className="text-xs font-bold text-rose-300 font-mono flex items-center gap-1.5 hover:underline">
                                {r.firNumber} <ArrowUpRight className="h-3 w-3 text-rose-400" />
                              </p>
                              <p className="text-[10px] text-slate-300">{r.offense} ({r.station})</p>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded border border-rose-500 bg-rose-950 text-rose-300 uppercase font-mono font-bold animate-pulse">Critical</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeDetailCard === "solved_cases" && (
                      <div className="space-y-2">
                        {records.filter(r => r.status === "solved" || r.status === "closed").slice(0, 8).map(r => (
                          <div
                            key={r.id}
                            onClick={() => navigate(`/cases/${r.id}`)}
                            className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-950/20 flex items-center justify-between cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-950/40 transition-all"
                          >
                            <div>
                              <p className="text-xs font-bold text-emerald-300 font-mono flex items-center gap-1.5 hover:underline">
                                {r.firNumber} <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                              </p>
                              <p className="text-[10px] text-slate-300">{r.offense} — Closed on: {new Date(r.date).toLocaleDateString()}</p>
                            </div>
                            <span className="text-[9px] px-2 py-0.5 rounded border border-emerald-500 bg-emerald-950 text-emerald-300 uppercase font-mono">CS FILED</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeDetailCard === "hotspots" && (
                      <div className="space-y-2">
                        {hotspots.map(h => (
                          <div key={h.id} className="p-3 rounded-lg border border-pink-500/20 bg-pink-950/20 flex items-center justify-between">
                            <div>
                              <p className="text-xs font-bold text-pink-300">{h.name}</p>
                              <p className="text-[10px] text-slate-300">Crimes: {h.totalCrimes} | Primary: {h.mostCommonCrime}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-black uppercase text-pink-400 block">Score: {h.hotspotScore}</span>
                              <span className="text-[8px] text-slate-400 font-mono block">Radius: {h.radius}km</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-4 border-t border-white/10 bg-navy-950/50 flex justify-end">
                    <button 
                      onClick={() => setActiveDetailCard(null)}
                      className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-white hover:bg-white/10"
                    >
                      Close Details
                    </button>
                  </div>
                </GlassCard>
              </div>
            )}
          </div>

        {/* TAB 3: CRIME SIGNATURE ENGINE */}
        {activeTab === "signatures" && (
          <div className="grid gap-6 lg:grid-cols-3 animate-fade-in">
            
            {/* Clustered Signature Cards (Left Columns) */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Crime Signature Fingerprints</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {signatures.map(sig => {
                  const isSelected = selectedSignature?.id === sig.id;
                  return (
                    <div 
                      key={sig.id}
                      onClick={() => setSelectedSignature(sig)}
                      className={`glass p-5 rounded-2xl cursor-pointer border border-white/10 hover:border-cyan-accent/30 hover:scale-[1.01] transition-all ${
                        isSelected ? "border-cyan-accent/30 bg-navy-950/60 shadow-glow" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
                        <span className="font-mono text-xs font-bold text-cyan-accent">{sig.id}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] px-2 py-0.5 rounded border border-white/10 bg-white/5 text-slate-300 font-semibold">{sig.category}</span>
                          <span className="text-[9px] font-bold text-emerald-400 font-mono">{sig.similarityPercentage}% Match</span>
                        </div>
                      </div>
                      
                      <h4 className="text-xs font-bold text-white mb-1.5">{sig.name}</h4>
                      <p className="text-[10px] text-slate-400 leading-normal line-clamp-2">{sig.description}</p>
                      
                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] text-slate-500 uppercase tracking-wider font-semibold">
                        <span>Cluster Cases: {sig.matchingCases.length}</span>
                        <span className="text-cyan-accent flex items-center gap-0.5">Analyze &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Signature Analysis Panel (Right Column) */}
            <div className="lg:col-span-1">
              {selectedSignature ? (
                <GlassCard className="p-5 border-cyan-accent/25 shadow-glow relative overflow-hidden flex flex-col space-y-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-accent/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <div>
                    <span className="text-[8.5px] uppercase font-bold text-cyan-accent font-mono tracking-wider">{selectedSignature.id} Fingerprint analysis</span>
                    <h3 className="text-sm font-black text-white mt-1 uppercase tracking-tight">{selectedSignature.name}</h3>
                  </div>

                  {/* Similarity gauge */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                      <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">AI Confidence</span>
                      <p className="text-lg font-black font-mono text-cyan-accent mt-0.5">{selectedSignature.confidenceScore}%</p>
                    </div>
                    <div className="p-3 rounded-xl border border-white/5 bg-white/[0.01]">
                      <span className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">MO Similarity</span>
                      <p className="text-lg font-black font-mono text-orange-400 mt-0.5">{selectedSignature.similarityPercentage}%</p>
                    </div>
                  </div>

                  {/* Modus Operandi specifications */}
                  <div className="space-y-2 border-y border-white/10 py-3 text-[10px] text-slate-300">
                    <p className="text-xs font-bold text-white uppercase tracking-wider mb-1">Modus Operandi</p>
                    <div className="grid grid-cols-2 gap-1.5 font-mono">
                      <span className="text-slate-500">Target Time:</span>
                      <span className="text-white text-right">{selectedSignature.moDetails.time}</span>
                      
                      <span className="text-slate-500">Location Area:</span>
                      <span className="text-white text-right">{selectedSignature.moDetails.location}</span>
                      
                      <span className="text-slate-500">Weapons Used:</span>
                      <span className="text-white text-right">{selectedSignature.moDetails.weapons}</span>
                      
                      <span className="text-slate-500"> getaway Vehicle:</span>
                      <span className="text-white text-right">{selectedSignature.moDetails.vehicle}</span>
                      
                      <span className="text-slate-500">suspect Link:</span>
                      <span className="text-white text-right text-rose-400">{selectedSignature.moDetails.suspect}</span>
                    </div>
                  </div>

                  {/* Matching Cases */}
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1.5">Matching Previous Cases</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedSignature.matchingCases.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => navigate(`/cases/${c}`)}
                          className="text-[9px] px-2 py-0.5 rounded border border-cyan-500/20 bg-cyan-950/70 text-cyan-400 font-mono font-bold hover:bg-cyan-accent/20 hover:border-cyan-accent/50 transition-all cursor-pointer"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Explanation */}
                  <div className="p-3.5 rounded-xl border border-cyan-accent/20 bg-cyan-accent/5">
                    <span className="text-[8.5px] uppercase font-bold text-cyan-accent font-mono tracking-wider flex items-center gap-1"><Bot className="h-3 w-3 animate-pulse" /> AI Explanation</span>
                    <p className="text-[10px] text-slate-300 leading-relaxed mt-1">{selectedSignature.aiExplanation}</p>
                  </div>

                </GlassCard>
              ) : (
                <div className="h-full flex items-center justify-center p-6 text-slate-500">
                  Select a crime signature card to display MO analysis.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 4: CONVERSATIONAL AI ASSISTANT */}
        {activeTab === "chat" && (
          <div className="max-w-4xl mx-auto animate-fade-in">
            <GlassCard className="border-white/10 flex flex-col h-[520px] p-0 bg-navy-950/40">
              
              {/* Header */}
              <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 bg-navy-950/70">
                <Bot className="h-4.5 w-4.5 text-cyan-accent animate-pulse" />
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Tactical AI Control Assistant</h3>
                  <p className="text-[8.5px] text-slate-400 uppercase tracking-wider">Holographic DB Engine Query Terminal</p>
                </div>
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}>
                    <div className={`h-8 w-8 shrink-0 rounded-lg border flex items-center justify-center text-xs font-bold ${
                      msg.role === "user" ? "bg-white/5 border-white/15 text-slate-300" : "bg-cyan-accent/15 border-cyan-accent/25 text-cyan-accent shadow-glow"
                    }`}>
                      {msg.role === "user" ? "US" : <Bot className="h-4.5 w-4.5" />}
                    </div>
                    <div className="space-y-3">
                      <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                        msg.role === "user" ? "bg-white/[0.04] border-white/5 text-slate-200 rounded-tr-none" : "bg-navy-900/90 border-white/10 text-slate-300 rounded-tl-none font-mono"
                      }`}>
                        {msg.content}
                      </div>

                      {/* Display Rich Widgets (Charts, Tables) returned in the payload */}
                      {(() => {
                        const data = msg.data;
                        if (!data) return null;
                        return (
                          <div className="animate-scale-in">
                            {/* Widget Type: Chart */}
                            {data.type === "chart" && (
                              <GlassCard className="p-4 border-white/10 bg-navy-950/90 w-[320px] sm:w-[420px] overflow-hidden">
                                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">{data.title}</h4>
                                
                                {/* Custom SVG Bar Chart */}
                                {data.chartType === "bar" && (
                                  <svg className="w-full h-36 border border-white/5 bg-black/20 rounded p-2" viewBox="0 0 300 120">
                                    {data.items.map((item: any, i: number) => {
                                      const maxVal = Math.max(...data.items.map(x => x[data.yAxisKey!]));
                                      const val = item[data.yAxisKey!];
                                      const pct = maxVal > 0 ? val / maxVal : 0;
                                      const height = 80 * pct;
                                      const x = 30 + i * (240 / data.items.length);
                                      const y = 90 - height;
                                      
                                      return (
                                        <g key={i}>
                                          <rect x={x} y={y} width="16" height={height} fill="#22d3ee" rx="2" className="transition-all hover:fill-white shadow-glow" />
                                          <text x={x + 8} y={104} fill="#cbd5e1" fontSize="6.5" textAnchor="middle">{item[data.xAxisKey!].slice(0, 5)}</text>
                                          <text x={x + 8} y={y - 4} fill="#22d3ee" fontSize="6.5" textAnchor="middle" fontWeight="bold">{val}</text>
                                        </g>
                                      );
                                    })}
                                  </svg>
                                )}

                                {/* Custom SVG Pie Chart */}
                                {data.chartType === "pie" && (
                                  <div className="flex items-center justify-around gap-4 h-36 border border-white/5 bg-black/20 rounded p-2">
                                    <svg className="w-24 h-24" viewBox="0 0 32 32">
                                      {/* Simple custom pie arcs using strokeDasharray */}
                                      {(() => {
                                        const totalVal = data.items.reduce((s: number, x: any) => s + x[data.yAxisKey!], 0);
                                        let acc = 0;
                                        const colors = ["#22d3ee", "#ef4444", "#a855f7", "#eab308"];
                                        
                                        return data.items.map((item: any, i: number) => {
                                          const val = item[data.yAxisKey!];
                                          const pct = totalVal > 0 ? (val / totalVal) * 100 : 0;
                                          const strokeDash = `${pct} ${100 - pct}`;
                                          const strokeOffset = 100 - acc + 25;
                                          acc += pct;
                                          
                                          return (
                                            <circle
                                              key={i}
                                              r="15.9"
                                              cx="16"
                                              cy="16"
                                              fill="transparent"
                                              stroke={colors[i % colors.length]}
                                              strokeWidth="2"
                                              strokeDasharray={strokeDash}
                                              strokeDashoffset={strokeOffset}
                                            />
                                          );
                                        });
                                      })()}
                                    </svg>
                                    <div className="space-y-1 text-[8.5px] font-mono text-slate-300">
                                      {data.items.map((item: any, i: number) => {
                                        const colors = ["#22d3ee", "#ef4444", "#a855f7", "#eab308"];
                                        return (
                                          <div key={i} className="flex items-center gap-1.5">
                                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                                            <span>{item[data.xAxisKey!]}: {item[data.yAxisKey!]}</span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </GlassCard>
                            )}

                            {/* Widget Type: Table */}
                            {data.type === "table" && (
                              <GlassCard className="p-4 border-white/10 bg-navy-950/90 w-[320px] sm:w-[480px] overflow-hidden">
                                <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2">{data.title}</h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-[9px] font-mono text-slate-300 border-collapse">
                                    <thead>
                                      <tr className="border-b border-white/10 text-slate-500 uppercase tracking-wider text-[8px] text-left">
                                        {data.headers?.map(h => (
                                          <th key={h} className="pb-1.5 font-bold">{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {data.items.slice(0, 5).map((item: any, i: number) => (
                                        <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.01]">
                                          {data.keys?.map(k => (
                                            <td key={k} className="py-2 pr-2">{item[k]}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </GlassCard>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="h-8 w-8 shrink-0 rounded-lg border bg-cyan-accent/15 border-cyan-accent/25 text-cyan-accent flex items-center justify-center animate-pulse">
                      <Bot className="h-4.5 w-4.5" />
                    </div>
                    <div className="p-4 rounded-2xl border border-white/10 bg-navy-900/90 text-xs text-slate-500 animate-pulse">
                      Querying database engines and generating insights...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="p-4 border-t border-white/10 bg-navy-950/80 flex gap-2">
                <input
                  type="text"
                  placeholder="Ask advisor: busiest officer, theft last week, show hotspots..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 bg-navy-900/80 border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs outline-none focus:border-cyan-accent/40"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="h-10 w-10 bg-cyan-accent/15 border border-cyan-accent/25 hover:bg-cyan-accent/25 text-cyan-accent flex items-center justify-center rounded-xl transition-all"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>

            </GlassCard>
          </div>
        )}

        {/* TAB 5: INVESTIGATOR COPILOT */}
        {activeTab === "copilot" && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Case Selector Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Active File:</span>
              <select
                value={selectedCopilotCaseId}
                onChange={(e) => setSelectedCopilotCaseId(e.target.value)}
                className="bg-navy-900 border border-white/10 text-white rounded-xl px-3 py-2 text-xs font-mono font-bold outline-none cursor-pointer hover:border-cyan-accent/30"
              >
                {records.slice(0, 15).map(r => (
                  <option key={r.id} value={r.id} className="bg-navy-950 font-mono">{r.firNumber} — {r.offense.slice(0, 30)}...</option>
                ))}
              </select>
            </div>

            {/* Main Copilot Panel */}
            {copilotLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-500 animate-pulse">
                <Cpu className="h-10 w-10 text-cyan-accent animate-spin mb-4" />
                Analyzing case parameters and mapping legal sections...
              </div>
            ) : copilotData ? (
              <div className="grid gap-6 lg:grid-cols-3">
                
                {/* Left Column: Copilot Details, suggested steps, evidence */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Case overview */}
                  <GlassCard className="p-5 border-white/10 relative overflow-hidden bg-navy-950/40">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
                      <span className="font-mono text-xs font-bold text-cyan-accent">Copilot Advisory Sheet</span>
                      <span className={`text-[8.5px] px-2.5 py-0.5 rounded border capitalize ${
                        copilotData.priority === "critical" ? "text-rose-400 border-rose-500/30 bg-rose-950/40" : "text-cyan-400 border-cyan-500/30 bg-cyan-950/40"
                      }`}>{copilotData.priority} priority</span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2">{copilotData.firNumber} — Incident Overview</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">{copilotData.summary}</p>

                    {/* Progress bar */}
                    <div className="mt-5">
                      <div className="flex justify-between items-center mb-1.5 text-[9px] uppercase tracking-wider font-bold text-slate-500">
                        <span>Investigation Progress</span>
                        <span className="text-cyan-accent">{copilotData.progress}% Complete</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-accent shadow-glow transition-all duration-500" style={{ width: `${copilotData.progress}%` }} />
                      </div>
                    </div>
                  </GlassCard>

                  {/* Actions & Steps */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    
                    {/* Suggested Steps Checklist */}
                    <GlassCard className="p-4 border-white/10 bg-navy-900/60 flex flex-col min-h-[220px]">
                      <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                        <Clock className="h-4 w-4 text-cyan-accent" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Investigation Steps</h3>
                      </div>
                      <div className="space-y-2 flex-1">
                        {copilotData.suggestedSteps?.map((step: string) => {
                          const isDone = stepsCompleted[step];
                          return (
                            <button
                              key={step}
                              onClick={() => toggleStep(step)}
                              className={`w-full flex items-start gap-2.5 p-2 rounded-lg border text-left text-[10px] leading-normal transition-all ${
                                isDone 
                                  ? "border-emerald-500/25 bg-emerald-950/20 text-emerald-300 line-through" 
                                  : "border-white/5 bg-white/[0.01] text-slate-300 hover:bg-white/[0.02]"
                              }`}
                            >
                              {isDone ? <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" /> : <div className="h-4 w-4 rounded-full border border-white/20 shrink-0 mt-0.5" />}
                              <span>{step}</span>
                            </button>
                          );
                        })}
                      </div>
                    </GlassCard>

                    {/* Evidence Checklist */}
                    <GlassCard className="p-4 border-white/10 bg-navy-900/60 flex flex-col min-h-[220px]">
                      <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                        <FileText className="h-4 w-4 text-cyan-accent" />
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Required Evidence Checklist</h3>
                      </div>
                      <div className="space-y-2 flex-1 font-mono text-[9px]">
                        {copilotData.evidenceChecklist?.map((ev: string) => (
                          <div key={ev} className="flex items-center gap-2 p-2 rounded-lg border border-white/5 bg-white/[0.01] text-slate-300">
                            <CheckCircle className="h-3.5 w-3.5 text-cyan-accent shrink-0" />
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                  </div>

                  {/* Case Timeline */}
                  <GlassCard className="p-4 border-white/10 bg-navy-900/60">
                    <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                      <Clock className="h-4 w-4 text-cyan-accent animate-pulse" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Investigation Chronology</h3>
                    </div>
                    <div className="space-y-4 pl-3 relative border-l border-white/10 ml-2 pt-2">
                      {copilotData.timeline?.map((t: any, idx: number) => (
                        <div key={idx} className="relative">
                          <span className="absolute -left-[19px] top-0.5 h-3 w-3 rounded-full border border-cyan-400 bg-navy-950 shadow-glow" />
                          <div className="text-[10px]">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-bold text-white uppercase">{t.title}</span>
                              <span className="text-[8px] text-slate-500 font-mono">{t.date}</span>
                            </div>
                            <p className="text-slate-400 leading-normal">{t.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                </div>

                {/* Right Column: AI Risk Scoring & Legal Sections */}
                <div className="space-y-6 lg:col-span-1">
                  
                  {/* AI Risk Scoring Card */}
                  <GlassCard className="p-5 border-rose-500/25 bg-rose-950/5 relative overflow-hidden shadow-glow">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu className="h-4.5 w-4.5 text-rose-400 animate-pulse" />
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Explainable AI Risk Scoring</span>
                    </div>

                    {/* Gauge score display */}
                    <div className="flex items-center justify-around gap-4 border-b border-white/10 pb-4 mb-4">
                      <div className="relative h-20 w-20 flex items-center justify-center">
                        {/* Circular ring representation */}
                        <svg className="absolute inset-0 h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="16" fill="none" stroke="#f43f5e" strokeWidth="3" strokeDasharray={`${copilotData.riskExplanation.score} 100`} />
                        </svg>
                        <span className="text-xl font-mono font-black text-white">{copilotData.riskExplanation.score}</span>
                      </div>
                      <div>
                        <span className="text-[8.5px] uppercase font-bold text-slate-500 tracking-wider">Calculated Severity</span>
                        <h4 className="text-sm font-black text-rose-400 uppercase tracking-tight">{copilotData.riskExplanation.level} Alert</h4>
                        <p className="text-[8px] text-slate-400">Risk index calculated via spatial density and priority flags.</p>
                      </div>
                    </div>

                    {/* Explanations */}
                    <div className="space-y-2 border-b border-white/10 pb-4 mb-4 text-[10px] text-slate-300">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">Contributing Risk Factors</p>
                      <ul className="list-disc list-inside space-y-1.5 font-mono text-[9px]">
                        {copilotData.riskExplanation.reasons?.map((reason: string, idx: number) => (
                          <li key={idx} className="leading-normal">{reason}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-950/20 text-[9.5px] leading-relaxed text-rose-300 font-mono">
                      <span className="font-bold block uppercase text-[8px] tracking-wider mb-0.5">Suggested Action</span>
                      {copilotData.riskExplanation.actions}
                    </div>

                  </GlassCard>

                  {/* Legal Sections References */}
                  <GlassCard className="p-4 border-white/10 bg-navy-900/60 space-y-3">
                    <div className="flex items-center gap-2 mb-1 border-b border-white/10 pb-2">
                      <BookOpen className="h-4.5 w-4.5 text-cyan-accent" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Applicable Legal Codes</h3>
                    </div>
                    <div className="p-3 rounded-lg border border-white/5 bg-white/[0.01] text-[11px] font-mono text-cyan-accent text-center font-bold">
                      {copilotData.legalSections}
                    </div>
                    <p className="text-[9px] leading-normal text-slate-400">Sections suggested automatically by AI scanner scanning case narrative content.</p>
                  </GlassCard>

                  {/* Recommended Deployment */}
                  <GlassCard className="p-4 border-white/10 bg-navy-900/60 space-y-2">
                    <div className="flex items-center gap-2 mb-1 border-b border-white/10 pb-2">
                      <MapPin className="h-4.5 w-4.5 text-cyan-accent" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">Resource Allocation</h3>
                    </div>
                    <div className="space-y-1 text-[10px] text-slate-300">
                      <p>Recommended Officer: <b>{copilotData.recommendedOfficer}</b></p>
                      <p className="mt-1 leading-normal text-slate-400">Patrol Deployment Target: <b>{copilotData.recommendedPatrolArea}</b></p>
                    </div>
                  </GlassCard>

                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-6 text-slate-500">
                Select a case file from the dropdown to load copilot analysis.
              </div>
            )}

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
