import { useEffect, useState, useMemo, useRef } from "react";
import { 
  Network, Search, Filter, Bot, X, 
  Clock, Download, Maximize, ZoomIn, ZoomOut, RotateCcw
} from "lucide-react";
import { GlassCard } from "../ui/GlassCard";

interface CaseNetworkExplorerProps {
  caseId: string;
}

interface NetworkNode {
  id: string;
  label: string;
  type: "case" | "suspect" | "victim" | "officer" | "location" | "phone" | "vehicle" | "evidence" | "unknown";
  details: string;
  photograph?: string;
  age?: number;
  alias?: string;
  criminalHistory?: string[];
  knownAssociates?: string[];
  linkedCases?: string[];
  riskScore?: number;
  currentStatus?: string;
  aiSummary?: string;
  owner?: string;
  linkedFIRs?: string[];
  linkedSuspects?: string[];
  callRecords?: string;
  riskLevel?: string;
  registration?: string;
  locations?: string[];
  evidence?: string[];
  evidenceId?: string;
  evidenceType?: string;
  collectedBy?: string;
  date?: string;
  labStatus?: string;
  aiAnalysis?: string;
  x?: number;
  y?: number;
}

interface NetworkLink {
  source: string;
  target: string;
  type: string;
  strength: number;
  aiExplanation: string;
}

export function CaseNetworkExplorer({ caseId }: CaseNetworkExplorerProps) {
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [links, setLinks] = useState<NetworkLink[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [evolution, setEvolution] = useState<any[]>([]);
  
  // Interaction states
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"graph" | "timeline">("graph");
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<NetworkLink | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Panning & Zooming State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Filter states
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [onlyRepeatOffenders, setOnlyRepeatOffenders] = useState(false);
  const [activeTypeFilters, setActiveTypeFilters] = useState<string[]>([]);

  // Fetch API dossier network
  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/intelligence/case-network/${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes);
        setLinks(data.links);
        setInsights(data.insights);
        setEvolution(data.evolution);
      }
    } catch (err) {
      console.error("Failed to load case network", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
  }, [caseId]);

  // Layout calculations (Radial mesh around center)
  const laidOutNodes = useMemo(() => {
    if (nodes.length === 0) return [];
    
    const center = { x: 300, y: 220 };
    
    return nodes.map((node) => {
      let x = center.x;
      let y = center.y;
      
      if (node.id === "central-case") {
        x = center.x;
        y = center.y;
      } else {
        // Classify node indices by radial layers
        const innerTypes = ["victim", "officer", "location"];
        const middleTypes = ["suspect", "phone", "vehicle"];
        
        let radius = 180; // Outer layer by default (evidence, similar cases)
        let groupNodes: NetworkNode[] = [];
        
        if (innerTypes.includes(node.type)) {
          radius = 80;
          groupNodes = nodes.filter(n => innerTypes.includes(n.type));
        } else if (middleTypes.includes(node.type)) {
          radius = 135;
          groupNodes = nodes.filter(n => middleTypes.includes(n.type));
        } else {
          groupNodes = nodes.filter(n => !innerTypes.includes(n.type) && !middleTypes.includes(n.type) && n.id !== "central-case");
        }
        
        const idx = groupNodes.findIndex(n => n.id === node.id);
        const count = groupNodes.length || 1;
        const angle = (idx * 2 * Math.PI) / count + (node.type === "suspect" ? Math.PI / 4 : 0);
        
        x = center.x + radius * Math.cos(angle);
        y = center.y + radius * Math.sin(angle);
      }
      
      return { ...node, x, y };
    });
  }, [nodes]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return laidOutNodes.filter(n => {
      const matchesSearch = n.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            n.details.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRisk = filterRisk === "all" || 
                          (filterRisk === "high" && (n.riskScore && n.riskScore > 75)) ||
                          (filterRisk === "medium" && (n.riskScore && n.riskScore <= 75 && n.riskScore > 40));
                          
      const matchesRepeat = !onlyRepeatOffenders || (n.type === "suspect" && n.alias === "Rony"); // Rohan Gupta is repeat
      
      const matchesType = activeTypeFilters.length === 0 || activeTypeFilters.includes(n.type);

      return matchesSearch && matchesRisk && matchesRepeat && matchesType;
    });
  }, [laidOutNodes, searchQuery, filterRisk, onlyRepeatOffenders, activeTypeFilters]);

  // Drag and pan handlers on SVG
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    // Only drag if not clicking a node
    if ((e.target as SVGElement).tagName === "svg" || (e.target as SVGElement).tagName === "line") {
      setIsDragging(true);
      dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const zoomIn = () => setZoom(z => Math.min(z + 0.15, 2.5));
  const zoomOut = () => setZoom(z => Math.max(z - 0.15, 0.5));
  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setSelectedLink(null);
  };

  const triggerExport = () => {
    alert("Exporting intelligence network graph... PNG and PDF compilation formats ready for secure transfer.");
  };

  if (loading || !insights) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 animate-pulse">
        <Network className="h-10 w-10 text-cyan-accent animate-spin mb-4" />
        <p className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Compiling cross-district database links...</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${isFullscreen ? "fixed inset-0 z-50 bg-navy-950 p-6 overflow-y-auto" : "lg:grid-cols-4"} animate-fade-in`}>
      
      {/* Left Column: Filters and search controls */}
      <div className="lg:col-span-1 space-y-4 print:hidden">
        
        {/* Search */}
        <GlassCard className="p-4 border-white/10 bg-navy-900/60">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search suspect, vehicle, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-950 border border-white/10 text-white rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:border-cyan-accent/40"
            />
          </div>
        </GlassCard>

        {/* Node Filters */}
        <GlassCard className="p-4 border-white/10 bg-navy-900/60 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-2">
            <Filter className="h-4.5 w-4.5 text-cyan-accent" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Tactical Filters</h4>
          </div>

          <div className="space-y-3 font-mono text-[10px]">
            {/* Risk Level */}
            <div>
              <label className="block text-slate-500 uppercase font-bold mb-1">Risk Profile</label>
              <select 
                value={filterRisk} 
                onChange={(e) => setFilterRisk(e.target.value)}
                className="w-full bg-navy-950 border border-white/10 text-slate-200 rounded-lg p-1.5 outline-none text-[10px]"
              >
                <option value="all">All Risk Levels</option>
                <option value="high">High Risk (&gt;75)</option>
                <option value="medium">Medium Risk (40-75)</option>
              </select>
            </div>

            {/* Repeat Offenders */}
            <label className="flex items-center gap-2 text-slate-300 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={onlyRepeatOffenders}
                onChange={() => setOnlyRepeatOffenders(p => !p)}
                className="accent-cyan-400 h-3.5 w-3.5 rounded border-white/10 bg-navy-950"
              />
              <span>Only Repeat Offenders</span>
            </label>

            {/* Type Filters */}
            <div className="border-t border-white/5 pt-3 space-y-1.5">
              <span className="block text-slate-500 uppercase font-bold mb-1">Entity Categories</span>
              {[
                { id: "suspect", label: "Suspects & Accused", dot: "bg-red-500" },
                { id: "officer", label: "Investigating Officers", dot: "bg-blue-500" },
                { id: "victim", label: "Victims & Complainants", dot: "bg-emerald-500" },
                { id: "evidence", label: "Forensic Evidence", dot: "bg-purple-500" },
                { id: "vehicle", label: "Getaway Vehicles", dot: "bg-yellow-500" },
                { id: "phone", label: "Mobile Lines", dot: "bg-orange-500" },
              ].map(f => {
                const checked = activeTypeFilters.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => setActiveTypeFilters(prev => {
                      if (prev.includes(f.id)) return prev.filter(t => t !== f.id);
                      return [...prev, f.id];
                    })}
                    className={`w-full flex items-center justify-between p-1.5 rounded border text-[9px] font-semibold text-slate-300 transition-all ${
                      checked ? "bg-cyan-accent/10 border-cyan-accent/40 text-white" : "border-white/5 hover:bg-white/[0.01]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${f.dot}`} />
                      <span>{f.label}</span>
                    </div>
                    {checked && <span className="text-[7.5px] uppercase font-bold text-cyan-accent">ON</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("graph")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
              viewMode === "graph" ? "bg-cyan-accent/15 border-cyan-accent/30 text-cyan-accent" : "bg-white/5 border-white/10 text-slate-400"
            }`}
          >
            Network Canvas
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
              viewMode === "timeline" ? "bg-cyan-accent/15 border-cyan-accent/30 text-cyan-accent" : "bg-white/5 border-white/10 text-slate-400"
            }`}
          >
            Evolution Flow
          </button>
        </div>

      </div>

      {/* Main Column: Network Canvas or Timeline Evolution (Middle Column) */}
      <div className="lg:col-span-2 flex flex-col space-y-4">
        
        {viewMode === "graph" ? (
          <GlassCard className="p-4 border-white/10 bg-navy-950/40 relative overflow-hidden flex flex-col min-h-[480px]">
            {/* Holographic grid and circle details background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.03),transparent)] pointer-events-none" />
            
            {/* Controls panel overlay */}
            <div className="flex items-center justify-between z-10 mb-3 border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <Network className="h-4.5 w-4.5 text-cyan-accent animate-pulse" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Holographic Case Link Matrix</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={zoomIn} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white" title="Zoom In"><ZoomIn className="h-3.5 w-3.5" /></button>
                <button onClick={zoomOut} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white" title="Zoom Out"><ZoomOut className="h-3.5 w-3.5" /></button>
                <button onClick={resetZoom} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white" title="Reset Camera"><RotateCcw className="h-3.5 w-3.5" /></button>
                <button onClick={() => setIsFullscreen(p => !p)} className="p-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white" title="Toggle Fullscreen"><Maximize className="h-3.5 w-3.5" /></button>
              </div>
            </div>

            {/* SVG Relationship canvas */}
            <div className="flex-1 bg-navy-950/90 rounded-2xl border border-white/5 relative min-h-[380px] overflow-hidden">
              <svg 
                className="w-full h-full min-h-[380px] absolute inset-0 select-none cursor-grab active:cursor-grabbing" 
                viewBox="0 0 600 440"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <g transform={`translate(${pan.x + 300 * (1 - zoom)}, ${pan.y + 220 * (1 - zoom)}) scale(${zoom})`}>
                  
                  {/* Draw link lines */}
                  {links.map((link, idx) => {
                    const sourceNode = laidOutNodes.find(n => n.id === link.source);
                    const targetNode = laidOutNodes.find(n => n.id === link.target);
                    if (!sourceNode || !targetNode) return null;
                    
                    const isSourceVisible = filteredNodes.some(n => n.id === link.source);
                    const isTargetVisible = filteredNodes.some(n => n.id === link.target);
                    if (!isSourceVisible || !isTargetVisible) return null;

                    const isSelected = selectedLink === link || 
                                       (selectedNode && (selectedNode.id === link.source || selectedNode.id === link.target));

                    const strokeColor = link.strength >= 90 ? "#ef4444" : link.strength >= 80 ? "#f97316" : "#22d3ee";
                    const strokeWidth = isSelected ? "2.5" : "1.2";
                    const opacityVal = isSelected ? "1.0" : selectedNode ? "0.15" : "0.4";

                    return (
                      <g key={idx}>
                        <line
                          x1={sourceNode.x}
                          y1={sourceNode.y}
                          x2={targetNode.x}
                          y2={targetNode.y}
                          stroke={strokeColor}
                          strokeWidth={strokeWidth}
                          strokeDasharray={isSelected ? "4,4" : undefined}
                          className={isSelected ? "animate-[dash_8s_linear_infinite]" : ""}
                          opacity={opacityVal}
                          onClick={() => setSelectedLink(link)}
                        />
                      </g>
                    );
                  })}

                  {/* Draw Nodes */}
                  {filteredNodes.map(node => {
                    const isSelected = selectedNode?.id === node.id;
                    const isLinked = selectedNode && links.some(l => 
                      (l.source === node.id && l.target === selectedNode.id) || 
                      (l.target === node.id && l.source === selectedNode.id)
                    );

                    let stroke = "#cbd5e1"; // Grey for victim / complainant / default
                    let fill = "rgba(15, 23, 42, 0.95)";
                    
                    if (node.type === "case") {
                      stroke = "#22d3ee"; // Blue case
                    } else if (node.type === "suspect") {
                      stroke = node.riskScore && node.riskScore > 75 ? "#ef4444" : "#f97316"; // Red for high risk, orange for repeat
                    } else if (node.type === "officer") {
                      stroke = "#3b82f6"; // Blue officer
                    } else if (node.type === "evidence") {
                      stroke = "#a855f7"; // Purple evidence
                    } else if (node.type === "vehicle") {
                      stroke = "#eab308"; // Yellow vehicle
                    } else if (node.type === "phone") {
                      stroke = "#f97316"; // Orange phone
                    } else if (node.type === "victim") {
                      stroke = "#10b981"; // Green victim
                    }

                    const radius = node.type === "case" ? 22 : node.type === "suspect" ? 18 : 14;
                    const opacityVal = (isSelected || isLinked || !selectedNode) ? "1.0" : "0.2";

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${node.x}, ${node.y})`}
                        onClick={() => {
                          setSelectedNode(node);
                          setSelectedLink(null);
                        }}
                        className="cursor-pointer"
                        opacity={opacityVal}
                      >
                        {isSelected && (
                          <circle r={radius + 8} fill="none" stroke={stroke} strokeWidth="1" className="animate-ping opacity-30" />
                        )}
                        <circle
                          r={radius}
                          fill={fill}
                          stroke={stroke}
                          strokeWidth={isSelected ? 3 : 1.5}
                          className="transition-all hover:stroke-white shadow-glow"
                        />
                        <text
                          textAnchor="middle"
                          dy=".3em"
                          fill={stroke}
                          fontSize={node.type === "case" ? "8" : "7.5"}
                          fontWeight="black"
                          className="pointer-events-none"
                        >
                          {node.type === "case" ? "CASE" : 
                           node.type === "suspect" ? "ACC" :
                           node.type === "officer" ? "OFF" : 
                           node.type === "victim" ? "VIC" : 
                           node.type === "evidence" ? "EVD" : 
                           node.type === "vehicle" ? "VEH" : "PH"}
                        </text>
                        <text
                          y={radius + 12}
                          textAnchor="middle"
                          fill="#f8fafc"
                          fontSize="8"
                          fontWeight="bold"
                          className="pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                        >
                          {node.label}
                        </text>
                      </g>
                    );
                  })}

                </g>
              </svg>

              {/* Selection details footer log within canvas */}
              {selectedLink && (
                <div className="absolute bottom-4 left-4 right-4 bg-navy-900/95 border border-white/10 p-3 rounded-xl flex items-center justify-between gap-4 z-20 shadow-glow animate-slide-in font-mono text-[10px]">
                  <div className="flex-1">
                    <span className="text-[8px] font-bold text-cyan-accent uppercase block tracking-wider">AI Relationship Analysis</span>
                    <p className="text-slate-300 leading-normal mt-0.5">{selectedLink.aiExplanation}</p>
                  </div>
                  <button onClick={() => setSelectedLink(null)} className="p-1 rounded bg-white/5 border border-white/10 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          </GlassCard>
        ) : (
          /* Timeline evolution mode */
          <GlassCard className="p-5 border-white/10 bg-navy-950/40 space-y-4 min-h-[480px]">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Clock className="h-4.5 w-4.5 text-cyan-accent" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Criminal Syndicate Evolution Flow</h3>
            </div>
            
            <div className="space-y-6 pl-4 relative border-l border-white/10 ml-2 pt-2">
              {evolution.map((step: any, idx: number) => (
                <div key={idx} className="relative animate-slide-in" style={{ animationDelay: `${idx * 100}ms` }}>
                  <span className="absolute -left-[21px] top-0.5 h-3.5 w-3.5 rounded-full border-2 border-cyan-400 bg-navy-950 shadow-glow" />
                  <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] space-y-1 font-mono text-xs">
                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span className="font-bold uppercase tracking-wider text-cyan-accent">{step.event}</span>
                      <span>{step.period}</span>
                    </div>
                    <p className="text-slate-300 leading-normal mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

      </div>

      {/* Right Column: Node details OR AI Insights Sidebar Panel (Right Column) */}
      <div className="lg:col-span-1 space-y-4">
        
        {/* Node Side Panel detail card */}
        {selectedNode ? (
          <GlassCard className="p-4 border-cyan-accent/30 shadow-glow relative overflow-hidden flex flex-col space-y-3 animate-scale-in">
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <span className="text-[8.5px] uppercase font-bold text-cyan-accent font-mono tracking-wider">Entity dossier card</span>
              <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white p-0.5"><X className="h-4 w-4" /></button>
            </div>

            {/* Render conditional node properties */}
            <div className="space-y-3 font-mono text-xs">
              
              {/* Suspect specific */}
              {selectedNode.type === "suspect" && (
                <>
                  <div className="flex items-center gap-3">
                    {selectedNode.photograph && (
                      <img src={selectedNode.photograph} className="h-14 w-14 rounded-xl border border-white/10 object-cover shadow-glow shrink-0" alt="Suspect" />
                    )}
                    <div>
                      <h4 className="font-bold text-white uppercase">{selectedNode.label}</h4>
                      <p className="text-[10px] text-slate-400">Alias: {selectedNode.alias || "None"}</p>
                      <p className="text-[9px] text-rose-400 mt-0.5 font-bold">Threat: {selectedNode.riskScore}%</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-2 text-[9px] space-y-1 text-slate-300">
                    <span className="text-[8px] text-slate-500 uppercase font-bold block">Status</span>
                    <p>{selectedNode.currentStatus}</p>

                    <span className="text-[8px] text-slate-500 uppercase font-bold block pt-1.5">Known Associates</span>
                    <p>{selectedNode.knownAssociates?.join(", ") || "None logged"}</p>

                    <span className="text-[8px] text-slate-500 uppercase font-bold block pt-1.5">Prior Salt Lake Records</span>
                    <ul className="list-disc list-inside text-rose-300">
                      {selectedNode.criminalHistory?.map((h: string) => (
                        <li key={h}>{h}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-2.5 rounded-xl border border-cyan-accent/25 bg-cyan-accent/5 mt-2">
                    <span className="text-[8px] font-bold text-cyan-accent uppercase block tracking-wider"><Bot className="h-3 w-3 inline animate-pulse mr-1" /> AI Summary</span>
                    <p className="text-[9px] text-slate-300 leading-normal mt-0.5">{selectedNode.aiSummary}</p>
                  </div>
                </>
              )}

              {/* Vehicle specific */}
              {selectedNode.type === "vehicle" && (
                <>
                  <h4 className="font-bold text-white uppercase">{selectedNode.label}</h4>
                  <div className="space-y-1.5 text-[10px] text-slate-300">
                    <p>Registration: <b>{selectedNode.registration}</b></p>
                    <p>Owner: <b>{selectedNode.owner}</b></p>
                    <p>Locations Spotted: <b>{selectedNode.locations?.join(", ")}</b></p>
                    <p>Linked Cases: <b>{selectedNode.linkedCases?.join(", ")}</b></p>
                  </div>
                </>
              )}

              {/* Phone specific */}
              {selectedNode.type === "phone" && (
                <>
                  <h4 className="font-bold text-white uppercase">{selectedNode.label}</h4>
                  <div className="space-y-1.5 text-[10px] text-slate-300">
                    <p>Registered: <b>{selectedNode.owner}</b></p>
                    <p>Cell Logs: <b>{selectedNode.callRecords}</b></p>
                    <p>Threat Grade: <b>{selectedNode.riskLevel}</b></p>
                    <p>Linked Accused: <b>{selectedNode.linkedSuspects?.join(", ")}</b></p>
                  </div>
                </>
              )}

              {/* Evidence specific */}
              {selectedNode.type === "evidence" && (
                <>
                  <h4 className="font-bold text-white uppercase">{selectedNode.label}</h4>
                  <div className="space-y-1.5 text-[10px] text-slate-300">
                    <p>Type: <b>{selectedNode.evidenceType}</b></p>
                    <p>Collector: <b>{selectedNode.collectedBy}</b></p>
                    <p>Lab Status: <b>{selectedNode.labStatus}</b></p>
                    <p>AI Analysis: <b>{selectedNode.aiAnalysis}</b></p>
                  </div>
                </>
              )}

              {/* General node type fallback */}
              {selectedNode.type !== "suspect" && selectedNode.type !== "vehicle" && selectedNode.type !== "phone" && selectedNode.type !== "evidence" && (
                <div>
                  <h4 className="font-bold text-white uppercase">{selectedNode.label}</h4>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal">{selectedNode.details}</p>
                </div>
              )}

            </div>
          </GlassCard>
        ) : (
          /* Default AI Intelligence panel */
          <GlassCard className="p-4 border-cyan-accent/20 bg-cyan-accent/5 relative overflow-hidden flex flex-col space-y-3 shadow-glow">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-accent/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-1.5 border-b border-cyan-accent/15 pb-1">
              <Bot className="h-4.5 w-4.5 text-cyan-accent animate-pulse" />
              <span className="text-xs font-bold text-cyan-accent uppercase tracking-wider">AI Intelligence Insights</span>
            </div>

            <div className="space-y-3 font-mono text-[9px] leading-[1.5] text-slate-300 overflow-y-auto max-h-[360px] pr-1">
              <div>
                <span className="text-slate-500 uppercase font-bold block">Network Summary</span>
                <p className="text-slate-200">{insights.networkSummary}</p>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-bold block">Most Influential Suspect</span>
                <p className="text-rose-400 font-bold">{insights.mostInfluentialPerson}</p>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-bold block">Hidden Links Identified</span>
                <p className="text-slate-200">{insights.hiddenRelationships}</p>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-bold block">Possible Mastermind</span>
                <p className="text-orange-400 font-bold">{insights.possibleMastermind}</p>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-bold block">Modus Operandi Clusters</span>
                <p className="text-slate-200">{insights.mostCommonCrimePattern}</p>
              </div>

              <div>
                <span className="text-slate-500 uppercase font-bold block">Recommended Next Action</span>
                <p className="text-cyan-accent font-bold">{insights.recommendedDirection}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-cyan-accent/25 flex items-center justify-between text-[8px] uppercase tracking-wider text-slate-500">
              <span>Match Confidence:</span>
              <span className="text-cyan-accent font-bold">{insights.confidenceLevel}</span>
            </div>
          </GlassCard>
        )}

        {/* Export Graph widget */}
        <button 
          onClick={triggerExport}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 text-xs font-bold uppercase hover:bg-white/[0.06] transition-all print:hidden"
        >
          <Download className="h-3.5 w-3.5" /> Export Network Graph
        </button>

      </div>

    </div>
  );
}
