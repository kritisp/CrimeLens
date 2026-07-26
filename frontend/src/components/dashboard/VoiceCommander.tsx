import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Volume2, Bot, Globe } from "lucide-react";

export function VoiceCommander({ sidebarCollapsed = false }: { sidebarCollapsed?: boolean }) {
  const leftClass = sidebarCollapsed ? "lg:left-[96px]" : "lg:left-[280px]";
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [feedback, setFeedback] = useState("");
  const [showConsole, setShowConsole] = useState(false);
  
  // Language Support
  const [language, setLanguage] = useState("en-IN");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const hideTimeoutRef = useRef<any>(null);

  useEffect(() => {
    // Check SpeechRecognition browser availability
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language;

      rec.onstart = () => {
        setIsListening(true);
        setFeedback(language === "en-IN" ? "Listening..." : language === "hi-IN" ? "सुन रहा हूँ..." : "ಕೇಳುತ್ತಿದ್ದೇನೆ...");
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
  }, [navigate, language]);

  const speak = (msg: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = 1.0;
      utterance.pitch = 1.1;
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);
    }
  };

  const processVoiceCommand = async (cmd: string) => {
    setShowConsole(true);
    setFeedback(`Processing: "${cmd}"`);

    try {
      const res = await fetch("/api/v1/intelligence/voice-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: cmd, language: language })
      });
      
      if (res.ok) {
        const data = await res.json();
        
        if (data.reply) {
          speak(data.reply);
          setFeedback(data.reply);
        }

        if (data.action === "NAVIGATE" && data.route) {
          setTimeout(() => navigate(data.route), 1200);
        }
      } else {
        throw new Error("API failed");
      }
    } catch (err) {
      console.error(err);
      speak(language === "en-IN" ? "Network error" : "Network error");
      setFeedback("Failed to process command over network.");
    }

    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => setShowConsole(false), 5000);
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

  const setLang = (code: string) => {
    setLanguage(code);
    setShowLangMenu(false);
    speak(code === "en-IN" ? "English activated" : code === "hi-IN" ? "हिंदी सक्रिय" : "ಕನ್ನಡ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ");
  };

  return (
    <>
      <div className={`fixed bottom-8 ${leftClass} left-6 z-[9999] print:hidden flex flex-col items-start gap-3 transition-all duration-300 font-mono`}>
        
        {showLangMenu && (
          <div className="bg-navy-900 border border-slate-700 rounded-lg p-2 flex flex-col gap-1 shadow-lg animate-fade-in mb-2 self-start">
            <button onClick={() => setLang("en-IN")} className={`text-xs px-3 py-1.5 rounded text-left ${language === 'en-IN' ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-300 hover:bg-slate-800'}`}>English</button>
            <button onClick={() => setLang("hi-IN")} className={`text-xs px-3 py-1.5 rounded text-left ${language === 'hi-IN' ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-300 hover:bg-slate-800'}`}>हिंदी</button>
            <button onClick={() => setLang("kn-IN")} className={`text-xs px-3 py-1.5 rounded text-left ${language === 'kn-IN' ? 'bg-cyan-900/50 text-cyan-400' : 'text-slate-300 hover:bg-slate-800'}`}>ಕನ್ನಡ</button>
          </div>
        )}

        {showConsole && (
          <div className="bg-navy-950/90 border border-cyan-500/30 rounded-2xl p-4 w-72 shadow-glow backdrop-blur-xl animate-scale-in text-xs space-y-2 self-start">
            <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
              <div className="flex items-center gap-2 text-cyan-accent font-bold">
                <Bot className="h-4 w-4 animate-pulse" />
                <span>AI Copilot</span>
              </div>
              <span className="text-[9px] uppercase text-slate-500">{language}</span>
            </div>
            {transcript && (
              <p className="text-[10px] text-slate-400">
                "{transcript}"
              </p>
            )}
            <p className="text-[10px] text-cyan-300 font-bold flex items-start gap-1.5 mt-2">
              <Volume2 className="h-3 w-3 mt-0.5 shrink-0" />
              <span className="leading-relaxed">{feedback}</span>
            </p>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => setShowLangMenu(!showLangMenu)}
            style={{ width: "48px", height: "48px", flexShrink: 0 }}
            className="rounded-full border border-slate-700 bg-slate-900/80 text-slate-400 flex items-center justify-center hover:bg-slate-800 transition-colors"
            title="Change Language"
          >
            <Globe className="h-5 w-5" />
          </button>
          <button
            onClick={toggleListen}
            title="Toggle Voice Dispatch Commander"
            style={{ width: "48px", height: "48px", flexShrink: 0 }}
            className={`rounded-full border flex items-center justify-center transition-all duration-300 shadow-glow group ${
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
      </div>
    </>
  );
}

export default VoiceCommander;
