import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Play, Pause, RefreshCw, Shield,
  Calendar, FileText, Sparkles, X,
  AlertTriangle, Navigation, Map, MessageSquare,
  BarChart3, Network, Target, Search, Send,
  ChevronRight, Layers, Zap,
  User, Phone, Car, MapPin, Lock,
  Brain, Activity, Clock, CheckCircle, XCircle,
  AlertCircle, BookOpen, Users
} from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { GlassCard } from "../components/ui/GlassCard";
import {
  AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Tooltip as ReTooltip,
  Legend, ResponsiveContainer, XAxis, YAxis, CartesianGrid
} from "recharts";
import { InteractiveResponse } from "../components/ai-assistant/InteractiveResponse";

// Fix Leaflet Default Icon assets
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ─── Types ────────────────────────────────────────────────────────────────
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

interface HeatmapPoint { lat: number; lng: number; intensity: number; }
interface Hotspot {
  id: string; name: string; centerLat: number; centerLng: number;
  totalCrimes: number; mostCommonCrime: string; lastIncident: string;
  avgMonthlyIncrease: number; hotspotScore: number; riskLevel: string; radius: number;
}
interface PatrolRoute { name: string; coordinates: [number, number][]; priority: string; assignedOfficers: number; }
interface BriefingData {
  highestCrimeDistrict: string; fastestGrowingHotspot: string;
  crimesIncreasingWeek: string[]; crimesDecreasingMonth: string[];
  suggestedPatrolLocations: PatrolRoute[];
  recommendedPoliceDeployment: string; mostActiveOfficer: string;
  highPriorityInvestigations: any[]; geminiSummary: string;
}
interface ChatMessage { role: "user" | "ai"; content: string; data?: any; timestamp: Date; }
interface CrimeSignature {
  id: string; name: string; category: string; confidenceScore: number;
  similarityPercentage: number; description: string; matchingCases: string[];
  aiExplanation: string; moDetails: any;
}
interface NetworkNode { id: string; label: string; type: string; details: string; [key: string]: any; }
interface NetworkLink { source: string; target: string; type: string; strength?: number; aiExplanation?: string; }

type TabId = "map" | "chat" | "analytics" | "signatures" | "network" | "copilot";

const BENGALURU_CENTER: [number, number] = [12.9716, 77.5946];
const CHART_COLORS = ["#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#f97316"];

function generateMockCoords(count: number, variance = 0.05): [number, number][] {
  return Array.from({ length: count }, () => [
    BENGALURU_CENTER[0] + (Math.random() - 0.5) * variance,
    BENGALURU_CENTER[1] + (Math.random() - 0.5) * variance,
  ]);
}

// ─── Main Component ───────────────────────────────────────────────────────
export function CrimeIntelligence() {
  const [activeTab, setActiveTab] = useState<TabId>("map");

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const patrolLayerRef = useRef<L.LayerGroup | null>(null);
  const cctvLayerRef = useRef<L.LayerGroup | null>(null);
  const stationsLayerRef = useRef<L.LayerGroup | null>(null);
  const infrastructureLayerRef = useRef<L.LayerGroup | null>(null);
  const riskZonesLayerRef = useRef<L.LayerGroup | null>(null);
  const networkLayerRef = useRef<L.LayerGroup | null>(null);
  const patrolCarMarkerRef = useRef<L.Marker | null>(null);
  const simIntervalRef = useRef<number | null>(null);
  const playIntervalRef = useRef<number | null>(null);

  const [layers, setLayers] = useState({
    incidents: true, heatmap: false, density: false,
    stations: true, patrols: true, cctv: true,
    infrastructure: false, riskZones: true, networks: false
  });

  // Filters
  const [district, setDistrict] = useState("all");
  const [station, setStation] = useState("all");
  const [category, setCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [timeOfDay, setTimeOfDay] = useState("all");
  const [loading, setLoading] = useState(false);

  // Data
  const [records, setRecords] = useState<FIRRecord[]>([]);
  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [briefing, setBriefing] = useState<BriefingData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [signatures, setSignatures] = useState<CrimeSignature[]>([]);
  const [networkData, setNetworkData] = useState<{ nodes: NetworkNode[]; links: NetworkLink[]; insights: string } | null>(null);

  // Selected state
  const [selectedRecord, setSelectedRecord] = useState<FIRRecord | null>(null);
  const [selectedRiskZone, setSelectedRiskZone] = useState<any | null>(null);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  // Time slider
  const [timeSliderVal, setTimeSliderVal] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);

  // Patrol sim
  const [simulatingPatrol, setSimulatingPatrol] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [dispatchStatus, setDispatchStatus] = useState("");
  const simRouteCoords = useRef<[number, number][]>([
    [12.9716, 77.5946], [12.9750, 77.6010], [12.9785, 77.6120],
    [12.9650, 77.6400], [12.9340, 77.6100], [12.9250, 77.5900], [12.9716, 77.5946]
  ]);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "ai", content: "🚔 KSP AI Intelligence Engine online. I can analyze crime patterns, identify hotspots, generate patrol recommendations, and answer queries about case data. What intelligence do you need?", timestamp: new Date() }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Copilot
  const [copilotCaseId, setCopilotCaseId] = useState("");
  const [copilotData, setCopilotData] = useState<any>(null);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [selectedNetworkNode, setSelectedNetworkNode] = useState<NetworkNode | null>(null);

  // Static data
  const districts = ["all", "Bengaluru City", "Mysuru City", "Hubballi-Dharwad", "Mangaluru City", "Belagavi"];
  const stations = ["all", "Indiranagar PS", "Cyber Cell, Bengaluru", "Koramangala PS", "Jayanagar PS", "EOW, Bengaluru", "Whitefield PS", "Mysuru Central PS", "Narcotics Cell, Bengaluru"];
  const categories = ["all", "Theft", "Cyber Crime", "Assault", "Domestic Violence", "Drug Possession", "Fraud", "Other"];

  const mockInfrastructure = useMemo(() => ({
    schools: generateMockCoords(12, 0.06),
    hospitals: generateMockCoords(10, 0.06),
    banks: generateMockCoords(15, 0.05),
    atms: generateMockCoords(25, 0.04)
  }), []);

  const mockRiskZones = useMemo(() => ([
    { id: "zone-1", name: "Koramangala IT Corridor", center: [12.9340, 77.6100] as [number, number], riskScore: 88, level: "Red", reason: "Recent 24% spike in phishing MOs. High concentration of tech parks, nearby bank outlets, and active cyber-offender nodes.", metrics: { diversity: "High", peakHours: "18:00 - 22:00", repeatOffenders: 14 } },
    { id: "zone-2", name: "Jayanagar Metro Hub", center: [12.9250, 77.5900] as [number, number], riskScore: 68, level: "Orange", reason: "Clustering of vehicle thefts. High pedestrian density during transit peak hours (08:00 - 10:00, 17:00 - 19:00).", metrics: { diversity: "Medium", peakHours: "08:00 - 19:00", repeatOffenders: 6 } },
    { id: "zone-3", name: "Whitefield Industrial Area", center: [12.9698, 77.7500] as [number, number], riskScore: 42, level: "Yellow", reason: "Occasional night snatching. Faded street lighting along connecting transit highways.", metrics: { diversity: "Low", peakHours: "22:00 - 02:00", repeatOffenders: 3 } }
  ]), []);

  const filterDateBound = useMemo(() => {
    if (dateRange === "all") return null;
    const now = new Date();
    if (dateRange === "24h") now.setHours(now.getHours() - 24);
    else if (dateRange === "7d") now.setDate(now.getDate() - 7);
    else if (dateRange === "30d") now.setDate(now.getDate() - 30);
    else if (dateRange === "90d") now.setDate(now.getDate() - 90);
    return now.toISOString();
  }, [dateRange]);

  // ─── Data Fetching ────────────────────────────────────────────────────
  const fetchMapData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (district !== "all") params.append("district", district);
      if (station !== "all") params.append("station", station);
      if (category !== "all") params.append("category", category);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (filterDateBound) params.append("date_from", filterDateBound);

      const [mapRes, heatRes, hotRes, briefRes] = await Promise.all([
        fetch(`/api/v1/intelligence/map?${params.toString()}`),
        fetch(`/api/v1/intelligence/heatmap?${params.toString()}`),
        fetch(`/api/v1/intelligence/hotspots?${params.toString()}`),
        fetch("/api/v1/intelligence/briefing")
      ]);

      if (mapRes.ok) setRecords(await mapRes.json());
      if (heatRes.ok) setHeatmapPoints(await heatRes.json());
      if (hotRes.ok) setHotspots(await hotRes.json());
      if (briefRes.ok) setBriefing(await briefRes.json());
    } catch (err) {
      console.error("Map data fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [district, station, category, statusFilter, filterDateBound]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/intelligence/analytics");
      if (res.ok) setAnalyticsData(await res.json());
    } catch (err) { console.error("Analytics fetch error:", err); }
  }, []);

  const fetchSignatures = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/intelligence/signatures");
      if (res.ok) setSignatures(await res.json());
    } catch (err) { console.error("Signatures fetch error:", err); }
  }, []);

  const fetchNetwork = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/intelligence/network");
      if (res.ok) setNetworkData(await res.json());
    } catch (err) { console.error("Network fetch error:", err); }
  }, []);

  const fetchCopilot = useCallback(async (caseId: string) => {
    if (!caseId.trim()) return;
    setCopilotLoading(true);
    try {
      const res = await fetch(`/api/v1/intelligence/copilot/${encodeURIComponent(caseId.trim())}`);
      if (res.ok) setCopilotData(await res.json());
      else setCopilotData(null);
    } catch (err) { console.error("Copilot fetch error:", err); }
    finally { setCopilotLoading(false); }
  }, []);

  useEffect(() => { fetchMapData(); }, [district, station, category, statusFilter, dateRange]);

  useEffect(() => {
    if (activeTab === "analytics" && !analyticsData) fetchAnalytics();
    if (activeTab === "signatures" && signatures.length === 0) fetchSignatures();
    if (activeTab === "network" && !networkData) fetchNetwork();
  }, [activeTab]);

  // ─── Time slider & play ───────────────────────────────────────────────
  const minMaxDates = useMemo(() => {
    if (records.length === 0) return { min: Date.now() - 30 * 24 * 3600 * 1000, max: Date.now() };
    const dates = records.map(r => new Date(r.date).getTime()).sort();
    return { min: dates[0], max: dates[dates.length - 1] };
  }, [records]);

  const activeThresholdDate = useMemo(() => {
    const timeSpan = minMaxDates.max - minMaxDates.min;
    return minMaxDates.min + (timeSpan * (timeSliderVal / 100));
  }, [timeSliderVal, minMaxDates]);

  const filteredRecords = useMemo(() => records.filter(r => {
    if (new Date(r.date).getTime() > activeThresholdDate) return false;
    if (timeOfDay === "all") return true;
    const h = new Date(r.date).getHours();
    if (timeOfDay === "morning") return h >= 5 && h < 12;
    if (timeOfDay === "afternoon") return h >= 12 && h < 17;
    if (timeOfDay === "evening") return h >= 17 && h < 22;
    if (timeOfDay === "night") return h >= 22 || h < 5;
    return true;
  }), [records, activeThresholdDate, timeOfDay]);

  const filteredHeatmap = useMemo(() => heatmapPoints.filter((_, idx) => {
    const record = records[idx];
    if (!record) return true;
    if (new Date(record.date).getTime() > activeThresholdDate) return false;
    if (timeOfDay === "all") return true;
    const h = new Date(record.date).getHours();
    if (timeOfDay === "morning") return h >= 5 && h < 12;
    if (timeOfDay === "afternoon") return h >= 12 && h < 17;
    if (timeOfDay === "evening") return h >= 17 && h < 22;
    if (timeOfDay === "night") return h >= 22 || h < 5;
    return true;
  }), [heatmapPoints, records, activeThresholdDate, timeOfDay]);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = window.setInterval(() => {
        setTimeSliderVal(prev => { if (prev >= 100) { setIsPlaying(false); return 100; } return prev + 1; });
      }, 200);
    } else {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    }
    return () => { if (playIntervalRef.current) clearInterval(playIntervalRef.current); };
  }, [isPlaying]);

  // ─── Map Initialization ───────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const map = L.map(mapContainerRef.current, { center: BENGALURU_CENTER, zoom: 12, zoomControl: false });
    L.control.zoom({ position: "topright" }).addTo(map);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    }).addTo(map);
    mapRef.current = map;
    markerLayerRef.current = L.layerGroup().addTo(map);
    patrolLayerRef.current = L.layerGroup().addTo(map);
    cctvLayerRef.current = L.layerGroup().addTo(map);
    stationsLayerRef.current = L.layerGroup().addTo(map);
    infrastructureLayerRef.current = L.layerGroup().addTo(map);
    riskZonesLayerRef.current = L.layerGroup().addTo(map);
    networkLayerRef.current = L.layerGroup().addTo(map);

    const canvas = L.DomUtil.create("canvas", "leaflet-heatmap-layer") as HTMLCanvasElement;
    canvas.style.pointerEvents = "none";
    canvas.style.position = "absolute";
    canvas.style.zIndex = "400";
    map.getPanes().overlayPane.appendChild(canvas);
    canvasRef.current = canvas;

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  const drawHeatmapOnCanvas = useCallback((map: L.Map, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!layers.heatmap) return;
    ctx.globalCompositeOperation = "screen";
    filteredHeatmap.forEach(p => {
      const pos = map.latLngToContainerPoint([p.lat, p.lng]);
      const radius = 25 + (map.getZoom() * 2);
      const grad = ctx.createRadialGradient(pos.x, pos.y, 1, pos.x, pos.y, radius);
      const alpha = p.intensity * 0.7;
      grad.addColorStop(0, `rgba(236,72,153,${alpha})`);
      grad.addColorStop(0.3, `rgba(249,115,22,${alpha * 0.6})`);
      grad.addColorStop(0.7, `rgba(6,182,212,${alpha * 0.2})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2); ctx.fill();
    });
  }, [layers.heatmap, filteredHeatmap]);

  // Invalidate map size when tab switches to Map
  useEffect(() => {
    if (activeTab === "map" && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 50);
    }
  }, [activeTab]);

  // Synchronize heatmap canvas on map movement/zoom
  useEffect(() => {
    const map = mapRef.current;
    const canvas = canvasRef.current;
    if (!map || !canvas) return;

    const syncCanvas = () => {
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
      
      const topLeft = map.containerPointToLayerPoint([0, 0]);
      L.DomUtil.setPosition(canvas, topLeft);
      
      drawHeatmapOnCanvas(map, canvas);
    };

    map.on("viewreset move moveend zoomend resize", syncCanvas);
    
    // Run once initially
    syncCanvas();

    return () => {
      map.off("viewreset move moveend zoomend resize", syncCanvas);
    };
  }, [drawHeatmapOnCanvas]);

  useEffect(() => {
    const map = mapRef.current; const canvas = canvasRef.current;
    if (map && canvas) drawHeatmapOnCanvas(map, canvas);
  }, [drawHeatmapOnCanvas]);

  // Marker icon helper
  const createMarkerIcon = useCallback((record: FIRRecord) => {
    const categoryColors: Record<string, string> = {
      "Theft": "border-cyan-400 bg-cyan-950/90 text-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]",
      "Cyber Crime": "border-fuchsia-400 bg-fuchsia-950/90 text-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.4)]",
      "Assault": "border-rose-500 bg-rose-950/90 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]",
      "Domestic Violence": "border-amber-400 bg-amber-950/90 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]",
      "Drug Possession": "border-emerald-400 bg-emerald-950/90 text-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]",
      "Fraud": "border-orange-400 bg-orange-950/90 text-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.4)]",
      "Other": "border-slate-400 bg-slate-900/90 text-slate-300"
    };
    const colorClass = categoryColors[record.crimeCategory] || categoryColors["Other"];
    const pulse = record.priority === "critical" ? "animate-pulse border-2 shadow-[0_0_15px_#f43f5e]" : "";
    return L.divIcon({
      html: `<div class="relative flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-sm transition-transform hover:scale-110 ${colorClass} ${pulse}"><span class="text-[9px] font-black uppercase">${record.crimeCategory?.slice(0, 2) || "FI"}</span></div>`,
      className: "custom-div-marker-icon", iconSize: [32, 32], iconAnchor: [16, 16]
    });
  }, []);

  // Main map drawing effect
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markerLayerRef.current) return;

    markerLayerRef.current.clearLayers();
    stationsLayerRef.current?.clearLayers();
    cctvLayerRef.current?.clearLayers();
    infrastructureLayerRef.current?.clearLayers();
    riskZonesLayerRef.current?.clearLayers();
    patrolLayerRef.current?.clearLayers();
    networkLayerRef.current?.clearLayers();

    // 1. Incidents
    if (layers.incidents) {
      if (!layers.density) {
        filteredRecords.forEach(r => {
          if (!r.latitude || !r.longitude) return;
          const marker = L.marker([r.latitude, r.longitude], { icon: createMarkerIcon(r) });
          marker.on("click", () => { setSelectedRecord(r); setSelectedRiskZone(null); setSelectedHotspot(null); });
          markerLayerRef.current!.addLayer(marker);
        });
      } else {
        const zoom = map.getZoom();
        const gridSize = 130 / (zoom * 0.55);
        const clusters: FIRRecord[][] = [];
        const visited = new Set<string>();
        filteredRecords.forEach(r => {
          if (visited.has(r.id) || !r.latitude || !r.longitude) return;
          const pos = map.latLngToContainerPoint([r.latitude, r.longitude]);
          const cluster = [r]; visited.add(r.id);
          filteredRecords.forEach(other => {
            if (visited.has(other.id) || !other.latitude || !other.longitude) return;
            const op = map.latLngToContainerPoint([other.latitude, other.longitude]);
            if (Math.hypot(pos.x - op.x, pos.y - op.y) < gridSize) { cluster.push(other); visited.add(other.id); }
          });
          clusters.push(cluster);
        });
        clusters.forEach(cluster => {
          const clat = cluster.reduce((s, f) => s + f.latitude, 0) / cluster.length;
          const clng = cluster.reduce((s, f) => s + f.longitude, 0) / cluster.length;
          if (cluster.length === 1) {
            const r = cluster[0];
            const m = L.marker([r.latitude, r.longitude], { icon: createMarkerIcon(r) });
            m.on("click", () => setSelectedRecord(r));
            markerLayerRef.current!.addLayer(m);
          } else {
            const count = cluster.length;
            const bc = count > 15 ? "border-rose-500 bg-rose-950/90 text-rose-300 shadow-[0_0_12px_#f43f5e]" : count > 8 ? "border-amber-500 bg-amber-950/90 text-amber-300" : "border-cyan-500 bg-cyan-950/90 text-cyan-300";
            const ci = L.divIcon({ html: `<div class="relative flex h-10 w-10 items-center justify-center rounded-full border-2 ${bc} font-bold text-xs backdrop-blur-sm">${count}</div>`, className: "custom-cluster-icon", iconSize: [40, 40], iconAnchor: [20, 20] });
            const m = L.marker([clat, clng], { icon: ci });
            m.on("click", () => map.setView([clat, clng], map.getZoom() + 1));
            markerLayerRef.current!.addLayer(m);
          }
        });
      }
    }

    // 2. Police Stations
    if (layers.stations) {
      const stIcon = L.divIcon({ html: `<div class="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-400 bg-blue-950/90 text-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.6)]"><span class="text-xs font-bold">👮</span></div>`, className: "ksp-station-marker", iconSize: [32, 32], iconAnchor: [16, 16] });
      [{ name: "Indiranagar PS", pos: [12.9650, 77.6400] as [number, number] }, { name: "Koramangala PS", pos: [12.9340, 77.6100] as [number, number] }, { name: "Jayanagar PS", pos: [12.9250, 77.5900] as [number, number] }, { name: "Whitefield PS", pos: [12.9698, 77.7500] as [number, number] }]
        .forEach(st => { const m = L.marker(st.pos, { icon: stIcon }); m.bindTooltip(`<b>${st.name}</b><br/>Division: Bengaluru East`, { direction: "top" }); stationsLayerRef.current!.addLayer(m); });
    }

    // 3. CCTV Nodes
    if (layers.cctv && hotspots.length > 0) {
      hotspots.forEach(h => {
        const ci = L.divIcon({ html: `<div class="relative flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400 bg-emerald-950/80 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg><div class="absolute inset-0 rounded-lg border border-emerald-400/20 animate-ping opacity-60"></div></div>`, className: "camera-map-marker", iconSize: [28, 28], iconAnchor: [14, 14] });
        const cm = L.marker([h.centerLat + 0.002, h.centerLng - 0.002], { icon: ci });
        cm.on("click", () => { setSelectedHotspot(h); setSelectedRecord(null); setSelectedRiskZone(null); });
        cctvLayerRef.current!.addLayer(cm);
        cctvLayerRef.current!.addLayer(L.circle([h.centerLat + 0.002, h.centerLng - 0.002], { color: "#10b981", fillColor: "#10b981", fillOpacity: 0.05, radius: 200, weight: 1, dashArray: "4, 4" }));
      });
    }

    // 4. Infrastructure
    if (layers.infrastructure) {
      const mkIcon = (color: string, emoji: string) => L.divIcon({ html: `<div class="flex h-6 w-6 items-center justify-center rounded-full bg-${color}-950 border border-${color}-400 text-${color}-300 text-[10px]">${emoji}</div>`, className: `infra-${color}`, iconSize: [24, 24] });
      mockInfrastructure.schools.forEach(c => infrastructureLayerRef.current!.addLayer(L.marker(c, { icon: mkIcon("indigo", "🏫") }).bindTooltip("Educational Institute")));
      mockInfrastructure.hospitals.forEach(c => infrastructureLayerRef.current!.addLayer(L.marker(c, { icon: mkIcon("rose", "🏥") }).bindTooltip("Medical Center")));
      mockInfrastructure.banks.forEach(c => infrastructureLayerRef.current!.addLayer(L.marker(c, { icon: mkIcon("emerald", "🏦") }).bindTooltip("Financial Outpost")));
    }

    // 5. Risk Zones
    if (layers.riskZones) {
      if (!document.getElementById("risk-pulse-style")) {
        const style = document.createElement("style"); style.id = "risk-pulse-style";
        style.innerHTML = `@keyframes riskPulse{0%{fill-opacity:.05;stroke-opacity:.25}50%{fill-opacity:.16;stroke-opacity:.65}100%{fill-opacity:.05;stroke-opacity:.25}}.risk-polygon-pulsing{animation:riskPulse 3s infinite ease-in-out}@keyframes patrolDash{to{stroke-dashoffset:-20}}.patrol-line-animated{animation:patrolDash 1s linear infinite}`;
        document.head.appendChild(style);
      }
      mockRiskZones.forEach(zone => {
        const color = zone.level === "Red" ? "#ef4444" : zone.level === "Orange" ? "#f97316" : "#eab308";
        const circle = L.circle(zone.center, { color, fillColor: color, fillOpacity: 0.1, radius: 500, weight: 2, className: "risk-polygon-pulsing" });
        circle.on("click", () => { setSelectedRiskZone(zone); setSelectedRecord(null); setSelectedHotspot(null); });
        circle.bindTooltip(`<b>AI: ${zone.name}</b><br/>Risk: ${zone.riskScore}%`, { sticky: true });
        riskZonesLayerRef.current!.addLayer(circle);
      });
    }

    // 6. Patrol Routes
    if (layers.patrols && briefing?.suggestedPatrolLocations) {
      briefing.suggestedPatrolLocations.forEach(route => {
        const color = route.priority === "High" ? "#ec4899" : "#22d3ee";
        const pl = L.polyline(route.coordinates, { color, weight: 4.5, dashArray: "10, 10", className: "patrol-line-animated" });
        pl.bindTooltip(`<b>Patrol Route</b><br/>Priority: ${route.priority}`, { sticky: true });
        patrolLayerRef.current!.addLayer(pl);
      });
    }

    // 7. Case Network Overlay
    if (layers.networks && selectedRecord) {
      const similar = filteredRecords.filter(r => r.id !== selectedRecord.id && r.crimeCategory === selectedRecord.crimeCategory).slice(0, 3);
      similar.forEach(other => {
        const line = L.polyline([[selectedRecord.latitude, selectedRecord.longitude], [other.latitude, other.longitude]], { color: "#f59e0b", weight: 2, dashArray: "5, 8", className: "patrol-line-animated" });
        line.bindTooltip("<b>AI MO Linkage</b><br/>Similarity: 87%", { sticky: true });
        networkLayerRef.current!.addLayer(line);
        networkLayerRef.current!.addLayer(L.marker([other.latitude, other.longitude], { icon: L.divIcon({ html: `<div class="h-2 w-2 rounded-full bg-amber-500 animate-ping"></div>`, className: "network-node-indicator", iconSize: [8, 8] }) }));
      });
    }
  }, [filteredRecords, layers, selectedRecord, hotspots, briefing, createMarkerIcon, mockInfrastructure, mockRiskZones]);

  // ─── Patrol Simulation ────────────────────────────────────────────────
  const startPatrolSimulation = () => {
    const map = mapRef.current; if (!map) return;
    setSimulatingPatrol(true); setSimStep(0);
    setDispatchStatus("Unit DELTA-1 dispatch initiated from KSP Bengaluru HQ...");
    map.setView(BENGALURU_CENTER, 13);
    const carIcon = L.divIcon({ html: `<div class="h-8 w-8 rounded-full border border-emerald-400 bg-navy-950 flex items-center justify-center shadow-[0_0_15px_#10b981] animate-pulse"><span class="text-sm">🚓</span></div>`, className: "patrol-car-icon", iconSize: [32, 32], iconAnchor: [16, 16] });
    const carMarker = L.marker(BENGALURU_CENTER, { icon: carIcon }).addTo(map);
    carMarker.bindTooltip("<b>AI Dispatch: Unit DELTA-1</b><br/>Responding to high risk zone", { permanent: true, direction: "top", offset: [0, -16] });
    patrolCarMarkerRef.current = carMarker;
    const logs = ["Unit DELTA-1 dispatch initiated from KSP Bengaluru HQ...", "ETA 3m: Speeding down MG Road limits...", "Entering Halasuru Junction. Scanning MAC logs...", "Passing Indiranagar. Hotspot radar scanning active...", "Navigating Koramangala Ring Rd. Anomaly detection verified...", "Entering Jayanagar Patrol Grid. Risk suppression active...", "Patrol circuit complete. Returning to HQ."];
    let step = 0;
    const interval = window.setInterval(() => {
      step += 1;
      if (step >= simRouteCoords.current.length) {
        clearInterval(interval); patrolCarMarkerRef.current?.remove(); patrolCarMarkerRef.current = null;
        setSimulatingPatrol(false); setDispatchStatus("Simulation completed. Target hotspots secured."); return;
      }
      setSimStep(step);
      const nextPos = simRouteCoords.current[step];
      patrolCarMarkerRef.current?.setLatLng(nextPos); map.panTo(nextPos);
      setDispatchStatus(logs[step] || "Scanning route...");
    }, 2500);
    simIntervalRef.current = interval;
  };

  const stopPatrolSimulation = () => {
    if (simIntervalRef.current) { clearInterval(simIntervalRef.current); simIntervalRef.current = null; }
    patrolCarMarkerRef.current?.remove(); patrolCarMarkerRef.current = null;
    setSimulatingPatrol(false); setDispatchStatus("Simulation terminated.");
  };

  // ─── Chat ─────────────────────────────────────────────────────────────
  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    const query = chatInput; setChatInput(""); setChatLoading(true);
    try {
      const isPlaybookQuery =
        query.toLowerCase().includes("vehicle") ||
        query.toLowerCase().includes("theft") ||
        query.toLowerCase().includes("division") ||
        query.toLowerCase().includes("ravi") ||
        query.toLowerCase().includes("bouncer") ||
        query.toLowerCase().includes("bidar") ||
        query.toLowerCase().includes("fraud") ||
        query.toLowerCase().includes("bank");

      let url = "/api/v1/intelligence/chat";
      let body: any = { message: query };

      if (isPlaybookQuery) {
        url = "/api/v1/chat/query";
        body = { query: query };
      }

      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        const data = await res.json();
        const content = data.summary || data.message || "";
        setChatMessages(prev => [...prev, { role: "ai", content: content, data: data, timestamp: new Date() }]);
      } else {
        setChatMessages(prev => [...prev, { role: "ai", content: "Communication error. Please try again.", timestamp: new Date() }]);
      }
    } catch { setChatMessages(prev => [...prev, { role: "ai", content: "Network error. Check connection.", timestamp: new Date() }]); }
    finally { setChatLoading(false); }
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // ─── Tab Nav Items ─────────────────────────────────────────────────────
  const tabs: { id: TabId; label: string; icon: any; color: string }[] = [
    { id: "map", label: "GIS Map", icon: Map, color: "text-cyan-400" },
    { id: "chat", label: "AI Chat", icon: MessageSquare, color: "text-fuchsia-400" },
    { id: "analytics", label: "Analytics", icon: BarChart3, color: "text-amber-400" },
    { id: "signatures", label: "MO Signatures", icon: Target, color: "text-rose-400" },
    { id: "network", label: "Criminal Network", icon: Network, color: "text-emerald-400" },
    { id: "copilot", label: "Case Copilot", icon: Brain, color: "text-violet-400" },
  ];

  const riskColor = (level: string) => level === "Red" || level === "High" ? "text-rose-400 bg-rose-950/40 border-rose-500/30" : level === "Orange" || level === "Medium" ? "text-orange-400 bg-orange-950/40 border-orange-500/30" : "text-amber-400 bg-amber-950/40 border-amber-500/30";
  const statusColor = (s: string) => s === "solved" || s === "closed" ? "text-emerald-400" : s === "investigating" ? "text-cyan-400" : "text-amber-400";

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <DashboardLayout mainClassName="h-screen overflow-hidden flex flex-col p-0 lg:p-0">
      <div className="flex h-full flex-1 flex-col overflow-hidden">

        {/* ── Top Bar ── */}
        <div className="glass border-b border-white/10 px-4 py-2.5 flex items-center justify-between gap-4 z-30 bg-navy-950/95 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-accent/20 border border-cyan-accent/30">
              <Shield className="h-4 w-4 text-cyan-accent" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white font-mono uppercase">Crime Intelligence Platform</h1>
              <p className="text-[10px] text-slate-500">Karnataka State Police · Command Center</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-xl p-1">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${activeTab === t.id ? "bg-white/10 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>
                <t.icon className={`h-3.5 w-3.5 ${activeTab === t.id ? t.color : ""}`} />
                <span className="hidden md:block">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {loading && <div className="h-4 w-4 border-2 border-cyan-accent border-t-transparent rounded-full animate-spin" />}
            <button onClick={fetchMapData} className="p-1.5 rounded-lg border border-white/10 hover:border-cyan-accent/30 bg-white/[0.03] text-slate-400 hover:text-white transition-colors" title="Refresh Data">
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Content Area ── */}
        <div className="flex-1 overflow-hidden relative">

          {/* ════════════════════════════════════ TAB: GIS MAP ════════════════════════════════════ */}
          <div className={`h-full flex-col lg:flex-row relative ${activeTab === "map" ? "flex" : "hidden"}`}>
              {/* Left: Map + Controls */}
              <div className="flex flex-1 flex-col relative h-full">
                {/* Filter Bar */}
                <div className="glass border-b border-white/10 px-4 py-2.5 flex flex-wrap items-center gap-2 z-30 bg-navy-950/90 backdrop-blur-md shrink-0">
                  {[
                    { label: "District", value: district, setter: setDistrict, options: districts },
                    { label: "Crime", value: category, setter: setCategory, options: categories },
                    { label: "PS Division", value: station, setter: setStation, options: stations, short: true },
                    { label: "Shift", value: timeOfDay, setter: setTimeOfDay, options: ["all","morning","afternoon","evening","night"] },
                    { label: "Range", value: dateRange, setter: setDateRange, options: ["all","24h","7d","30d","90d"] },
                  ].map(f => (
                    <div key={f.label} className="flex items-center gap-1.5 text-[11px] rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1">
                      <span className="text-slate-500">{f.label}:</span>
                      <select value={f.value} onChange={e => f.setter(e.target.value)} className={`bg-transparent text-white outline-none border-0 py-0.5 cursor-pointer font-semibold ${f.short ? "max-w-[120px]" : ""}`}>
                        {f.options.map(o => <option key={o} value={o} className="bg-navy-900 capitalize">{o === "all" ? `All ${f.label}s` : o}</option>)}
                      </select>
                    </div>
                  ))}
                  <button onClick={() => { setDistrict("all"); setStation("all"); setCategory("all"); setStatusFilter("all"); setDateRange("all"); setTimeOfDay("all"); }} className="p-1.5 rounded-lg border border-white/10 hover:border-rose-500/30 bg-white/[0.03] text-slate-400 hover:text-rose-400 transition-colors" title="Reset Filters">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Map */}
                <div ref={mapContainerRef} className="flex-1 w-full h-full z-10 bg-navy-950" />

                {/* GIS Layer Control */}
                <div className="absolute top-20 left-4 z-20">
                  <GlassCard className="p-3 shadow-glass border-white/10 bg-navy-950/90 space-y-2 min-w-[180px]">
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest block border-b border-white/5 pb-1 mb-2 flex items-center gap-1"><Layers className="h-3 w-3" /> GIS Layers</span>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { key: "incidents", label: "FIR Incidents" },
                        { key: "heatmap", label: "Crime Heatmap" },
                        { key: "density", label: "Density Grid" },
                        { key: "stations", label: "Police Stations" },
                        { key: "patrols", label: "Patrol Routes" },
                        { key: "cctv", label: "CCTV Nodes" },
                        { key: "infrastructure", label: "Schools/Banks" },
                        { key: "riskZones", label: "AI Risk Zones" },
                        { key: "networks", label: "MO Network" },
                      ].map(l => (
                        <label key={l.key} className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white transition-colors">
                          <input type="checkbox" checked={(layers as any)[l.key]} onChange={e => setLayers(prev => ({ ...prev, [l.key]: e.target.checked }))} className="rounded border-white/10 bg-black text-cyan-accent focus:ring-0 w-3.5 h-3.5" />
                          <span>{l.label}</span>
                        </label>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                {/* Time Slider */}
                <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center gap-4 bg-navy-950/85 backdrop-blur-md border border-white/10 p-3 rounded-2xl max-w-[760px] mx-auto shadow-glass">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-accent/10 border border-cyan-accent/20 text-cyan-accent hover:bg-cyan-accent/20 transition-colors">
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1 text-[10px]">
                      <span className="text-slate-400 flex items-center gap-1"><Calendar className="h-3 w-3" /> Timeline Replay</span>
                      <span className="text-cyan-accent font-mono font-bold">{new Date(activeThresholdDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                    <input type="range" min="0" max="100" value={timeSliderVal} onChange={e => { setTimeSliderVal(Number(e.target.value)); setIsPlaying(false); }} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-accent outline-none" />
                  </div>
                  <div className="text-right shrink-0 border-l border-white/10 pl-3">
                    <p className="text-[9px] uppercase font-bold text-slate-500 font-mono">Active FIRs</p>
                    <p className="text-base font-bold text-white font-mono">{filteredRecords.length}</p>
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <aside className="w-full lg:w-96 glass border-l border-white/10 bg-navy-900/90 backdrop-blur-xl flex flex-col overflow-y-auto z-20 h-full p-4 space-y-4 shadow-glass shrink-0">

                {/* AI Briefing */}
                <div className="rounded-2xl border border-cyan-accent/20 bg-cyan-accent/5 p-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-accent/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-accent/20 text-cyan-accent"><Sparkles className="h-3.5 w-3.5" /></div>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-accent">AI Command Briefing</span>
                  </div>
                  <div className="text-xs leading-relaxed text-slate-300 max-h-[150px] overflow-y-auto pr-1">
                    {loading ? (
                      <div className="flex flex-col gap-2 animate-pulse pt-2">{[1,2,3].map(n => <div key={n} className="h-3 bg-white/10 rounded w-full" />)}</div>
                    ) : briefing?.geminiSummary ? (
                      <p className="whitespace-pre-line text-slate-300 font-mono text-[10.5px] leading-[1.6]">{briefing.geminiSummary}</p>
                    ) : <p className="text-slate-500">Briefing engines currently offline.</p>}
                  </div>
                </div>

                {/* Patrol Sim */}
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400"><Navigation className="h-3.5 w-3.5" /></div>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Patrol Route Optimizer</span>
                    </div>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-slate-400">DISPATCH-SIM</span>
                  </div>
                  <p className="text-[10px] text-slate-400">Simulate AI-optimized patrol route through Bengaluru crime hotspots in real-time.</p>
                  {simulatingPatrol ? (
                    <div className="p-3 bg-black/60 border border-white/5 rounded-xl space-y-2 font-mono text-[9px] text-slate-300">
                      <div className="flex items-center justify-between"><span className="text-slate-500 uppercase">Active Unit</span><span className="text-emerald-400 font-bold">DELTA-1</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-500 uppercase">Segment</span><span>{simStep + 1} / {simRouteCoords.current.length}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-500 uppercase">Coords</span><span>{simRouteCoords.current[simStep]?.map(n => n.toFixed(4)).join(", ") || "..."}</span></div>
                      <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-300 font-bold animate-pulse text-center text-[9.5px]">🚨 {dispatchStatus}</div>
                      <button onClick={stopPatrolSimulation} className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold uppercase tracking-wider text-[8px] transition-all">Terminate</button>
                    </div>
                  ) : (
                    <button onClick={startPatrolSimulation} className="w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold uppercase tracking-wider text-[9px] transition-all flex items-center justify-center gap-1.5">
                      <Play className="h-3 w-3" /> Initiate Route Optimization
                    </button>
                  )}
                </div>

                {/* Selected Detail Panel */}
                {selectedRecord ? (
                  <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-4 relative animate-fade-in space-y-3">
                    <button onClick={() => setSelectedRecord(null)} className="absolute top-3 right-3 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
                    <div className="flex items-center gap-2 mb-1"><FileText className="h-4 w-4 text-cyan-accent" /><span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Case: {selectedRecord.firNumber}</span></div>
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div><span className="text-[10px] text-slate-500 uppercase font-semibold block">Offense</span><p className="text-slate-100 font-medium text-[11px] leading-relaxed">{selectedRecord.offense}</p></div>
                      <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2">
                        <div><span className="text-[9px] text-slate-500 uppercase font-semibold">Complainant</span><p className="truncate text-slate-200 font-semibold">{selectedRecord.complainant}</p></div>
                        <div><span className="text-[9px] text-slate-500 uppercase font-semibold">Officer</span><p className="truncate text-slate-200 font-semibold">{selectedRecord.officer}</p></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2">
                        <div><span className="text-[9px] text-slate-500 uppercase font-semibold">Station / Ward</span><p className="truncate text-slate-200">{selectedRecord.station}</p></div>
                        <div><span className="text-[9px] text-slate-500 uppercase font-semibold">Date</span><p className="truncate text-slate-200">{new Date(selectedRecord.date).toLocaleDateString()}</p></div>
                      </div>
                      <div className="p-2.5 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 text-[10.5px]">
                        <span className="text-[9px] text-slate-500 uppercase font-bold flex items-center gap-1"><Sparkles className="w-3 h-3 text-cyan-accent" /> AI Recommendations</span>
                        <p className="text-slate-300 leading-normal">{selectedRecord.crimeCategory === "Cyber Crime" ? "Flag UPI ID, request NPCI freeze, extract source MAC addresses." : selectedRecord.crimeCategory === "Theft" ? "Correlate CCTV exit routes, check repeat offenders within 1.5km." : "Schedule patrol sweeps, verify similar MO cases nearby."}</p>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 uppercase font-bold">Status:</span>
                        <span className={`font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${statusColor(selectedRecord.status)} bg-white/5 border-white/10`}>{selectedRecord.status}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] border-t border-white/5 pt-2">
                        <span className="text-slate-500 uppercase font-bold">Risk Score:</span>
                        <span className="text-rose-400 font-black text-sm">{selectedRecord.riskScore}%</span>
                      </div>
                    </div>
                  </div>
                ) : selectedRiskZone ? (
                  <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-4 relative animate-fade-in space-y-3">
                    <button onClick={() => setSelectedRiskZone(null)} className="absolute top-3 right-3 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
                    <div className="flex items-center gap-2 mb-1 text-red-400"><AlertTriangle className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wider font-mono">AI Risk Zone Alert</span></div>
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div><span className="text-[9px] text-slate-500 uppercase font-semibold block">Zone</span><p className="text-slate-100 font-semibold text-sm">{selectedRiskZone.name}</p></div>
                      <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2">
                        <div><span className="text-[9px] text-slate-500 uppercase font-semibold">Risk Score</span><p className="text-red-400 font-black text-lg">{selectedRiskZone.riskScore}%</p></div>
                        <div><span className="text-[9px] text-slate-500 uppercase font-semibold">Level</span><span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${riskColor(selectedRiskZone.level)}`}>{selectedRiskZone.level}</span></div>
                      </div>
                      <div className="border-t border-white/5 pt-2"><span className="text-[9px] text-slate-500 uppercase font-semibold block">AI Reason</span><p className="text-slate-300 text-[10.5px] mt-1 bg-black/40 p-2.5 rounded-lg border border-white/5">{selectedRiskZone.reason}</p></div>
                      <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[10px]">
                        <div><span className="text-slate-500">Peak Hours</span><p className="text-slate-200 font-semibold">{selectedRiskZone.metrics.peakHours}</p></div>
                        <div><span className="text-slate-500">Repeat Offenders</span><p className="text-slate-200 font-semibold">{selectedRiskZone.metrics.repeatOffenders} Active</p></div>
                      </div>
                    </div>
                  </div>
                ) : selectedHotspot ? (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 relative animate-fade-in space-y-3">
                    <button onClick={() => setSelectedHotspot(null)} className="absolute top-3 right-3 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
                    <div className="flex items-center gap-2 mb-1 text-amber-400"><AlertTriangle className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-wider font-mono">DBSCAN Hotspot</span></div>
                    <div className="space-y-2.5 text-xs text-slate-300">
                      <div><span className="text-[9px] text-slate-500 uppercase font-semibold block">Zone</span><p className="text-slate-100 font-semibold text-sm">{selectedHotspot.name}</p></div>
                      <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2">
                        <div><span className="text-[9px] text-slate-500 uppercase font-semibold">Total Crimes</span><p className="text-amber-400 font-black text-lg">{selectedHotspot.totalCrimes}</p></div>
                        <div><span className="text-[9px] text-slate-500 uppercase font-semibold">Growth</span><p className={`font-semibold text-xs mt-1 ${selectedHotspot.avgMonthlyIncrease >= 0 ? "text-rose-400" : "text-emerald-400"}`}>{selectedHotspot.avgMonthlyIncrease >= 0 ? "+" : ""}{selectedHotspot.avgMonthlyIncrease}% / mo</p></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 text-[10px]">
                        <div><span className="text-slate-500">Primary Crime</span><p className="text-slate-200 font-bold">{selectedHotspot.mostCommonCrime}</p></div>
                        <div><span className="text-slate-500">Risk Level</span><p className={`font-bold ${selectedHotspot.riskLevel === "High" ? "text-rose-400" : selectedHotspot.riskLevel === "Medium" ? "text-orange-400" : "text-cyan-400"}`}>{selectedHotspot.riskLevel}</p></div>
                      </div>
                      <div className="flex justify-between text-[10px] border-t border-white/5 pt-2">
                        <span className="text-slate-500">DBSCAN Score</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-white/10 h-1.5 rounded-full overflow-hidden"><div className={`h-full ${selectedHotspot.riskLevel === "High" ? "bg-rose-500" : "bg-orange-500"}`} style={{ width: `${selectedHotspot.hotspotScore}%` }} /></div>
                          <span className="text-white font-bold">{selectedHotspot.hotspotScore}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-6 text-center text-xs text-slate-500 flex flex-col items-center justify-center py-8">
                    <Map className="h-5 w-5 text-slate-600 mb-2" />
                    Click markers, risk zones, or CCTV hotspots on the map to load intelligence dossiers.
                  </div>
                )}

                {/* Hotspot List */}
                <div className="flex-1 flex flex-col min-h-[180px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Hotspots</span>
                    <span className="text-[10px] rounded-full bg-cyan-accent/10 px-2 py-0.5 text-cyan-accent font-semibold">{hotspots.length} Zones</span>
                  </div>
                  <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[260px]">
                    {loading ? [1,2,3].map(n => <div key={n} className="h-14 bg-white/5 rounded-xl animate-pulse" />) : hotspots.length > 0 ? hotspots.map(spot => (
                      <div key={spot.id} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex items-center justify-between hover:bg-white/[0.05] transition-colors cursor-pointer" onClick={() => { setSelectedHotspot(spot); setSelectedRecord(null); setSelectedRiskZone(null); mapRef.current?.setView([spot.centerLat, spot.centerLng], 14); }}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="text-xs font-bold text-white truncate max-w-[140px]">{spot.name}</p>
                            <span className={`text-[9px] px-1.5 rounded border uppercase font-bold ${riskColor(spot.riskLevel)}`}>{spot.riskLevel}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">Type: <b>{spot.mostCommonCrime}</b></p>
                          <p className="text-[9px] text-slate-500">Growth: <span className={spot.avgMonthlyIncrease >= 0 ? "text-rose-400" : "text-emerald-400"}>{spot.avgMonthlyIncrease >= 0 ? "+" : ""}{spot.avgMonthlyIncrease}% / mo</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase text-slate-500 font-bold font-mono">Crimes</p>
                          <p className="text-sm font-black text-white font-mono">{spot.totalCrimes}</p>
                          <div className="w-12 bg-white/10 h-1 rounded-full mt-1 overflow-hidden"><div className={`h-full ${spot.riskLevel === "High" ? "bg-rose-500" : "bg-orange-500"}`} style={{ width: `${spot.hotspotScore}%` }} /></div>
                        </div>
                      </div>
                    )) : <div className="text-center text-xs text-slate-500 py-6 border border-dashed border-white/10 rounded-2xl">No active hotspots detected.</div>}
                  </div>
                </div>

                {/* Deployment Recommendation */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-400">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">Recommended Deployment</span>
                  <p className="text-slate-300 leading-normal text-[10.5px]">{briefing?.recommendedPoliceDeployment || "Compile statistics to load recommendations."}</p>
                </div>
              </aside>
            </div>

          {/* ════════════════════════════════════ TAB: AI CHAT ════════════════════════════════════ */}
          {activeTab === "chat" && (
            <div className="flex h-full flex-col max-w-4xl mx-auto w-full p-4 gap-4">
              <div className="flex items-center gap-3 bg-fuchsia-500/5 border border-fuchsia-500/20 rounded-2xl p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-fuchsia-500/20 text-fuchsia-400"><MessageSquare className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-bold text-white">KSP Intelligence AI Chat</p>
                  <p className="text-[10px] text-slate-400">Ask about hotspots, officer workloads, crime trends, case data, and patrol recommendations.</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {["Show hotspots", "Busiest officer", "Cyber crime stats", "Weekly report"].map(q => (
                    <button key={q} onClick={() => { setChatInput(q); }} className="text-[10px] px-2 py-1 rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white hover:border-fuchsia-500/30 transition-colors hidden md:block">{q}</button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${msg.role === "ai" ? "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30" : "bg-cyan-accent/20 text-cyan-accent border border-cyan-accent/30"}`}>
                      {msg.role === "ai" ? <Brain className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                    </div>
                    <div className={`flex-1 max-w-[80%] space-y-2 ${msg.role === "user" ? "items-end flex flex-col" : ""}`}>
                      <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${msg.role === "ai" ? "bg-white/[0.04] border border-white/10 text-slate-200" : "bg-cyan-accent/10 border border-cyan-accent/20 text-cyan-100"}`}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.role === "ai" && msg.data && <InteractiveResponse data={msg.data} />}
                      </div>
                      {msg.data && (msg.data.type === "table" || msg.data.type === "chart") && (
                        <div className="bg-black/40 border border-white/10 rounded-xl p-3 w-full">
                          <p className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">{msg.data.title}</p>
                          {msg.data.type === "table" && (
                            <div className="overflow-x-auto">
                              <table className="w-full text-[10px] text-slate-300">
                                <thead><tr className="border-b border-white/10">{msg.data.headers?.map((h: string) => <th key={h} className="text-left py-1.5 pr-3 text-slate-500 font-semibold uppercase">{h}</th>)}</tr></thead>
                                <tbody>{msg.data.items?.map((item: any, ii: number) => <tr key={ii} className="border-b border-white/5 hover:bg-white/[0.02]">{msg.data.keys.map((k: string) => <td key={k} className="py-1.5 pr-3 font-mono">{item[k]}</td>)}</tr>)}</tbody>
                              </table>
                            </div>
                          )}
                          {msg.data.type === "chart" && (
                            <ResponsiveContainer width="100%" height={180}>
                              {msg.data.chartType === "bar" ? (
                                <BarChart data={msg.data.items}><CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" /><XAxis dataKey={msg.data.xAxisKey} tick={{ fill: "#94a3b8", fontSize: 9 }} /><YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} /><ReTooltip contentStyle={{ background: "#0f172a", border: "1px solid #ffffff20", borderRadius: 8, fontSize: 10 }} /><Bar dataKey={msg.data.yAxisKey} fill="#06b6d4" radius={[4,4,0,0]} /></BarChart>
                              ) : (
                                <PieChart><Pie data={msg.data.items} dataKey={msg.data.yAxisKey} nameKey={msg.data.xAxisKey} cx="50%" cy="50%" outerRadius={70} label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>{msg.data.items?.map((_: any, ii: number) => <Cell key={ii} fill={CHART_COLORS[ii % CHART_COLORS.length]} />)}</Pie><ReTooltip contentStyle={{ background: "#0f172a", border: "1px solid #ffffff20", fontSize: 10 }} /></PieChart>
                              )}
                            </ResponsiveContainer>
                          )}
                        </div>
                      )}
                      <p className="text-[9px] text-slate-600 font-mono">{msg.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30"><Brain className="h-3.5 w-3.5" /></div>
                    <div className="bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <div className="flex gap-1">{[0,1,2].map(i => <div key={i} className="h-1.5 w-1.5 bg-fuchsia-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}</div>
                      <span className="text-[10px] text-slate-400">Analyzing...</span>
                    </div>
                  </div>
                )}
                {chatMessages.length === 1 && !chatLoading && (
                  <div className="p-4 mx-auto w-full max-w-2xl space-y-3 font-mono">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Suggested queries</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { label: "Analyze vehicle theft patterns in East Division", query: "Analyze vehicle theft patterns in East Division" },
                        { label: "Show dossier on suspect Ravi 'Bouncer' Kumar", query: "Show intelligence dossier on suspect Ravi 'Bouncer' Kumar" },
                        { label: "Verify bank anomalies in Bidar case", query: "Verify bank transaction anomalies in Bidar case" }
                      ].map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => { setChatInput(sug.query); }}
                          className="p-3 bg-white/[0.02] border border-white/10 hover:border-fuchsia-500/30 rounded-2xl text-left text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.04] transition-all flex items-center justify-between group shadow-sm cursor-pointer"
                        >
                          <span>{sug.label}</span>
                          <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-fuchsia-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2 bg-white/[0.03] border border-white/10 rounded-2xl p-2">
                <input
                  value={chatInput} onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
                  placeholder="Ask about crime patterns, hotspots, officers, patrol routes..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none px-2"
                />
                <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/30 transition-colors disabled:opacity-40">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════ TAB: ANALYTICS ════════════════════════════════════ */}
          {activeTab === "analytics" && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              {!analyticsData ? (
                <div className="flex items-center justify-center h-40"><div className="h-8 w-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <>
                  {/* KPI Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {[
                      { label: "Total FIRs", value: analyticsData.kpis?.totalFIRs, color: "text-cyan-400", icon: FileText },
                      { label: "Active Cases", value: analyticsData.kpis?.activeCases, color: "text-amber-400", icon: Activity },
                      { label: "Solved Cases", value: analyticsData.kpis?.solvedCases, color: "text-emerald-400", icon: CheckCircle },
                      { label: "High Risk", value: analyticsData.kpis?.highRiskCases, color: "text-rose-400", icon: AlertTriangle },
                      { label: "Hotspots", value: analyticsData.kpis?.crimeHotspots, color: "text-fuchsia-400", icon: Target },
                    ].map(kpi => (
                      <GlassCard key={kpi.label} className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-500 uppercase font-semibold">{kpi.label}</span>
                          <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                        </div>
                        <p className={`text-2xl font-black font-mono ${kpi.color}`}>{kpi.value ?? "—"}</p>
                      </GlassCard>
                    ))}
                  </div>

                  {/* Charts Row 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <GlassCard className="p-4">
                      <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Crime Trends Over Time</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={analyticsData.trendOverTime}>
                          <defs>{["Theft","Cyber Crime","Assault","Fraud"].map((k,i) => <linearGradient key={k} id={`g${i}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={CHART_COLORS[i]} stopOpacity={0.3}/><stop offset="95%" stopColor={CHART_COLORS[i]} stopOpacity={0}/></linearGradient>)}</defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis dataKey="period" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                          <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                          <ReTooltip contentStyle={{ background: "#0f172a", border: "1px solid #ffffff20", borderRadius: 8, fontSize: 10 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          {["Theft","Cyber Crime","Assault","Fraud"].map((k,i) => <Area key={k} type="monotone" dataKey={k} stroke={CHART_COLORS[i]} fill={`url(#g${i})`} strokeWidth={2} />)}
                        </AreaChart>
                      </ResponsiveContainer>
                    </GlassCard>

                    <GlassCard className="p-4">
                      <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Categories by District</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={analyticsData.categoriesByDistrict}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis dataKey="district" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                          <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                          <ReTooltip contentStyle={{ background: "#0f172a", border: "1px solid #ffffff20", borderRadius: 8, fontSize: 10 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          {["Theft","Cyber Crime","Assault","Fraud"].map((k,i) => <Bar key={k} dataKey={k} stackId="a" fill={CHART_COLORS[i]} />)}
                        </BarChart>
                      </ResponsiveContainer>
                    </GlassCard>
                  </div>

                  {/* Charts Row 2 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <GlassCard className="p-4">
                      <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Hourly Distribution</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie data={analyticsData.hourlyDistribution} dataKey="cases" nameKey="period" cx="50%" cy="50%" outerRadius={70} label={({ percent }: any) => `${(percent * 100).toFixed(0)}%`}>
                            {analyticsData.hourlyDistribution?.map((_: any, idx: number) => <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                          </Pie>
                          <ReTooltip contentStyle={{ background: "#0f172a", border: "1px solid #ffffff20", fontSize: 10 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </GlassCard>

                    <GlassCard className="p-4">
                      <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Investigation Funnel</p>
                      <div className="space-y-2">
                        {analyticsData.funnelData?.map((f: any, i: number) => (
                          <div key={i} className="space-y-0.5">
                            <div className="flex justify-between text-[10px]"><span className="text-slate-400">{f.stage}</span><span className="text-white font-bold">{f.count}</span></div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(f.count / 100) * 100}%`, background: CHART_COLORS[i % CHART_COLORS.length] }} /></div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    <GlassCard className="p-4">
                      <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">Department Radar</p>
                      <ResponsiveContainer width="100%" height={180}>
                        <RadarChart data={analyticsData.radarMetrics}>
                          <PolarGrid stroke="#ffffff15" />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 8 }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 8 }} />
                          <Radar name="Score" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} strokeWidth={2} />
                          <ReTooltip contentStyle={{ background: "#0f172a", border: "1px solid #ffffff20", fontSize: 10 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </GlassCard>
                  </div>

                  {/* Officer Performance Table */}
                  <GlassCard className="p-4">
                    <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2"><Users className="h-4 w-4 text-amber-400" /> Officer Performance Metrics</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-white/10">{["Officer","Assigned","Solved","Pending","Avg Days","AI Score"].map(h => <th key={h} className="text-left py-2 pr-4 text-slate-500 font-semibold uppercase text-[10px]">{h}</th>)}</tr></thead>
                        <tbody>{analyticsData.officerPerformance?.map((o: any, i: number) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="py-2.5 pr-4 font-semibold text-white">{o.officer}</td>
                            <td className="py-2.5 pr-4 text-slate-300">{o.assigned}</td>
                            <td className="py-2.5 pr-4 text-emerald-400 font-bold">{o.solved}</td>
                            <td className="py-2.5 pr-4 text-amber-400 font-bold">{o.pending}</td>
                            <td className="py-2.5 pr-4 text-slate-300">{o.resolutionTime}d</td>
                            <td className="py-2.5 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-white/10 h-1.5 rounded-full overflow-hidden"><div className="h-full bg-cyan-400 rounded-full" style={{ width: `${o.aiScore}%` }} /></div>
                                <span className="text-cyan-400 font-bold">{o.aiScore}</span>
                              </div>
                            </td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  </GlassCard>

                  {/* AI Insights */}
                  <GlassCard className="p-4">
                    <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-400" /> AI Analytical Insights</p>
                    <div className="space-y-2">
                      {analyticsData.aiInsights?.map((insight: string, i: number) => (
                        <div key={i} className="flex gap-2.5 p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                          <Zap className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-slate-300 leading-relaxed">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </>
              )}
            </div>
          )}

          {/* ════════════════════════════════════ TAB: MO SIGNATURES ════════════════════════════════════ */}
          {activeTab === "signatures" && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <div className="flex items-center gap-3 bg-rose-500/5 border border-rose-500/20 rounded-2xl p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400"><Target className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-bold text-white">AI Modus Operandi Signatures</p>
                  <p className="text-[10px] text-slate-400">Pattern recognition identifies recurring criminal behavior clusters across cases using machine learning.</p>
                </div>
              </div>

              {signatures.length === 0 ? (
                <div className="flex items-center justify-center h-40"><div className="h-8 w-8 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  {signatures.map((sig) => (
                    <GlassCard key={sig.id} className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-mono text-slate-500 border border-white/10 px-2 py-0.5 rounded">{sig.id}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded border uppercase font-bold bg-rose-500/10 text-rose-400 border-rose-500/20">{sig.category}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white">{sig.name}</h3>
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{sig.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[9px] text-slate-500 uppercase font-bold">Confidence</p>
                          <p className="text-2xl font-black text-rose-400">{sig.confidenceScore}%</p>
                          <p className="text-[9px] text-slate-500">Similarity: {sig.similarityPercentage}%</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/5 pt-4">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">MO Details</p>
                          <div className="space-y-1.5 text-[11px]">
                            {Object.entries(sig.moDetails).map(([k, v]) => (
                              <div key={k} className="flex justify-between gap-2">
                                <span className="text-slate-500 capitalize">{k}:</span>
                                <span className="text-slate-200 font-semibold text-right">{String(v)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Matching Cases</p>
                          <div className="flex flex-wrap gap-1.5">
                            {sig.matchingCases.map(c => (
                              <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-accent/20 bg-cyan-accent/5 text-cyan-accent">{c}</span>
                            ))}
                          </div>
                          <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 mt-3 tracking-wider">AI Explanation</p>
                          <p className="text-[11px] text-slate-300 leading-relaxed bg-white/[0.02] border border-white/5 rounded-lg p-2.5">{sig.aiExplanation}</p>
                        </div>
                      </div>

                      {/* Confidence Bar */}
                      <div className="border-t border-white/5 pt-3">
                        <div className="flex justify-between text-[9px] mb-1"><span className="text-slate-500 uppercase">Pattern Match Confidence</span><span className="text-rose-400 font-bold">{sig.confidenceScore}%</span></div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-700" style={{ width: `${sig.confidenceScore}%` }} />
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════ TAB: CRIMINAL NETWORK ════════════════════════════════════ */}
          {activeTab === "network" && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400"><Network className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-bold text-white">Criminal Network Intelligence Graph</p>
                  <p className="text-[10px] text-slate-400">AI-detected relationships between suspects, victims, vehicles, phones, locations and cases.</p>
                </div>
              </div>

              {!networkData ? (
                <div className="flex items-center justify-center h-40"><div className="h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Node List */}
                  <div className="lg:col-span-1 space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Network Nodes ({networkData.nodes.length})</p>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                      {networkData.nodes.map(node => {
                        const typeConfig: Record<string, { color: string; icon: any; bg: string }> = {
                          suspect: { color: "text-rose-400", bg: "bg-rose-950/40 border-rose-500/30", icon: User },
                          victim: { color: "text-amber-400", bg: "bg-amber-950/40 border-amber-500/30", icon: User },
                          officer: { color: "text-blue-400", bg: "bg-blue-950/40 border-blue-500/30", icon: Shield },
                          phone: { color: "text-fuchsia-400", bg: "bg-fuchsia-950/40 border-fuchsia-500/30", icon: Phone },
                          vehicle: { color: "text-cyan-400", bg: "bg-cyan-950/40 border-cyan-500/30", icon: Car },
                          location: { color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-500/30", icon: MapPin },
                          case: { color: "text-violet-400", bg: "bg-violet-950/40 border-violet-500/30", icon: FileText },
                          evidence: { color: "text-orange-400", bg: "bg-orange-950/40 border-orange-500/30", icon: BookOpen },
                        };
                        const tc = typeConfig[node.type] || typeConfig.case;
                        return (
                          <div key={node.id} className={`rounded-xl border p-3 cursor-pointer transition-all ${tc.bg} ${selectedNetworkNode?.id === node.id ? "ring-1 ring-white/30" : "hover:bg-white/[0.02]"}`} onClick={() => setSelectedNetworkNode(selectedNetworkNode?.id === node.id ? null : node)}>
                            <div className="flex items-start gap-2">
                              <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-white/10 ${tc.color} shrink-0`}><tc.icon className="h-3 w-3" /></div>
                              <div className="min-w-0">
                                <p className={`text-xs font-bold ${tc.color} truncate`}>{node.label}</p>
                                <p className="text-[9px] text-slate-500 capitalize">{node.type}</p>
                                {selectedNetworkNode?.id === node.id && (
                                  <p className="text-[10px] text-slate-300 mt-1.5 leading-relaxed">{node.details}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Links + Insights */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* AI Insights */}
                    <GlassCard className="p-4">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3 flex items-center gap-1.5"><Brain className="h-3.5 w-3.5 text-emerald-400" /> AI Network Intelligence Summary</p>
                      <p className="text-xs text-slate-300 leading-relaxed bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-3 whitespace-pre-line">{networkData.insights}</p>
                    </GlassCard>

                    {/* Relationship Links */}
                    <GlassCard className="p-4">
                      <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-3">Relationship Links ({networkData.links.length})</p>
                      <div className="space-y-2">
                        {networkData.links.map((link, i) => {
                          const srcNode = networkData.nodes.find(n => n.id === link.source);
                          const tgtNode = networkData.nodes.find(n => n.id === link.target);
                          return (
                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors text-xs">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-cyan-400 font-semibold truncate max-w-[100px]">{srcNode?.label || link.source}</span>
                                  <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-slate-400 font-mono">{link.type.replace(/_/g, " ")}</span>
                                  <ChevronRight className="h-3 w-3 text-slate-500 shrink-0" />
                                  <span className="text-emerald-400 font-semibold truncate max-w-[100px]">{tgtNode?.label || link.target}</span>
                                </div>
                                {(link as any).aiExplanation && <p className="text-[10px] text-slate-500 mt-1 truncate">{(link as any).aiExplanation}</p>}
                              </div>
                              {(link as any).strength && (
                                <div className="shrink-0 text-right">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${(link as any).strength >= 90 ? "bg-rose-500/20 text-rose-400" : (link as any).strength >= 75 ? "bg-amber-500/20 text-amber-400" : "bg-cyan-500/20 text-cyan-400"}`}>{(link as any).strength}%</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </GlassCard>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════ TAB: CASE COPILOT ════════════════════════════════════ */}
          {activeTab === "copilot" && (
            <div className="h-full overflow-y-auto p-4 space-y-4">
              <div className="flex items-center gap-3 bg-violet-500/5 border border-violet-500/20 rounded-2xl p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400"><Brain className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-bold text-white">AI Case Copilot</p>
                  <p className="text-[10px] text-slate-400">Enter any FIR number or Case ID to get an AI-powered full case analysis, timeline, evidence checklist, and risk assessment.</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2.5 focus-within:border-violet-500/40 transition-colors">
                  <Search className="h-4 w-4 text-slate-500 shrink-0" />
                  <input
                    value={copilotCaseId} onChange={e => setCopilotCaseId(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") fetchCopilot(copilotCaseId); }}
                    placeholder="Enter FIR number (e.g. FIR/2026/A1004) or Case ID..."
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                  />
                </div>
                <button onClick={() => fetchCopilot(copilotCaseId)} disabled={copilotLoading || !copilotCaseId.trim()} className="px-4 py-2.5 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 font-bold uppercase tracking-wider text-xs hover:bg-violet-500/30 transition-colors disabled:opacity-40 flex items-center gap-2">
                  {copilotLoading ? <div className="h-4 w-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /> : <Brain className="h-4 w-4" />}
                  Analyze
                </button>
              </div>

              {/* Quick case IDs */}
              <div className="flex flex-wrap gap-2">
                <p className="text-[10px] text-slate-500">Quick load:</p>
                {["FIR/2026/A1004", "FIR/2026/C1001", "FIR/2026/D1001"].map(id => (
                  <button key={id} onClick={() => { setCopilotCaseId(id); fetchCopilot(id); }} className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 bg-white/[0.03] text-slate-400 hover:text-violet-400 hover:border-violet-500/30 transition-colors">{id}</button>
                ))}
              </div>

              {copilotLoading && (
                <div className="flex items-center justify-center h-40"><div className="h-8 w-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /></div>
              )}

              {copilotData && !copilotLoading && (
                <div className="space-y-4 animate-fade-in">
                  {/* Case Overview */}
                  <GlassCard className="p-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-[10px] text-slate-500 font-mono mb-1">{copilotData.firNumber}</p>
                        <p className="text-base font-bold text-white leading-snug">{copilotData.summary}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-sm font-black px-3 py-1 rounded-full border ${riskColor(copilotData.riskLevel)}`}>{copilotData.riskLevel} RISK</span>
                        <span className="text-2xl font-black text-rose-400">{copilotData.riskScore}%</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-[10px]"><span className="text-slate-500 uppercase">Investigation Progress</span><span className="text-violet-400 font-bold">{copilotData.progress}%</span></div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full transition-all" style={{ width: `${copilotData.progress}%` }} /></div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-white/5 pt-4">
                      {[{ label: "Priority", value: copilotData.priority?.toUpperCase(), color: copilotData.priority === "critical" ? "text-rose-400" : "text-amber-400" }, { label: "Status", value: copilotData.riskLevel }, { label: "Officer", value: copilotData.recommendedOfficer }, { label: "Patrol Area", value: copilotData.recommendedPatrolArea }].map(f => (
                        <div key={f.label}>
                          <p className="text-[9px] text-slate-500 uppercase font-semibold">{f.label}</p>
                          <p className={`text-xs font-bold truncate ${f.color || "text-slate-200"}`}>{f.value || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Timeline */}
                    <GlassCard className="p-4">
                      <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2"><Clock className="h-4 w-4 text-violet-400" /> Case Timeline</p>
                      <div className="space-y-3">
                        {copilotData.timeline?.map((event: any, i: number) => (
                          <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center"><div className="h-6 w-6 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0"><CheckCircle className="h-3 w-3 text-violet-400" /></div>{i < copilotData.timeline.length - 1 && <div className="w-px flex-1 bg-white/10 my-1" />}</div>
                            <div className="pb-2">
                              <p className="text-xs font-bold text-white">{event.title}</p>
                              <p className="text-[10px] text-slate-400">{event.date}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{event.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Steps & Evidence */}
                    <div className="space-y-4">
                      <GlassCard className="p-4">
                        <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-400" /> Suggested Steps</p>
                        <div className="space-y-2">
                          {copilotData.suggestedSteps?.map((step: string, i: number) => (
                            <div key={i} className="flex gap-2 p-2 bg-white/[0.02] rounded-lg border border-white/5">
                              <span className="text-emerald-400 font-bold text-[10px] shrink-0">{i + 1}.</span>
                              <p className="text-[11px] text-slate-300">{step}</p>
                            </div>
                          ))}
                        </div>
                      </GlassCard>

                      <GlassCard className="p-4">
                        <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2"><BookOpen className="h-4 w-4 text-cyan-400" /> Evidence Checklist</p>
                        <div className="space-y-1.5">
                          {copilotData.evidenceChecklist?.map((item: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300">
                              <div className="h-3.5 w-3.5 rounded border border-white/20 bg-white/5 shrink-0" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </GlassCard>
                    </div>
                  </div>

                  {/* Legal Sections & Next Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <GlassCard className="p-4">
                      <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2"><Lock className="h-4 w-4 text-amber-400" /> Applicable Legal Sections</p>
                      <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl">
                        <p className="text-xs text-slate-200 font-mono leading-relaxed">{copilotData.legalSections}</p>
                      </div>
                      <p className="text-xs font-bold text-slate-300 mt-3 mb-2 uppercase tracking-wider flex items-center gap-2"><AlertCircle className="h-4 w-4 text-rose-400" /> Missing Info</p>
                      {copilotData.missingInformation?.map((m: string, i: number) => (
                        <div key={i} className="flex gap-2 text-[11px] text-slate-400 py-1"><XCircle className="h-3 w-3 text-rose-400 shrink-0 mt-0.5" />{m}</div>
                      ))}
                    </GlassCard>

                    <GlassCard className="p-4">
                      <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider flex items-center gap-2"><Zap className="h-4 w-4 text-fuchsia-400" /> Next Actions</p>
                      <div className="space-y-2">
                        {copilotData.nextActions?.map((action: string, i: number) => (
                          <div key={i} className="flex gap-2 p-2.5 bg-fuchsia-500/5 border border-fuchsia-500/15 rounded-xl">
                            <ChevronRight className="h-3.5 w-3.5 text-fuchsia-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-slate-300">{action}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-rose-500/5 border border-rose-500/15 rounded-xl">
                        <p className="text-[9px] text-slate-500 uppercase font-bold mb-1">Risk Explanation</p>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{copilotData.riskExplanation?.actions}</p>
                      </div>
                    </GlassCard>
                  </div>
                </div>
              )}

              {!copilotData && !copilotLoading && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Brain className="h-12 w-12 text-slate-700 mb-4" />
                  <p className="text-slate-500 text-sm">Enter a FIR number above to load the AI case analysis.</p>
                  <p className="text-slate-600 text-[11px] mt-1">The copilot will provide timelines, legal sections, evidence checklists, and next actions.</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>
  );
}

export default CrimeIntelligence;
