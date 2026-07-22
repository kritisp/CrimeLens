import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { RecentFIRTable } from "../components/dashboard/RecentFIRTable";
import { SearchBar } from "../components/dashboard/SearchBar";
import { FIRFiltersPanel } from "../components/dashboard/FIRFiltersPanel";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { recentFIRs } from "../data/mockData";
import type { FIRPriority, FIRStatus } from "../types";
import { parseStatusParam } from "../utils/urlParams";

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

export function Cases() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("query") ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilters, setStatusFilters] = useState<FIRStatus[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<FIRPriority[]>([]);

  const selectedId = searchParams.get("selected");

  useEffect(() => {
    if (selectedId) {
      navigate(`/cases/${selectedId}`);
      return;
    }
    const query = searchParams.get("query") ?? "";
    const status = parseStatusParam(searchParams.get("status"));

    setSearchQuery(query);
    setStatusFilters(status ? [status] : []);
    setShowFilters(Boolean(status));
  }, [searchParams, selectedId, navigate]);

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  return (
    <DashboardLayout>
      <div className="grid-bg space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
            All Cases
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Search and filter FIRs across stations, officers, and priority levels. Click any case record to open in a dedicated full page dossier view.
          </p>
        </div>

        <SearchBar
          initialQuery={searchQuery}
          onSearch={(value) => {
            setSearchQuery(value);
            updateSearchParams({ query: value.trim() || null });
          }}
          onFiltersClick={() => setShowFilters((prev) => !prev)}
          filtersActive={showFilters || statusFilters.length > 0 || priorityFilters.length > 0}
          placeholder="Search by FIR number, complainant, station, or officer..."
        />

        {showFilters && (
          <FIRFiltersPanel
            statusFilters={statusFilters}
            priorityFilters={priorityFilters}
            onToggleStatus={(status) => {
              const next = toggleValue(statusFilters, status);
              setStatusFilters(next);
              updateSearchParams({
                status: next.length === 1 ? next[0] : null,
              });
            }}
            onTogglePriority={(priority) =>
              setPriorityFilters((prev) => toggleValue(prev, priority))
            }
          />
        )}

        <RecentFIRTable
          records={recentFIRs}
          searchQuery={searchQuery}
          statusFilters={statusFilters}
          priorityFilters={priorityFilters}
          selectedId={selectedId}
          onSelectRecord={(id) => navigate(`/cases/${id}`)}
        />
      </div>
    </DashboardLayout>
  );
}
