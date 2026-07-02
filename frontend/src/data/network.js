// CrimeLens AI - Mock Criminal Network Database
// Pre-configured nodes and connection link definitions for the interactive SVG link explorer

export const mockNodes = [
  {
    id: "N1",
    name: "Ravi 'Bouncer' Kumar",
    type: "Person",
    details: "Primary suspect in the Bengaluru East vehicle theft syndicate. Heavy history of auto lifting and gang coordination.",
    risk: "High Risk",
    clearance: "Surveillance Active",
    meta: { age: "34 Years", phone: "+91 98801-92311", location: "Kolar Border" },
    x: 350,
    y: 220
  },
  {
    id: "N2",
    name: "Hyundai Creta (KA-03-MB-4432)",
    type: "Vehicle",
    details: "Stolen white SUV, registered to Suresh Kumar. Subject vehicle in primary heist FIR-1024.",
    risk: "High Risk",
    clearance: "Seizure Flagged",
    meta: { owner: "Suresh Kumar", color: "White", engine: "1.6L VTVT" },
    x: 160,
    y: 280
  },
  {
    id: "N3",
    name: "+91 98801-92311",
    type: "Phone",
    details: "Burner SIM registered under fake credentials. Used heavily during midnight theft hours near cell towers.",
    risk: "Medium Risk",
    clearance: "Interception Active",
    meta: { provider: "Jio", location: "Indiranagar Sector", callsToday: "18 logs" },
    x: 520,
    y: 120
  },
  {
    id: "N4",
    name: "UPI ID: ravikumar@okaxis",
    type: "UPI",
    details: "UPI address utilized for quick payment transfers from scrap-dealer chop-shops.",
    risk: "High Risk",
    clearance: "Audit Triggered",
    meta: { gateway: "Axis Pay", monthlyVolume: "₹6.8 Lakhs", suspectNode: "ChopShop-HSR" },
    x: 520,
    y: 320
  },
  {
    id: "N5",
    name: "HSR Layout Chop-Shop",
    type: "Location",
    details: "Automobile scrapyard suspected of receiving stolen vehicles, stripping parts within 4 hours of heist.",
    risk: "High Risk",
    clearance: "Warrant Pending",
    meta: { operator: "Karan B.", address: "24th Main, HSR Layout", volume: "20+ units/mo" },
    x: 350,
    y: 60
  },
  {
    id: "N6",
    name: "FIR-1024",
    type: "FIR",
    details: "Primary case file representing Indiranagar vehicle theft case registered on October 24.",
    risk: "Medium Risk",
    clearance: "Active Case",
    meta: { division: "Bengaluru East", divisionOfficer: "Insp. Vikram Rao", date: "2026-10-24" },
    x: 160,
    y: 140
  },
  {
    id: "N7",
    name: "Shell Acct: 4099-281-22",
    type: "Bank Account",
    details: "Co-signed savings account suspected of splitting heist profits and laundering deposits.",
    risk: "High Risk",
    clearance: "Freeze Initiated",
    meta: { bank: "State Bank of India", branch: "Bidar Branch", balance: "₹14.2 Lakhs" },
    x: 720,
    y: 320
  }
];

export const mockLinks = [
  { source: "N1", target: "N3", type: "Communication", label: "Burner Line" },
  { source: "N1", target: "N4", type: "Ownership", label: "Owner" },
  { source: "N1", target: "N5", type: "Co-occurrence", label: "Freq Visitor" },
  { source: "N2", target: "N6", type: "Co-occurrence", label: "Subject Vehicle" },
  { source: "N1", target: "N6", type: "Co-occurrence", label: "Prime Accused" },
  { source: "N4", target: "N7", type: "Transaction", label: "Cash out ₹4.2L" }
];
