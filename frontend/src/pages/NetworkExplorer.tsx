import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import {
  Search, Network, X, ZoomIn, ZoomOut, RefreshCw, Download,
  Filter, Maximize2, Minimize2, ChevronRight, Share2,
  AlertTriangle, User, MapPin, Building2, Briefcase, Link2,
  Eye, EyeOff, Play, Pause, Target, Layers
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface GraphNode {
  id: string;
  label: string;
  type: "case" | "suspect" | "officer" | "location" | "organization";
  subtype?: string;
  riskLevel?: "critical" | "high" | "medium" | "low";
  details: Record<string, string | number>;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned: boolean;
  radius: number;
  cluster?: number;
  centrality?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: "mo_link" | "location" | "officer_assigned" | "suspect_relation" | "co_offender" | "financial";
  weight: number;
  label: string;
  confidence: number;
}

// ─────────────────────────────────────────────────────────────────────────────
//  MOCK DATA — positions use a normalized [-1..1] range, mapped to canvas later
// ─────────────────────────────────────────────────────────────────────────────
function buildGraphData(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  // Spread nodes around origin; physics will settle them
  const P = (ax: number, ay: number): { x: number; y: number } => ({
    x: ax * 200,
    y: ay * 200,
  });

  const nodes: GraphNode[] = [
    // ── Cases ──
    { id: "c1", label: "FIR-2024-0041", type: "case", subtype: "Cyber Crime", riskLevel: "critical",
      details: { Complainant: "Ravi Sharma", Status: "Investigating", Date: "2024-06-12", Priority: "Critical", Officer: "SI Ananya Reddy", Station: "Cyber Cell, BLR", RiskScore: 92 },
      ...P(0.1, -0.2), vx: 0, vy: 0, pinned: false, radius: 22, centrality: 0.91 },
    { id: "c2", label: "FIR-2024-0055", type: "case", subtype: "Fraud", riskLevel: "high",
      details: { Complainant: "Priya Mehta", Status: "Pending", Date: "2024-06-18", Priority: "High", Officer: "Insp. Vikram Singh", Station: "EOW, BLR", RiskScore: 79 },
      ...P(0.5, 0.1), vx: 0, vy: 0, pinned: false, radius: 18, centrality: 0.67 },
    { id: "c3", label: "FIR-2024-0062", type: "case", subtype: "Cyber Crime", riskLevel: "high",
      details: { Complainant: "Arjun Nair", Status: "Investigating", Date: "2024-06-21", Priority: "High", Officer: "SI Ananya Reddy", Station: "Cyber Cell, BLR", RiskScore: 83 },
      ...P(-0.4, -0.3), vx: 0, vy: 0, pinned: false, radius: 19, centrality: 0.72 },
    { id: "c4", label: "FIR-2024-0078", type: "case", subtype: "Theft", riskLevel: "medium",
      details: { Complainant: "Sita Devi", Status: "Solved", Date: "2024-05-30", Priority: "Medium", Officer: "SI Amit Kumar", Station: "Indiranagar PS", RiskScore: 45 },
      ...P(-0.7, 0.2), vx: 0, vy: 0, pinned: false, radius: 15, centrality: 0.41 },
    { id: "c5", label: "FIR-2024-0089", type: "case", subtype: "Assault", riskLevel: "critical",
      details: { Complainant: "Vikram Bose", Status: "Investigating", Date: "2024-07-02", Priority: "Critical", Officer: "Insp. Vikram Singh", Station: "Koramangala PS", RiskScore: 95 },
      ...P(0.0, 0.5), vx: 0, vy: 0, pinned: false, radius: 21, centrality: 0.88 },
    { id: "c6", label: "FIR-2024-0092", type: "case", subtype: "Drug Possession", riskLevel: "high",
      details: { Complainant: "State vs. Accused", Status: "Pending", Date: "2024-07-05", Priority: "High", Officer: "SI Priya Sen", Station: "Narcotics Cell", RiskScore: 77 },
      ...P(0.8, -0.4), vx: 0, vy: 0, pinned: false, radius: 17, centrality: 0.59 },

    // ── Suspects ──
    { id: "s1", label: "Rohit Verma", type: "suspect", riskLevel: "critical",
      details: { Age: 34, Alias: "The Ghost", PriorConvictions: 3, MO: "Phishing + UPI Fraud", LastSeen: "Koramangala", Nationality: "Indian", ThreatLevel: "Critical" },
      ...P(0.9, -0.05), vx: 0, vy: 0, pinned: false, radius: 24, cluster: 1, centrality: 0.95 },
    { id: "s2", label: "Deepak Rao", type: "suspect", riskLevel: "high",
      details: { Age: 28, Alias: "D-Ram", PriorConvictions: 1, MO: "Vehicle Theft", LastSeen: "Whitefield", Nationality: "Indian", ThreatLevel: "High" },
      ...P(-0.9, -0.05), vx: 0, vy: 0, pinned: false, radius: 19, cluster: 2, centrality: 0.64 },
    { id: "s3", label: "Anwar Sheikh", type: "suspect", riskLevel: "high",
      details: { Age: 42, Alias: "AW", PriorConvictions: 2, MO: "Financial Fraud", LastSeen: "Shivajinagar", Nationality: "Indian", ThreatLevel: "High" },
      ...P(1.1, 0.3), vx: 0, vy: 0, pinned: false, radius: 20, cluster: 1, centrality: 0.73 },
    { id: "s4", label: "Kavita Shetty", type: "suspect", riskLevel: "medium",
      details: { Age: 26, Alias: "KS", PriorConvictions: 0, MO: "Drug Distribution", LastSeen: "Jayanagar", Nationality: "Indian", ThreatLevel: "Medium" },
      ...P(0.45, -0.7), vx: 0, vy: 0, pinned: false, radius: 16, cluster: 3, centrality: 0.48 },
    { id: "s5", label: "Mohan Das", type: "suspect", riskLevel: "critical",
      details: { Age: 38, Alias: "The Broker", PriorConvictions: 5, MO: "Organized Crime Syndicate", LastSeen: "Unknown", Nationality: "Indian", ThreatLevel: "Critical" },
      ...P(1.25, -0.55), vx: 0, vy: 0, pinned: false, radius: 26, cluster: 1, centrality: 0.98 },

    // ── Officers ──
    { id: "o1", label: "SI Ananya Reddy", type: "officer",
      details: { Badge: "KSP-1042", Rank: "Sub Inspector", Station: "Cyber Cell, BLR", CasesHandled: 18, ClearanceRate: "78%", Specialization: "Cyber Crime" },
      ...P(-0.25, -0.75), vx: 0, vy: 0, pinned: false, radius: 18, centrality: 0.55 },
    { id: "o2", label: "Insp. Vikram Singh", type: "officer",
      details: { Badge: "KSP-0892", Rank: "Inspector", Station: "EOW, BLR", CasesHandled: 22, ClearanceRate: "86%", Specialization: "Economic Offences" },
      ...P(0.3, 0.85), vx: 0, vy: 0, pinned: false, radius: 20, centrality: 0.61 },

    // ── Locations ──
    { id: "l1", label: "Koramangala Tech Hub", type: "location",
      details: { Zone: "Koramangala", RiskScore: 88, CrimesReported: 34, MostCommonCrime: "Cyber Crime", LastIncident: "2024-07-05", CCTV: "Active" },
      ...P(-1.0, 0.5), vx: 0, vy: 0, pinned: false, radius: 17, centrality: 0.52 },
    { id: "l2", label: "MG Road Corridor", type: "location",
      details: { Zone: "Central BLR", RiskScore: 72, CrimesReported: 21, MostCommonCrime: "Theft", LastIncident: "2024-07-01", CCTV: "Active" },
      ...P(-1.1, -0.3), vx: 0, vy: 0, pinned: false, radius: 14, centrality: 0.39 },

    // ── Organizations ──
    { id: "org1", label: "Syndicate Alpha", type: "organization", riskLevel: "critical",
      details: { Type: "Organized Crime", Members: "14 Known", Territory: "BLR South", Revenue: "Est. ₹4.2 Cr/yr", Status: "Active", Founded: "2019" },
      ...P(1.5, 0), vx: 0, vy: 0, pinned: false, radius: 28, cluster: 1, centrality: 1.0 },
    { id: "org2", label: "Ghost Net Group", type: "organization", riskLevel: "high",
      details: { Type: "Cyber Crime Ring", Members: "8 Known", Territory: "Online + Whitefield", Revenue: "Est. ₹2.1 Cr/yr", Status: "Active", Founded: "2021" },
      ...P(1.35, -0.75), vx: 0, vy: 0, pinned: false, radius: 22, cluster: 1, centrality: 0.87 },
  ];

  const edges: GraphEdge[] = [
    { id: "e1", source: "c1", target: "c3", type: "mo_link", weight: 3, label: "Same MO: Phishing", confidence: 91 },
    { id: "e2", source: "c2", target: "c3", type: "mo_link", weight: 2, label: "Similar MO: UPI Fraud", confidence: 76 },
    { id: "e3", source: "c1", target: "c6", type: "mo_link", weight: 2, label: "Common Network Node", confidence: 68 },
    { id: "e4", source: "s1", target: "c1", type: "suspect_relation", weight: 4, label: "Primary Suspect", confidence: 94 },
    { id: "e5", source: "s1", target: "c3", type: "suspect_relation", weight: 3, label: "Linked via Device MAC", confidence: 82 },
    { id: "e6", source: "s3", target: "c2", type: "suspect_relation", weight: 3, label: "Financial Beneficiary", confidence: 88 },
    { id: "e7", source: "s2", target: "c4", type: "suspect_relation", weight: 2, label: "Witnessed at Scene", confidence: 61 },
    { id: "e8", source: "s4", target: "c6", type: "suspect_relation", weight: 3, label: "Arrested with Evidence", confidence: 97 },
    { id: "e9", source: "s5", target: "c5", type: "suspect_relation", weight: 4, label: "Mastermind (Intelligence)", confidence: 72 },
    { id: "e10", source: "s1", target: "c2", type: "suspect_relation", weight: 2, label: "Digital Fingerprint Match", confidence: 69 },
    { id: "e11", source: "o1", target: "c1", type: "officer_assigned", weight: 1, label: "Investigating Officer", confidence: 100 },
    { id: "e12", source: "o1", target: "c3", type: "officer_assigned", weight: 1, label: "Investigating Officer", confidence: 100 },
    { id: "e13", source: "o2", target: "c2", type: "officer_assigned", weight: 1, label: "Lead Investigator", confidence: 100 },
    { id: "e14", source: "o2", target: "c5", type: "officer_assigned", weight: 1, label: "Lead Investigator", confidence: 100 },
    { id: "e15", source: "s1", target: "s3", type: "co_offender", weight: 3, label: "Known Associates", confidence: 85 },
    { id: "e16", source: "s1", target: "s5", type: "co_offender", weight: 4, label: "Hierarchy: Reports To", confidence: 78 },
    { id: "e17", source: "s3", target: "s5", type: "co_offender", weight: 3, label: "Financial Handler", confidence: 71 },
    { id: "e18", source: "s4", target: "s5", type: "co_offender", weight: 2, label: "Distribution Network", confidence: 65 },
    { id: "e19", source: "s5", target: "org1", type: "co_offender", weight: 5, label: "Syndicate Leader", confidence: 89 },
    { id: "e20", source: "s1", target: "org2", type: "co_offender", weight: 4, label: "Core Member", confidence: 84 },
    { id: "e21", source: "s3", target: "org1", type: "co_offender", weight: 3, label: "Financial Wing", confidence: 77 },
    { id: "e22", source: "org1", target: "org2", type: "financial", weight: 3, label: "Shared Funding Source", confidence: 63 },
    { id: "e23", source: "l1", target: "c1", type: "location", weight: 2, label: "Crime Location", confidence: 100 },
    { id: "e24", source: "l1", target: "c5", type: "location", weight: 2, label: "Incident Zone", confidence: 100 },
    { id: "e25", source: "l2", target: "c4", type: "location", weight: 2, label: "Crime Scene", confidence: 100 },
    { id: "e26", source: "l1", target: "s1", type: "location", weight: 2, label: "Last Known Location", confidence: 80 },
    { id: "e27", source: "l1", target: "s2", type: "location", weight: 1, label: "Spotted in Zone", confidence: 55 },
  ];

  return { nodes, edges };
}

// ─────────────────────────────────────────────────────────────────────────────
//  DISPLAY CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const NODE_COLORS: Record<string, { fill: string; stroke: string; glow: string }> = {
  case:         { fill: "rgba(34,211,238,0.15)", stroke: "#22d3ee", glow: "rgba(34,211,238,0.6)" },
  suspect:      { fill: "rgba(239,68,68,0.15)",  stroke: "#ef4444", glow: "rgba(239,68,68,0.6)" },
  officer:      { fill: "rgba(59,130,246,0.15)",  stroke: "#3b82f6", glow: "rgba(59,130,246,0.6)" },
  location:     { fill: "rgba(168,85,247,0.15)",  stroke: "#a855f7", glow: "rgba(168,85,247,0.6)" },
  organization: { fill: "rgba(249,115,22,0.15)",  stroke: "#f97316", glow: "rgba(249,115,22,0.6)" },
};

const EDGE_COLORS: Record<string, string> = {
  mo_link: "#22d3ee",
  location: "#a855f7",
  officer_assigned: "#3b82f6",
  suspect_relation: "#ef4444",
  co_offender: "#f97316",
  financial: "#eab308",
};

const RISK_BORDER: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22d3ee",
};

const NODE_TYPE_ICON: Record<string, React.ReactNode> = {
  case: <Briefcase className="h-3.5 w-3.5" />,
  suspect: <User className="h-3.5 w-3.5" />,
  officer: <Target className="h-3.5 w-3.5" />,
  location: <MapPin className="h-3.5 w-3.5" />,
  organization: <Building2 className="h-3.5 w-3.5" />,
};

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function NetworkExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const graphRef = useRef(buildGraphData());

  // Camera / viewport
  const cam = useRef({ x: 0, y: 0, scale: 1 });
  const animTime = useRef(0);

  // Interaction refs (not state to avoid re-renders per frame)
  const panActive = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const didPan = useRef(false); // true if mouse moved > 4px after down (means it's a drag, not a click)
  const dragNode = useRef<GraphNode | null>(null);
  const hoverNode = useRef<GraphNode | null>(null);
  const mouseDown = useRef({ x: 0, y: 0 });

  // Centered flag — to center the graph on first render once we know canvas dimensions
  const centeredOnce = useRef(false);

  // ── State ──
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterEdge, setFilterEdge] = useState("all");
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [isSimulating, setIsSimulating] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetrics, setShowMetrics] = useState(true);
  const [hoverLabel, setHoverLabel] = useState<GraphNode | null>(null);

  // Force a re-render tick every 100ms so sidebar reacts to filter changes
  const [, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 100); return () => clearInterval(id); }, []);

  const { nodes, edges } = graphRef.current;

  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    nodes.forEach(n => { if (filterType === "all" || n.type === filterType) ids.add(n.id); });
    return ids;
  }, [filterType, nodes]);

  const visibleEdgeList = useMemo(() => {
    return edges.filter(e =>
      visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target) &&
      (filterEdge === "all" || e.type === filterEdge)
    );
  }, [visibleNodeIds, filterEdge, edges]);

  const visibleNodes = useMemo(() => nodes.filter(n => visibleNodeIds.has(n.id)), [visibleNodeIds, nodes]);

  const searchIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    return new Set(nodes.filter(n => n.label.toLowerCase().includes(q) || n.subtype?.toLowerCase().includes(q)).map(n => n.id));
  }, [searchQuery, nodes]);

  const metrics = useMemo(() => {
    const top = [...nodes].sort((a, b) => (b.centrality || 0) - (a.centrality || 0)).slice(0, 5);
    return { totalNodes: nodes.length, totalEdges: edges.length, criticalCount: nodes.filter(n => n.riskLevel === "critical").length, topCentral: top };
  }, [nodes, edges]);

  // ── Center graph once canvas dimensions are known ──
  const centerGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width < 10) return;
    cam.current = { x: canvas.width / 2, y: canvas.height / 2, scale: 0.9 };
  }, []);

  // ── Hit test (canvas px → world coords → closest node) ──
  const hitTest = useCallback((px: number, py: number): GraphNode | null => {
    const c = cam.current;
    const wx = (px - c.x) / c.scale;
    const wy = (py - c.y) / c.scale;
    // Check in reverse so topmost drawn node is hit first
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      if (!visibleNodeIds.has(n.id)) continue;
      const dx = n.x - wx, dy = n.y - wy;
      if (dx * dx + dy * dy < (n.radius + 6) * (n.radius + 6)) return n;
    }
    return null;
  }, [nodes, visibleNodeIds]);

  // ── Physics ──
  const simulate = useCallback(() => {
    if (!isSimulating) return;
    const ns = nodes;
    const es = edges;

    // Repulsion (Barnes-Hut would be better for large graphs but N=18 is fine)
    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const a = ns[i], b = ns[j];
        if (a.pinned && b.pinned) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.max(Math.hypot(dx, dy), 1);
        const F = 4000 / (dist * dist);
        const fx = (dx / dist) * F, fy = (dy / dist) * F;
        if (!a.pinned) { a.vx -= fx; a.vy -= fy; }
        if (!b.pinned) { b.vx += fx; b.vy += fy; }
      }
    }

    // Attraction along edges
    es.forEach(e => {
      const src = ns.find(n => n.id === e.source);
      const tgt = ns.find(n => n.id === e.target);
      if (!src || !tgt) return;
      const dx = tgt.x - src.x, dy = tgt.y - src.y;
      const dist = Math.max(Math.hypot(dx, dy), 1);
      const ideal = 140 + (4 - e.weight) * 25;
      const stretch = (dist - ideal) * 0.015;
      const fx = (dx / dist) * stretch, fy = (dy / dist) * stretch;
      if (!src.pinned) { src.vx += fx; src.vy += fy; }
      if (!tgt.pinned) { tgt.vx -= fx; tgt.vy -= fy; }
    });

    // Gentle gravity towards origin
    ns.forEach(n => {
      if (!n.pinned) {
        n.vx -= n.x * 0.0004;
        n.vy -= n.y * 0.0004;
      }
    });

    // Integrate + damping
    ns.forEach(n => {
      if (n.pinned) return;
      n.vx *= 0.88;
      n.vy *= 0.88;
      n.x += n.vx;
      n.y += n.vy;
    });
  }, [isSimulating, nodes, edges]);

  // ── Draw ──
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const c = cam.current;
    animTime.current += 0.02;
    const t = animTime.current;

    // ── Center once on first frame ──
    if (!centeredOnce.current && canvas.width > 100) {
      centerGraph();
      centeredOnce.current = true;
    }

    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
    bg.addColorStop(0, "#060f1e");
    bg.addColorStop(1, "#020810");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid dots (screen space, not world space)
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#22d3ee";
    const gridSpacing = 36;
    for (let gx = 0; gx < W; gx += gridSpacing) {
      for (let gy = 0; gy < H; gy += gridSpacing) {
        ctx.fillRect(gx, gy, 1, 1);
      }
    }
    ctx.restore();

    // ── World transform ──
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.scale, c.scale);

    // Build set of "active" nodes (selected + its neighbors)
    const activeIds = new Set<string>();
    const sel = selectedNode;
    if (sel) {
      activeIds.add(sel.id);
      visibleEdgeList.forEach(e => {
        if (e.source === sel.id || e.target === sel.id) {
          activeIds.add(e.source);
          activeIds.add(e.target);
        }
      });
    }
    const hasSelection = activeIds.size > 0;

    // ── Edges ──
    visibleEdgeList.forEach(e => {
      const src = nodes.find(n => n.id === e.source);
      const tgt = nodes.find(n => n.id === e.target);
      if (!src || !tgt) return;

      const active = !hasSelection || (activeIds.has(e.source) && activeIds.has(e.target));
      const alpha = active ? 0.7 : 0.12;
      const color = EDGE_COLORS[e.type] || "#94a3b8";

      ctx.globalAlpha = alpha;

      // Dashed animated lines
      const dashOff = (t * 14) % 24;
      ctx.setLineDash([5, 5]);
      ctx.lineDashOffset = -dashOff;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(0.8, e.weight * 0.55) * (active ? 1.5 : 0.6);
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Edge labels (only when selected)
      if (active && hasSelection) {
        const mx = (src.x + tgt.x) / 2, my = (src.y + tgt.y) / 2;
        ctx.globalAlpha = 0.9;
        ctx.font = "bold 7.5px monospace";
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(`${e.confidence}%`, mx, my - 3);
        ctx.font = "6.5px monospace";
        ctx.fillStyle = "#94a3b8";
        ctx.textBaseline = "top";
        ctx.fillText(e.label.length > 22 ? e.label.slice(0, 21) + "…" : e.label, mx, my + 2);
      }
    });

    ctx.globalAlpha = 1;

    // ── Nodes ──
    visibleNodes.forEach(n => {
      const colors = NODE_COLORS[n.type] || NODE_COLORS.case;
      const isSel = sel?.id === n.id;
      const isHover = hoverNode.current?.id === n.id;
      const isHL = searchIds.has(n.id) || highlightedNodes.has(n.id);
      const active = !hasSelection || activeIds.has(n.id);

      const a = active ? 1 : 0.25;
      const r = n.radius + (isSel || isHover ? 5 : 0);

      ctx.globalAlpha = a;

      // Glow
      if (isSel || isHover || isHL) {
        const gr = r + 16 + Math.sin(t * 2.5) * 5;
        const grd = ctx.createRadialGradient(n.x, n.y, r * 0.5, n.x, n.y, gr);
        grd.addColorStop(0, colors.glow);
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, gr, 0, Math.PI * 2);
        ctx.fill();
      }

      // Critical pulse
      if (n.riskLevel === "critical" && active) {
        const pr = r + 10 + Math.abs(Math.sin(t * 3)) * 7;
        ctx.beginPath();
        ctx.arc(n.x, n.y, pr, 0, Math.PI * 2);
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = (0.3 + Math.abs(Math.sin(t * 3)) * 0.35) * a;
        ctx.stroke();
        ctx.globalAlpha = a;
      }

      // Fill
      const fg = ctx.createRadialGradient(n.x - r * 0.25, n.y - r * 0.25, 0, n.x, n.y, r);
      fg.addColorStop(0, colors.fill.replace("0.15", "0.35"));
      fg.addColorStop(1, colors.fill);
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = isSel ? "#ffffff" : (n.riskLevel ? (RISK_BORDER[n.riskLevel] || colors.stroke) : colors.stroke);
      ctx.lineWidth = isSel ? 2.5 : 1.5;
      ctx.stroke();

      // Abbreviation inside
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `bold ${Math.max(9, r * 0.45)}px monospace`;
      ctx.fillText(n.label.slice(0, 2).toUpperCase(), n.x, n.y);

      // Label below
      ctx.textBaseline = "top";
      ctx.font = `${Math.max(7.5, r * 0.36)}px monospace`;
      ctx.fillStyle = isSel ? "#ffffff" : colors.stroke;
      const lbl = n.label.length > 15 ? n.label.slice(0, 14) + "…" : n.label;
      ctx.fillText(lbl, n.x, n.y + r + 4);

      ctx.globalAlpha = 1;
    });

    ctx.restore();
  }, [visibleNodes, visibleEdgeList, selectedNode, searchIds, highlightedNodes, nodes, centerGraph]);

  // ── Render loop ──
  useEffect(() => {
    const loop = () => {
      simulate();
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [simulate, draw]);

  // ── Resize canvas with container ──
  useEffect(() => {
    const resizeObs = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const { width, height } = container.getBoundingClientRect();
      if (canvas.width !== Math.round(width) || canvas.height !== Math.round(height)) {
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
      }
    });
    if (containerRef.current) resizeObs.observe(containerRef.current);
    return () => resizeObs.disconnect();
  }, []);

  // ── Passive-false wheel listener (so preventDefault actually works) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = (ev: WheelEvent) => {
      ev.preventDefault();
      const factor = ev.deltaY < 0 ? 1.1 : 0.91;
      const rect = canvas.getBoundingClientRect();
      const px = ev.clientX - rect.left, py = ev.clientY - rect.top;
      const c = cam.current;
      c.x = px - (px - c.x) * factor;
      c.y = py - (py - c.y) * factor;
      c.scale = Math.max(0.2, Math.min(5, c.scale * factor));
    };
    canvas.addEventListener("wheel", handler, { passive: false });
    return () => canvas.removeEventListener("wheel", handler);
  }, []);

  // ── Mouse handlers ──
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    mouseDown.current = { x: e.clientX, y: e.clientY };
    didPan.current = false;

    const hit = hitTest(px, py);
    if (hit) {
      dragNode.current = hit;
      hit.pinned = true;
    } else {
      panActive.current = true;
    }
    panStart.current = { x: e.clientX, y: e.clientY };
  }, [hitTest]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const dx = e.clientX - panStart.current.x;
    const dy = e.clientY - panStart.current.y;
    panStart.current = { x: e.clientX, y: e.clientY };

    // Determine if it's a drag (>4px movement)
    const totalDx = e.clientX - mouseDown.current.x;
    const totalDy = e.clientY - mouseDown.current.y;
    if (totalDx * totalDx + totalDy * totalDy > 16) didPan.current = true;

    if (dragNode.current) {
      const c = cam.current;
      dragNode.current.x += dx / c.scale;
      dragNode.current.y += dy / c.scale;
      dragNode.current.vx = 0;
      dragNode.current.vy = 0;
    } else if (panActive.current) {
      cam.current.x += dx;
      cam.current.y += dy;
    }

    // Hover detection
    const rect = canvasRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const hit = hitTest(px, py);
    if (hit !== hoverNode.current) {
      hoverNode.current = hit;
      setHoverLabel(hit);
    }
    canvasRef.current!.style.cursor = hit ? "pointer" : panActive.current ? "grabbing" : "grab";
  }, [hitTest]);

  const onMouseUp = useCallback(() => {
    const clickedNode = dragNode.current;
    if (clickedNode) {
      // If we barely moved, treat it as a click on the node
      if (!didPan.current) {
        setSelectedNode(prev => prev?.id === clickedNode.id ? null : clickedNode);
      }
      clickedNode.pinned = false;
      dragNode.current = null;
    } else if (!didPan.current) {
      // Clicked on empty space — deselect
      setSelectedNode(null);
    }
    panActive.current = false;
  }, []);

  const onMouseLeave = useCallback(() => {
    panActive.current = false;
    if (dragNode.current) {
      dragNode.current.pinned = false;
      dragNode.current = null;
    }
    hoverNode.current = null;
    setHoverLabel(null);
  }, []);

  // ── Zoom buttons ──
  const zoomBtn = (dir: "in" | "out") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const factor = dir === "in" ? 1.25 : 0.8;
    const c = cam.current;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    c.x = cx - (cx - c.x) * factor;
    c.y = cy - (cy - c.y) * factor;
    c.scale = Math.max(0.2, Math.min(5, c.scale * factor));
  };

  const resetView = () => centerGraph();

  const exportGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement("a");
    a.download = "criminal_network_graph.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  const focusOnNode = (node: GraphNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const c = cam.current;
    c.scale = 1.6;
    c.x = canvas.width / 2 - node.x * c.scale;
    c.y = canvas.height / 2 - node.y * c.scale;
    setSelectedNode(node);
  };

  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return visibleEdgeList.filter(e => e.source === selectedNode.id || e.target === selectedNode.id);
  }, [selectedNode, visibleEdgeList]);

  const connectedNodes = useMemo(() => {
    if (!selectedNode) return [];
    const ids = new Set<string>();
    connectedEdges.forEach(e => {
      if (e.source !== selectedNode.id) ids.add(e.source);
      if (e.target !== selectedNode.id) ids.add(e.target);
    });
    return nodes.filter(n => ids.has(n.id));
  }, [selectedNode, connectedEdges, nodes]);

  // ─────────────────────────────────────────────────────────────────────────
  //  JSX
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout mainClassName="!p-0 !overflow-hidden h-[calc(100vh-4rem)] flex flex-col">
      <div className={`flex flex-col h-full ${isFullscreen ? "fixed inset-0 z-[999] bg-[#020810]" : ""}`}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 bg-navy-950/95 border-b border-white/10 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-[0_0_12px_rgba(249,115,22,0.5)]">
              <Network className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white uppercase tracking-widest font-mono">Criminal Network Explorer</h1>
              <p className="text-[10px] text-slate-500">Force-directed AI Link Analysis Engine · KSP Intelligence Division</p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[10px]">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-500 pointer-events-none" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search nodes..." className="pl-7 pr-3 py-1.5 w-44 bg-white/[0.04] border border-white/10 rounded-lg text-slate-200 outline-none focus:border-amber-500/40 placeholder:text-slate-600 text-[10px]" />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><X className="h-3 w-3" /></button>
              )}
            </div>

            {/* Node filter */}
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-white/[0.04] border border-white/10 text-slate-200 rounded-lg px-2 py-1.5 outline-none">
              <option value="all">All Nodes</option>
              <option value="case">Cases</option>
              <option value="suspect">Suspects</option>
              <option value="officer">Officers</option>
              <option value="location">Locations</option>
              <option value="organization">Organizations</option>
            </select>

            {/* Edge filter */}
            <select value={filterEdge} onChange={e => setFilterEdge(e.target.value)} className="bg-white/[0.04] border border-white/10 text-slate-200 rounded-lg px-2 py-1.5 outline-none">
              <option value="all">All Links</option>
              <option value="mo_link">MO Links</option>
              <option value="suspect_relation">Suspect</option>
              <option value="co_offender">Co-offender</option>
              <option value="location">Location</option>
              <option value="officer_assigned">Officer</option>
              <option value="financial">Financial</option>
            </select>

            {/* Tool buttons */}
            <div className="flex items-center gap-0.5 border border-white/10 rounded-lg bg-white/[0.03] p-0.5">
              <button onClick={() => zoomBtn("in")} className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white" title="Zoom In"><ZoomIn className="h-3.5 w-3.5" /></button>
              <button onClick={() => zoomBtn("out")} className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white" title="Zoom Out"><ZoomOut className="h-3.5 w-3.5" /></button>
              <button onClick={resetView} className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white" title="Reset View"><RefreshCw className="h-3.5 w-3.5" /></button>
              <button onClick={exportGraph} className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white" title="Export PNG"><Download className="h-3.5 w-3.5" /></button>
              <button onClick={() => setIsSimulating(s => !s)} className={`p-1.5 rounded hover:bg-white/10 ${isSimulating ? "text-emerald-400" : "text-slate-400"}`} title={isSimulating ? "Pause Physics" : "Resume Physics"}>
                {isSimulating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => setIsFullscreen(f => !f)} className="p-1.5 rounded hover:bg-white/10 text-slate-400 hover:text-white">
                {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">

          {/* Canvas */}
          <div ref={containerRef} className="flex-1 relative min-w-0 min-h-0 overflow-hidden">
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "grab", touchAction: "none", display: "block" }}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseLeave}
            />

            {/* Legend */}
            {showLegend && (
              <div className="absolute bottom-5 left-5 z-20 bg-navy-950/90 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 shadow-glass select-none">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Legend</span>
                  <button onClick={() => setShowLegend(false)} className="text-slate-600 hover:text-white"><X className="h-3 w-3" /></button>
                </div>
                <div className="space-y-2 font-mono text-[9px]">
                  <div>
                    <p className="text-slate-600 uppercase tracking-wider mb-1">Nodes</p>
                    {Object.entries(NODE_COLORS).map(([type, c]) => (
                      <div key={type} className="flex items-center gap-2 mb-0.5">
                        <div className="h-3 w-3 rounded-full border-2 flex-shrink-0" style={{ borderColor: c.stroke, background: c.fill }} />
                        <span className="text-slate-300 capitalize">{type}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/5 pt-1.5">
                    <p className="text-slate-600 uppercase tracking-wider mb-1">Links</p>
                    {Object.entries(EDGE_COLORS).map(([type, color]) => (
                      <div key={type} className="flex items-center gap-2 mb-0.5">
                        <div className="h-0.5 w-4 rounded flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-slate-300 capitalize">{type.replace(/_/g, " ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {!showLegend && (
              <button onClick={() => setShowLegend(true)} className="absolute bottom-5 left-5 z-20 flex items-center gap-1.5 bg-navy-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-slate-400 hover:text-white font-mono">
                <Layers className="h-3 w-3" /> Legend
              </button>
            )}

            {/* Hover tooltip */}
            {hoverLabel && !selectedNode && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-navy-950/95 border border-white/15 rounded-xl px-4 py-2 shadow-glass font-mono text-[10px] text-slate-300 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: NODE_COLORS[hoverLabel.type]?.stroke }} />
                <span className="font-bold text-white">{hoverLabel.label}</span>
                <span className="text-slate-500">·</span>
                <span className="capitalize text-slate-400">{hoverLabel.type}</span>
                {hoverLabel.riskLevel && (
                  <><span className="text-slate-500">·</span><span style={{ color: RISK_BORDER[hoverLabel.riskLevel] }} className="font-bold uppercase">{hoverLabel.riskLevel}</span></>
                )}
                <span className="text-slate-600">· click to inspect</span>
              </div>
            )}

            {/* Status badge */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-navy-950/80 border border-white/10 rounded-xl px-3 py-1.5 font-mono text-[9px] select-none">
              <div className={`h-1.5 w-1.5 rounded-full ${isSimulating ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
              <span className="text-slate-400">{isSimulating ? "Physics Active" : "Physics Paused"}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{visibleNodes.length} nodes · {visibleEdgeList.length} links</span>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <aside className="w-96 shrink-0 bg-navy-950/95 border-l border-white/10 flex flex-col overflow-y-auto z-10 backdrop-blur-xl">

            {/* Metrics */}
            {showMetrics && (
              <div className="p-4 border-b border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">Graph Intelligence Metrics</span>
                  <button onClick={() => setShowMetrics(false)} className="text-slate-600 hover:text-white"><EyeOff className="h-3 w-3" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2 font-mono">
                  {[
                    { label: "Nodes", val: metrics.totalNodes, color: "text-cyan-400" },
                    { label: "Links", val: metrics.totalEdges, color: "text-amber-400" },
                    { label: "Critical", val: metrics.criticalCount, color: "text-rose-400" },
                  ].map(m => (
                    <div key={m.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 text-center">
                      <p className={`text-lg font-black ${m.color}`}>{m.val}</p>
                      <p className="text-[9px] text-slate-500 uppercase tracking-wider">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Top Central Nodes</p>
                  <div className="space-y-1">
                    {metrics.topCentral.map((n, idx) => (
                      <button key={n.id} onClick={() => focusOnNode(n)} className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors text-left">
                        <span className="text-[9px] font-bold text-slate-600 w-3 font-mono">#{idx + 1}</span>
                        <div className="h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: `${NODE_COLORS[n.type]?.stroke}22`, border: `1px solid ${NODE_COLORS[n.type]?.stroke}` }}>
                          <span className="text-[8px] font-bold" style={{ color: NODE_COLORS[n.type]?.stroke }}>{n.label.slice(0, 1)}</span>
                        </div>
                        <span className="text-[10px] text-slate-200 truncate flex-1 font-mono">{n.label}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <div className="w-10 bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(n.centrality || 0) * 100}%`, backgroundColor: NODE_COLORS[n.type]?.stroke }} />
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono">{((n.centrality || 0) * 100).toFixed(0)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {!showMetrics && (
              <button onClick={() => setShowMetrics(true)} className="flex items-center gap-1.5 m-3 px-3 py-2 rounded-xl border border-white/10 text-[10px] text-slate-400 hover:text-white font-mono bg-white/[0.02]">
                <Eye className="h-3 w-3" /> Show Metrics
              </button>
            )}

            {/* Dossier or Node List */}
            {selectedNode ? (
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="rounded-2xl border p-4 space-y-3 relative" style={{ borderColor: `${NODE_COLORS[selectedNode.type]?.stroke}40`, background: NODE_COLORS[selectedNode.type]?.fill }}>
                  <button onClick={() => setSelectedNode(null)} className="absolute top-3 right-3 text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 border" style={{ borderColor: NODE_COLORS[selectedNode.type]?.stroke, background: `${NODE_COLORS[selectedNode.type]?.stroke}22`, color: NODE_COLORS[selectedNode.type]?.stroke }}>
                      {NODE_TYPE_ICON[selectedNode.type]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] uppercase font-bold tracking-wider" style={{ color: NODE_COLORS[selectedNode.type]?.stroke }}>{selectedNode.type}{selectedNode.subtype ? ` · ${selectedNode.subtype}` : ""}</p>
                      <p className="text-sm font-black text-white font-mono leading-tight">{selectedNode.label}</p>
                      {selectedNode.riskLevel && (
                        <span className="inline-block mt-0.5 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider" style={{ color: RISK_BORDER[selectedNode.riskLevel], backgroundColor: `${RISK_BORDER[selectedNode.riskLevel]}15`, border: `1px solid ${RISK_BORDER[selectedNode.riskLevel]}40` }}>
                          {selectedNode.riskLevel} RISK
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedNode.centrality !== undefined && (
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Network Centrality</span>
                        <span className="text-[9px] font-bold font-mono" style={{ color: NODE_COLORS[selectedNode.type]?.stroke }}>{(selectedNode.centrality * 100).toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${selectedNode.centrality * 100}%`, backgroundColor: NODE_COLORS[selectedNode.type]?.stroke }} />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-white/5">
                    {Object.entries(selectedNode.details).map(([key, val]) => (
                      <div key={key} className="bg-black/20 rounded-lg p-2">
                        <p className="text-[8px] uppercase text-slate-500 font-semibold tracking-wider">{key}</p>
                        <p className="text-[10px] text-slate-200 font-mono font-bold truncate">{String(val)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connections */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Connections ({connectedEdges.length})</span>
                    <button onClick={() => { setHighlightedNodes(new Set(connectedNodes.map(n => n.id))); setTimeout(() => setHighlightedNodes(new Set()), 3000); }} className="flex items-center gap-1 text-[9px] font-bold text-amber-400 hover:text-amber-300 font-mono uppercase tracking-wider">
                      <Share2 className="h-3 w-3" /> Highlight
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {connectedEdges.map(e => {
                      const otherId = e.source === selectedNode.id ? e.target : e.source;
                      const other = nodes.find(n => n.id === otherId);
                      if (!other) return null;
                      const ec = EDGE_COLORS[e.type] || "#94a3b8";
                      return (
                        <button key={e.id} onClick={() => focusOnNode(other)} className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors text-left">
                          <div className="h-6 w-6 rounded-lg flex-shrink-0 flex items-center justify-center border" style={{ borderColor: NODE_COLORS[other.type]?.stroke, background: `${NODE_COLORS[other.type]?.stroke}15` }}>
                            <span className="text-[8px] font-black" style={{ color: NODE_COLORS[other.type]?.stroke }}>{other.label.slice(0, 2)}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-white font-mono truncate">{other.label}</p>
                            <p className="text-[8px] font-mono truncate" style={{ color: ec }}>{e.label}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="h-1 w-5 rounded-full" style={{ backgroundColor: ec }} />
                            <span className="text-[8px] font-mono" style={{ color: ec }}>{e.confidence}%</span>
                          </div>
                          <ChevronRight className="h-3 w-3 text-slate-600 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* AI Recommendation */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400">AI Analyst Recommendation</span>
                  </div>
                  <p className="text-[10px] text-slate-300 leading-relaxed font-mono">
                    {selectedNode.type === "suspect"
                      ? `Cross-reference ${selectedNode.label} against CCTNS national database. ${connectedEdges.length > 4 ? "High connectivity — potential hub figure." : "Investigate financial transactions within 90-day window."}`
                      : selectedNode.type === "case"
                      ? `Case linked to ${connectedEdges.length} network nodes. ${selectedNode.riskLevel === "critical" ? "Escalate to DCP level — critical risk." : "Assign investigator and request CCTV footage."}`
                      : selectedNode.type === "organization"
                      ? "Request SIT formation. Pursue hawala trail via ED cooperation."
                      : "Deploy patrol team for surveillance. Cross-map against local offender register."
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] uppercase font-black tracking-widest text-slate-500">Node Index ({visibleNodes.length})</span>
                  <Filter className="h-3 w-3 text-slate-600" />
                </div>
                <div className="space-y-1 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
                  {visibleNodes
                    .filter(n => !searchQuery || searchIds.has(n.id))
                    .sort((a, b) => (b.centrality || 0) - (a.centrality || 0))
                    .map(n => (
                      <button key={n.id} onClick={() => focusOnNode(n)} className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-white/5 bg-white/[0.015] hover:bg-white/[0.04] transition-colors text-left group">
                        <div className="h-7 w-7 rounded-lg flex-shrink-0 flex items-center justify-center border" style={{ borderColor: NODE_COLORS[n.type]?.stroke, background: `${NODE_COLORS[n.type]?.stroke}18` }}>
                          <span className="text-[9px] font-black" style={{ color: NODE_COLORS[n.type]?.stroke }}>{n.label.slice(0, 2)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-white font-mono truncate">{n.label}</p>
                          <p className="text-[8.5px] text-slate-500 capitalize font-mono">{n.type}{n.subtype ? ` · ${n.subtype}` : ""}</p>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          {n.riskLevel && (
                            <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded" style={{ color: RISK_BORDER[n.riskLevel], backgroundColor: `${RISK_BORDER[n.riskLevel]}15`, border: `1px solid ${RISK_BORDER[n.riskLevel]}30` }}>
                              {n.riskLevel}
                            </span>
                          )}
                          <span className="text-[8px] text-slate-600 font-mono">{n.centrality ? `C:${(n.centrality * 100).toFixed(0)}` : ""}</span>
                        </div>
                        <Link2 className="h-3 w-3 text-slate-700 group-hover:text-slate-400 flex-shrink-0" />
                      </button>
                    ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default NetworkExplorer;
