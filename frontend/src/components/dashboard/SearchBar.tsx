import { Filter, Search } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  onFiltersClick?: () => void;
  filtersActive?: boolean;
  initialQuery?: string;
}

export function SearchBar({
  onSearch,
  placeholder = "Search by FIR number, complainant, or offense...",
  onFiltersClick,
  filtersActive = false,
  initialQuery = "",
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 transition-all duration-300 focus:border-cyan-accent/30 focus:bg-white/[0.06] focus:outline-none focus:ring-1 focus:ring-cyan-accent/20"
        />
      </div>
      <button
        type="button"
        onClick={onFiltersClick}
        disabled={!onFiltersClick}
        title={onFiltersClick ? "Toggle FIR filters" : "Filters unavailable"}
        className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-slate-300 transition-all duration-300 hover:border-cyan-accent/20 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Filter className="h-4 w-4" />
        {filtersActive ? "Filters On" : "Filters"}
      </button>
    </div>
  );
}
