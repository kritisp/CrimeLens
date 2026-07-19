import type { FIRPriority, FIRRecord, FIRStatus } from "../types";

export interface FIRFilterState {
  statuses: FIRStatus[];
  priorities: FIRPriority[];
}

export const emptyFIRFilters: FIRFilterState = {
  statuses: [],
  priorities: [],
};

export function filterFIRRecords(
  records: FIRRecord[],
  searchQuery: string,
  filters: FIRFilterState
) {
  const query = searchQuery.toLowerCase().trim();

  return records.filter((record) => {
    const matchesQuery =
      !query ||
      [
        record.firNumber,
        record.complainant,
        record.offense,
        record.station,
        record.officer,
      ].some((value) => value.toLowerCase().includes(query));

    const matchesStatus =
      filters.statuses.length === 0 || filters.statuses.includes(record.status);
    const matchesPriority =
      filters.priorities.length === 0 ||
      filters.priorities.includes(record.priority);

    return matchesQuery && matchesStatus && matchesPriority;
  });
}
