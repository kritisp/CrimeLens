import { ChevronDown, LogOut, Settings, User, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { currentUser } from "../../data/mockData";
import { clearConversationStorage } from "../../utils/conversationStorage";

export function UserDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const menuItems: Array<{
    icon: LucideIcon;
    label: string;
    onClick: () => void;
  }> = [
    {
      icon: User,
      label: "Profile",
      onClick: () => {
        navigate("/settings");
        setOpen(false);
      },
    },
    {
      icon: Settings,
      label: "Settings",
      onClick: () => {
        navigate("/settings");
        setOpen(false);
      },
    },
    {
      icon: LogOut,
      label: "Sign out",
      onClick: () => {
        clearConversationStorage();
        localStorage.removeItem("saved-fir-draft");
        localStorage.removeItem("fir-app-settings");
        setOpen(false);
        navigate("/");
      },
    },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 transition-all duration-300 hover:border-cyan-accent/30 hover:bg-white/[0.06]"
        aria-label="Open user menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-accent to-cyan-glow text-xs font-bold text-navy-950">
          {currentUser.avatar}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium text-white">{currentUser.name}</p>
          <p className="text-xs text-slate-400">{currentUser.role}</p>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 animate-fade-in overflow-hidden rounded-xl border border-white/10 bg-navy-850/95 shadow-glass backdrop-blur-xl">
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-sm font-medium text-white">{currentUser.name}</p>
            <p className="text-xs text-slate-400">Badge: {currentUser.badge}</p>
          </div>
          <div className="p-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
