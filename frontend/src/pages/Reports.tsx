import { Download, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { GlassCard } from "../components/ui/GlassCard";
import { reports } from "../data/mockData";

function downloadReport(title: string, description: string) {
  const content = `${title}\n\n${description}\n\nGenerated from Police FIR Management System`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${title.toLowerCase().replace(/\s+/g, "-")}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function Reports() {
  return (
    <DashboardLayout>
      <div className="grid-bg space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">Reports</h1>
          <p className="mt-1 text-sm text-slate-400">
            Operational summaries and downloadable review reports.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {reports.map((report) => (
            <GlassCard key={report.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold text-white">{report.title}</h2>
                  <p className="mt-2 text-sm text-slate-400">{report.description}</p>
                  <p className="mt-3 text-xs text-slate-500">Updated {report.updatedAt}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  to={report.href}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition-colors hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => downloadReport(report.title, report.description)}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-accent/30 bg-cyan-accent/10 px-4 py-2 text-sm font-medium text-cyan-accent transition-colors hover:bg-cyan-accent/20"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
