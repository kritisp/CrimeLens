import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  ArrowLeft, 
  User, 
  Car, 
  Phone as PhoneIcon, 
  Building, 
  Coins, 
  MapPin, 
  FileText, 
  Link2, 
  Filter, 
  ZoomIn, 
  ZoomOut, 
  Sparkles, 
  AlertOctagon, 
  ShieldAlert, 
  Loader2, 
  RefreshCw,
  Search
} from 'lucide-react';

export default function NetworkExplorer() {
  const navigate = useNavigate();

  // Asynchronous states
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected focus states
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filters state
  const [visibleNodeTypes, setVisibleNodeTypes] = useState({
    Person: true,
    Vehicle: true,
    Phone: true,
    UPI: true,
    Location: true,
    FIR: true,
    "Bank Account": true
  });
  const [visibleLinkTypes, setVisibleLinkTypes] = useState({
    Communication: true,
    Ownership: true,
    Transaction: true,
    "Co-occurrence": true
  });

  useEffect(() => {
    Promise.all([
      api.get('/network/nodes'),
      api.get('/network/links')
    ]).then(([nodesRes, linksRes]) => {
      setNodes(nodesRes.data);
      setLinks(linksRes.data);
      // Select Ravi Kumar (N1) by default
      if (nodesRes.data && nodesRes.data.length > 0) {
        setSelectedNode(nodesRes.data[0]);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Error loading network graph dataset", err);
      setLoading(false);
    });
  }, []);

  // Map node types to colors
  const getNodeColor = (type) => {
    switch (type) {
      case 'Person': return 'bg-red-500 border-red-400 text-red-100 ring-red-500/20';
      case 'Vehicle': return 'bg-blue-600 border-blue-400 text-blue-100 ring-blue-500/20';
      case 'Phone': return 'bg-emerald-600 border-emerald-400 text-emerald-100 ring-emerald-500/20';
      case 'UPI': return 'bg-purple-600 border-purple-400 text-purple-100 ring-purple-500/20';
      case 'Location': return 'bg-amber-600 border-amber-400 text-amber-100 ring-amber-500/20';
      case 'FIR': return 'bg-slate-700 border-slate-500 text-slate-100 ring-slate-700/20';
      case 'Bank Account': return 'bg-indigo-600 border-indigo-400 text-indigo-100 ring-indigo-500/20';
      default: return 'bg-slate-600 border-slate-400 text-slate-100 ring-slate-650/20';
    }
  };

  // Map node types to React icons
  const getNodeIcon = (type) => {
    switch (type) {
      case 'Person': return User;
      case 'Vehicle': return Car;
      case 'Phone': return PhoneIcon;
      case 'UPI': return Coins;
      case 'Location': return MapPin;
      case 'FIR': return FileText;
      case 'Bank Account': return Building;
      default: return Link2;
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setVisibleNodeTypes({
      Person: true,
      Vehicle: true,
      Phone: true,
      UPI: true,
      Location: true,
      FIR: true,
      "Bank Account": true
    });
    setVisibleLinkTypes({
      Communication: true,
      Ownership: true,
      Transaction: true,
      "Co-occurrence": true
    });
    setSearchQuery("");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500 gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <div className="font-mono text-sm tracking-widest uppercase animate-pulse">Mapping Relation Coordinates...</div>
      </div>
    );
  }

  // Filter nodes & links based on checkboxes
  const filteredNodes = nodes.filter(node => {
    // Node Type filter
    if (!visibleNodeTypes[node.type]) return false;
    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return node.name.toLowerCase().includes(q) || 
             node.type.toLowerCase().includes(q) || 
             (node.details && node.details.toLowerCase().includes(q));
    }
    return true;
  });

  const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

  const filteredLinks = links.filter(link => {
    // Link Type filter
    if (!visibleLinkTypes[link.type]) return false;
    // Source & Target must both be visible nodes
    return filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target);
  });

  // Calculate connected nodes of selectedNode for highlighting
  const activeConnections = new Set();
  if (selectedNode) {
    activeConnections.add(selectedNode.id);
    links.forEach(l => {
      if (l.source === selectedNode.id) activeConnections.add(l.target);
      if (l.target === selectedNode.id) activeConnections.add(l.source);
    });
  }

  // Get links of selected node to display in drawer
  const selectedNodeLinks = links
    .filter(l => l.source === selectedNode?.id || l.target === selectedNode?.id)
    .map(l => {
      const partnerId = l.source === selectedNode.id ? l.target : l.source;
      const partnerNode = nodes.find(n => n.id === partnerId);
      return {
        type: l.type,
        label: l.label,
        node: partnerNode
      };
    })
    .filter(item => item.node !== undefined);

  return (
    <div className="space-y-6">
      
      {/* Header with back navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/cases/FIR-1024')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Case Details
          </button>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Network Link Explorer</h2>
          <p className="text-sm text-slate-500 mt-0.5">Plot and analyze inter-entity relationships, financial loops, and co-locations.</p>
        </div>
        
        {/* Search bar */}
        <div className="relative w-full sm:w-64 group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter nodes..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-xs text-slate-900 placeholder-slate-400 outline-none transition-all shadow-sm font-semibold"
          />
        </div>
      </div>

      {/* Main split work-desk */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Filter desk (1 col) */}
        <div className="xl:col-span-1 space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Filter size={14} className="text-blue-600" /> Filter Layers
            </h3>
            <button 
              onClick={handleResetFilters}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw size={10} /> Reset
            </button>
          </div>

          {/* Node Types filters */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Node Type Filter</div>
            {Object.keys(visibleNodeTypes).map(type => (
              <label 
                key={type} 
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none"
              >
                <input 
                  type="checkbox"
                  checked={visibleNodeTypes[type]}
                  onChange={() => setVisibleNodeTypes(prev => ({ ...prev, [type]: !prev[type] }))}
                  className="rounded text-blue-600 focus:ring-blue-500/20 border-slate-300 w-3.5 h-3.5 cursor-pointer"
                />
                <span>{type}s</span>
              </label>
            ))}
          </div>

          <div className="h-px bg-slate-100 my-4"></div>

          {/* Link Type filters */}
          <div className="space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Link Type Filter</div>
            {Object.keys(visibleLinkTypes).map(type => (
              <label 
                key={type} 
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none"
              >
                <input 
                  type="checkbox"
                  checked={visibleLinkTypes[type]}
                  onChange={() => setVisibleLinkTypes(prev => ({ ...prev, [type]: !prev[type] }))}
                  className="rounded text-blue-600 focus:ring-blue-500/20 border-slate-300 w-3.5 h-3.5 cursor-pointer"
                />
                <span>{type} links</span>
              </label>
            ))}
          </div>
        </div>

        {/* Center: Interactive SVG Canvas (2 cols) */}
        <div className="xl:col-span-2 relative bg-slate-900 border border-slate-800 rounded-2xl h-[550px] shadow-xl overflow-hidden group">
          
          {/* Active styling particles keyframes injected */}
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes linkDashFlow {
              to {
                stroke-dashoffset: -100;
              }
            }
            .animated-link {
              stroke-dasharray: 6 4;
              animation: linkDashFlow 12s linear infinite;
            }
          `}} />

          {/* HUD Overlay details */}
          <div className="absolute top-4 left-4 z-10 bg-slate-950/80 border border-slate-800 p-3 rounded-xl backdrop-blur-md">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">HUD Status</div>
            <div className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
              <Sparkles size={12} className="text-blue-400" /> Active Nodes: {filteredNodes.length} / {nodes.length}
            </div>
            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Click a node to inspect relationships.
            </div>
          </div>

          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button className="bg-slate-950/80 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"><ZoomIn size={14} /></button>
            <button className="bg-slate-950/80 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"><ZoomOut size={14} /></button>
          </div>

          {/* SVG Graph Canvas */}
          <svg className="w-full h-full select-none">
            {/* Draw Links first so they lay behind node circles */}
            {filteredLinks.map((link, idx) => {
              const sourceNode = nodes.find(n => n.id === link.source);
              const targetNode = nodes.find(n => n.id === link.target);
              if (!sourceNode || !targetNode) return null;

              // Check if linked to current focus for highlight contrast
              const isSelectedFocus = selectedNode && (sourceNode.id === selectedNode.id || targetNode.id === selectedNode.id);
              const strokeColor = isSelectedFocus ? 'stroke-blue-500' : 'stroke-slate-700';
              const strokeWidth = isSelectedFocus ? 'stroke-2.5' : 'stroke-1.5';
              const opacity = selectedNode 
                ? (isSelectedFocus ? 'opacity-100' : 'opacity-25') 
                : 'opacity-70';

              // Get link type style
              const isTransaction = link.type === 'Transaction';
              const strokeDash = isTransaction ? 'animated-link' : '';

              // Calculate middle point for text labeling
              const midX = (sourceNode.x + targetNode.x) / 2;
              const midY = (sourceNode.y + targetNode.y) / 2;

              return (
                <g key={idx} className={`${opacity} transition-all duration-300`}>
                  {/* Glowing wide backdrop line */}
                  {isSelectedFocus && (
                    <line 
                      x1={sourceNode.x} 
                      y1={sourceNode.y} 
                      x2={targetNode.x} 
                      y2={targetNode.y} 
                      className="stroke-blue-500/10 stroke-6"
                    />
                  )}
                  {/* Structural line */}
                  <line 
                    x1={sourceNode.x} 
                    y1={sourceNode.y} 
                    x2={targetNode.x} 
                    y2={targetNode.y} 
                    className={`${strokeColor} ${strokeWidth} ${strokeDash} transition-colors`}
                  />
                  {/* Text label */}
                  <text 
                    x={midX} 
                    y={midY - 6} 
                    className="text-[9px] font-bold text-slate-500 fill-slate-500 select-none pointer-events-none"
                    textAnchor="middle"
                  >
                    {link.label}
                  </text>
                </g>
              );
            })}

            {/* Draw Nodes */}
            {filteredNodes.map((node) => {
              const Icon = getNodeIcon(node.type);
              const colorClass = getNodeColor(node.type);
              
              // Focus highlight logic
              const isFocused = selectedNode?.id === node.id;
              const isConnected = selectedNode ? activeConnections.has(node.id) : true;
              const opacity = selectedNode 
                ? (isConnected ? 'opacity-100' : 'opacity-25 scale-95') 
                : 'opacity-100';
              const scale = isFocused ? 'scale-110 shadow-blue-500/20' : 'hover:scale-105';

              return (
                <g 
                  key={node.id} 
                  transform={`translate(${node.x}, ${node.y})`}
                  className={`${opacity} ${scale} cursor-pointer transition-all duration-300`}
                  onClick={() => setSelectedNode(node)}
                >
                  {/* Glowing ring if focused */}
                  {isFocused && (
                    <circle 
                      r={30} 
                      className="fill-none stroke-blue-500/30 stroke-[3px] animate-pulse" 
                    />
                  )}
                  {/* Node Background base */}
                  <circle 
                    r={22} 
                    className={`stroke-2 stroke-slate-900 ${colorClass.split(' ')[0]} transition-all`} 
                  />
                  {/* Icon foreign element */}
                  <foreignObject 
                    x={-11} 
                    y={-11} 
                    width={22} 
                    height={22}
                    className="pointer-events-none"
                  >
                    <Icon size={22} className="text-white" />
                  </foreignObject>
                  {/* Label Text below node */}
                  <text 
                    y={34} 
                    className="text-[10px] font-bold text-slate-300 fill-current select-none font-sans"
                    textAnchor="middle"
                  >
                    {node.name.split(' ')[0] + (node.name.split(' ')[1] ? '..' : '')}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Side: Inspector drawer (1 col) */}
        <div className="xl:col-span-1 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[550px]">
          
          {selectedNode ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Drawer header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400 border border-blue-500/20">
                     <Sparkles size={14} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider font-display">Entity Profile Inspector</span>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                
                {/* Entity Details Header */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/30">
                      {selectedNode.type}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      selectedNode.risk.includes('High') 
                        ? 'text-red-400 bg-red-900/20 border-red-500/30' 
                        : 'text-amber-400 bg-amber-900/20 border-amber-500/30'
                    }`}>
                      {selectedNode.risk}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                    {selectedNode.name}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">{selectedNode.clearance}</p>
                </div>

                {/* Narrative description */}
                <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-xs text-slate-300 leading-relaxed font-semibold">
                  {selectedNode.details}
                </div>

                {/* Metadata properties */}
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Metadata Registry</div>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(selectedNode.meta).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-xs font-bold text-white font-mono">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Linked relations in topology */}
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Direct Linkages</div>
                  <div className="space-y-1.5">
                    {selectedNodeLinks.map((link, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedNode(link.node)}
                        className="flex items-center justify-between p-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-lg cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-slate-500 group-hover:text-blue-400 transition-colors">
                            <Link2 size={12} />
                          </div>
                          <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors truncate max-w-[110px]">
                            {link.node.name}
                          </span>
                        </div>
                        <span className="text-[9px] font-bold text-blue-400 uppercase">
                          {link.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action commands */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-2">
                {selectedNode.type === 'FIR' ? (
                  <button 
                    onClick={() => navigate('/cases/FIR-1024')}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md text-xs cursor-pointer font-sans"
                  >
                    <FileText size={14} /> Open FIR Case File
                  </button>
                ) : (
                  <button 
                    onClick={() => navigate('/chat')}
                    className="w-full flex items-center justify-center gap-2 bg-slate-850 hover:bg-slate-850 text-white font-semibold py-2.5 rounded-xl transition-all border border-slate-850 text-xs cursor-pointer"
                  >
                    <Sparkles size={14} /> Search Entity in AI Chat
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <ShieldAlert size={32} className="mb-2 text-slate-600" />
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Selection</h4>
              <p className="text-[10px] mt-1 font-semibold max-w-[160px]">Click any coordinate node inside the graph center to inspect profile records.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
