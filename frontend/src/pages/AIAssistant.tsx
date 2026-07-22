import { useState, useEffect, useRef } from "react";
import { 
  Menu, X, Shield, FileText, Upload, Mic, 
  RefreshCw, Image, Video, Music, Send, Eye, Printer
} from "lucide-react";
import { FIRDraftModal } from "../components/ai-assistant/FIRDraftModal";
import { ChatWindow } from "../components/ai-assistant/ChatWindow";
import { ConversationList } from "../components/ai-assistant/ConversationList";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { useChatSession } from "../hooks/useChatSession";
import { GlassCard } from "../components/ui/GlassCard";
import type { FIRDraftPayload } from "../types/chat";
import { InteractiveResponse } from "../components/ai-assistant/InteractiveResponse";

interface CaseOption {
  id: string;
  firNumber: string;
  offense: string;
  complainant: string;
  status: string;
  station: string;
}

interface EvidenceFile {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  extracted_text: string;
  summary: string;
  confidence_score: number;
}

interface CopilotEntity {
  id: string;
  name: string;
  category: string;
  details: string;
  confidence_score: number;
}

interface TimelineItem {
  id: string;
  timestamp_str: string;
  title: string;
  description: string;
}

interface CaseDossier {
  overview: {
    firNumber: string;
    caseNumber: string;
    caseTitle: string;
    crimeCategory: string;
    crimeSubCategory: string;
    currentStatus: string;
    priority: string;
    riskScore: number;
    investigationStage: string;
    dateRegistered: string;
    assignedOfficer: string;
    policeStation: string;
    district: string;
  };
  complainant: {
    name: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
    address: string;
    occupation: string;
  };
  victim: {
    name: string;
    age: number;
    gender: string;
    injuries: string;
    hospital: string;
  };
  suspect: {
    name: string;
    alias: string;
    photograph: string;
    status: string;
    physicalDescription: string;
    knownAssociates: string[];
    criminalHistory: string;
  };
}

export function AIAssistant() {
  // --- Legacy FIR Registration Intake Session Hook ---
  const {
    conversations,
    activeConversation,
    activeId,
    isTyping,
    generateFirDraft,
    selectConversation,
    startNewConversation,
    sendMessage,
  } = useChatSession();

  const [showMobileConversations, setShowMobileConversations] = useState(false);
  const [firDraft, setFirDraft] = useState<FIRDraftPayload | null>(null);
  const [draftModalOpen, setDraftModalOpen] = useState(false);

  // --- Active Case Copilot & Multi-Modal State ---
  const [selectedCaseId, setSelectedCaseId] = useState<string>("intake");
  const [cases, setCases] = useState<CaseOption[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);

  const [dossier, setDossier] = useState<CaseDossier | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [entities, setEntities] = useState<CopilotEntity[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // --- Copilot Case Chat Messages ---
  const [copilotMessages, setCopilotMessages] = useState<Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    data?: any;
  }>>([]);
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotTyping, setCopilotTyping] = useState(false);

  // --- Voice Transcription Simulated State ---
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<any>(null);

  // --- Evidence File Upload states ---
  const [uploading, setUploading] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Cases list
  const fetchCases = async () => {
    setLoadingCases(true);
    try {
      const response = await fetch("/api/v1/intelligence/copilot-cases");
      if (response.ok) {
        const data = await response.json();
        setCases(data);
      }
    } catch (err) {
      console.error("Error loading copilot cases:", err);
    } finally {
      setLoadingCases(false);
    }
  };

  // Fetch Case Details (Dossier & Evidence)
  const fetchCaseDetails = async (caseId: string) => {
    setLoadingDetails(true);
    try {
      // 1. Dossier
      const dossierRes = await fetch(`/api/v1/intelligence/dossier/${caseId}`);
      if (dossierRes.ok) {
        const data = await dossierRes.json();
        setDossier(data);
      }
      // 2. Evidence files, timeline, entities
      const evidenceRes = await fetch(`/api/v1/intelligence/case-evidence/${caseId}`);
      if (evidenceRes.ok) {
        const data = await evidenceRes.json();
        setEvidenceFiles(data.files);
        setEntities(data.entities);
        setTimeline(data.timeline);
      }
    } catch (err) {
      console.error("Error loading case details:", err);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (selectedCaseId !== "intake") {
      fetchCaseDetails(selectedCaseId);
      // Initialize chat with default welcome
      setCopilotMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hello Officer. I have indexed all evidence, victim details, and extracted entities for this case file. Ask me anything, request similar MO analysis, or upload new evidence to enrich the investigation gallery.",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
        }
      ]);
    }
  }, [selectedCaseId]);

  // Handle Legacy Intake FIR Generation
  const handleGenerateFirDraft = async () => {
    if (isTyping) return;
    const draft = await generateFirDraft();
    if (draft) {
      setFirDraft(draft);
      setDraftModalOpen(true);
    }
  };

  const handleSaveDraft = (draft: FIRDraftPayload) => {
    localStorage.setItem("saved-fir-draft", JSON.stringify(draft));
    setFirDraft(draft);
  };

  // Send message inside Grounded Case Copilot
  const handleSendCopilotMessage = async (msgText: string) => {
    const trimmed = msgText.trim();
    if (!trimmed || copilotTyping) return;

    const userMsg = {
      id: `copilot-msg-${Date.now()}`,
      role: "user" as const,
      content: trimmed,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    };

    setCopilotMessages(prev => [...prev, userMsg]);
    setCopilotInput("");
    setCopilotTyping(true);

    try {
      const isPlaybookQuery =
        trimmed.toLowerCase().includes("vehicle") ||
        trimmed.toLowerCase().includes("theft") ||
        trimmed.toLowerCase().includes("division") ||
        trimmed.toLowerCase().includes("ravi") ||
        trimmed.toLowerCase().includes("bouncer") ||
        trimmed.toLowerCase().includes("bidar") ||
        trimmed.toLowerCase().includes("fraud") ||
        trimmed.toLowerCase().includes("bank");

      let resData;
      if (isPlaybookQuery) {
        const response = await fetch("/api/v1/chat/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmed })
        });
        if (response.ok) {
          resData = await response.json();
        } else {
          throw new Error("Playbook query failed");
        }
      } else {
        const response = await fetch("/api/v1/intelligence/query-case", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            case_id: selectedCaseId,
            message: trimmed
          })
        });
        if (response.ok) {
          resData = await response.json();
        } else {
          throw new Error("Query failed");
        }
      }

      if (resData) {
        const aiMsg = {
          id: `copilot-msg-ai-${Date.now()}`,
          role: "assistant" as const,
          content: resData.summary || resData.message || "",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }),
          data: resData
        };
        setCopilotMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      const errorMsg = {
        id: `copilot-msg-err-${Date.now()}`,
        role: "assistant" as const,
        content: "Error: Muted or timed out connecting to the Copilot Engine. Please verify network interfaces.",
        timestamp: new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
      };
      setCopilotMessages(prev => [...prev, errorMsg]);
    } finally {
      setCopilotTyping(false);
    }
  };

  // Handle new Evidence Upload
  const handleUploadEvidence = async () => {
    if (!selectedUploadFile || selectedCaseId === "intake") return;
    setUploading(true);

    const formData = new FormData();
    formData.append("case_id", selectedCaseId);
    formData.append("file", selectedUploadFile);

    try {
      const response = await fetch("/api/v1/intelligence/upload-evidence", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        setSelectedUploadFile(null);
        // Refresh gallery
        await fetchCaseDetails(selectedCaseId);
        // Add success system notification to copilot chat
        setCopilotMessages(prev => [...prev, {
          id: `sys-${Date.now()}`,
          role: "assistant",
          content: `🚨 Evidence File "${selectedUploadFile.name}" has been uploaded, parsed by Mock AI extraction engine, and indexed into the Evidence Gallery. Key entities and timeline events have been updated.`,
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
        }]);
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  // Recording timer simulation
  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingAndTranscribe = async () => {
    clearInterval(recordingIntervalRef.current);
    setIsRecording(false);
    setCopilotTyping(true);

    try {
      // Send mock blob to transcribe-voice endpoint
      const mockBlob = new Blob(["mock-audio"], { type: "audio/wav" });
      const formData = new FormData();
      formData.append("file", mockBlob, "voice_note.wav");

      const response = await fetch("/api/v1/intelligence/transcribe-voice", {
        method: "POST",
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setCopilotInput(data.text);
      }
    } catch (err) {
      console.error("Voice transcription failed:", err);
    } finally {
      setCopilotTyping(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  };

  // PDF Generation Trigger
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <DashboardLayout mainClassName="flex flex-col overflow-hidden p-0 lg:p-0">
      
      {/* Header with Case Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 bg-navy-950/80 px-4 py-3 gap-3 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2.5">
          <Shield className="h-5 w-5 text-cyan-accent" />
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Investigative Copilot Workspace</h1>
            <p className="text-[10px] text-slate-500 font-mono">Ground AI chat models directly in physical case evidence & files</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400 font-mono uppercase hidden sm:inline">Active Case File:</span>
          <select 
            value={selectedCaseId} 
            onChange={(e) => setSelectedCaseId(e.target.value)}
            disabled={loadingCases}
            className="bg-navy-900 border border-white/10 text-xs text-slate-200 rounded-xl px-3 py-2 outline-none hover:border-cyan-accent/30 font-mono cursor-pointer min-w-[240px]"
          >
            {loadingCases ? (
              <option>Loading case files...</option>
            ) : (
              <>
                <option value="intake">📝 New Case Intake (Intake Assistant)</option>
                {cases.map(c => (
                  <option key={c.id} value={c.id}>📂 {c.firNumber} — {c.complainant}</option>
                ))}
              </>
            )}
          </select>
          {selectedCaseId !== "intake" && (
            <button 
              onClick={() => fetchCaseDetails(selectedCaseId)} 
              title="Refresh Case File Details"
              className="p-2 border border-white/10 bg-white/5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* --- INTAKE MODE: Legacy FIR Registration Assistant --- */}
      {selectedCaseId === "intake" && (
        <div className="flex h-[calc(100vh-8rem)] flex-col">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 md:hidden">
            <h2 className="text-sm font-semibold text-white">AI Assistant</h2>
            <button
              type="button"
              onClick={() => setShowMobileConversations((prev) => !prev)}
              className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white"
              aria-label="Toggle conversations"
            >
              {showMobileConversations ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1">
            <div
              className={[
                "absolute inset-0 z-20 md:relative md:inset-auto md:flex md:w-72 md:shrink-0 lg:w-80",
                showMobileConversations ? "flex" : "hidden md:flex",
              ].join(" ")}
            >
              <ConversationList
                conversations={conversations}
                activeId={activeId}
                onSelect={(id) => {
                  selectConversation(id);
                  setShowMobileConversations(false);
                }}
                onNewChat={() => {
                  startNewConversation();
                  setShowMobileConversations(false);
                }}
              />
            </div>

            <ChatWindow
              conversation={activeConversation}
              isTyping={isTyping}
              onSend={sendMessage}
              onGenerateFirDraft={handleGenerateFirDraft}
            />
          </div>
          
          <FIRDraftModal
            open={draftModalOpen}
            draft={firDraft}
            onClose={() => setDraftModalOpen(false)}
            onSave={handleSaveDraft}
          />
        </div>
      )}

      {/* --- INVESTIGATION MODE: Three-Column Grounded Panel --- */}
      {selectedCaseId !== "intake" && (
        <div className="flex-1 min-h-0 overflow-hidden grid grid-cols-1 xl:grid-cols-12 bg-navy-950/20">
          
          {/* Column 1: Case Profile & Evidence Gallery (Left, Span 4) */}
          <div className="xl:col-span-4 border-r border-white/10 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4">
            
            {/* Case Profiler Card */}
            {loadingDetails && (
              <div className="text-[10px] text-cyan-accent/80 font-mono animate-pulse p-4 bg-navy-900/50 rounded-xl border border-cyan-accent/15">
                ⚡ Synchronizing Case Profile Details & Evidence Gallery...
              </div>
            )}
            {!loadingDetails && dossier && (
              <GlassCard className="p-4 border-white/10 space-y-3 print:border-none print:shadow-none">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-bold text-cyan-accent uppercase tracking-wider font-mono">Case Dossier Index</span>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                    dossier.overview.currentStatus === "solved" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                  }`}>
                    {dossier.overview.currentStatus}
                  </span>
                </div>
                
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">FIR Reference:</span>
                    <span className="text-white font-bold">{dossier.overview.firNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Legal Section:</span>
                    <span className="text-slate-200">{dossier.overview.crimeCategory} · {dossier.overview.crimeSubCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registrar Complainant:</span>
                    <span className="text-slate-300 font-bold">{dossier.complainant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Assigned Officer:</span>
                    <span className="text-cyan-400">{dossier.overview.assignedOfficer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registered:</span>
                    <span className="text-slate-300">{dossier.overview.dateRegistered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">GPS Coordinate:</span>
                    <span className="text-orange-400">{dossier.overview.policeStation}</span>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Evidence Uploader */}
            <GlassCard className="p-4 border-cyan-accent/25 bg-cyan-accent/5 space-y-3">
              <h3 className="text-xs font-bold text-cyan-accent uppercase tracking-wider font-mono">Upload New Case Evidence</h3>
              <p className="text-[10px] text-slate-400 leading-normal">
                Submit raw evidence (images, videos, audio narratives, or text files). Copilot will parse content, run OCR/ASR, and map entities.
              </p>
              
              <div className="flex flex-col gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={(e) => setSelectedUploadFile(e.target.files?.[0] ?? null)}
                  className="hidden" 
                  accept="image/*,video/*,audio/*,.pdf,.docx,.txt"
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-white/20 hover:border-cyan-accent/40 rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all text-slate-400 hover:text-white bg-black/10"
                >
                  <Upload className="h-5 w-5 text-cyan-accent" />
                  <span className="text-xs font-mono">
                    {selectedUploadFile ? selectedUploadFile.name : "Select File (Image, Video, Audio, Doc)"}
                  </span>
                  <span className="text-[9px] text-slate-600">Max size: 10MB</span>
                </button>

                {selectedUploadFile && (
                  <button 
                    onClick={handleUploadEvidence}
                    disabled={uploading}
                    className="w-full bg-cyan-accent hover:bg-cyan-accent/80 text-navy-950 text-xs font-bold font-mono py-2 rounded-xl transition-all shadow-glow flex items-center justify-center gap-2"
                  >
                    {uploading ? "Analyzing & Storing..." : "Verify & Index Evidence File"}
                  </button>
                )}
              </div>
            </GlassCard>

            {/* Evidence Gallery Section */}
            <GlassCard className="p-4 border-white/10 flex-1 flex flex-col min-h-[300px]">
              <div className="border-b border-white/5 pb-2 mb-3 flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Case Evidence Gallery ({evidenceFiles.length})</span>
                <Eye className="h-4 w-4 text-slate-400" />
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                {evidenceFiles.length === 0 ? (
                  <div className="text-center py-8 text-slate-600 text-xs font-mono">
                    No files indexed. Drag and upload case evidence above.
                  </div>
                ) : (
                  evidenceFiles.map(file => (
                    <div 
                      key={file.id}
                      className="p-3 bg-navy-900/60 border border-white/5 rounded-xl space-y-2 hover:border-cyan-accent/15 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {file.file_type === "image" && <Image className="h-4 w-4 text-cyan-400" />}
                          {file.file_type === "video" && <Video className="h-4 w-4 text-rose-400" />}
                          {file.file_type === "audio" && <Music className="h-4 w-4 text-purple-400" />}
                          {file.file_type === "document" && <FileText className="h-4 w-4 text-emerald-400" />}
                          <span className="text-xs font-bold text-white truncate max-w-[150px] font-mono">{file.filename}</span>
                        </div>
                        <span className="text-[9px] font-mono text-cyan-accent font-bold bg-cyan-950/40 px-2 py-0.5 rounded">
                          {file.confidence_score}% Confidence
                        </span>
                      </div>
                      
                      {file.summary && (
                        <p className="text-[10px] text-slate-400 leading-normal bg-black/10 p-2 rounded border border-white/5 font-mono">
                          {file.summary}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-[8px] text-slate-500 font-mono">
                        <span>{file.file_type.toUpperCase()} · {(file.file_size / 1024).toFixed(1)} KB</span>
                        <span>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

          </div>

          {/* Column 2: Grounded Chatbot (Center, Span 5) */}
          <div className="xl:col-span-5 border-r border-white/10 flex flex-col min-h-0 bg-navy-950/40">
            
            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-4 max-w-3xl mx-auto">
                {copilotMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs font-mono leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-cyan-accent/15 text-white border border-cyan-accent/30 rounded-br-none" 
                        : "bg-navy-900 border border-white/10 text-slate-300 rounded-bl-none"
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5 border-b border-white/5 pb-1">
                        <span className={`text-[8px] font-bold uppercase tracking-wider ${
                          msg.role === "user" ? "text-cyan-accent" : "text-slate-400"
                        }`}>
                          {msg.role === "user" ? "Investigator Officer" : "AI Copilot Engine"}
                        </span>
                        <span className="text-[8px] text-slate-500 ml-auto">{msg.timestamp}</span>
                      </div>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === "assistant" && msg.data && (
                        <InteractiveResponse data={msg.data} />
                      )}
                    </div>
                  </div>
                ))}

                {copilotTyping && (
                  <div className="flex justify-start">
                    <div className="bg-navy-900 border border-white/10 text-slate-400 rounded-2xl rounded-bl-none p-3.5 text-xs font-mono flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-accent opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-accent"></span>
                      </span>
                      AI Copilot is resolving entities and compiling recommendations...
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="px-4 py-2 border-t border-white/5 bg-black/10 flex items-center gap-2 flex-wrap font-mono text-[9px]">
              <span className="text-slate-500 uppercase font-bold">Quick Inquiries:</span>
              <button 
                onClick={() => handleSendCopilotMessage("Suggest Similar MO (Modus Operandi) signatures in database")}
                className="border border-white/10 rounded-full px-2.5 py-1 text-slate-300 hover:border-cyan-accent/30 hover:text-white bg-white/5"
              >
                Similar MOs?
              </button>
              <button 
                onClick={() => handleSendCopilotMessage("List suspect criminal history matches")}
                className="border border-white/10 rounded-full px-2.5 py-1 text-slate-300 hover:border-cyan-accent/30 hover:text-white bg-white/5"
              >
                Criminal History?
              </button>
              <button 
                onClick={() => handleSendCopilotMessage("Draft legal witness statement template")}
                className="border border-white/10 rounded-full px-2.5 py-1 text-slate-300 hover:border-cyan-accent/30 hover:text-white bg-white/5"
              >
                Witness Statement Draft?
              </button>
            </div>

            {/* Voice Transcription Indicator Overlay */}
            {isRecording && (
              <div className="mx-4 my-2 p-3 bg-red-950/20 border border-red-500/20 rounded-xl flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-[10px] text-red-400 font-mono font-bold">
                    Microphone active - Listening... ({formatTime(recordingTime)})
                  </span>
                </div>
                <button 
                  onClick={stopRecordingAndTranscribe}
                  className="bg-red-500 text-white font-mono font-bold text-[9px] px-2.5 py-1 rounded"
                >
                  Stop & Transcribe
                </button>
              </div>
            )}

            {/* Chat Input Container */}
            <div className="border-t border-white/10 bg-navy-900/80 p-3.5 backdrop-blur-xl shrink-0">
              <div className="mx-auto max-w-3xl flex items-end gap-2 bg-navy-950/60 border border-white/10 rounded-2xl p-2 shadow-card">
                
                {/* Voice Translator Trigger */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecordingAndTranscribe : startRecording}
                  title={isRecording ? "Stop voice recording" : "Record voice narration & transcribe"}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                    isRecording ? "bg-red-500/20 text-red-500 animate-pulse" : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <Mic className="h-5 w-5" />
                </button>

                <textarea
                  value={copilotInput}
                  onChange={(e) => setCopilotInput(e.target.value)}
                  disabled={copilotTyping}
                  placeholder="Query case details, ask AI recommendations, or trace suspect MO..."
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendCopilotMessage(copilotInput);
                    }
                  }}
                  className="max-h-24 min-h-[40px] flex-1 resize-none bg-transparent py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none disabled:opacity-50 font-mono"
                />

                <button
                  type="button"
                  disabled={!copilotInput.trim() || copilotTyping}
                  onClick={() => handleSendCopilotMessage(copilotInput)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-accent to-cyan-glow text-navy-950 transition-all duration-300 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 text-center text-[9px] text-slate-600 font-mono">
                Copilot queries are secured and cached locally. Reference case ID: {selectedCaseId.slice(0, 8)}
              </p>
            </div>

          </div>

          {/* Column 3: Chronology Timeline & Entities (Right, Span 3) */}
          <div className="xl:col-span-3 flex flex-col min-h-0 p-4 space-y-4 overflow-y-auto">
            
            {/* Generate Dossier Report Print */}
            <button 
              onClick={handlePrintPdf}
              className="w-full border border-cyan-accent/20 hover:border-cyan-accent/40 bg-cyan-accent/5 hover:bg-cyan-accent/10 rounded-xl py-3 text-xs font-bold text-cyan-accent font-mono flex items-center justify-center gap-2 transition-all cursor-pointer shadow-glass"
            >
              <Printer className="h-4 w-4" />
              Generate PDF Dossier
            </button>

            {/* Extracted Entity Checklist */}
            <GlassCard className="p-4 border-white/10 space-y-3">
              <div className="border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Extracted Case Entities</span>
              </div>

              <div className="space-y-2.5 overflow-y-auto max-h-[250px] pr-1">
                {entities.length === 0 ? (
                  <div className="text-slate-600 font-mono text-[10px] text-center py-4">
                    No entities extracted yet.
                  </div>
                ) : (
                  entities.map(ent => (
                    <div 
                      key={ent.id}
                      className="p-2.5 bg-black/20 border border-white/5 rounded-xl space-y-1 hover:bg-black/30 transition-all font-mono"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{ent.name}</span>
                        <span className="text-[8px] uppercase font-bold text-cyan-accent bg-cyan-950/30 px-1.5 py-0.5 rounded">
                          {ent.category}
                        </span>
                      </div>
                      {ent.details && (
                        <p className="text-[9px] text-slate-400 leading-normal">
                          {ent.details}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

            {/* Timelines Chronology */}
            <GlassCard className="p-4 border-white/10 flex-1 flex flex-col min-h-[300px]">
              <div className="border-b border-white/5 pb-2 mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">Chronological Event Timeline</span>
              </div>

              <div className="relative border-l border-white/10 ml-2 pl-4 space-y-4 overflow-y-auto flex-1 max-h-[350px] pr-1">
                {timeline.length === 0 ? (
                  <div className="text-slate-600 font-mono text-[10px] text-center py-4">
                    No timeline logs generated.
                  </div>
                ) : (
                  timeline.map(item => (
                    <div key={item.id} className="relative font-mono">
                      <span className="absolute -left-[21px] top-1 bg-cyan-accent h-2 w-2 rounded-full ring-4 ring-navy-950" />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-white">{item.title}</span>
                          <span className="text-[8px] text-slate-500 font-mono">({item.timestamp_str})</span>
                        </div>
                        <p className="text-[9px] text-slate-400 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </GlassCard>

          </div>

          {/* --- PRINT ONLY PDF DOSSIER BLOCK --- */}
          {dossier && (
            <div className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans z-50 overflow-y-auto">
              <div className="space-y-6">
                
                {/* Print Header */}
                <div className="flex justify-between border-b-2 border-black pb-4">
                  <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wide">POLICE CASE INVESTIGATION REPORT</h1>
                    <p className="text-xs text-gray-500">STATE POLICE DIVISION · JURISDICTION CONTROL</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">CASE REF: {dossier.overview.caseNumber}</p>
                    <p className="text-xs text-gray-500">PRINT DATE: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Print Case Details */}
                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                  <div>
                    <h2 className="text-sm font-bold uppercase text-gray-700 mb-2">1. OVERVIEW</h2>
                    <p className="text-xs"><strong>FIR Number:</strong> {dossier.overview.firNumber}</p>
                    <p className="text-xs"><strong>Crime Category:</strong> {dossier.overview.crimeCategory} / {dossier.overview.crimeSubCategory}</p>
                    <p className="text-xs"><strong>Current Status:</strong> {dossier.overview.currentStatus.toUpperCase()}</p>
                    <p className="text-xs"><strong>Assigned Officer:</strong> {dossier.overview.assignedOfficer}</p>
                    <p className="text-xs"><strong>Police Station:</strong> {dossier.overview.policeStation}</p>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase text-gray-700 mb-2">2. VICTIM & COMPLAINANT</h2>
                    <p className="text-xs"><strong>Complainant:</strong> {dossier.complainant.name} ({dossier.complainant.phone})</p>
                    <p className="text-xs"><strong>Address:</strong> {dossier.complainant.address}</p>
                    <p className="text-xs"><strong>Victim Name:</strong> {dossier.victim.name} (Age: {dossier.victim.age})</p>
                    <p className="text-xs"><strong>Injuries:</strong> {dossier.victim.injuries}</p>
                  </div>
                </div>

                {/* Print Evidence List */}
                <div>
                  <h2 className="text-sm font-bold uppercase text-gray-700 mb-2">3. INDEXED EVIDENCE FILES ({evidenceFiles.length})</h2>
                  <table className="w-full text-xs text-left border">
                    <thead>
                      <tr className="bg-gray-100 border-b">
                        <th className="p-2 border">Filename</th>
                        <th className="p-2 border">Type</th>
                        <th className="p-2 border">AI Extraction Summary</th>
                        <th className="p-2 border">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evidenceFiles.map(file => (
                        <tr key={file.id} className="border-b">
                          <td className="p-2 border font-mono">{file.filename}</td>
                          <td className="p-2 border uppercase">{file.file_type}</td>
                          <td className="p-2 border">{file.summary}</td>
                          <td className="p-2 border">{file.confidence_score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Print Entities */}
                <div>
                  <h2 className="text-sm font-bold uppercase text-gray-700 mb-2">4. EXTRACTED INTELLIGENCE ENTITIES</h2>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {entities.map(ent => (
                      <div key={ent.id} className="p-2 border rounded">
                        <strong>{ent.name}</strong> ({ent.category.toUpperCase()}) - {ent.details}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Print Timeline */}
                <div>
                  <h2 className="text-sm font-bold uppercase text-gray-700 mb-2">5. CHRONOLOGY TIMELINE</h2>
                  <div className="space-y-2 pl-4 border-l-2 border-black">
                    {timeline.map(item => (
                      <div key={item.id} className="text-xs">
                        <strong>{item.title}</strong> ({item.timestamp_str}) - {item.description}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Print Disclaimers */}
                <div className="text-[10px] text-gray-500 border-t pt-4 text-center">
                  This dossier is generated from secure digital records by AI Investigation Copilot. Certified and verified for official police court production.
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </DashboardLayout>
  );
}
