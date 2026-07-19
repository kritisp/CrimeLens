import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Volume2, Bot } from "lucide-react";

export function VoiceCommander() {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [showConsole, setShowConsole] = useState(false);

  useEffect(() => {
    // Check SpeechRecognition browser availability
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-IN"; // Set English (India) or English (US)

      rec.onstart = () => {
        setIsListening(true);
        setFeedback("Listening for command dispatch...");
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition Error:", e);
        setIsListening(false);
        setFeedback("Error capturing audio feed.");
      };

      rec.onresult = (event: any) => {
        const text = event.results[0][0].transcript.toLowerCase();
        setTranscript(text);
        processVoiceCommand(text);
      };

      setRecognition(rec);
    }
  }, [navigate]);

  const speak = (msg: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const processVoiceCommand = (cmd: string) => {
    setShowConsole(true);
    setFeedback(`Processing command: "${cmd}"`);

    // Routing commands
    if (cmd.includes("dashboard") || cmd.includes("overview")) {
      speak("Navigating to intelligence command center dashboard.");
      setTimeout(() => navigate("/dashboard"), 800);
    } else if (cmd.includes("cases") || cmd.includes("all cases")) {
      speak("Accessing cases and digital dossiers database.");
      setTimeout(() => navigate("/cases"), 800);
    } else if (cmd.includes("map") || cmd.includes("intelligence") || cmd.includes("gis")) {
      speak("Opening crime intelligence GIS map layers.");
      setTimeout(() => navigate("/crime-intelligence"), 800);
    } else if (cmd.includes("analytics") || cmd.includes("statistics") || cmd.includes("charts")) {
      speak("Accessing crime intelligence analytics center.");
      setTimeout(() => navigate("/analytics"), 800);
    } else if (cmd.includes("assistant") || cmd.includes("chat") || cmd.includes("bot")) {
      speak("Connecting with Gemini investigator assistant.");
      setTimeout(() => navigate("/ai-assistant"), 800);
    } else if (cmd.includes("register") || cmd.includes("fir") || cmd.includes("new case")) {
      speak("Initiating new FIR registration form.");
      setTimeout(() => navigate("/register-fir"), 800);
    } else if (cmd.includes("logout") || cmd.includes("log out") || cmd.includes("exit")) {
      speak("Terminating secure dispatch link. Logging out.");
      setTimeout(() => navigate("/"), 800);
    } else if (cmd.includes("status") || cmd.includes("brief") || cmd.includes("read status")) {
      const statsBrief = "System status: Online. Database connection: Verified. Current queue includes two thousand eight hundred forty seven active case files. AI engines operational.";
      setFeedback("System briefing active...");
      speak(statsBrief);
    } else {
      speak("Command not recognized. Please speak clear directions.");
      setFeedback(`Unknown dispatch: "${cmd}". Speak "dashboard", "cases", "map", "analytics", "register", or "status".`);
    }

    // Hide console shortly after execution
    setTimeout(() => {
      setShowConsole(false);
    }, 4500);
  };

  const toggleListen = () => {
    if (!recognition) {
      speak("Voice commander module is not supported in this browser. Please use Chrome.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      setShowConsole(true);
      recognition.start();
    }
  };

  return (
    <>
      {/* Floating Widget mic button */}
      <div className="fixed bottom-6 right-6 z-50 print:hidden flex flex-col items-end gap-3 font-mono">
        {/* Glowing voice console overlay */}
        {showConsole && (
          <div className="bg-navy-950/90 border border-cyan-500/30 rounded-2xl p-4 w-72 shadow-glow backdrop-blur-xl animate-scale-in text-xs space-y-2">
            <div className="flex items-center gap-2 border-b border-white/10 pb-1.5 text-cyan-accent font-bold">
              <Bot className="h-4 w-4 animate-pulse" />
              <span>Voice Commander Active</span>
            </div>
            {transcript && (
              <p className="text-[10px] text-slate-400">
                Parsed: <b className="text-white">"{transcript}"</b>
              </p>
            )}
            <p className="text-[10px] text-cyan-300 font-bold animate-pulse flex items-center gap-1.5">
              <Volume2 className="h-3 w-3" />
              {feedback}
            </p>
          </div>
        )}

        <button
          onClick={toggleListen}
          title="Toggle Voice Dispatch Commander"
          className={`h-12 w-12 rounded-full border flex items-center justify-center transition-all duration-300 shadow-glow group ${
            isListening
              ? "bg-rose-500 border-rose-400 text-white animate-pulse"
              : "bg-cyan-accent/10 border-cyan-accent/30 text-cyan-accent hover:bg-cyan-accent/20 hover:scale-105"
          }`}
        >
          {isListening ? (
            <Mic className="h-5 w-5" />
          ) : (
            <Mic className="h-5 w-5 group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>
    </>
  );
}

export default VoiceCommander;
