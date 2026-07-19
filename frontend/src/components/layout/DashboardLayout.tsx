import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { VoiceCommander } from "../dashboard/VoiceCommander";

interface DashboardLayoutProps {
  children: ReactNode;
  mainClassName?: string;
}

export function DashboardLayout({ children, mainClassName }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onMenuClick={() => setMobileOpen(true)} />
        <main className={`flex-1 overflow-auto p-4 lg:p-6 ${mainClassName ?? ""}`}>
          {children}
        </main>
      </div>
      <VoiceCommander />
    </div>
  );
}
