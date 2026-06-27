import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { 
  ArrowLeft, 
  Filter, 
  Map, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  ChevronRight, 
  Loader2, 
  RefreshCw, 
  Clock, 
  ShieldAlert,
  Car
} from 'lucide-react';

export default function Heatmaps() {
  const navigate = useNavigate();

  // Asynchronous states
  const [districts, setDistricts] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active filters
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [selectedCrimeType, setSelectedCrimeType] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");
  const [selectedTime, setSelectedTime] = useState("All");

  useEffect(() => {
    Promise.all([
      api.get('/heatmap/districts'),
      api.get('/heatmap/hotspots'),
      api.get('/cases')
    ]).then(([distRes, hotRes, casesRes]) => {
      setDistricts(distRes.data);
      setHotspots(hotRes.data);
      setCases(casesRes.data);
      
      // Focus on first hotspot by default
      if (hotRes.data && hotRes.data.length > 0) {
        setSelectedHotspot(hotRes.data[0]);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Failed loading geotemporal dataset", err);
      setLoading(false);
    });
  }, []);

  const handleResetFilters = () => {
    setSelectedCrimeType("All");
    setSelectedDistrict("All");
    setSelectedTime("All");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-slate-500 gap-4">
        <Loader2 size={40} className="animate-spin text-blue-600" />
        <div className="font-mono text-sm tracking-widest uppercase animate-pulse">Syncing Spatio-Temporal Maps...</div>
      </div>
    );
  }

  // Filter logic
  const filteredHotspots = hotspots.filter(h => {
    if (selectedCrimeType !== "All" && h.crimeType !== selectedCrimeType) return false;
    if (selectedDistrict !== "All" && h.district !== selectedDistrict) return false;
    if (selectedTime !== "All" && h.timeRange !== selectedTime) return false;
    return true;
  });

  // Unique types and districts for dropdowns
  const crimeTypesList = ["All", "Vehicle Theft", "Cyber Fraud", "Narcotics", "Financial Crime"];
  const districtsList = ["All", "Bengaluru Urban", "Mysuru", "Mangaluru", "Hubballi-Dharwad", "Bidar"];
  const timeRangesList = [
    { label: "All Time", value: "All" },
    { label: "Last 24 Hours", value: "24h" },
    { label: "Last 7 Days", value: "7d" },
    { label: "Last 30 Days", value: "30d" }
  ];

  // Map severity to colors
  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'High': return 'fill-red-500 stroke-red-500 text-red-500';
      case 'Medium': return 'fill-amber-500 stroke-amber-500 text-amber-500';
      default: return 'fill-yellow-400 stroke-yellow-400 text-yellow-400';
    }
  };

  // Find detailed FIR object from case dataset
  const getCaseDetails = (id) => {
    return cases.find(c => c.id === id);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-3 cursor-pointer"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Geotemporal Crime Heatmaps</h2>
          <p className="text-sm text-slate-500 mt-0.5">Spatio-temporal mapping of incident rates and criminal hotspots across Karnataka.</p>
        </div>
      </div>

      {/* Main split work-desk */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Side: Filter desk (1 col) */}
        <div className="xl:col-span-1 space-y-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider">
              <Filter size={14} className="text-blue-600" /> Filter Coordinates
            </h3>
            <button 
              onClick={handleResetFilters}
              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-wider cursor-pointer"
            >
              <RefreshCw size={10} /> Clear Filters
            </button>
          </div>

          {/* Crime type selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Crime Type</label>
            <select
              value={selectedCrimeType}
              onChange={(e) => setSelectedCrimeType(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-2.5 rounded-xl outline-none"
            >
              {crimeTypesList.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* District selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">District Division</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-2.5 rounded-xl outline-none"
            >
              {districtsList.map(dist => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Time range selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Time Filter</label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 p-2.5 rounded-xl outline-none"
            >
              {timeRangesList.map(time => (
                <option key={time.value} value={time.value}>{time.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Interactive SVG Karnataka Map (2 cols) */}
        <div className="xl:col-span-2 relative bg-slate-900 border border-slate-800 rounded-2xl h-[550px] shadow-xl overflow-hidden group">
          
          {/* HUD Overlay details */}
          <div className="absolute top-4 left-4 z-10 bg-slate-950/80 border border-slate-800 p-3 rounded-xl backdrop-blur-md">
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Map Status</div>
            <div className="text-xs font-bold text-white mt-1 flex items-center gap-1.5">
              <Map size={12} className="text-blue-400" /> Hotspots Displayed: {filteredHotspots.length}
            </div>
            <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
              Interactive geographic radar grid
            </div>
          </div>

          {/* SVG Map Canvas */}
          <svg className="w-full h-full select-none" viewBox="0 0 500 500">
            {/* Draw state boundary mesh guidelines */}
            <g className="stroke-slate-800 stroke-[1.5] fill-none">
              {/* Coast boundary guide */}
              <path d="M 180,100 L 190,150 L 180,220 L 195,300 L 190,340 L 230,420" strokeDasharray="3 3" />
              {/* Land boundary guide */}
              <path d="M 230,420 L 290,390 L 350,340 L 370,250 L 360,180 L 370,100 L 370,50" strokeDasharray="3 3" />
              {/* Inner district grid dividers */}
              <line x1={190} y1={340} x2={290} y2={390} strokeDasharray="5 5" className="stroke-slate-850" />
              <line x1={230} y1={210} x2={360} y2={180} strokeDasharray="5 5" className="stroke-slate-850" />
              <line x1={350} y1={340} x2={290} y2={390} strokeDasharray="5 5" className="stroke-slate-850" />
            </g>

            {/* Draw Districts label centers */}
            {districts.map(dist => (
              <g key={dist.id} transform={`translate(${dist.x}, ${dist.y})`}>
                <circle r={dist.radius} className="fill-slate-800/10 stroke-slate-800/30 stroke-[1px]" />
                <text 
                  y={4} 
                  className="text-[9px] font-bold text-slate-600 fill-slate-600 select-none pointer-events-none uppercase tracking-widest font-sans"
                  textAnchor="middle"
                >
                  {dist.name.split(' ')[0]}
                </text>
              </g>
            ))}

            {/* Draw Pulsing Hotspots */}
            {filteredHotspots.map(hot => {
              const severityColor = getSeverityColor(hot.severity);
              const isSelected = selectedHotspot?.id === hot.id;

              return (
                <g 
                  key={hot.id} 
                  transform={`translate(${hot.x}, ${hot.y})`}
                  onClick={() => setSelectedHotspot(hot)}
                  className="cursor-pointer transition-all duration-300 group"
                >
                  {/* Glowing pulsing radar ring */}
                  <circle r={8} className={`${severityColor} opacity-20`}>
                    <animate attributeName="r" values="8;20;8" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.1;0.8" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                  
                  {/* Radar central node */}
                  <circle 
                    r={isSelected ? 6 : 4.5} 
                    className={`${severityColor} stroke-slate-900 stroke-[1.5px] transition-all`} 
                  />
                  
                  {/* Tooltip on hover */}
                  <title>{hot.name} ({hot.crimeType})</title>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Side: Active FIR Drawer (1 col) */}
        <div className="xl:col-span-1 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[550px]">
          
          {selectedHotspot ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Drawer header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600/20 p-2 rounded-lg text-blue-400 border border-blue-500/20">
                     <MapPin size={14} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider font-display">Hotspot Incident List</span>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                
                {/* Hotspot details info */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{selectedHotspot.district}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                      selectedHotspot.severity === 'High' 
                        ? 'text-red-400 bg-red-900/20 border-red-500/30' 
                        : 'text-amber-400 bg-amber-900/20 border-amber-500/30'
                    }`}>
                      {selectedHotspot.severity} Risk
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-tight leading-snug">
                    {selectedHotspot.name}
                  </h3>
                  <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">Primary Crime: {selectedHotspot.crimeType}</p>
                </div>

                <div className="h-px bg-slate-800 my-2"></div>

                {/* Linked FIRs lists */}
                <div className="space-y-3">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Active Incident Files</div>
                  
                  {selectedHotspot.firs.map(firId => {
                    const c = getCaseDetails(firId);
                    if (!c) return null;

                    return (
                      <div 
                        key={firId}
                        onClick={() => navigate(`/cases/${c.id}`)}
                        className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-xl cursor-pointer transition-all group space-y-2.5"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white font-mono group-hover:text-blue-400 transition-colors">
                            {c.id}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">
                            {c.status}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-semibold text-slate-350 line-clamp-1">{c.title}</div>
                          <div className="text-[10px] text-slate-500 font-semibold">{c.officer}</div>
                        </div>
                        <div className="flex items-center justify-end text-[9px] font-bold text-blue-400 uppercase tracking-widest">
                          View Dossier <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
              
              {/* Bottom quick actions */}
              <div className="p-4 bg-slate-950 border-t border-slate-800">
                 <button 
                   onClick={() => navigate(`/cases/${selectedHotspot.firs[0]}`)}
                   className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md text-xs cursor-pointer font-sans"
                 >
                   <FileText size={14} /> Open Priority Dossier
                 </button>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <ShieldAlert size={32} className="mb-2 text-slate-600" />
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">No Active Hotspot</h4>
              <p className="text-[10px] mt-1 font-semibold max-w-[160px]">Click any pulsing radar point on the geographical grid to review incidents.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}


