import { useState, useRef, useEffect } from "react";
import { 
  Sparkles, Send, Bot, Shield, CheckCircle, 
  FileText, Printer, UserCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { GlassCard } from "../components/ui/GlassCard";

interface Message {
  sender: "officer" | "ai";
  text: string;
  timestamp: string;
}

interface ExtractionChecklist {
  category: { label: string; val: string; checked: boolean };
  location: { label: string; val: string; checked: boolean };
  datetime: { label: string; val: string; checked: boolean };
  property: { label: string; val: string; checked: boolean };
  suspects: { label: string; val: string; checked: boolean };
}

export function RegisterFIR() {
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState("My motorcycle was stolen from Wipro Crossing Sector V last night.");
  const [isEnquiring, setIsEnquiring] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [draftGenerated, setDraftGenerated] = useState(false);
  const [firDraftText, setFirDraftText] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Entities extracted from complaint & chat dialog
  const [checklist, setChecklist] = useState<ExtractionChecklist>({
    category: { label: "Incident Category", val: "Pending", checked: false },
    location: { label: "Exact Location", val: "Pending", checked: false },
    datetime: { label: "Date & Time", val: "Pending", checked: false },
    property: { label: "Stolen Assets / Property", val: "Pending", checked: false },
    suspects: { label: "Suspect Description", val: "Pending", checked: false }
  });

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isTyping]);

  const handleStartEnquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaint.trim()) return;

    setIsEnquiring(true);
    setIsTyping(true);

    // Initial Entity Extraction from the complaint
    const extracted = { ...checklist };
    
    // Simple mock NLP checks
    if (complaint.toLowerCase().includes("stolen") || complaint.toLowerCase().includes("theft")) {
      extracted.category = { label: "Incident Category", val: "Motor Vehicle Theft", checked: true };
    }
    if (complaint.toLowerCase().includes("wipro") || complaint.toLowerCase().includes("sector v")) {
      extracted.location = { label: "Exact Location", val: "Wipro Crossing, Sector V", checked: true };
    }
    if (complaint.toLowerCase().includes("last night") || complaint.toLowerCase().includes("yesterday")) {
      extracted.datetime = { label: "Date & Time", val: "2026-07-09 (Night Shift)", checked: true };
    }

    setChecklist(extracted);

    // AI opens with enquiry questions based on what is missing
    setTimeout(() => {
      setIsTyping(false);
      const initialAIMessage: Message = {
        sender: "ai",
        text: `Officer, I have parsed the initial complaint. I've successfully extracted the Incident Category, Location, and Date/Time. 

We are missing critical details to file the FIR. Could you please enquire:
1. What is the make, model, color, and registration plate number of the stolen motorcycle?
2. Did the complainant notice any suspicious individuals, or are there CCTV cameras near Wipro Crossing?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages([initialAIMessage]);
    }, 1500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      sender: "officer",
      text: inputValue.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const input = inputValue.toLowerCase();
    setInputValue("");
    setIsTyping(true);

    // Process the new answers to simulate AI extraction
    setTimeout(() => {
      setIsTyping(false);
      const updatedChecklist = { ...checklist };
      let reply = "";

      // Check if registration number or model details provided
      const plateRegex = /[a-z]{2}-\d{2}-[a-z]-\d{4}/i;
      const matchPlate = input.match(plateRegex);
      
      const containsPlate = matchPlate || input.includes("plate") || input.includes("wb-02") || input.includes("registration");
      const containsBikeModel = input.includes("enfield") || input.includes("bullet") || input.includes("pulsar") || input.includes("motorcycle");

      if (containsPlate || containsBikeModel) {
        let bikeDetail = "Royal Enfield Bullet";
        if (matchPlate) bikeDetail += ` (${matchPlate[0].toUpperCase()})`;
        else if (input.includes("wb-02")) bikeDetail += " (WB-02-A-8840)";
        
        updatedChecklist.property = {
          label: "Stolen Assets / Property",
          val: bikeDetail,
          checked: true
        };
      }

      // Check if suspect details provided
      const containsSuspect = input.includes("helmet") || input.includes("jacket") || input.includes("guy") || input.includes("man") || input.includes("suspect") || input.includes("unknown");
      if (containsSuspect) {
        let suspectDetail = "Unknown (wearing black helmet)";
        if (input.includes("jacket")) suspectDetail += ", blue windbreaker jacket";
        updatedChecklist.suspects = {
          label: "Suspect Description",
          val: suspectDetail,
          checked: true
        };
      }

      setChecklist(updatedChecklist);

      // Determine next questions based on checklist state
      if (updatedChecklist.property.checked && updatedChecklist.suspects.checked) {
        reply = "Excellent. I have extracted all necessary biometric, situational, and asset parameters. The dossier database is fully complete. You can now generate the official FIR registration draft.";
      } else if (updatedChecklist.property.checked && !updatedChecklist.suspects.checked) {
        reply = "Vehicle registration and model extracted successfully. We still need suspect descriptions or camera angles. Did they mention any physical traits of the thief?";
      } else if (!updatedChecklist.property.checked && updatedChecklist.suspects.checked) {
        reply = "Suspect traits registered. However, we still need the motorcycle model and license plate to initiate block alerts. Please check the vehicle records.";
      } else {
        reply = "I couldn't extract the vehicle registry or suspect details from that statement. Please clarify the motorcycle's number plate (e.g. WB-02-A-8840) or suspect clothing.";
      }

      const aiReply: Message = {
        sender: "ai",
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setChatMessages(prev => [...prev, aiReply]);
    }, 1500);
  };

  const handleGenerateDraft = () => {
    setDraftGenerated(true);
    // Build a nice FIR draft template using the collected parameters
    const draft = `FIRST INFORMATION REPORT
(Under Section 154 Cr.P.C.)

1. District: Bidhannagar Commissionerate
2. Police Station: Sector-V PS
3. FIR Number: FIR/2026/0284
4. Date & Time of Occurrence: 2026-07-09 22:30 Hrs
5. Place of Occurrence: Wipro Crossing, Sector V, Salt Lake
6. Complainant Name: Rajesh Kumar Sharma
7. Details of Stolen Property: 
   - Type: Two-Wheeler Motorcycle
   - Make/Model: ${checklist.property.val}
   - Ownership: Registered under complainant
8. Accused Description: ${checklist.suspects.val}
9. Brief Description of Offense:
   The complainant reported that his motorcycle was parked near the Wipro Crossing, Sector-V. Upon returning, the vehicle was found missing. AI footage scan confirms a suspect in a black helmet initiating theft tools.

[STATUS: DRAFT GENERATED]
[DIGITAL SECURITY HASH: 0x9328ff9a0bc310d540291ba7ff0234ed4cba8f017a]
[VERIFIED OFFICER SIGNATURE: Insp. Vikram Singh]`;

    setFirDraftText(draft);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 font-mono">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white lg:text-3xl">
            AI Enquiry Command Center
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Real-time entity extraction and investigator dialogue interface.
          </p>
        </div>

        {!isEnquiring ? (
          <div className="grid gap-6 lg:grid-cols-3">
            <GlassCard className="p-6 lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <Shield className="h-5 w-5 text-cyan-accent" />
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Initial Intake Log</h2>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Type the complainant's raw statement. The AI investigator will automatically compile it, identify missing parameters, and open an enquiry loop.
              </p>
              <form onSubmit={handleStartEnquiry} className="space-y-4">
                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  rows={6}
                  placeholder="e.g. My wallet was picked while boarding the bus at Sector V junction this afternoon..."
                  className="w-full rounded-xl border border-white/10 bg-black/40 p-4 text-xs text-slate-200 outline-none focus:border-cyan-accent/30 font-mono leading-relaxed"
                />
                <button
                  type="submit"
                  disabled={!complaint.trim()}
                  className="rounded-xl border border-cyan-accent/30 bg-cyan-accent/10 px-5 py-3 text-xs font-bold uppercase tracking-wider text-cyan-accent hover:bg-cyan-accent/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-glass flex items-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  Initiate AI Enquiry Loop
                </button>
              </form>
            </GlassCard>

            <GlassCard className="p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-accent/20 text-cyan-accent border border-cyan-accent/30 shadow-glow">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Guidelines</h2>
                <p className="text-xs leading-normal text-slate-400">
                  The AI-Assisted registration module validates timelines, maps spatial landmarks, and registers assets in accordance with local legal codes.
                </p>
              </div>
              <div className="pt-4 border-t border-white/5 text-[10px] text-slate-500">
                SYSTEM VER: v9.2.1-AUTO
              </div>
            </GlassCard>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3 items-start">
            
            {/* Left Column: Chat Dialogue Enquirer */}
            <GlassCard className="p-4 lg:col-span-2 flex flex-col h-[520px] justify-between border-white/10">
              
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-cyan-accent animate-pulse" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Investigator Copilot Enquirer</h3>
                    <p className="text-[9px] text-slate-500">ACTIVE INTERVIEW DIALOGUE</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setIsEnquiring(false);
                    setChatMessages([]);
                    setDraftGenerated(false);
                  }}
                  className="text-[9.5px] uppercase font-bold text-rose-400 border border-rose-500/20 bg-rose-500/5 px-2.5 py-1 rounded-lg hover:bg-rose-500/20 transition-all"
                >
                  Reset Form
                </button>
              </div>

              {/* Chat Messages Logs */}
              <div className="flex-1 overflow-y-auto p-2 space-y-4 my-3 text-xs leading-relaxed max-h-[360px]">
                {chatMessages.map((msg, index) => (
                  <div 
                    key={index}
                    className={`flex gap-3 max-w-[85%] ${msg.sender === "officer" ? "ml-auto flex-row-reverse" : ""}`}
                  >
                    <div className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border font-bold text-[10px] ${
                      msg.sender === "officer" 
                        ? "bg-cyan-accent/15 border-cyan-accent/30 text-cyan-accent" 
                        : "bg-navy-900 border-white/10 text-white"
                    }`}>
                      {msg.sender === "officer" ? "OFF" : "AI"}
                    </div>

                    <div className={`rounded-2xl p-3.5 ${
                      msg.sender === "officer"
                        ? "bg-cyan-accent/10 border border-cyan-accent/20 text-slate-200"
                        : "bg-white/[0.02] border border-white/5 text-slate-300 whitespace-pre-wrap"
                    }`}>
                      <p>{msg.text}</p>
                      <span className="block text-[8px] text-slate-500 text-right mt-1.5">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border border-white/10 bg-navy-900 text-white font-bold text-[10px]">
                      AI
                    </div>
                    <div className="rounded-2xl p-3 bg-white/[0.02] border border-white/5 text-slate-500 animate-pulse">
                      Analyzing input parameters...
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input form */}
              {!draftGenerated && (
                <form onSubmit={handleSendMessage} className="flex gap-2 pt-3 border-t border-white/10">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Provide details e.g., 'Bike is a black Bullet plate WB-02-A-8840'..."
                    className="flex-1 bg-black/60 border border-white/10 text-white rounded-xl px-4 py-3 outline-none text-xs focus:border-cyan-accent/40 font-mono"
                  />
                  <button
                    type="submit"
                    className="h-10 w-10 bg-cyan-accent border border-cyan-accent text-navy-950 flex items-center justify-center rounded-xl hover:bg-cyan-glow transition-all shrink-0 shadow-glow"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              )}

            </GlassCard>

            {/* Right Column: Live Dossier Parameter Checklists */}
            <div className="space-y-4">
              <GlassCard className="p-4 border-white/10 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                  <CheckCircle className="h-4 w-4 text-cyan-accent" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Mandatory FIR Parameters</h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  {Object.entries(checklist).map(([key, item]) => (
                    <div key={key} className="flex items-start justify-between gap-3 border-b border-white/5 pb-2">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">{item.label}</span>
                        <span className={`text-[11px] block mt-0.5 font-mono ${item.checked ? "text-cyan-accent" : "text-slate-500"}`}>
                          {item.val}
                        </span>
                      </div>
                      <div className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                        item.checked 
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]" 
                          : "border-white/10 bg-white/5 text-slate-600"
                      }`}>
                        {item.checked ? "✓" : ""}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Draft Button */}
                {Object.values(checklist).filter(c => c.checked).length >= 4 && !draftGenerated && (
                  <button
                    onClick={handleGenerateDraft}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold uppercase tracking-wider text-[10px] transition-all shadow-glass animate-bounce"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Official FIR Draft
                  </button>
                )}
              </GlassCard>

              {/* Generated Draft Section */}
              {draftGenerated && (
                <GlassCard className="p-4 border-emerald-500/30 bg-emerald-950/5 space-y-4 animate-scale-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-emerald-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Completed FIR Draft</h4>
                    </div>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-950/80 text-emerald-400 font-bold uppercase">
                      READY TO SUBMIT
                    </span>
                  </div>

                  <pre className="p-3 bg-black/60 border border-white/5 rounded-xl text-[9.5px] text-slate-300 font-mono overflow-auto max-h-[220px] whitespace-pre-wrap leading-relaxed">
                    {firDraftText}
                  </pre>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.print()}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white transition-all text-[9.5px] uppercase font-bold"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </button>
                    <button 
                      onClick={() => {
                        alert("FIR submitted and logged into the Central Police Registry database successfully!");
                        setIsEnquiring(false);
                        setDraftGenerated(false);
                        navigate("/cases");
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all text-[9.5px] uppercase font-bold shadow-glass"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Submit & Register
                    </button>
                  </div>
                </GlassCard>
              )}
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default RegisterFIR;
