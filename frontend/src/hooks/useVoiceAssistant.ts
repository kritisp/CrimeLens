import { useState, useEffect, useRef, useCallback } from "react";

export interface VoiceAssistantOptions {
  onTranscriptChange?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  autoSpeak?: boolean;
}

export function useVoiceAssistant(options: VoiceAssistantOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [autoSpeakEnabled, setAutoSpeakEnabled] = useState(options.autoSpeak ?? false);
  const [hasSpeechRecognition, setHasSpeechRecognition] = useState(true);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setHasSpeechRecognition(true);
      const rec = new SpeechRecognitionAPI();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-IN"; // English (India) & standard English

      rec.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript) {
          setTranscript(currentTranscript);
          options.onTranscriptChange?.(currentTranscript);
        }
      };

      rec.onerror = (e: any) => {
        console.warn("Speech recognition notice:", e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    } else {
      setHasSpeechRecognition(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer logic for recording
  useEffect(() => {
    if (isListening) {
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isListening]);

  // Start STT Listening
  const startListening = useCallback(() => {
    setTranscript("");
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        return;
      } catch (err) {
        console.warn("Starting Web Speech Recognition failed, using fallback audio recorder", err);
      }
    }

    // Fallback: Use Navigator MediaRecorder
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              audioChunksRef.current.push(event.data);
            }
          };

          mediaRecorder.start();
          setIsListening(true);
        })
        .catch((err) => {
          console.error("Audio recording permission denied:", err);
        });
    }
  }, []);

  // Stop STT Listening & return transcribed text
  const stopListening = useCallback(async (): Promise<string> => {
    setIsListening(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    // Handle MediaRecorder fallback if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());

      try {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("file", audioBlob, "voice_note.wav");

        const res = await fetch("/api/v1/intelligence/transcribe-voice", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.text) {
            setTranscript(data.text);
            options.onFinalTranscript?.(data.text);
            return data.text;
          }
        }
      } catch (err) {
        console.error("Voice transcription failed:", err);
      }
    }

    options.onFinalTranscript?.(transcript);
    return transcript;
  }, [transcript]);

  // Text-to-Speech (TTS)
  const speak = useCallback((text: string, messageId?: string) => {
    if (!("speechSynthesis" in window) || !text) return;

    window.speechSynthesis.cancel();

    // Remove markdown symbols and code blocks for natural reading
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/[*_#`~]/g, "")
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = "en-IN";

    utterance.onstart = () => {
      setIsSpeaking(true);
      if (messageId) setCurrentlySpeakingId(messageId);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentlySpeakingId(null);
    }
  }, []);

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeakEnabled((prev) => !prev);
  }, []);

  return {
    isListening,
    transcript,
    recordingTime,
    hasSpeechRecognition,
    startListening,
    stopListening,
    isSpeaking,
    currentlySpeakingId,
    speak,
    stopSpeaking,
    autoSpeakEnabled,
    toggleAutoSpeak,
    setAutoSpeakEnabled,
  };
}
