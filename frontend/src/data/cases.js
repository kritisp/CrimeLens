// CrimeLens AI - Mock Intelligence Database
// Centralized mock data layer for Karnataka State Police MVP prototype

export const mockStats = {
  todayFirs: 24,
  openCases: 12,
  solvedCases: 156,
  repeatOffenders: 8,
};

export const mockAlerts = [
  {
    id: "ALERT-992",
    title: "Organized Vehicle Theft Network Detected",
    description: "6 linked FIRs found across 3 jurisdictions. Modus operandi matches known 'Phantom' syndicate patterns.",
    priority: "HIGH",
    time: "10 mins ago",
    confidence: "94%",
    category: "Organized Crime",
  },
  {
    id: "ALERT-993",
    title: "Anomalous Financial Transaction Spike",
    description: "Multi-layered shell accounts registered in Bidar District detected transferring high-volume funds linked to suspect cyber group.",
    priority: "MEDIUM",
    time: "1 hour ago",
    category: "Financial Crime",
  }
];

export const mockCases = [
  {
    id: "FIR-1024",
    title: "Organized Vehicle Theft - Indiranagar",
    priority: "High",
    category: "Organized Crime",
    type: "Vehicle Theft",
    location: "Indiranagar, Bengaluru",
    officer: "Insp. Vikram Rao (KSP-4821)",
    status: "AI Analyzing",
    lastUpdate: "2 hrs ago",
    date: "Oct 24, 2026",
    time: "08:30 AM",
    victim: "Suresh Kumar",
    description: "Complainant reported their white Hyundai Creta (KA-03-MB-4432) stolen from outside their residence. The vehicle was parked at 10:00 PM the previous night. No broken glass found at the scene, suggesting a potential electronic bypass.",
    evidence: [
      { id: 1, type: "Video", desc: "CCTV footage from neighboring house showing 2 masked individuals.", icon: "video" },
      { id: 2, type: "Document", desc: "Vehicle Registration & Insurance papers.", icon: "file" }
    ],
    timeline: [
      { id: 1, time: "02:15 AM", date: "Oct 24", title: "Suspects arrive", desc: "Two individuals seen approaching the vehicle on foot from 12th Main." },
      { id: 2, time: "02:22 AM", date: "Oct 24", title: "Vehicle compromised", desc: "Electronic relay attack suspected to bypass keyless entry. Lights flash once." },
      { id: 3, time: "02:28 AM", date: "Oct 24", title: "Vehicle driven away", desc: "Vehicle heads South towards Old Madras Road." },
      { id: 4, time: "08:30 AM", date: "Oct 24", title: "FIR Filed", desc: "Complainant registers FIR at Indiranagar Police Station." }
    ],
    copilot: {
      riskScore: 88,
      aiSummary: "High probability of connection to the 'Phantom' syndicate. Modus operandi exactly matches 5 recent thefts in the East division using electronic relay attacks.",
      crimeCategory: "Grand Theft Auto",
      organizedCrimeLikelihood: "94%",
      similarCases: ["FIR-0982 (Koramangala)", "FIR-1011 (HSR Layout)", "FIR-1018 (Domlur)"],
      suspects: [
        { name: "Unknown (Masked)", match: "89% (Gait Analysis)" },
        { name: "Ravi 'Bouncer' Kumar", match: "72% (Co-location CDR)" }
      ],
      recommendations: [
        "Request ANPR logs for Toll Plazas on NH48 between 03:00-05:00 AM.",
        "Cross-reference cellular tower dumps at Indiranagar (02:00-03:00 AM) with FIR-0982.",
        "Dispatch team to known chop-shop locations in Kolar."
      ]
    }
  },
  {
    id: "FIR-2031",
    title: "Vasanthnagar Cyber Extortion Ring",
    priority: "Medium",
    category: "Cyber / Extortion",
    type: "Cyber Fraud",
    location: "Koramangala, Bengaluru",
    officer: "SI Kavitha R. (KSP-9912)",
    status: "Evidence Gathering",
    lastUpdate: "5 hrs ago",
    date: "Oct 20, 2026",
    time: "11:45 AM",
    victim: "TechCorp Karnataka",
    description: "Distributed malware campaign seeking extortion payment in cryptocurrency from regional telecom vendors.",
    evidence: [],
    timeline: [],
    copilot: {
      riskScore: 68,
      aiSummary: "Traced to compromised proxy servers in North Karnataka.",
      crimeCategory: "Cyber Extortion",
      organizedCrimeLikelihood: "75%",
      similarCases: ["FIR-1122 (Belagavi)"],
      suspects: [{ name: "Anom Group", match: "65%" }],
      recommendations: ["Track IP hops", "Check wallet addresses"]
    }
  }
];

export const mockRecentFindings = [
  {
    id: 1,
    type: "CCTV Analysis",
    text: "Facial recognition match (89%) for suspect in FIR-1024 at MG Road Junction.",
    time: "1 hour ago",
  },
  {
    id: 2,
    type: "Financial Intel",
    text: "Hidden transaction node discovered linking 3 suspect bank accounts.",
    time: "3 hours ago",
  },
  {
    id: 3,
    type: "CDR Pattern",
    text: "Co-location detected between prime suspect and repeat offender (RO-402).",
    time: "Yesterday",
  }
];

export const mockCopilotChat = [
  {
    id: 1,
    sender: "copilot",
    message: "Welcome to CrimeLens Copilot. I have mapped 48 active investigations and highlighted 7 high-risk alerts in Karnataka today. How can I assist you with your case intelligence?",
    time: "09:00 AM",
  }
];
