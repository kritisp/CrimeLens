import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, BarChart, Bar, AreaChart, Area, PieChart, Pie, 
  Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, 
  ScatterChart, Scatter, ZAxis, Treemap
} from "recharts";
import { 
  TrendingUp, AlertTriangle, CheckCircle, Clock, MapPin, 
  Bot, FileText, Download, Filter, RotateCcw, Maximize
} from "lucide-react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { GlassCard } from "../components/ui/GlassCard";
import { recentFIRs } from "../data/mockData";


const COLORS = ["#22d3ee", "#ef4444", "#a855f7", "#eab308", "#10b981", "#3b82f6", "#f97316"];

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  
  // Cross-Filter States
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedStation, setSelectedStation] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedRisk, setSelectedRisk] = useState("all");
  
  // Custom Interaction States
  const [timeToggle, setTimeToggle] = useState<"daily" | "weekly" | "monthly">("monthly");
  const [sortStations, setSortStations] = useState<"highest" | "lowest">("highest");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeKPIFilter, setActiveKPIFilter] = useState<string | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<string>("trends");

  // Fetch API analytics datasets
  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/intelligence/analytics");
      if (res.ok) {
        setData(await res.json());
      } else {
        setData(fallbackMockData());
      }
    } catch (err) {
      console.error(err);
      setData(fallbackMockData());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Filter local case list records dynamically
  const filteredCases = useMemo(() => {
    return recentFIRs.filter(r => {
      const matchDistrict = selectedDistrict === "all" || r.station.includes(selectedDistrict);
      const matchStation = selectedStation === "all" || r.station === selectedStation;
      const matchCategory = selectedCategory === "all" || r.offense.toLowerCase().includes(selectedCategory.toLowerCase());
      const matchStatus = selectedStatus === "all" || r.status === selectedStatus;
      const matchPriority = selectedPriority === "all" || r.priority === selectedPriority;
      const matchRisk = selectedRisk === "all" || 
                        (selectedRisk === "high" && r.priority === "critical") ||
                        (selectedRisk === "medium" && r.priority === "high");
                        
      const matchKPI = !activeKPIFilter || 
                       (activeKPIFilter === "active" && (r.status === "pending" || r.status === "investigating")) ||
                       (activeKPIFilter === "solved" && r.status === "solved") ||
                       (activeKPIFilter === "critical" && r.priority === "critical");

      return matchDistrict && matchStation && matchCategory && matchStatus && matchPriority && matchRisk && matchKPI;
    });
  }, [selectedDistrict, selectedStation, selectedCategory, selectedStatus, selectedPriority, selectedRisk, activeKPIFilter]);

  // Handler to export chart data as CSV
  const handleCSVExport = () => {
    const csvRows = [
      ["FIR Number", "Complainant", "Offense", "Station", "Officer", "Date", "Status", "Priority"],
      ...filteredCases.map(c => [c.firNumber, c.complainant, c.offense, c.station, c.officer, c.date, c.status, c.priority])
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Crime_Intelligence_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center p-12 text-slate-500 animate-pulse">
          <Bot className="h-10 w-10 text-cyan-accent animate-spin mb-4" />
          <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-widest">Generating Predictive Crime Analytics & Spatial Overlays...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Sorting for top stations
  const sortedStations = [...data.topStations].sort((a, b) => {
    return sortStations === "highest" ? b.firs - a.firs : a.firs - b.firs;
  });

  return (
    <DashboardLayout>
      <div className={`grid-bg space-y-6 pb-12 ${isFullscreen ? "fixed inset-0 z-50 bg-navy-950 p-6 overflow-y-auto" : ""}`}>
        
        {/* Sticky Filter Bar (Top) */}
        <div className="glass border border-white/10 p-4 rounded-2xl sticky top-0 z-30 bg-navy-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shadow-glow">
          <div className="flex items-center gap-2">
            <Filter className="h-4.5 w-4.5 text-cyan-accent" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Tactical Analytics Filters</span>
          </div>

          <div className="flex flex-wrap gap-2.5 font-mono text-[10px]">
            {/* District */}
            <select 
              value={selectedDistrict} 
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-navy-900 border border-white/10 text-slate-200 rounded-lg p-1.5 outline-none hover:border-cyan-accent/35"
            >
              <option value="all">All Districts</option>
              <option value="Bidhannagar">Bidhannagar</option>
              <option value="Salt Lake">Salt Lake</option>
              <option value="New Town">New Town</option>
            </select>

            {/* Crime Category */}
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-navy-900 border border-white/10 text-slate-200 rounded-lg p-1.5 outline-none hover:border-cyan-accent/35"
            >
              <option value="all">All Categories</option>
              <option value="theft">Theft</option>
              <option value="cyber">Cyber Crime</option>
              <option value="assault">Assault</option>
              <option value="fraud">Fraud</option>
            </select>

            {/* Status */}
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-navy-900 border border-white/10 text-slate-200 rounded-lg p-1.5 outline-none hover:border-cyan-accent/35"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="solved">Solved</option>
              <option value="closed">Closed</option>
            </select>

            {/* Priority */}
            <select 
              value={selectedPriority} 
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-navy-900 border border-white/10 text-slate-200 rounded-lg p-1.5 outline-none hover:border-cyan-accent/35"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <button 
              onClick={() => setIsFullscreen(p => !p)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 font-bold hover:bg-white/10"
            >
              <Maximize className="h-3 w-3" /> Fullscreen
            </button>

            <button 
              onClick={() => {
                setSelectedDistrict("all");
                setSelectedStation("all");
                setSelectedCategory("all");
                setSelectedStatus("all");
                setSelectedPriority("all");
                setSelectedRisk("all");
                setActiveKPIFilter(null);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 font-bold hover:bg-rose-500/20"
            >
              <RotateCcw className="h-3 w-3" /> Reset Filters
            </button>
          </div>
        </div>

        {/* KPI Panel Grid Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {[
            { id: "total", label: "Total FIRs", val: data.kpis.totalFIRs, icon: FileText, color: "hover:border-cyan-accent/30" },
            { id: "active", label: "Active Cases", val: data.kpis.activeCases, icon: Clock, color: "hover:border-amber-500/30" },
            { id: "solved", label: "Solved Cases", val: data.kpis.solvedCases, icon: CheckCircle, color: "hover:border-emerald-500/30" },
            { id: "critical", label: "High Risk Cases", val: data.kpis.highRiskCases, icon: AlertTriangle, color: "hover:border-rose-500/30" },
            { id: "hotspots", label: "Active Hotspots", val: data.kpis.crimeHotspots, icon: MapPin, color: "hover:border-purple-500/30" }
          ].map(kpi => {
            const Icon = kpi.icon;
            const active = activeKPIFilter === kpi.id;
            return (
              <button
                key={kpi.id}
                type="button"
                onClick={() => setActiveKPIFilter(active ? null : kpi.id)}
                className="w-full text-left outline-none block"
              >
                <GlassCard 
                  className={`p-4 flex items-center justify-between transition-all duration-300 border-white/10 ${kpi.color} ${
                    active ? "border-cyan-accent/40 bg-cyan-accent/5 shadow-glow" : ""
                  }`}
                >
                  <div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                    <h3 className="mt-1 text-2xl font-black text-white font-mono">{kpi.val}</h3>
                  </div>
                  <div className="h-10 w-10 bg-white/5 border border-white/10 flex items-center justify-center rounded-xl text-slate-400">
                    <Icon className="h-5 w-5" />
                  </div>
                </GlassCard>
              </button>
            );
          })}
        </div>

        {/* Section: AI Insights Cards Panel */}
        <GlassCard className="p-5 border-cyan-accent/25 bg-cyan-accent/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-accent/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-4.5 w-4.5 text-cyan-accent animate-pulse" />
            <h4 className="text-xs font-bold text-cyan-accent uppercase tracking-wider">AI Predictive Insight Summaries</h4>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-[10px] font-mono text-slate-300 leading-normal">
            {data.aiInsights.map((insight: string, idx: number) => (
              <div key={idx} className="p-3 rounded-xl border border-cyan-accent/15 bg-navy-950/70 flex items-start gap-2">
                <TrendingUp className="h-4 w-4 shrink-0 text-cyan-accent mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Section: Calendar Heatmap Grid */}
        <GlassCard className="p-5 border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Control Room Calendar Heatmap</span>
            <span className="text-[9px] text-slate-500 font-mono">Hover squares to inspect registration volume</span>
          </div>
          
          <div className="grid grid-cols-7 sm:grid-cols-15 md:grid-cols-31 gap-2 font-mono text-center text-[8.5px] text-slate-400">
            {Array.from({ length: 31 }).map((_, dayIdx) => {
              const weightVal = (dayIdx % 5) + 1;
              const bgClass = weightVal === 1 ? "bg-cyan-950/20 border-cyan-500/10 text-slate-600" :
                              weightVal === 2 ? "bg-cyan-950/50 border-cyan-500/20 text-slate-400" :
                              weightVal === 3 ? "bg-cyan-900/60 border-cyan-500/30 text-slate-300" :
                              weightVal === 4 ? "bg-cyan-700/60 border-cyan-400/40 text-white font-bold" :
                              "bg-cyan-400 text-navy-950 font-black shadow-glow";

              return (
                <div 
                  key={dayIdx} 
                  className={`h-8 w-8 rounded-lg flex items-center justify-center border transition-all hover:scale-110 cursor-pointer ${bgClass}`}
                  title={`Day ${dayIdx + 1}: ${weightVal} FIR registrations`}
                >
                  {dayIdx + 1}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Section 15: Sankey Crime Flow Diagram representation */}
        <GlassCard className="p-5 border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Tactical Crime Flow Matrix</span>
            <span className="text-[9px] text-slate-500 font-mono">Movement pipeline</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-4 font-mono text-[10px] text-slate-300">
            {[
              { title: "Crime Category", list: ["Theft (57)", "Cyber (70)", "Assault (17)"], color: "text-cyan-accent" },
              { title: "District Hub", list: ["Bidhannagar (65)", "Salt Lake (55)", "New Town (68)"], color: "text-orange-400" },
              { title: "Police Unit", list: ["Sector V PS", "Salt Lake PS", "Connaught Place PS"], color: "text-purple-400" },
              { title: "Lead Officer", list: ["SI Ananya Reddy", "Insp. Vikram Singh", "SI Amit Kumar"], color: "text-blue-400" },
              { title: "Case Status", list: ["Pending", "Investigating", "Solved", "Closed"], color: "text-emerald-400" }
            ].map((col) => (
              <div key={col.title} className="flex-1 w-full max-w-[160px] bg-navy-900/60 border border-white/5 rounded-xl p-3.5 space-y-3 shadow-glass flex flex-col items-center">
                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block text-center border-b border-white/5 pb-1 w-full">{col.title}</span>
                <div className="space-y-1.5 w-full text-center">
                  {col.list.map(item => (
                    <div key={item} className={`p-1.5 bg-black/20 rounded border border-white/5 ${col.color} truncate font-bold`}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Section: Additional Analysis Model Selector */}
        <GlassCard className="p-4 border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-950/40">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Interactive Model Selector</h3>
            <p className="text-[10px] text-slate-500 font-mono">Select an additional intelligence analysis chart to display</p>
          </div>
          <select 
            value={selectedChartType} 
            onChange={(e) => setSelectedChartType(e.target.value)}
            className="bg-navy-900 border border-white/10 text-xs text-slate-200 rounded-lg p-2.5 outline-none hover:border-cyan-accent/35 font-mono max-w-xs cursor-pointer"
          >
            <option value="trends">Crime Trend Over Time</option>
            <option value="categories">Categories by District</option>
            <option value="stations">Top Crime-Prone Stations</option>
            <option value="officer">Officer Case Workload</option>
            <option value="peak">Time of Day Peak Periods</option>
            <option value="growth">Crime Growth Trajectories</option>
            <option value="share">Crime Category Share (Donut)</option>
            <option value="capability">Officer Capability Index</option>
            <option value="progress">Investigation Progress vs Risk</option>
            <option value="district">District Intelligence Matrix (Bubble Map)</option>
            <option value="treemap">Volume Breakdown Treemap</option>
            <option value="funnel">Case Investigation Funnel</option>
          </select>
        </GlassCard>

        {/* Selected Chart Rendering Container */}
        <div className="mt-4">
          {selectedChartType === "trends" && (
            <GlassCard className="p-5 border-white/10 flex flex-col justify-between h-[350px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Crime Trend Over Time</span>
                <div className="flex bg-navy-900 border border-white/10 rounded-lg p-0.5 font-mono text-[9px]">
                  {["daily", "weekly", "monthly"].map(t => (
                    <button 
                      key={t}
                      onClick={() => setTimeToggle(t as any)}
                      className={`px-2 py-0.5 rounded uppercase font-bold transition-all ${
                        timeToggle === t ? "bg-cyan-accent/15 text-cyan-accent" : "text-slate-500"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trendOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", fontSize: "10px", fontFamily: "monospace" }} />
                    <Legend wrapperStyle={{ fontSize: "9px", fontFamily: "monospace" }} />
                    <Line type="monotone" dataKey="Theft" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Cyber Crime" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Assault" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {selectedChartType === "categories" && (
            <GlassCard className="p-5 border-white/10 flex flex-col justify-between h-[350px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Categories by District</span>
                <span className="text-[9px] text-slate-500 font-mono">Normalized counts</span>
              </div>
              
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categoriesByDistrict}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="district" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", fontSize: "10px", fontFamily: "monospace" }} />
                    <Legend wrapperStyle={{ fontSize: "9px", fontFamily: "monospace" }} />
                    <Bar dataKey="Theft" stackId="a" fill="#22d3ee" />
                    <Bar dataKey="Cyber Crime" stackId="a" fill="#ef4444" />
                    <Bar dataKey="Fraud" stackId="a" fill="#eab308" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {selectedChartType === "stations" && (
            <GlassCard className="p-5 border-white/10 flex flex-col justify-between h-[350px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Top Crime-Prone Police Stations</span>
                <button 
                  onClick={() => setSortStations(s => s === "highest" ? "lowest" : "highest")}
                  className="text-[9px] uppercase font-bold text-cyan-accent font-mono border border-cyan-accent/25 rounded px-2 py-0.5 hover:bg-cyan-accent/10"
                >
                  Sort: {sortStations}
                </button>
              </div>
              
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedStations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                    <YAxis dataKey="station" type="category" stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", fontSize: "10px", fontFamily: "monospace" }} />
                    <Bar dataKey="firs" fill="#eab308" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {selectedChartType === "officer" && (
            <GlassCard className="p-5 border-white/10 flex flex-col justify-between h-[350px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Officer Case Workload Comparison</span>
                <span className="text-[9px] text-slate-500 font-mono">Resolution counts</span>
              </div>
              
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.officerPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="officer" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", fontSize: "10px", fontFamily: "monospace" }} />
                    <Legend wrapperStyle={{ fontSize: "9px", fontFamily: "monospace" }} />
                    <Bar dataKey="assigned" fill="#3b82f6" />
                    <Bar dataKey="solved" fill="#10b981" />
                    <Bar dataKey="pending" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {selectedChartType === "peak" && (
            <GlassCard className="p-5 border-white/10 flex flex-col justify-between h-[350px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Time of Day Reporting Peak Periods</span>
                <span className="text-[9px] text-rose-400 font-mono font-bold animate-pulse">Night Peak Spike</span>
              </div>
              
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={8} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", fontSize: "10px", fontFamily: "monospace" }} />
                    <Bar dataKey="cases" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {selectedChartType === "growth" && (
            <GlassCard className="p-5 border-white/10 flex flex-col justify-between h-[350px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Crime Growth Trajectories</span>
                <span className="text-[9px] text-slate-500 font-mono">Area index</span>
              </div>
              
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trendOverTime}>
                    <defs>
                      <linearGradient id="colorTheft" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="period" stroke="#94a3b8" fontSize={9} />
                    <YAxis stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", fontSize: "10px", fontFamily: "monospace" }} />
                    <Area type="monotone" dataKey="Theft" stroke="#22d3ee" fillOpacity={1} fill="url(#colorTheft)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {selectedChartType === "share" && (
            <GlassCard className="p-5 border-white/10 flex flex-col justify-between h-[350px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Crime Category Share</span>
                <span className="text-[9px] text-slate-500 font-mono">Donut mapping</span>
              </div>
              
              <div className="flex-1 w-full min-h-[220px] flex items-center justify-around">
                <ResponsiveContainer width="50%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.treemapData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="size"
                      onClick={(entry: any) => { if (entry && entry.name) setSelectedCategory(entry.name.toLowerCase()); }}
                    >
                      {data.treemapData.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 font-mono text-[9px] text-slate-300">
                  {data.treemapData.map((entry: any, index: number) => (
                    <div key={entry.name} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name}: {entry.size} cases</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}

          {selectedChartType === "capability" && (
            <GlassCard className="p-5 border-white/10 flex flex-col justify-between h-[350px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Officer Capability Index Profile</span>
                <span className="text-[9px] text-slate-500 font-mono">Joint tactical capabilities</span>
              </div>
              
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data.radarMetrics}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="metric" stroke="#94a3b8" fontSize={7.5} />
                    <PolarRadiusAxis stroke="#94a3b8" fontSize={8} />
                    <Radar name="SI Reddy" dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {selectedChartType === "progress" && (
            <GlassCard className="p-5 border-white/10 flex flex-col justify-between h-[350px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Investigation Progress vs Risk</span>
                <span className="text-[8px] font-bold text-rose-400 font-mono">Bottom-Right = Action Needed</span>
              </div>
              
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis type="number" dataKey="riskScore" name="Risk Score" stroke="#94a3b8" fontSize={9} />
                    <YAxis type="number" dataKey="progress" name="Investigation Progress" stroke="#94a3b8" fontSize={9} />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", fontSize: "10px", fontFamily: "monospace" }} />
                    <Scatter name="Cases" data={data.riskVsProgress} fill="#ef4444" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {selectedChartType === "district" && (
            <GlassCard className="p-5 border-white/10 flex flex-col justify-between h-[350px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">District Intelligence Matrix</span>
                <span className="text-[9px] text-slate-500 font-mono">Bubble map</span>
              </div>
              
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="resolutionRate" name="Resolution Rate" stroke="#94a3b8" fontSize={9} />
                    <YAxis dataKey="avgRisk" name="Average Risk" stroke="#94a3b8" fontSize={9} />
                    <ZAxis dataKey="firs" range={[50, 400]} name="Total FIRs" />
                    <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "10px", fontSize: "10px", fontFamily: "monospace" }} />
                    <Scatter name="Districts" data={data.bubbleDistrictData} fill="#22d3ee" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {selectedChartType === "treemap" && (
            <GlassCard className="p-5 border-white/10 flex flex-col justify-between h-[350px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Volume breakdown Treemap</span>
                <span className="text-[9px] text-slate-500 font-mono">Size matches volume</span>
              </div>
              
              <div className="flex-1 w-full min-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={data.treemapData}
                    dataKey="size"
                    stroke="#0f172a"
                    fill="#22d3ee"
                  />
                </ResponsiveContainer>
              </div>
            </GlassCard>
          )}

          {selectedChartType === "funnel" && (
            <GlassCard className="p-5 border-white/10 flex flex-col justify-between h-[350px]">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Case Investigation Funnel</span>
                <span className="text-[9px] text-slate-500 font-mono">Stage distribution</span>
              </div>
              
              <div className="flex-1 w-full min-h-[220px] flex flex-col justify-around py-2 font-mono text-[9.5px]">
                {data.funnelData.map((stage: any) => {
                  const maxCount = data.funnelData[0].count;
                  const widthPct = (stage.count / maxCount) * 100;
                  
                  return (
                    <div key={stage.stage} className="flex items-center gap-3">
                      <span className="w-28 text-slate-400 truncate text-right">{stage.stage}</span>
                      <div className="flex-1 h-3.5 bg-white/5 rounded-md overflow-hidden relative border border-white/5">
                        <div className="h-full bg-cyan-400/80 shadow-glow transition-all" style={{ width: `${widthPct}%` }} />
                        <span className="absolute right-2 top-0.5 text-[8px] font-bold text-white">{stage.count}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Existing Analytics List (Preserved) */}
        <GlassCard className="overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 px-5 py-4 gap-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                {selectedStatus === "all" ? "All Filtered Cases" : `${selectedStatus} Cases`}
              </h2>
              <p className="text-xs text-slate-500">{filteredCases.length} records matching search indexes</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleCSVExport}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-semibold text-slate-300 hover:border-cyan-accent/25 hover:text-white transition-all shadow-glass"
              >
                <Download className="h-3.5 w-3.5" /> Export CSV Data
              </button>
              
              <Link
                to={selectedStatus === "all" ? "/cases" : `/cases?status=${selectedStatus}`}
                className="text-xs font-medium text-cyan-accent hover:underline"
              >
                Open in All Cases
              </Link>
            </div>
          </div>
          <div className="divide-y divide-white/5 max-h-[300px] overflow-y-auto pr-1">
            {filteredCases.map((record) => (
              <Link
                key={record.id}
                to={`/cases/${record.id}`}
                className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-white/[0.03]"
              >
                <div>
                  <p className="font-mono text-sm text-cyan-accent">{record.firNumber}</p>
                  <p className="text-sm text-slate-300">{record.complainant} — <span className="text-[10px] text-slate-400 font-mono">{record.offense}</span></p>
                </div>
                <div className="text-right">
                  <span className="text-xs capitalize text-slate-500 block">{record.status}</span>
                  <span className="text-[9px] font-mono text-slate-500 block">{record.station}</span>
                </div>
              </Link>
            ))}
          </div>
        </GlassCard>

      </div>
    </DashboardLayout>
  );
}

// Analytics Mock Fallback Constructor
function fallbackMockData() {
  return {
    kpis: {
      totalFIRs: recentFIRs.length,
      activeCases: recentFIRs.filter(r => r.status === "pending" || r.status === "investigating").length,
      solvedCases: recentFIRs.filter(r => r.status === "solved").length,
      pendingInvestigations: recentFIRs.filter(r => r.status === "pending" || r.status === "investigating").length,
      avgResolutionTime: 14.2,
      highRiskCases: recentFIRs.filter(r => r.priority === "critical").length,
      repeatOffenders: 14,
      aiAlerts: 7,
      crimeHotspots: 3,
      todayFIRs: 2
    },
    trendOverTime: [
      {"period": "Jan", "Theft": 12, "Cyber Crime": 8, "Assault": 5, "Fraud": 3},
      {"period": "Feb", "Theft": 15, "Cyber Crime": 12, "Assault": 6, "Fraud": 5},
      {"period": "Mar", "Theft": 18, "Cyber Crime": 14, "Assault": 4, "Fraud": 8},
      {"period": "Apr", "Theft": 14, "Cyber Crime": 19, "Assault": 8, "Fraud": 7},
      {"period": "May", "Theft": 22, "Cyber Crime": 24, "Assault": 9, "Fraud": 12},
      {"period": "Jun", "Theft": 30, "Cyber Crime": 29, "Assault": 12, "Fraud": 15}
    ],
    categoriesByDistrict: [
      {"district": "Bidhannagar", "Theft": 18, "Cyber Crime": 22, "Assault": 5, "Fraud": 14},
      {"district": "Salt Lake", "Theft": 25, "Cyber Crime": 18, "Assault": 4, "Fraud": 10},
      {"district": "New Town", "Theft": 14, "Cyber Crime": 30, "Assault": 2, "Fraud": 22},
      {"district": "Lake Town", "Theft": 10, "Cyber Crime": 8, "Assault": 6, "Fraud": 4}
    ],
    topStations: [
      {"station": "Sector V PS", "firs": 45, "solvedPct": 80, "pendingPct": 20, "avgInvestigationTime": 11},
      {"station": "Salt Lake PS", "firs": 38, "solvedPct": 74, "pendingPct": 26, "avgInvestigationTime": 14},
      {"station": "Connaught Place PS", "firs": 28, "solvedPct": 85, "pendingPct": 15, "avgInvestigationTime": 9},
      {"station": "Adamas Outpost", "firs": 22, "solvedPct": 58, "pendingPct": 42, "avgInvestigationTime": 18}
    ],
    officerPerformance: [
      {"officer": "SI Ananya Reddy", "assigned": 18, "solved": 14, "pending": 4, "resolutionTime": 11.5, "aiScore": 94},
      {"officer": "Insp. Vikram Singh", "assigned": 22, "solved": 19, "pending": 3, "resolutionTime": 9.2, "aiScore": 96},
      {"officer": "SI Amit Kumar", "assigned": 15, "solved": 10, "pending": 5, "resolutionTime": 14.8, "aiScore": 88},
      {"officer": "SI Priya Sen", "assigned": 12, "solved": 8, "pending": 4, "resolutionTime": 12.0, "aiScore": 91}
    ],
    hourlyDistribution: [
      {"period": "Morning (06:00 - 12:00)", "cases": 18},
      {"period": "Afternoon (12:00 - 18:00)", "cases": 28},
      {"period": "Evening (18:00 - 00:00)", "cases": 42},
      {"period": "Night (00:00 - 06:00)", "cases": 12}
    ],
    riskVsProgress: [
      {"case": "FIR-001", "riskScore": 90, "progress": 40},
      {"case": "FIR-002", "riskScore": 75, "progress": 60},
      {"case": "FIR-003", "riskScore": 40, "progress": 85},
      {"case": "FIR-004", "riskScore": 92, "progress": 20},
      {"case": "FIR-005", "riskScore": 60, "progress": 70},
      {"case": "FIR-006", "riskScore": 82, "progress": 35},
      {"case": "FIR-007", "riskScore": 30, "progress": 95}
    ],
    radarMetrics: [
      {"metric": "Speed", "value": 85},
      {"metric": "Accuracy", "value": 90},
      {"metric": "Closure", "value": 78},
      {"metric": "Evidence", "value": 92},
      {"metric": "Documentation", "value": 85},
      {"metric": "Response", "value": 88}
    ],
    bubbleDistrictData: [
      {"name": "Bidhannagar", "firs": 65, "resolutionRate": 80, "avgRisk": 68},
      {"name": "Salt Lake", "firs": 55, "resolutionRate": 74, "avgRisk": 72},
      {"name": "New Town", "firs": 68, "resolutionRate": 70, "avgRisk": 60},
      {"name": "Lake Town", "firs": 30, "resolutionRate": 60, "avgRisk": 45}
    ],
    funnelData: [
      {"stage": "FIR Registered", "count": 100},
      {"stage": "Investigation Started", "count": 85},
      {"stage": "Evidence Collected", "count": 65},
      {"stage": "Suspect Identified", "count": 45},
      {"stage": "Arrest Made", "count": 30},
      {"stage": "Chargesheet Filed", "count": 20},
      {"stage": "Case Closed", "count": 10}
    ],
    treemapData: [
      {"name": "Theft", "size": 57},
      {"name": "Cyber Crime", "size": 70},
      {"name": "Assault", "size": 17},
      {"name": "Fraud", "size": 46}
    ],
    aiInsights: [
      "Cyber crime incidents have increased by 22% this month, heavily clustered within New Town boundaries.",
      "Salt Lake Sector-V district has the highest repeat offender matches inside our DB.",
      "Sector V PS has recorded the fastest investigation average completion rate (11 days).",
      "Night-time thefts (18:00 - 00:00) represent the highest distribution spike (42 cases).",
      "Three emerging spatial hotspots have been identified matching lockpick modus operandi."
    ]
  };
}
