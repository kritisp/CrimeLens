import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Eye, 
  EyeOff,
  Lock, 
  User, 
  ChevronDown, 
  Network, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Clear localStorage on login page mount
  useEffect(() => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('badgeId');
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password || !role) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    
    // Simulate network request for authentic feel
    setTimeout(() => {
      setIsLoading(false);
      
      // Store user details for custom rendering in Dashboard layout
      localStorage.setItem('userRole', role);
      localStorage.setItem('username', username);
      
      const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const badgeId = cleanUsername.startsWith('KSP') ? cleanUsername : `KSP-${cleanUsername}`;
      localStorage.setItem('badgeId', badgeId);

      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex selection:bg-blue-600/30 selection:text-blue-100 font-sans">
      
      {/* LEFT SECTION - Branding & Info */}
      <div className="hidden lg:flex w-[55%] relative overflow-hidden bg-slate-950 flex-col justify-between p-12 xl:p-16 border-r border-slate-900">
        
        {/* Background Decorative Elements for "AI/Data" feel */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        <div className="absolute top-0 right-0 -mr-48 -mt-48 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute bottom-0 left-0 -ml-48 -mb-48 w-96 h-96 bg-cyan-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-15"></div>

        {/* Header / Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-3 rounded-2xl shadow-lg shadow-blue-500/20 text-white border border-blue-500/30">
            <Shield size={32} className="stroke-[2.5]" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight font-display">CrimeLens AI</span>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/60 border border-blue-900/50 text-blue-400 text-sm font-medium mb-8 backdrop-blur-sm">
            <Network size={16} />
            <span>Secure Intelligence Network</span>
          </div>
          <h1 className="text-5xl xl:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
            AI Powered Crime <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Intelligence Platform</span>
          </h1>
          <p className="text-slate-400 text-lg xl:text-xl leading-relaxed max-w-lg font-light">
            Helping investigators discover hidden crime patterns, criminal networks, and actionable investigative leads through advanced analytical models.
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-900 pt-8 mt-12">
          <div className="flex flex-col">
            <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">Authorized Use Only</span>
            <span className="text-white font-medium mt-1">Government of Karnataka</span>
          </div>
          <div className="opacity-40 grayscale hover:opacity-75 transition-opacity">
             <div className="w-12 h-12 rounded-full border border-slate-800 flex items-center justify-center bg-slate-900/50">
                <Shield size={20} className="text-slate-400" />
             </div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION - Login Card */}
      <div className="w-full lg:w-[45%] flex flex-col justify-center items-center p-6 sm:p-12 relative bg-slate-950">
        
        {/* Mobile Logo (hidden on desktop) */}
        <div className="lg:hidden flex items-center gap-3 mb-10 w-full max-w-md">
          <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/30 text-white">
            <Shield size={24} className="stroke-[2.5]" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">CrimeLens AI</span>
        </div>

        <div className="w-full max-w-md">
          
          {/* Form Header */}
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-3 tracking-tight">Secure Access</h2>
            <p className="text-slate-400 text-sm">Please authenticate with your official credentials.</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            
            {error && (
              <div className="p-4 bg-red-950/40 border border-red-900/60 rounded-2xl flex items-start gap-3 text-red-300 text-sm font-medium">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Username / Badge ID</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-500" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  placeholder="Enter badge ID (e.g. KSP-1284)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-slate-300">Passphrase</label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-500" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-11 pr-12 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Role Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300 ml-1">Assigned Role</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Shield size={18} className="text-slate-500" />
                </div>
                <select
                  required
                  className="block w-full pl-11 pr-10 py-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm appearance-none font-medium"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="" disabled className="text-slate-500">Select clearance level...</option>
                  <option value="investigator">Investigator</option>
                  <option value="crime-analyst">Crime Analyst</option>
                  <option value="supervisor">Supervisor</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-between mt-2 ml-1">
               <div></div> 
               <a href="#" className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline underline-offset-4 transition-all">
                  Forgot Password?
                </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed group mt-8"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                <>
                  Secure Login
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            
          </form>
          
          {/* Mobile Footer */}
          <div className="mt-12 text-center lg:hidden text-sm text-slate-500 font-medium">
            Government of Karnataka
          </div>
        </div>
      </div>
    </div>
  );
}
