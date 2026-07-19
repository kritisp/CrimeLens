import type { FIRDraftPayload } from "../types/chat";

const REQUIRED_KEYS: (keyof FIRDraftPayload)[] = [
  "crime_type",
  "incident_summary",
  "date_time",
  "location",
  "complainant_details",
  "suspect_details",
  "evidence",
  "final_fir_draft",
];

export function parseFirDraftPayload(rawText: string): FIRDraftPayload {
  try {
    const parsed = JSON.parse(rawText) as Partial<FIRDraftPayload>;

    if (
      parsed &&
      typeof parsed === "object" &&
      REQUIRED_KEYS.every((key) => typeof parsed[key] === "string")
    ) {
      return parsed as FIRDraftPayload;
    }
  } catch {
    // Fall through to the text-only fallback.
  }

  return {
    crime_type: "",
    incident_summary: "",
    date_time: "",
    location: "",
    complainant_details: "",
    suspect_details: "",
    evidence: "",
    final_fir_draft: rawText,
  };
}

export function serializeDraftForDownload(draft: FIRDraftPayload): string {
  return [
    `Crime Type: ${draft.crime_type}`,
    `Incident Summary: ${draft.incident_summary}`,
    `Date & Time: ${draft.date_time}`,
    `Location: ${draft.location}`,
    `Complainant Details: ${draft.complainant_details}`,
    `Suspect Details: ${draft.suspect_details}`,
    `Evidence: ${draft.evidence}`,
    "",
    draft.final_fir_draft,
  ].join("\n");
}
