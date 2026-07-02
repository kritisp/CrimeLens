// CrimeLens AI - Mock AI Chat Responses
// Structured chatbot data including cards, timelines, and action buttons for the clickable prototype

export const mockSuggestions = [
  {
    id: "sug-1",
    label: "Analyze vehicle theft patterns in East Division",
    query: "Analyze vehicle theft patterns in East Division"
  },
  {
    id: "sug-2",
    label: "Show intelligence dossier on suspect Ravi 'Bouncer' Kumar",
    query: "Show intelligence dossier on suspect Ravi 'Bouncer' Kumar"
  },
  {
    id: "sug-3",
    label: "Verify bank transaction anomalies in Bidar case",
    query: "Verify bank transaction anomalies in Bidar case"
  }
];

export const mockChatResponses = {
  "Analyze vehicle theft patterns in East Division": {
    summary: "AI analysis of 6 linked FIRs indicates an active keyless relay attack pattern operated by the 'Phantom Syndicate' in Indiranagar, HSR, and Koramangala. The group focuses on high-end SUVs and exits toward NH48.",
    stats: [
      { label: "Linked cases", value: "6 FIRs" },
      { label: "Modus Operandi", value: "Relay Attack" },
      { label: "Primary Target", value: "Creta / Seltos" },
      { label: "Confidence", value: "94%" }
    ],
    timeline: [
      { id: 1, time: "02:15 AM", title: "Approach", desc: "Suspects arrive in a getaway vehicle; one approaches target on foot carrying an electronic relay device." },
      { id: 2, time: "02:22 AM", title: "Bypass", desc: "Keyless signal cloned from home transponder. Vehicle lock disengaged without damage." },
      { id: 3, time: "02:28 AM", title: "Departure", desc: "Vehicle driven away via NH48 highways towards Kolar border." }
    ],
    networkPreview: {
      nodes: 6,
      connections: 8,
      mainEntity: "Phantom Syndicate",
      linkedEntities: ["Ravi Kumar", "KA-03-MB-4432", "Kolar Hub"]
    },
    heatmapPreview: {
      density: "High",
      hotspots: ["Indiranagar 100ft Rd", "Koramangala 4th Block", "HSR Sector 2"],
      coordinates: [12.9716, 77.5946]
    },
    recommendations: [
      "Alert NH48 Toll Plazas to scan ANPR logs for getaway vehicle plates.",
      "Conduct cellular dump analysis for Indiranagar tower nodes between 02:00 - 02:30 AM."
    ],
    caseId: "FIR-1024",
    actions: ["open_case", "open_network", "generate_report"]
  },
  
  "Show intelligence dossier on suspect Ravi 'Bouncer' Kumar": {
    summary: "Ravi 'Bouncer' Kumar is a primary suspect linked to organized vehicle thefts in Bengaluru East. CDR cell tower logs and gait patterns show co-locations during multiple heist incidents.",
    stats: [
      { label: "Clearance State", value: "High Risk" },
      { label: "Active Warrants", value: "2 Warrants" },
      { label: "Gait Similarity", value: "89% Match" },
      { label: "CDR Correlation", value: "92%" }
    ],
    timeline: [
      { id: 1, time: "Jan 2025", title: "Apprehension", desc: "Arrested in Kolar on charges of auto theft; released on bail." },
      { id: 2, time: "Oct 2025", title: "Cell Tower Hit", desc: "Phone registered within 150m of Indiranagar theft location at 02:20 AM." },
      { id: 3, time: "Jun 2026", title: "Surveillance Flag", desc: "Facial recognition camera matches gait model near MG Road junction." }
    ],
    networkPreview: {
      nodes: 4,
      connections: 5,
      mainEntity: "Ravi Kumar",
      linkedEntities: ["Phantom Syndicate", "KA-03-MB-4432", "Kolar Suburb"]
    },
    heatmapPreview: {
      density: "Medium",
      hotspots: ["Kolar Suburbs", "Koramangala Transit Hub"],
      coordinates: [13.1368, 78.1292]
    },
    recommendations: [
      "Obtain search warrant for suspect's primary residence in Kolar suburb.",
      "Deploy surveillance teams to monitor known auto-breaker yards in Bidar."
    ],
    caseId: "FIR-1024",
    actions: ["open_case", "open_network"]
  },

  "Verify bank transaction anomalies in Bidar case": {
    summary: "AI transaction auditing flagged an anomalous money laundering pipeline transferring high-volume funds to secondary accounts registered in Bidar District. Probable links to overseas cyber ransomware syndicates.",
    stats: [
      { label: "Total Audited", value: "₹42 Lakhs" },
      { label: "Anomalous Nodes", value: "4 Accounts" },
      { label: "Risk Score", value: "91 / 100" },
      { label: "Primary Route", value: "Bidar -> Mumbai" }
    ],
    timeline: [
      { id: 1, time: "09:12 AM", title: "Initial Transfer", desc: "Extortion ransom transferred from compromised vendor to primary shell account." },
      { id: 2, time: "09:30 AM", title: "Splitting", desc: "Funds split into 4 micro-transactions and routed through local branches in Bidar." },
      { id: 3, time: "11:45 AM", title: "ATM Cash-Out", desc: "Coordinated cash withdrawals recorded at Bidar and Gulbarga transit terminals." }
    ],
    networkPreview: {
      nodes: 8,
      connections: 12,
      mainEntity: "Bidar Shell Accounts",
      linkedEntities: ["TechCorp ransomware", "ATM-Bidar-01", "Acct-Mumbai-84"]
    },
    heatmapPreview: {
      density: "High Anomaly",
      hotspots: ["Bidar Town Center", "Gulbarga Junction"],
      coordinates: [17.9120, 77.5300]
    },
    recommendations: [
      "Initiate immediate banking lock directives for the 4 identified shell accounts.",
      "Dispatch local investigator teams to audit surveillance cameras at ATM-Bidar-01."
    ],
    caseId: "FIR-2031",
    actions: ["open_case", "generate_report"]
  }
};

export const defaultResponse = {
  summary: "Query registered. No direct matching playbook found in local intelligence files. Suggest inquiring about 'vehicle theft patterns in East Division' or 'suspect Ravi Kumar'.",
  stats: [
    { label: "Query Status", value: "Unresolved" },
    { label: "AI confidence", value: "Low" }
  ],
  timeline: [],
  networkPreview: null,
  heatmapPreview: null,
  recommendations: [
    "Refine query by referencing specific FIR IDs or suspect names.",
    "Click the suggested topics above the input area to retrieve structured mock results."
  ],
  caseId: "FIR-1024",
  actions: []
};
