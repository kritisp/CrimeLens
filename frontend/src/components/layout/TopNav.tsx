import { Bell, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { notifications as notificationItems } from "../../data/mockData";
import { UserDropdown } from "../ui/UserDropdown";

interface TopNavProps {
  onMenuClick: () => void;
}

export function TopNav({ onMenuClick }: TopNavProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const unreadCount = notificationItems.filter((item) => !item.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-navy-900/60 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              placeholder="Search FIRs, cases, officers..."
              onKeyDown={(event) => {
                if (event.key === "Enter" && event.currentTarget.value.trim()) {
                  navigate(
                    `/cases?query=${encodeURIComponent(event.currentTarget.value.trim())}`
                  );
                }
              }}
              className="w-64 rounded-xl border border-white/10 bg-white/[0.04] py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 transition-all duration-300 focus:w-80 focus:border-cyan-accent/30 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-accent/20 lg:w-72 lg:focus:w-96"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div ref={panelRef} className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="relative rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-slate-400 transition-all duration-300 hover:border-cyan-accent/20 hover:bg-white/[0.06] hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-accent text-[10px] font-bold text-navy-950">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-white/10 bg-navy-850/95 shadow-glass backdrop-blur-xl">
                <div className="border-b border-white/10 px-4 py-3">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <p className="text-xs text-slate-400">Recent FIR updates and alerts</p>
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {notificationItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      <p>{item.message}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{item.time}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <UserDropdown />
        </div>
      </div>
    </header>
  );
}
