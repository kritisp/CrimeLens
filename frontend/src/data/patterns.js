// CrimeLens AI - Pattern Analysis & Crime Signature Mock Database
// Stores extracted signatures, similarity details, and comparative cases

export const mockPatternData = {
  "FIR-1024": {
    fir: {
      id: "FIR-1024",
      type: "Vehicle Theft",
      time: "2:15 AM",
      location: "Indiranagar, Bengaluru",
      vehicle: "KTM Duke 390",
      entryMethod: "Duplicate Key Relay",
      escapeRoute: "NH-16 Corridor",
      officer: "Insp. Vikram Rao",
      status: "Under Investigation"
    },
    signature: {
      type: "Vehicle Theft",
      timeWindow: "2:00 AM - 3:00 AM",
      target: "Sports Bike (KTM Duke)",
      modusOperandi: "Duplicate Key Bypass",
      locationPattern: "Near Highway Corridor",
      escapeRoute: "NH-16 Corridor",
      gangIndicator: "Highly Probable (Phantom)"
    },
    similarCases: [
      { 
        id: "FIR-201", 
        match: 94, 
        status: "Open", 
        features: ["Same Crime Type", "Same Time Window", "Same Modus Operandi", "Same Escape Route"], 
        details: { 
          type: "Vehicle Theft",
          time: "2:40 AM", 
          vehicle: "KTM Duke 200", 
          entry: "Duplicate Key", 
          escape: "NH-16",
          location: "HSR Layout, Bengaluru"
        } 
      },
      { 
        id: "FIR-310", 
        match: 91, 
        status: "Open", 
        features: ["Same Crime Type", "Same Time Window", "Same Target Vehicle Class", "Same Escape Route"], 
        details: { 
          type: "Vehicle Theft",
          time: "2:05 AM", 
          vehicle: "KTM Duke 250", 
          entry: "Duplicate Key Bypass", 
          escape: "NH-16",
          location: "Koramangala, Bengaluru"
        } 
      },
      { 
        id: "FIR-441", 
        match: 88, 
        status: "Under Review", 
        features: ["Same Crime Type", "Same Target Vehicle Class", "Same Modus Operandi"], 
        details: { 
          type: "Vehicle Theft",
          time: "3:15 AM", 
          vehicle: "Kawasaki Ninja", 
          entry: "Duplicate Key Relay", 
          escape: "NH-48",
          location: "Hebbal, Bengaluru"
        } 
      }
    ],
    patternAnalysis: {
      title: "Organized Auto-Lifting Network Pattern",
      points: [
        "Crimes occur strictly between 2:00 AM – 3:00 AM",
        "Targets are premium sports bikes (KTM / Kawasaki)",
        "Incidents happen near key highways & bypasses",
        "Duplicate key / signal relay cloning technique observed",
        "Consistent getaway vector towards NH-16 corridor"
      ],
      conclusion: "AI Core isolates a highly correlated organized vehicle theft ring. Modus operandi matches Phantom Syndicate's eastern extraction cell operations."
    },
    explainability: {
      crimeType: 92,
      timeWindow: 95,
      location: 89,
      vehicleType: 91,
      modusOperandi: 97
    }
  }
};
