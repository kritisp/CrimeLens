import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { mockSuggestions } from '../data/chat';
import { 
  Send, 
  MessageSquare, 
  Sparkles, 
  Network, 
  Map, 
  FileText, 
  ArrowRight, 
  Target, 
  Zap, 
  Clock, 
  Bot, 
  User, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

export default function AIChat() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  // Chat states
  const [messages, setMessages] = useState([
    {
      id: "welcome-1",
      sender: "copilot",
      text: "Welcome to CrimeLens AI. I am synced with Karnataka State Police records today. Ask me about suspect dossiers, case connections, or geographical hot zones.",
      isInteractive: false,
      timestamp: "09:00 AM"
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Recent chat log items in sidebar
  const recentChats = [
    { id: "log-1", query: "Analyze vehicle theft patterns in East Division" },
    { id: "log-2", query: "Show intelligence dossier on suspect Ravi 'Bouncer' Kumar" },
    { id: "log-3", query: "Verify bank transaction anomalies in Bidar case" }
  ];

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Send message processor
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      // POST search to mock API
      const res = await api.post('/chat/query', { query: text });
      const aiData = res.data;

      // Add AI response
      const aiMessage = {
        id: `ai-${Date.now()}`,
        sender: "copilot",
        text: aiData.summary,
        isInteractive: true,
        data: aiData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error("AI engine query failure", err);
      // Fallback message
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: "copilot",
        text: "Error synchronizing with the pattern matching registry. Please check your credentials.",
        isInteractive: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      
      {/* LEFT SIDEBAR: ChatGPT-style logs */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 text-slate-300 hidden md:flex">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <MessageSquare size={16} className="text-blue-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-white font-display">Intelligence Logs</span>
        </div>
        
        {/* Recents list */}
        <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {recentChats.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSendMessage(c.query)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-all truncate border border-transparent hover:border-slate-800"
            >
              <Bot size={12} className="shrink-0 text-slate-500" />
              <span className="truncate">{c.query}</span>
            </button>
          ))}
        </div>
        
        {/* Foot disclaimer */}
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-semibold leading-relaxed">
          Authorized KSP sessions logged under surveillance.
        </div>
      </div>

      {/* RIGHT WORKSPACE: Conversation Screen */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50">
        
        {/* Messages Frame */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex gap-4 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Profile indicator */}
              {m.sender !== 'user' && (
                <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
              )}

              {/* Message Bubble Container */}
              <div className={`max-w-2xl space-y-3 ${
                m.sender === 'user' 
                  ? 'bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-sm rounded-tr-none' 
                  : 'w-full'
              }`}>
                {/* User plain text message */}
                {m.sender === 'user' && (
                  <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                )}

                {/* AI Interactive response formatting */}
                {m.sender !== 'user' && (
                  <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm rounded-tl-none space-y-4 text-slate-900 relative">
                    
                    {/* Header title */}
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Sparkles size={12} className="text-blue-500" /> CrimeLens Copilot AI
                    </div>
                    
                    {/* Summary text */}
                    <p className="text-sm text-slate-700 leading-relaxed font-semibold">
                      {m.text}
                    </p>

                    {/* INTERACTIVE COMPONENT LAYER */}
                    {m.isInteractive && m.data && (
                      <div className="space-y-4 pt-3 border-t border-slate-100">
                        
                        {/* 1. Analytics Cards */}
                        {m.data.stats && (
                          <div className="grid grid-cols-2 gap-2">
                            {m.data.stats.map((s, idx) => (
                              <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</div>
                                <div className="text-xs font-bold text-slate-900 mt-0.5">{s.value}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 2. Timeline Widget */}
                        {m.data.timeline && m.data.timeline.length > 0 && (
                          <div className="space-y-2.5 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Clock size={12}/> Modus Operandi Timeline
                            </div>
                            <div className="relative border-l-2 border-slate-200 ml-2 space-y-3.5 pb-1">
                              {m.data.timeline.map(t => (
                                <div key={t.id} className="relative pl-4">
                                  <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-white border border-blue-500 shadow-sm"></div>
                                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-900">
                                    <span>{t.title}</span>
                                    <span className="text-slate-400">{t.time}</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{t.desc}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 3. Combined Previews: Network & Heatmap */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Network Graph box */}
                          {m.data.networkPreview && (
                            <div 
                              onClick={() => navigate('/network')}
                              className="bg-slate-900 text-white rounded-xl p-3 border border-slate-800 cursor-pointer hover:border-slate-700 hover:shadow-sm transition-all group flex flex-col justify-between h-28"
                            >
                              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>Network Mapping</span>
                                <Network size={12} className="text-blue-400" />
                              </div>
                              <div className="my-2">
                                <div className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                                  {m.data.networkPreview.mainEntity}
                                </div>
                                <div className="text-[9px] text-slate-500 font-semibold truncate mt-0.5">
                                  Links: {m.data.networkPreview.linkedEntities.join(', ')}
                                </div>
                              </div>
                              <div className="text-[9px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                Open Network <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          )}

                          {/* Heatmap Geo box */}
                          {m.data.heatmapPreview && (
                            <div 
                              onClick={() => navigate('/heatmap')}
                              className="bg-slate-900 text-white rounded-xl p-3 border border-slate-800 cursor-pointer hover:border-slate-700 hover:shadow-sm transition-all group flex flex-col justify-between h-28"
                            >
                              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                <span>Geographic clusters</span>
                                <Map size={12} className="text-emerald-400" />
                              </div>
                              <div className="my-2">
                                <div className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                                  Hotspots: {m.data.heatmapPreview.hotspots[0]}
                                </div>
                                <div className="text-[9px] text-slate-500 font-semibold truncate mt-0.5">
                                  Density: {m.data.heatmapPreview.density} • Areas: {m.data.heatmapPreview.hotspots.slice(1).join(', ')}
                                </div>
                              </div>
                              <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                Open Heatmap <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 4. Recommendation cards */}
                        {m.data.recommendations && (
                          <div className="space-y-1.5">
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Zap size={11} className="text-amber-500" /> Next Actions
                            </div>
                            <div className="space-y-1.5">
                              {m.data.recommendations.map((rec, idx) => (
                                <div key={idx} className="flex gap-2 p-2 bg-slate-50 border border-slate-150 rounded-lg items-start text-[11px] font-semibold text-slate-700">
                                  <Zap size={12} className="text-amber-500 mt-0.5 shrink-0" />
                                  <span>{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. Navigation Action Buttons */}
                        {m.data.actions && m.data.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                            {m.data.actions.includes("open_case") && (
                              <button 
                                onClick={() => navigate(`/cases/${m.data.caseId}`)}
                                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                              >
                                <FileText size={12}/> Open Case File
                              </button>
                            )}
                            {m.data.actions.includes("open_network") && (
                              <button 
                                onClick={() => navigate('/network')}
                                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Network size={12}/> Explore Connections
                              </button>
                            )}
                            {m.data.actions.includes("generate_report") && (
                              <button 
                                onClick={() => navigate('/reports')}
                                className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <FileText size={12}/> Print brief
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* AI Thinking Loader */}
          {isTyping && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div className="bg-white border border-slate-200 px-5 py-3.5 rounded-2xl rounded-tl-none text-slate-500 text-xs font-semibold flex items-center gap-2 shadow-sm animate-pulse">
                <span>CrimeLens AI is mapping connections...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Sugggestion grid shown if chat has only greeting */}
        {messages.length === 1 && !isTyping && (
          <div className="p-6 pt-0 max-w-2xl mx-auto w-full space-y-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Suggested queries</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockSuggestions.map((sug) => (
                <button
                  key={sug.id}
                  onClick={() => handleSendMessage(sug.query)}
                  className="p-3 bg-white border border-slate-200 hover:border-blue-500 rounded-2xl text-left text-xs font-semibold text-slate-700 hover:text-blue-600 transition-all flex items-center justify-between group shadow-sm cursor-pointer"
                >
                  <span>{sug.label}</span>
                  <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM INPUT CONSOLE */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputText);
            }}
            className="flex gap-2 max-w-3xl mx-auto"
          >
            <input 
              type="text"
              disabled={isTyping}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Copilot about vehicle theft timeline, suspects, or transactions..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-2xl text-sm placeholder-slate-400 text-slate-900 transition-all outline-none disabled:opacity-70"
            />
            <button 
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Send size={18} />
            </button>
          </form>
          
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-bold max-w-lg mx-auto text-center leading-snug">
            <AlertCircle size={10} className="shrink-0 text-slate-400" />
            <span>AI responses are patterns for lead vetting only. Cross-reference ANPR with regional registries.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
