import { useEffect, useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { GlassCard } from "../components/ui/GlassCard";
import { currentUser } from "../data/mockData";

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

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    setSaved(true);
    const timer = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(timer);
  }, [settings]);

  return (
    <DashboardLayout>
      <div className="grid-bg space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-slate-400">
            Profile preferences and workstation configuration.
          </p>
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
                {
                  key: "emailAlerts" as const,
                  label: "Email Alerts",
                  description: "Receive FIR assignment and escalation notifications.",
                },
                {
                  key: "darkMode" as const,
                  label: "Dark Command Theme",
                  description: "Keep the cyber-police dark interface enabled.",
                },
                {
                  key: "aiSuggestions" as const,
                  label: "AI Suggestions",
                  description: "Show AI assistant prompts during FIR intake.",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings[item.key]}
                    onChange={(e) =>
                      setSettings((prev) => ({ ...prev, [item.key]: e.target.checked }))
                    }
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
