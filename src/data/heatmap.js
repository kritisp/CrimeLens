// CrimeLens AI - Mock Geotemp Heatmap Database
// Coordinate mapping and district registry for the Karnataka State Police prototype map

export const mockDistricts = [
  { id: "D1", name: "Bengaluru Urban", x: 350, y: 340, radius: 40 },
  { id: "D2", name: "Mysuru", x: 290, y: 390, radius: 32 },
  { id: "D3", name: "Mangaluru", x: 190, y: 340, radius: 28 },
  { id: "D4", name: "Hubballi-Dharwad", x: 230, y: 210, radius: 30 },
  { id: "D5", name: "Belagavi", x: 180, y: 150, radius: 32 },
  { id: "D6", name: "Bidar", x: 370, y: 50, radius: 24 },
  { id: "D7", name: "Kalaburagi", x: 360, y: 100, radius: 28 }
];

export const mockHotspots = [
  {
    id: "HS-001",
    name: "Indiranagar 100ft Road",
    district: "Bengaluru Urban",
    crimeType: "Vehicle Theft",
    timeRange: "24h",
    severity: "High",
    x: 360,
    y: 335,
    firs: ["FIR-1024"]
  },
  {
    id: "HS-002",
    name: "Koramangala 4th Block",
    district: "Bengaluru Urban",
    crimeType: "Cyber Fraud",
    timeRange: "24h",
    severity: "Medium",
    x: 345,
    y: 350,
    firs: ["FIR-2031"]
  },
  {
    id: "HS-003",
    name: "Ullal Border Checkpoint",
    district: "Mangaluru",
    crimeType: "Narcotics",
    timeRange: "7d",
    severity: "High",
    x: 190,
    y: 340,
    firs: ["FIR-1024"]
  },
  {
    id: "HS-004",
    name: "HSR Layout Sector 2",
    district: "Bengaluru Urban",
    crimeType: "Vehicle Theft",
    timeRange: "30d",
    severity: "Low",
    x: 355,
    y: 360,
    firs: ["FIR-1024"]
  },
  {
    id: "HS-005",
    name: "Bidar Cash withdrawal terminal",
    district: "Bidar",
    crimeType: "Financial Crime",
    timeRange: "24h",
    severity: "High",
    x: 370,
    y: 50,
    firs: ["FIR-2031"]
  },
  {
    id: "HS-006",
    name: "Hubballi Toll Plaza",
    district: "Hubballi-Dharwad",
    crimeType: "Vehicle Theft",
    timeRange: "7d",
    severity: "Medium",
    x: 230,
    y: 210,
    firs: ["FIR-1024"]
  }
];
