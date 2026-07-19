import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Brain,
  Video,
  BarChart3,
  Car,
  Fingerprint,
  ScanFace,
  Network as NetworkIcon,
  Mic,
  FileText,
  TrendingUp,
  MapPin,
  Folder,
  Share2,
  User,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ShieldCheck,
  Activity,
} from "lucide-react";

export function Login() {
  const navigate = useNavigate();
  const [badgeId, setBadgeId] = useState("KSP-04213");
  const [passcode, setPasscode] = useState("admin123");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Animation Refs
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const angleOffsetRef = useRef(0);

  // Generate random twinkling stars
  const stars = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 1.5 + 1.2, // Between 1.2px and 2.7px
      delay: `${Math.random() * 6}s`,
      duration: `${3 + Math.random() * 5}s`,
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeId.trim() || !passcode.trim()) return;

    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      navigate("/dashboard");
    }, 1000); // 1.0s allows the Earth spin & zoom animation to complete
  }, [badgeId, passcode, navigate]);

  // Capabilities with dual-line text matching the mock
  const capabilities = [
    { icon: Brain, line1: "AI", line2: "INVESTIGATION" },
    { icon: Video, line1: "CCTV", line2: "ANALYSIS" },
    { icon: BarChart3, line1: "CRIME", line2: "ANALYTICS" },
    { icon: Car, line1: "VEHICLE", line2: "INTELLIGENCE" },
    { icon: Fingerprint, line1: "DIGITAL", line2: "FORENSICS" },
    { icon: ScanFace, line1: "FACIAL", line2: "RECOGNITION" },
    { icon: NetworkIcon, line1: "KNOWLEDGE", line2: "GRAPH" },
    { icon: Folder, line1: "EVIDENCE", line2: "PROCESSING" },
    { icon: MapPin, line1: "HEAT", line2: "MAPS" },
    { icon: TrendingUp, line1: "PREDICTIVE", line2: "ANALYTICS" },
    { icon: FileText, line1: "CASE", line2: "CORRELATION" },
    { icon: Mic, line1: "VOICE", line2: "INTELLIGENCE" },
    { icon: Share2, line1: "CRIMINAL", line2: "NETWORK" }
  ];

  // High-performance requestAnimationFrame loop for 3D Orbit projection
  useEffect(() => {
    let animId: number;

    const updatePositions = () => {
      angleOffsetRef.current += 0.0012; // Controls rotation speed

      const width = window.innerWidth;
      const height = window.innerHeight;

      // Orbit center (centered around Earth position)
      const cx = width / 2;
      const cy = height / 2 + 50;

      // Tilted ellipse radii
      const rx = width * 0.44;
      const ry = height * 0.32;

      capabilities.forEach((_, idx) => {
        const el = nodeRefs.current[idx];
        if (!el) return;

        const baseAngle = (idx * 2 * Math.PI) / capabilities.length;
        const angle = baseAngle + angleOffsetRef.current;

        // Polar coordinates calculation
        const x = cx + Math.cos(angle) * rx;
        const y = cy + Math.sin(angle) * ry;

        // Depth perspective mapping based on sine wave
        const depth = (Math.sin(angle) + 1) / 2; // Normalized range [0..1]
        const scale = 0.72 + depth * 0.32; // Scale bounds
        const opacity = 0.25 + depth * 0.75; // Opacity bounds

        // Back elements render behind center login card (zIndex < 10)
        // Front elements render in front of center login card (zIndex >= 10)
        const zIndex = Math.round(depth * 20) + 1;

        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.transform = `translate(-50%, -50%) scale(${scale})`;
        el.style.opacity = `${opacity}`;
        el.style.zIndex = `${zIndex}`;
      });

      animId = requestAnimationFrame(updatePositions);
    };

    animId = requestAnimationFrame(updatePositions);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-black overflow-hidden flex items-center justify-center p-4 font-mono select-none">
      {/* Inject Twinkle Keyframes */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.7); }
          50% { opacity: 0.95; transform: scale(1.35); }
        }
      `}</style>

      {/* Twinkling Stars Background Layer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute bg-white rounded-full opacity-[0.25]"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              boxShadow: "0 0 5px rgba(255, 255, 255, 0.8)",
              animation: `twinkle ${star.duration} infinite ease-in-out`,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      {/* Earth Background Layer with Spin, Zoom, and delayed Fade transitions */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(10, 15, 30, 0.1) 0%, rgba(2, 4, 12, 0.95) 100%), url('/earthBg.jpg')",
          transform: isAuthenticating 
            ? "scale(2.2) rotate(180deg)" 
            : "scale(1.0) rotate(0deg)",
          opacity: isAuthenticating ? 0 : 1,
          filter: isAuthenticating 
            ? "brightness(1.4) contrast(1.1)" 
            : "brightness(1.0) contrast(1.0)",
          transition: isAuthenticating
            ? "transform 1000ms ease-in-out, filter 1000ms ease-in-out, opacity 400ms ease-in-out 600ms"
            : "transform 600ms ease-in-out, filter 600ms ease-in-out, opacity 600ms ease-in-out",
        }}
      />

      {/* HUD Grid Overlay */}
      <div className={`absolute inset-0 bg-[linear-gradient(to_right,#00d9ff03_1px,transparent_1px),linear-gradient(to_bottom,#00d9ff03_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none z-0 transition-opacity duration-300 ${isAuthenticating ? "opacity-0" : "opacity-100"}`} />

      {/* Top Header Section */}
      <div className={`absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center text-center pointer-events-none z-10 transition-all duration-300 ${isAuthenticating ? "opacity-0 scale-95" : "opacity-100"}`}>
        {/* Karnataka State Police Gold/Red Crest Emblem */}
        <svg className="w-16 h-16 drop-shadow-[0_0_12px_rgba(218,165,32,0.4)]" viewBox="0 0 100 100">
          <circle cx="50" cy="52" r="34" fill="none" stroke="#d4af37" strokeWidth="1.5" />
          <path d="M50,15 L62,25 L58,58 L50,68 L42,58 L38,25 Z" fill="rgba(139, 0, 0, 0.85)" stroke="#d4af37" strokeWidth="2" />
          {/* Double Headed Gandaberunda Bird Silhouette */}
          <path d="M47,28 C45,28 43,30 43,32 C43,34 45,36 47,36 L48,36 L48,46 L45,49 L45,43 L42,43 C42,40 40,38 38,38 C36,38 34,40 34,43 L36,45 L38,45 C38,47 40,49 42,49 L43,49 L43,53 L47,56 L47,58 L50,58 L53,58 L53,56 L57,53 L57,49 L58,49 C60,49 62,47 62,45 L64,45 L66,43 C66,40 64,38 62,38 C60,38 58,40 58,43 L55,43 L55,49 L52,46 L52,36 L53,36 C55,36 57,34 57,32 C57,30 55,28 53,28 Z" fill="#d4af37" />
          {/* Lion Capital of Ashoka top element */}
          <path d="M46,12 L54,12 L52,15 L48,15 Z" fill="#d4af37" />
          <circle cx="50" cy="9" r="2.5" fill="#d4af37" />
        </svg>
        <h1 className="text-white text-lg font-black tracking-[0.25em] uppercase mt-3">
          Karnataka State Police
        </h1>
        <h2 className="text-cyan-400 text-[10px] tracking-[0.35em] uppercase font-bold mt-1">
          AI Crime Intelligence Platform
        </h2>
      </div>

      {/* Top Left Status */}
      <div className={`absolute top-6 left-8 flex items-center gap-2 pointer-events-none z-10 transition-opacity duration-300 ${isAuthenticating ? "opacity-0" : "opacity-100"}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <div className="text-left font-mono">
          <div className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider">Secure Network</div>
          <div className="text-[9px] text-slate-300 uppercase tracking-widest font-black">Online</div>
        </div>
      </div>

      {/* Top Right Status */}
      <div className={`absolute top-6 right-8 flex items-center gap-2 pointer-events-none z-10 text-right transition-opacity duration-300 ${isAuthenticating ? "opacity-0" : "opacity-100"}`}>
        <div className="font-mono">
          <div className="text-[7.5px] text-slate-500 font-bold uppercase tracking-wider">System Status</div>
          <div className="text-[9px] text-emerald-400 uppercase tracking-widest font-black flex items-center justify-end gap-1">
            <span className="w-1 h-3 bg-emerald-500/40 rounded-full inline-block animate-[pulse_1s_infinite_200ms]" />
            <span className="w-1 h-2 bg-emerald-500/40 rounded-full inline-block animate-[pulse_1s_infinite_400ms]" />
            Operational
          </div>
        </div>
      </div>

      {/* Fading Orbit system wrapper */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-[400ms] ${isAuthenticating ? "opacity-0 scale-75" : "opacity-100"}`}>
        {/* Orbit Rings behind nodes */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
          <ellipse 
            cx="50%" 
            cy="calc(50% + 50px)" 
            rx="44vw" 
            ry="32vh" 
            fill="none" 
            stroke="rgba(6, 182, 212, 0.12)" 
            strokeWidth="1.5" 
            strokeDasharray="6 4"
          />
          <ellipse 
            cx="50%" 
            cy="calc(50% + 50px)" 
            rx="46vw" 
            ry="34vh" 
            fill="none" 
            stroke="rgba(99, 102, 241, 0.06)" 
            strokeWidth="1.2" 
          />
        </svg>

        {/* Revolving Orbit Nodes */}
        {capabilities.map((cap, idx) => {
          const Icon = cap.icon;
          return (
            <div
              key={idx}
              ref={(el) => { nodeRefs.current[idx] = el; }}
              className="absolute p-2 rounded-xl border border-cyan-500/20 bg-slate-950/80 backdrop-blur-md flex items-center gap-2.5 hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all duration-300 cursor-pointer w-44 select-none pointer-events-auto"
              style={{
                boxShadow: "0 4px 12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)"
              }}
            >
              <div className="h-7 w-7 rounded-lg border border-cyan-500/25 bg-cyan-950/20 flex items-center justify-center text-cyan-400">
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-left font-mono">
                <div className="text-[10px] font-black text-white tracking-wide uppercase leading-tight">
                  {cap.line1}
                </div>
                <div className="text-[8px] font-bold text-cyan-400/80 tracking-widest uppercase leading-none mt-0.5">
                  {cap.line2}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Center Glassmorphic Card (zIndex = 10) */}
      <main className={`relative z-10 w-full max-w-md px-6 transition-all duration-300 ${isAuthenticating ? "opacity-0 scale-95 pointer-events-none" : "opacity-100"}`}>
        <div 
          className="rounded-3xl border border-white/10 bg-slate-950/75 p-9 backdrop-blur-xl space-y-6 relative overflow-hidden"
          style={{
            boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.08), 0 25px 60px rgba(0, 0, 0, 0.9)"
          }}
        >
          {/* Top Lock Badge Icon */}
          <div className="flex justify-center">
            <div className="h-10 w-10 rounded-full border border-cyan-500/35 bg-cyan-950/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>

          <div className="text-center space-y-2">
            <span className="text-[8.5px] font-black text-cyan-400 uppercase tracking-[0.25em]">Secure Officer Authentication</span>
            <h3 className="text-2xl font-black text-white tracking-wide">Welcome, Officer</h3>
            <p className="text-[10px] text-slate-500 tracking-wider">Access restricted to authorized personnel only</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Officer ID */}
            <div className="space-y-1.5">
              <label className="block text-slate-400 uppercase font-black text-[8px] tracking-wider ml-1">Officer ID</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-cyan-400 transition-colors">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  placeholder="e.g. KSP-04213"
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-3.5 pl-10 pr-4 text-slate-200 placeholder-slate-700 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-slate-400 uppercase font-black text-[8px] tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600 group-focus-within:text-cyan-400 transition-colors">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-3.5 pl-10 pr-10 text-slate-200 placeholder-slate-700 outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/20 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3.5 top-3.5 text-slate-600 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember device & Forgot password */}
            <div className="flex items-center justify-between px-1 text-[9.5px]">
              <label className="flex items-center gap-1.5 text-slate-500 hover:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="rounded border-white/10 bg-black/60 text-cyan-500 focus:ring-0 accent-cyan-500"
                />
                Remember this device
              </label>
              <a href="#" className="font-bold text-cyan-400/50 hover:text-cyan-400 transition-colors uppercase tracking-wider">
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold uppercase tracking-[0.2em] text-xs transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.35)] disabled:opacity-50 mt-5 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAuthenticating ? (
                <>
                  <Activity className="h-4 w-4 animate-spin text-white" />
                  Authenticating...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Secure Login
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Legal Warning Footer inside Card */}
          <div className="text-center pt-2 font-mono text-[8px] text-slate-600 leading-relaxed uppercase tracking-wider border-t border-white/5 pt-4">
            Unauthorized access is a punishable offence under the IT Act, 2000
          </div>
        </div>
      </main>

      {/* Bottom Left Initializing Log Checklist */}
      <div className={`absolute bottom-8 left-8 flex flex-col gap-1.5 font-mono text-[9px] text-slate-500 pointer-events-none z-10 text-left transition-all duration-300 ${isAuthenticating ? "opacity-0" : "opacity-100"}`}>
        <div className="text-[10px] font-black text-white/50 tracking-wider mb-1">System Initializing...</div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-bold">✓</span> Loading AI Models
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-bold">✓</span> Connecting Secure Network
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-bold">✓</span> Verifying Credentials
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-bold">✓</span> Loading Intelligence Database
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-emerald-400 font-bold">✓</span> Establishing Encrypted Tunnel
        </div>
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" /> Access Gateway Ready
        </div>
      </div>

      {/* Bottom Center Ticker */}
      <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-10 transition-all duration-300 ${isAuthenticating ? "opacity-0" : "opacity-100"}`}>
        <div className="text-[8.5px] text-slate-500 uppercase tracking-widest">Command Access Gateway</div>
        {/* Progress dots bar */}
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-500/30" />
        </div>
      </div>

      {/* Global Footer Status Bar */}
      <footer className={`absolute bottom-3 left-0 right-0 px-8 flex items-center justify-between font-mono text-[9px] text-slate-600 pointer-events-none z-10 transition-all duration-300 ${isAuthenticating ? "opacity-0" : "opacity-100"}`}>
        <div>IP SECURE: 117.197.XX.XX</div>
        <div className="flex items-center gap-1.5 uppercase font-bold text-[8.5px]">
          <Lock className="h-3 w-3 text-emerald-500" /> Encrypted Connection Established
        </div>
        <div className="flex items-center gap-1">
          BUILD 2.4.7 VERIFIED <span className="text-emerald-400 font-bold">✓</span>
        </div>
      </footer>
    </div>
  );
}
