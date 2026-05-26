"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, History as HistoryIcon, Search, AlertCircle, Shield, Scale, Map, Info, Paperclip, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createChat, addMessage, getUserChats, getMessages } from "@/lib/firestore";

export default function ConsultationPage() {
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadChats = async () => {
    if (!user) return;
    const userChats = await getUserChats(user.uid);
    setChats(userChats);
  };

  const loadChatHistory = async (chatId: string) => {
    setCurrentChatId(chatId);
    const msgs = await getMessages(chatId);
    setMessages(msgs);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !user || isLoading) return;

    const userMessageContent = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    let chatId = currentChatId;
    if (!chatId) {
      chatId = await createChat(user.uid, userMessageContent.substring(0, 30) + "...");
      setCurrentChatId(chatId);
      loadChats(); // refresh sidebar
    }

    // Optimistic UI for User Message
    const userMsgObj = { role: "user", content: userMessageContent };
    setMessages((prev) => [...prev, userMsgObj]);
    
    // Save User message to Firestore
    await addMessage(chatId, "user", userMessageContent);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessageContent }),
      });

      const data = await response.json();
      
      if (data.response) {
        // Save AI message to Firestore
        await addMessage(chatId, "assistant", data.response, { classification: data.classification });
        
        // Update UI
        setMessages((prev) => [
          ...prev, 
          { role: "assistant", content: data.response, classification: data.classification }
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6 pb-6 -mt-4">
      {/* Left Panel: Conversation History */}
      <div className="hidden lg:flex w-64 flex-col gap-4 border-r border-white/5 pr-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-brand-gold">
            <HistoryIcon className="w-4 h-4" />
            <span className="font-serif text-sm font-bold uppercase tracking-widest">History</span>
          </div>
          <button 
            onClick={() => { setCurrentChatId(null); setMessages([]); }}
            className="text-xs text-brand-text-secondary hover:text-white"
          >
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => loadChatHistory(chat.id)}
              className={`p-3 rounded-xl cursor-pointer transition-colors ${currentChatId === chat.id ? 'bg-white/10 text-white' : 'text-brand-text-secondary hover:bg-white/5 hover:text-white'}`}
            >
              <p className="text-sm font-medium truncate">{chat.title}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Center Panel: AI Conversation */}
      <div className="flex-1 flex flex-col relative max-w-3xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto pb-32 pt-4 space-y-8 scroll-smooth pr-4 custom-scrollbar">
          
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
              <Scale className="w-16 h-16 text-brand-gold mb-4" />
              <p className="text-xl font-serif">How can NyayaBot help you today?</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'user' ? (
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl rounded-tr-sm max-w-[85%] backdrop-blur-sm">
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-w-[95%]">
                  {msg.classification && (
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 bg-brand-gold/10 border border-brand-gold/30 rounded-full flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-brand-gold" />
                        <span className="text-[10px] font-bold tracking-widest text-brand-gold uppercase">{msg.classification || msg.metadata?.classification}</span>
                      </div>
                    </div>
                  )}

                  <div className="glass-panel p-6 sm:p-8 rounded-2xl rounded-tl-sm border-white/10 relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold" />
                    
                    <h3 className="font-serif text-2xl font-bold mb-4">Legal Evaluation</h3>
                    <div className="text-brand-text-secondary leading-relaxed mb-6 whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    
                    {/* Disclaimer */}
                    <div className="mt-8 p-4 bg-black/40 rounded-xl border border-white/5 flex gap-3">
                      <Info className="w-5 h-5 text-brand-text-secondary shrink-0 mt-0.5" />
                      <p className="text-xs text-brand-text-secondary leading-relaxed">
                        This analysis is for informational purposes and does not constitute formal legal advice. Please consult an advocate before filing matters in court.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-brand-gold">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">NyayaBot is thinking...</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand-bg via-brand-bg to-transparent pt-10 pb-2">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-gold/20 via-brand-gold/5 to-brand-gold/20 rounded-[28px] blur opacity-0 group-hover:opacity-100 transition duration-500" />
            <div className="relative flex items-center bg-brand-surface border border-white/10 rounded-[24px] p-2 pr-3 shadow-2xl">
              <button className="p-3 text-brand-text-secondary hover:text-white transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Describe your workplace situation..." 
                className="flex-1 bg-transparent outline-none text-white placeholder:text-white/20 text-sm md:text-base px-2"
                disabled={isLoading}
              />
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-brand-gold transition-colors hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-brand-text-secondary mt-3">
            NyayaBot can make mistakes. Consider verifying critical legal information.
          </p>
        </div>
      </div>

      {/* Right Panel: Legal References (Static for now) */}
      <div className="hidden xl:flex w-80 flex-col gap-4 border-l border-white/5 pl-6">
        <div className="flex items-center gap-2 mb-2 text-brand-gold">
          <Scale className="w-4 h-4" />
          <span className="font-serif text-sm font-bold uppercase tracking-widest">Citations</span>
        </div>

        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-sm group-hover:text-brand-gold transition-colors">Indian Employment Law</h4>
              <Shield className="w-3.5 h-3.5 text-brand-gold/50" />
            </div>
            <p className="text-xs text-brand-text-secondary leading-relaxed">
              Legal citations will be linked automatically based on the AI's analysis.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
