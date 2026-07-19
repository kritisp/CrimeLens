import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SearchBar } from "../components/dashboard/SearchBar";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { GlassCard } from "../components/ui/GlassCard";
import { officers } from "../data/mockData";

export function Officers() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return officers;
    return officers.filter(
      (officer) =>
        officer.name.toLowerCase().includes(normalized) ||
        officer.badge.toLowerCase().includes(normalized) ||
        officer.station.toLowerCase().includes(normalized)
    );
  }, [query]);

  return (
    <DashboardLayout>
      <div className="grid-bg space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">Officers</h1>
          <p className="mt-1 text-sm text-slate-400">
            Investigating officers, stations, and active case load.
          </p>
        </div>

        <SearchBar
          initialQuery={query}
          onSearch={setQuery}
          placeholder="Search officers by name, badge, or station..."
        />

        <GlassCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3">Officer</th>
                  <th className="px-5 py-3">Badge</th>
                  <th className="px-5 py-3">Station</th>
                  <th className="px-5 py-3">Active Cases</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((officer) => (
                  <tr key={officer.id} className="border-b border-white/[0.03]">
                    <td className="px-5 py-4 text-sm text-white">{officer.name}</td>
                    <td className="px-5 py-4 font-mono text-sm text-slate-400">
                      {officer.badge}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-400">{officer.station}</td>
                    <td className="px-5 py-4 text-sm text-slate-300">{officer.activeCases}</td>
                    <td className="px-5 py-4 text-sm capitalize text-cyan-accent">
                      {officer.status.replace("-", " ")}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        to={`/cases?query=${encodeURIComponent(officer.name)}`}
                        className="text-xs font-medium text-cyan-accent hover:underline"
                      >
                        View Cases
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </DashboardLayout>
  );
}
