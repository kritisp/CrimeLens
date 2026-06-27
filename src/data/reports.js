// CrimeLens AI - Mock Intelligence Reports Database
// Raw structured text, matrices, and metrics representing official KSP generated reports

export const mockInvestigationReport = {
  caseId: "FIR-1024",
  title: "Organized Vehicle Theft - Indiranagar Division",
  classification: "CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE",
  department: "KARNATAKA STATE POLICE (CRIME BRANCH)",
  officer: "Insp. Vikram Rao (KSP-4821)",
  dateGenerated: "2026-06-28",
  summary: "This document compiles the intelligence dossier regarding the theft of a white Hyundai Creta (KA-03-MB-4432) from Indiranagar. Modus operandi analysis strongly correlates this heist with the 'Phantom Syndicate' due to keyless relay signal cloning. Cellular dumps and CCTV gait matches place prime suspect Ravi 'Bouncer' Kumar near the target location.",
  evidence: [
    { type: "Video Footage", description: "CCTV file IND-994 showing 2 masked suspects approaching target vehicle.", date: "Oct 24, 2026" },
    { type: "Signal Log", description: "ANPR checkpoint hit at NH48 toll plaza matching getaway plates.", date: "Oct 24, 2026" },
    { type: "Cellular Record", description: "Cell tower dump showing co-location correlation (88%) between burner IMEI and victim's block.", date: "Oct 24, 2026" }
  ],
  riskAudit: {
    riskScore: "88/100",
    riskCategory: "Organized Auto Lifting",
    likelihood: "94%"
  }
};

export const mockDistrictReport = {
  title: "Karnataka District Crime Intelligence Audit",
  classification: "RESTRICTED // FOR OFFICIAL USE ONLY",
  dateGenerated: "2026-06-28",
  timeframe: "Last 30 Days",
  districts: [
    { name: "Bengaluru Urban", active: 28, solved: 114, repeatOffenders: 5, risk: "CRITICAL" },
    { name: "Mysuru City", active: 8, solved: 32, repeatOffenders: 1, risk: "LOW" },
    { name: "Mangaluru Coastal", active: 11, solved: 24, repeatOffenders: 2, risk: "HIGH" },
    { name: "Hubballi-Dharwad", active: 7, solved: 18, repeatOffenders: 0, risk: "MEDIUM" },
    { name: "Bidar Border", active: 4, solved: 9, repeatOffenders: 1, risk: "MEDIUM" }
  ],
  totalSummary: {
    totalActive: 58,
    totalSolved: 197,
    resolvedRate: "77.2%"
  }
};

export const mockTrendReport = {
  title: "Geotemporal Crime Projections & Trend Analysis",
  classification: "SECRET // LAW ENFORCEMENT INTERNAL USE ONLY",
  dateGenerated: "2026-06-28",
  summary: "Analysis of regional crime trends shows a 14% increase in relay-bypass auto thefts along the Bengaluru-Mysuru highway corridor. Cyber fraud queries relating to cryptocurrency splitting accounts show a 22% spike in northern border districts including Bidar and Gulbarga.",
  trends: [
    { category: "Vehicle Theft", trend: "+14.2% MoM", riskLevel: "HIGH", peakHours: "02:00 AM - 04:00 AM" },
    { category: "Cyber Extortion", trend: "+22.4% MoM", riskLevel: "HIGH", peakHours: "09:00 AM - 12:00 PM" },
    { category: "Narcotics", trend: "-2.1% MoM", riskLevel: "MEDIUM", peakHours: "23:00 PM - 02:00 AM" },
    { category: "Financial Fraud", trend: "+8.7% MoM", riskLevel: "MEDIUM", peakHours: "10:00 AM - 15:00 PM" }
  ],
  hotZones: ["Indiranagar 100ft Corridor", "Bidar Town ATMs", "Ullal Checkpoint"]
};

export const mockTimelineReport = {
  title: "Case Milestones & Audit Log: FIR-1024",
  classification: "CONFIDENTIAL // INVESTIGATIVE FILE",
  dateGenerated: "2026-06-28",
  caseSubject: "Organized Auto Lifting (Phantom Syndicate)",
  milestones: [
    { step: "01", date: "2026-10-24 02:15 AM", title: "Visual Approach", description: "CCTV logs record suspects approaching target vehicle." },
    { step: "02", date: "2026-10-24 02:22 AM", title: "Signal Compromise", description: "Relay clone device disengages vehicle engine locks." },
    { step: "03", date: "2026-10-24 02:28 AM", title: "Highway Departure", description: "Stolen Creta enters Old Madras road corridor heading east." },
    { step: "04", date: "2026-10-24 08:30 AM", title: "FIR Registry", description: "Complainant files official vehicle theft complaint." },
    { step: "05", date: "2026-10-25 14:15 PM", title: "CDR Tower Match", description: "AI logs isolate suspect burner IMEI cell tower intersection near Indiranagar." }
  ]
};
