export type FIRStatus = "pending" | "investigating" | "solved" | "closed";

export type FIRPriority = "low" | "medium" | "high" | "critical";

export interface FIRRecord {
  id: string;
  firNumber: string;
  complainant: string;
  offense: string;
  station: string;
  officer: string;
  date: string;
  status: FIRStatus;
  priority: FIRPriority;
}

export interface StatCardData {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: string;
  href: string;
}

export interface NavItem {
  label: string;
  icon: string;
  href: string;
  badge?: string;
}

export interface QuickAction {
  label: string;
  description: string;
  icon: string;
  variant: "primary" | "secondary";
  href: string;
}
