import { ArrowUpRight, MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { FIRRecord } from "../../types";
import { Badge } from "../ui/Badge";
import { GlassCard } from "../ui/GlassCard";
import { filterFIRRecords } from "../../utils/firFilters";

interface RecentFIRTableProps {
  records: FIRRecord[];
  searchQuery?: string;
  statusFilters?: FIRRecord["status"][];
  priorityFilters?: FIRRecord["priority"][];
  onViewAll?: () => void;
  selectedId?: string | null;
  onSelectRecord?: (id: string) => void;
}

export function RecentFIRTable({
  records,
  searchQuery = "",
  statusFilters = [],
  priorityFilters = [],
  onViewAll,
  selectedId = null,
  onSelectRecord,
}: RecentFIRTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return filterFIRRecords(records, searchQuery, {
      statuses: statusFilters,
      priorities: priorityFilters,
    });
  }, [priorityFilters, records, searchQuery, statusFilters]);

  return (
    <GlassCard className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-white">Recent FIRs</h2>
          <p className="text-xs text-slate-500">
            {filtered.length} records found
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAll ?? (() => navigate("/cases"))}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-cyan-accent transition-colors hover:bg-cyan-accent/10"
        >
          View all
          <ArrowUpRight className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3 font-medium">FIR Number</th>
              <th className="px-5 py-3 font-medium">Complainant</th>
              <th className="px-5 py-3 font-medium">Offense</th>
              <th className="px-5 py-3 font-medium">Station</th>
              <th className="px-5 py-3 font-medium">Officer</th>
              <th className="px-5 py-3 font-medium">Date</th>
              <th className="px-5 py-3 font-medium">Priority</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((record) => (
              <tr
                key={record.id}
                onMouseEnter={() => setHoveredRow(record.id)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onSelectRecord?.(record.id)}
                className={`cursor-pointer border-b border-white/[0.03] transition-all duration-200 ${
                  selectedId === record.id
                    ? "bg-cyan-accent/[0.08]"
                    : hoveredRow === record.id
                      ? "bg-cyan-accent/[0.04]"
                      : "hover:bg-white/[0.02]"
                }`}
              >
                <td className="px-5 py-3.5">
                  <span className="font-mono text-sm font-medium text-cyan-accent">
                    {record.firNumber}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-300">
                  {record.complainant}
                </td>
                <td className="max-w-[200px] truncate px-5 py-3.5 text-sm text-slate-400">
                  {record.offense}
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-400">
                  {record.station}
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-400">
                  {record.officer}
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-500">
                  {record.date}
                </td>
                <td className="px-5 py-3.5">
                  <Badge
                    label={record.priority}
                    variant="priority"
                    priority={record.priority}
                  />
                </td>
                <td className="px-5 py-3.5">
                  <Badge
                    label={record.status}
                    variant="status"
                    status={record.status}
                  />
                </td>
                <td className="px-5 py-3.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      if (onSelectRecord) {
                        onSelectRecord(record.id);
                      } else {
                        navigate(`/cases?selected=${record.id}`);
                      }
                    }}
                    className={`rounded-lg p-1.5 text-slate-500 transition-all duration-200 ${
                      hoveredRow === record.id
                        ? "opacity-100 hover:bg-white/[0.06] hover:text-white"
                        : "opacity-0"
                    }`}
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            No FIR records match your search.
          </div>
        )}
      </div>
    </GlassCard>
  );
}
