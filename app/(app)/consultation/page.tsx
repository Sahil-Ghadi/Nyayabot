"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, History as HistoryIcon, AlertCircle, Shield, Scale, Info, Paperclip, Loader2, Clock } from "lucide-react";
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
      const savedChatId = sessionStorage.getItem("currentChatId");
      if (savedChatId) {
        loadChatHistory(savedChatId);
      }
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
    sessionStorage.setItem("currentChatId", chatId);
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
      sessionStorage.setItem("currentChatId", chatId);
      loadChats();
    }

    const userMsgObj = { role: "user", content: userMessageContent };
    setMessages((prev) => [...prev, userMsgObj]);

    await addMessage(chatId, "user", userMessageContent);

    try {
      const token = await user.getIdToken();
      const history = messages.map(msg => ({ role: msg.role, content: msg.content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMessageContent, history }),
      });

      const data = await response.json();

      if (data.response) {
        await addMessage(chatId, "assistant", data.response, { classification: data.classification });

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response, classification: data.classification },
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
      {/* Center Panel: AI Conversation */}
      <div className="flex-1 flex flex-col relative w-full">
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
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "user" ? (
                <div className="bg-white/5 border border-white/10 p-5 rounded-2xl rounded-tr-sm max-w-[85%] backdrop-blur-sm">
                  <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-4 max-w-[95%]">
                  {(msg.classification || msg.metadata?.classification) && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="px-3 py-1 bg-brand-gold/10 border border-brand-gold/30 rounded-full flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-brand-gold" />
                        <span className="text-[10px] font-bold tracking-widest text-brand-gold uppercase">
                          {msg.classification || msg.metadata?.classification}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="glass-panel p-6 sm:p-8 rounded-2xl rounded-tl-sm border-white/10 relative overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                    <div className="absolute top-0 left-0 w-1 h-full bg-brand-gold" />

                    {/* Rendered Response */}
                    <div className="text-brand-text-secondary leading-relaxed w-full">
                      {typeof msg.content === "string" ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h2: ({ children }) => (
                              <h2 className="text-brand-gold font-bold text-base mt-6 mb-3 first:mt-0">
                                {children}
                              </h2>
                            ),
                            p: ({ children }) => (
                              <p className="text-white/80 my-2 leading-relaxed text-sm">{children}</p>
                            ),
                            strong: ({ children }) => (
                              <strong className="text-white font-semibold">{children}</strong>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-brand-gold pl-4 text-white/70 italic my-3 bg-white/5 py-2 pr-3 rounded-r-lg">
                                {children}
                              </blockquote>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-4 rounded-lg border border-white/10">
                                <table className="w-full border-collapse text-sm">{children}</table>
                              </div>
                            ),
                            th: ({ children }) => (
                              <th className="border border-brand-gold/30 bg-brand-gold/10 px-3 py-2 text-left text-brand-gold font-semibold text-xs uppercase tracking-wider">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="border border-white/10 px-3 py-2 text-white/75 text-sm">
                                {children}
                              </td>
                            ),
                            ul: ({ children }) => (
                              <ul className="my-3 space-y-1">{children}</ul>
                            ),
                            li: ({ children }) => (
                              <li className="ml-5 my-1.5 text-white/80 text-sm list-disc">
                                {children}
                              </li>
                            ),
                            hr: () => <hr className="border-white/10 my-4" />,
                            em: ({ children }) => (
                              <em className="text-white/40 text-xs not-italic">{children}</em>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="flex flex-col gap-8 w-full">
                          {/* Assessment */}
                          {msg.content?.assessment && (
                            <div className="bg-white/5 border-l-4 border-brand-gold p-5 rounded-r-xl">
                              <h3 className="text-brand-gold font-bold mb-3 flex items-center gap-2 uppercase tracking-wider text-xs">
                                <Scale className="w-4 h-4" /> Legal Assessment
                              </h3>
                              <p className="text-white/90 text-sm leading-relaxed">{msg.content.assessment}</p>
                            </div>
                          )}
                          
                          {/* Laws */}
                          {msg.content?.applicableLaws && msg.content.applicableLaws.length > 0 && (
                            <div>
                              <h3 className="text-brand-gold font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                                <Shield className="w-4 h-4" /> Applicable Laws & Provisions
                              </h3>
                              <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                <table className="w-full text-sm text-left table-fixed break-words">
                                  <thead className="bg-brand-gold/10 text-brand-gold uppercase text-[10px] tracking-wider">
                                    <tr>
                                      <th className="w-1/4 px-5 py-4 font-semibold border-b border-brand-gold/20">Law / Act</th>
                                      <th className="w-1/4 px-5 py-4 font-semibold border-b border-brand-gold/20">Section</th>
                                      <th className="w-1/2 px-5 py-4 font-semibold border-b border-brand-gold/20">What It Means</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-white/10">
                                    {msg.content.applicableLaws.map((law: any, idx: number) => (
                                      <tr key={idx} className="hover:bg-white/[0.08] transition-colors">
                                        <td className="px-5 py-4 font-medium text-white/90">{law.law}</td>
                                        <td className="px-5 py-4 text-white/70">{law.section}</td>
                                        <td className="px-5 py-4 text-white/70">{law.meaning}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* Action Plan */}
                          {msg.content?.actionPlan && msg.content.actionPlan.length > 0 && (
                            <div>
                              <h3 className="text-brand-gold font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                                <Info className="w-4 h-4" /> Your Action Plan
                              </h3>
                              <div className="space-y-4">
                                {msg.content.actionPlan.map((step: any, idx: number) => (
                                  <div key={idx} className="flex items-start gap-5 p-5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.05] transition-colors">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-gold/20 text-brand-gold flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                                      {idx + 1}
                                    </div>
                                    <div className="pt-0.5">
                                      <h4 className="text-white font-medium mb-1.5">{step.stepTitle}</h4>
                                      <p className="text-white/70 text-sm leading-relaxed">{step.action}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                            {/* Evidence */}
                            {msg.content?.evidence && msg.content.evidence.length > 0 && (
                              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.03]">
                                <h3 className="text-brand-gold font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                                  <Paperclip className="w-4 h-4" /> Evidence to Collect
                                </h3>
                                <ul className="space-y-4">
                                  {msg.content.evidence.map((item: any, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5 flex-shrink-0" />
                                      <div>
                                        <span className="text-white font-medium block text-sm mb-1">{item.item}</span>
                                        <span className="text-white/60 text-xs block leading-relaxed">{item.reason}</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Deadlines */}
                            {msg.content?.deadlines && msg.content.deadlines.length > 0 && (
                              <div className="p-5 rounded-xl border border-white/10 bg-white/[0.03]">
                                <h3 className="text-brand-gold font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-xs">
                                  <Clock className="w-4 h-4" /> Key Deadlines
                                </h3>
                                <ul className="space-y-4">
                                  {msg.content.deadlines.map((dl: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-3">
                                      <div className="w-1.5 h-1.5 rounded-full bg-brand-gold mt-1.5 flex-shrink-0 shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                                      <span className="text-white/80 text-sm leading-relaxed">{dl}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
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
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
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


    </div>
  );
}