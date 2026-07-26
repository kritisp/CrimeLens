import { useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { GlassCard } from "../components/ui/GlassCard";
import { currentUser } from "../data/mockData";
import { Shield, Lock, UserPlus, Eye, EyeOff, CheckCircle, XCircle, X, KeyRound } from "lucide-react";

interface AppSettings {
  emailAlerts: boolean;
  darkMode: boolean;
  aiSuggestions: boolean;
}

const SETTINGS_KEY = "fir-app-settings";
const defaultSettings: AppSettings = {
  emailAlerts: true,
  darkMode: true,
  aiSuggestions: true,
};

// Super Admin Panel Modal
function SuperAdminModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"auth" | "register">("auth");
  const [adminSecret, setAdminSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Registration form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Investigator");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; badge_id?: string } | null>(null);

  const handleSecretSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // We forward the secret to the register call — the backend validates it
    // But we can do a quick client-side pre-check to give instant feedback
    if (!adminSecret.trim()) {
      setAuthError("Please enter the Super Admin secret key.");
      return;
    }
    setAuthError(null);
    setStep("register");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    setIsSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admin_secret: adminSecret,
          email,
          password,
          full_name: fullName,
          role,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: data.message, badge_id: data.badge_id });
        // Reset form
        setFullName(""); setEmail(""); setPassword("");
      } else {
        setResult({ success: false, message: data.detail || "Registration failed." });
        // If forbidden, go back to auth step
        if (res.status === 403) setStep("auth");
      }
    } catch {
      setResult({ success: false, message: "Network error. Ensure backend is running." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-gradient-to-b from-slate-900 to-black shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-500/20 bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Shield className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-widest uppercase">Super Admin Console</h2>
              <p className="text-[10px] text-red-400 font-mono">RESTRICTED ACCESS — AUTHORIZED PERSONNEL ONLY</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {step === "auth" ? (
            <form onSubmit={handleSecretSubmit} className="space-y-4">
              <p className="text-sm text-slate-400 text-center">Enter the Super Admin secret key to access investigator registration.</p>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showSecret ? "text" : "password"}
                  value={adminSecret}
                  onChange={(e) => setAdminSecret(e.target.value)}
                  placeholder="Super Admin Secret Key"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 font-mono"
                />
                <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {authError && <p className="text-xs text-red-400 font-mono">{authError}</p>}
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 rounded-xl text-white text-sm font-bold tracking-wider transition-all shadow-lg shadow-red-900/30">
                AUTHENTICATE
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Register New Investigator</h3>
              </div>

              {result && (
                <div className={`p-3 rounded-xl border flex items-start gap-2 text-sm ${result.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                  {result.success ? <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" /> : <XCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                  <div>
                    <p>{result.message}</p>
                    {result.badge_id && <p className="font-mono text-xs mt-1">Auto-assigned Badge ID: <span className="text-white font-bold">{result.badge_id}</span></p>}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full Name (e.g. Inspector Sharma)"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Official Email (e.g. sharma@ksp.gov.in)"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set Password (min 8 characters)"
                    minLength={8} required
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <select
                  value={role} onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/50"
                >
                  <option value="Investigator">Investigator</option>
                  <option value="Inspector">Inspector</option>
                  <option value="Superintendent">Superintendent</option>
                  <option value="App Administrator">App Administrator</option>
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep("auth")} className="flex-1 py-3 border border-white/10 rounded-xl text-slate-400 text-sm hover:bg-white/5 transition-colors">
                  Back
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 disabled:opacity-50 rounded-xl text-white text-sm font-bold tracking-wider transition-all">
                  {isSubmitting ? "REGISTERING..." : "REGISTER OFFICER"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [saved, setSaved] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const handleToggle = (key: keyof AppSettings) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return next;
    });
  };

  return (
    <DashboardLayout>
      {showAdminModal && <SuperAdminModal onClose={() => setShowAdminModal(false)} />}

      <div className="grid-bg space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">Settings</h1>
            <p className="mt-1 text-sm text-slate-400">Profile preferences and workstation configuration.</p>
          </div>
          {/* Super Admin Access Tag */}
          <button
            onClick={() => setShowAdminModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-bold tracking-widest uppercase transition-all group"
          >
            <Lock className="h-3.5 w-3.5 group-hover:animate-pulse" />
            ⬡ Super Admin Access
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold text-white">Profile</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400">Name</span>
                <span className="text-white">{currentUser.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-3">
                <span className="text-slate-400">Role</span>
                <span className="text-white">{currentUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Badge</span>
                <span className="font-mono text-cyan-accent">{currentUser.badge}</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-sm font-semibold text-white">Preferences</h2>
            <div className="mt-4 space-y-4">
              {[
                { key: "emailAlerts" as const, label: "Email Alerts", description: "Receive FIR assignment and escalation notifications." },
                { key: "darkMode" as const, label: "Dark Command Theme", description: "Keep the cyber-police dark interface enabled." },
                { key: "aiSuggestions" as const, label: "AI Suggestions", description: "Show AI assistant prompts during FIR intake." },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={() => handleToggle(item.key)}
                    className="mt-1 h-4 w-4 accent-cyan-accent"
                  />
                </label>
              ))}
            </div>
            {saved && <p className="mt-4 text-sm text-emerald-400">Settings saved.</p>}
          </GlassCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
