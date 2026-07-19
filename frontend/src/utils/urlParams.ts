import type { FIRStatus } from "../types";

export function parseStatusParam(value: string | null): FIRStatus | null {
  if (
    value === "pending" ||
    value === "investigating" ||
    value === "solved" ||
    value === "closed"
  ) {
    return value;
  }
  return null;
}
