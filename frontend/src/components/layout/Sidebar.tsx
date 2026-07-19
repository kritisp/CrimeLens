import {
  BarChart3,
  Bot,
  FileBarChart,
  FilePlus,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LucideIcon,
  Map,
  Network,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { navItems } from "../../data/mockData";
 
const iconMap: Record<string, LucideIcon> = {
  "layout-dashboard": LayoutDashboard,
  "file-plus": FilePlus,
  "folder-open": FolderOpen,
  map: Map,
  network: Network,
  sparkles: Sparkles,
  "bar-chart-3": BarChart3,
  users: Users,
  "file-bar-chart": FileBarChart,
  settings: Settings,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const sidebarContent = (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent to-cyan-glow shadow-glow">
          <FileText className="h-5 w-5 text-navy-950" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="truncate text-sm font-semibold text-white">
              KSP FIR Command
            </p>
            <p className="truncate text-xs text-slate-500">Karnataka Police HQ (SCRB)</p>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item, index) => {
          const Icon = iconMap[item.icon] ?? LayoutDashboard;

          return (
            <NavLink
              key={item.label}
              to={item.href}
              end={item.href === "/"}
              onClick={onMobileClose}
              style={{ animationDelay: `${index * 50}ms` }}
              className={({ isActive }) =>
                [
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 animate-slide-in",
                  isActive
                    ? "bg-cyan-accent/10 text-cyan-accent shadow-glow"
                    : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
                  collapsed ? "justify-center" : "",
                ].join(" ")
              }
              title={collapsed ? item.label : undefined}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-cyan-accent" : ""}`}
                  />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-left">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="rounded-full bg-cyan-accent/10 px-2 py-0.5 text-xs text-cyan-accent">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl border border-cyan-accent/20 bg-cyan-accent/5 p-3">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-cyan-accent" />
              <span className="text-xs font-medium text-cyan-accent">
                AI Assistant Active
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              847 cases analyzed this week
            </p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-navy-900/80 backdrop-blur-xl transition-all duration-300 lg:relative lg:translate-x-0",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {sidebarContent}

        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-20 hidden h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-navy-800 text-slate-400 transition-colors hover:border-cyan-accent/30 hover:text-cyan-accent lg:flex"
        >
          <span className="text-xs">{collapsed ? "›" : "‹"}</span>
        </button>
      </aside>
    </>
  );
}
