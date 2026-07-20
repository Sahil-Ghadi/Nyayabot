"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createChat, addMessage, getMessages } from "@/lib/firestore";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: any; // Can be string or structured object
};

export default function ConsultationPage() {
  const { user } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [citations, setCitations] = useState<any[]>([]);
  const [isContextOpen, setIsContextOpen] = useState(false);
  const chatFeedRef = useRef<HTMLDivElement>(null);

  const [streamState, setStreamState] = useState<any>(null);

  const getStreamStatusText = (state: any) => {
    if (state.response || state.actionPlan) return "Finalizing response...";
    if (state.applicableLaws) return "Structuring action plan...";
    if (state.assessment) return "Generating legal assessment...";
    if (state.retrievedDocs) return "Analyzing legal precedents...";
    if (state.classification) return "Classifying issue...";
    return "Analyzing query...";
  };

  // Load chat if continuing from history
  useEffect(() => {
    const savedChatId = sessionStorage.getItem("currentChatId");
    if (savedChatId && user) {
      setChatId(savedChatId);
      getMessages(savedChatId).then((fetchedMessages) => {
        if (fetchedMessages) {
          // Sort messages by createdAt if needed, but getMessages handles ordering
          setMessages(fetchedMessages.map((m: any) => ({ role: m.role, content: m.content })));
        }
      }).catch(err => console.error("Failed to load chat", err));
    }
    
    // Clear chat ID when unmounting so starting a new consultation works
    return () => sessionStorage.removeItem("currentChatId");
  }, [user]);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [messages, isLoading, streamState]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage = input.trim();
    setInput("");
    
    // Setup Chat DB
    let currentChatId = chatId;
    if (!currentChatId) {
      try {
        const title = userMessage.length > 40 ? userMessage.substring(0, 40) + "..." : userMessage;
        currentChatId = await createChat(user.uid, title);
        setChatId(currentChatId);
        sessionStorage.setItem("currentChatId", currentChatId);
      } catch (err) {
        console.error("Failed to create chat", err);
        return;
      }
    }

    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);
    setStreamState(null);

    try {
      // Save User Message to Firestore
      await addMessage(currentChatId, "user", userMessage);

      // In production, we'd pass the actual Firebase token
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer dummy-token", // TODO: Replace with real token
        },
        body: JSON.stringify({
          message: userMessage,
          history: messages,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let lastState: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              const nodeData = Object.values(data)[0] as any;
              // Update state as it streams through nodes
              lastState = { ...lastState, ...(nodeData || {}) };
              setStreamState({ ...lastState });
            } catch (e) {
              console.error("Error parsing stream chunk", e);
            }
          }
        }
      }

      if (lastState) {
        if (lastState.citations) {
          setCitations(lastState.citations);
        }

        // Construct assistant message content
        let content: any = {};
        if (lastState.response) {
          content = lastState.response;
        } else {
          content = {
            assessment: lastState.assessment,
            actionPlan: lastState.actionPlan,
            applicableLaws: lastState.applicableLaws,
            evidence: lastState.evidence,
          };
        }

        setMessages((prev) => [...prev, { role: "assistant", content }]);
        // Save Assistant Message to Firestore
        await addMessage(currentChatId, "assistant", content, { 
          citations: lastState.citations || [],
          classification: lastState.classification || null
        });
        setStreamState(null);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
      setStreamState(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderAssistantMessage = (content: any) => {
    if (!content) return null;
    
    if (typeof content === "string") {
      return (
        <div className="prose prose-invert max-w-none text-body-md text-on-surface leading-relaxed [&>p]:mb-4 [&>ul]:list-disc [&>ul]:ml-4 [&>ol]:list-decimal [&>ol]:ml-4">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {content.assessment && (
          <p className="font-semibold">{content.assessment}</p>
        )}
        
        {content.actionPlan && content.actionPlan.length > 0 && (
          <div className="my-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-primary text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>format_list_numbered</span>
              <h4 className="text-title-lg font-title-lg text-on-surface">Recommended Action Plan</h4>
            </div>
            <div className="flex flex-col gap-4 relative before:absolute before:inset-y-0 before:left-5 before:w-[2px] before:bg-white/10 ml-2">
              {content.actionPlan.map((step: any, idx: number) => (
                <div key={idx} className="flex gap-5 items-start relative group">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest border-4 border-surface flex items-center justify-center shrink-0 z-10 text-primary font-bold shadow-lg group-hover:bg-primary/20 transition-colors">
                    {idx + 1}
                  </div>
                  <div className="bg-surface-container-lowest/50 border border-white/5 rounded-xl p-4 flex-1 hover:bg-surface-container-low transition-colors shadow-sm">
                    <h5 className="font-bold text-on-surface text-body-md mb-1">{step.stepTitle}</h5>
                    <p className="text-[14px] text-on-surface-variant leading-relaxed">{step.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {content.evidence && content.evidence.length > 0 && (
          <div className="my-3 bg-tertiary-container/10 border border-tertiary/20 rounded-xl p-4 relative overflow-hidden shadow-sm">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-tertiary/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <span className="material-symbols-outlined text-tertiary text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>folder_special</span>
              <h4 className="text-body-md font-body-md font-bold text-on-surface">Evidence to Collect</h4>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 relative z-10">
              {content.evidence.map((ev: any, idx: number) => (
                <li key={idx} className="flex gap-2.5 items-start bg-surface-container-lowest/40 p-3 rounded-lg border border-white/5 hover:border-tertiary/30 transition-colors group">
                  <span className="material-symbols-outlined text-tertiary/70 group-hover:text-tertiary mt-0.5 text-[16px] transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <div className="leading-snug">
                    <strong className="text-on-surface font-semibold text-[13px] mr-1.5">{ev.item}:</strong>
                    <span className="text-[12px] text-on-surface-variant">{ev.reason}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    );
  };

  const assistantMessagesWithLaws = messages.filter(m => m.role === "assistant" && m.content && m.content.applicableLaws);
  const latestApplicableLaws = streamState?.applicableLaws || (assistantMessagesWithLaws.length > 0 
    ? assistantMessagesWithLaws[assistantMessagesWithLaws.length - 1].content.applicableLaws 
    : []);
    
  const currentCitations = streamState?.citations || citations;

  return (
    <div className="flex-1 flex h-full overflow-hidden relative bg-surface-dim">
      {/* Abstract Background Glow for Depth */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-container blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-tertiary-container blur-[150px]"></div>
      </div>

      {/* Central Chat Canvas */}
      <section className="flex-1 flex flex-col h-full relative z-10">
        <header className="h-[72px] shrink-0 border-b border-white/5 bg-surface/80 backdrop-blur-md px-gutter flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-title-lg font-title-lg text-on-surface">
              {chatId ? "Continuing Consultation" : "New Consultation"}
            </h2>
            <p className="text-label-sm font-label-sm text-tertiary">Labour Law Assistant</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              className="p-2 rounded-lg bg-surface-container border border-white/10 text-primary hover:bg-white/5 transition-colors xl:hidden flex items-center gap-2"
              onClick={() => setIsContextOpen(true)}
            >
              <span className="material-symbols-outlined text-[18px]">menu_open</span>
              <span className="text-label-sm font-label-sm hidden sm:inline">Context</span>
            </button>
          </div>
        </header>

        {/* Scrollable Chat Feed */}
        <div ref={chatFeedRef} className="flex-1 overflow-y-auto px-4 md:px-card-padding py-8 scroll-smooth">
          <div className="max-w-[800px] mx-auto flex flex-col gap-8 pb-12">
            
            {/* Initial Welcome Message */}
            {messages.length === 0 && (
              <div className="flex gap-4 max-w-[85%] self-start animate-[fadeIn_0.3s_ease-out]">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">balance</span>
                </div>
                <div className="flex flex-col gap-1 relative">
                  <span className="text-label-sm font-label-sm text-on-surface-variant ml-1">NyayaBot</span>
                  <div className="bg-surface-container/70 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-sm p-5 text-body-md font-body-md text-on-surface shadow-xl relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-tertiary opacity-80"></div>
                    <p>Hello. I am ready to assist with your labour law queries. Please provide the context or the specific situation you are dealing with.</p>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-4 max-w-[90%] ${msg.role === "user" ? "self-end" : "self-start"} animate-[fadeIn_0.3s_ease-out]`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-on-primary text-[18px]">balance</span>
                  </div>
                )}
                
                <div className={`flex flex-col gap-1 relative w-full ${msg.role === "user" ? "items-end" : ""}`}>
                  <span className={`text-label-sm font-label-sm text-on-surface-variant ${msg.role === "user" ? "mr-1" : "ml-1"}`}>
                    {msg.role === "user" ? "You" : "NyayaBot"}
                  </span>
                  
                  <div className={msg.role === "user" 
                    ? "bg-primary-container/20 backdrop-blur-md border border-primary/20 rounded-2xl rounded-tr-sm p-4 text-body-md font-body-md text-on-surface shadow-md"
                    : "bg-surface-container/80 backdrop-blur-xl border border-white/10 rounded-2xl rounded-tl-sm p-6 text-body-md font-body-md text-on-surface shadow-2xl relative overflow-hidden flex flex-col gap-4"
                  }>
                    {msg.role === "assistant" && (
                      <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-tertiary"></div>
                    )}
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      renderAssistantMessage(msg.content)
                    )}
                  </div>
                </div>
                
                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center shrink-0">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full" />
                    ) : (
                      <span className="text-on-tertiary-container font-label-sm text-label-sm font-bold">
                        {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Live Streaming Message */}
            {isLoading && streamState && (
              <div className="flex gap-4 max-w-[90%] self-start animate-[fadeIn_0.3s_ease-out]">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 animate-pulse">
                  <span className="material-symbols-outlined text-on-primary text-[18px]">balance</span>
                </div>
                
                <div className="flex flex-col gap-1 relative w-full">
                  <span className="text-label-sm font-label-sm text-on-surface-variant ml-1 flex items-center gap-2">
                    NyayaBot
                    <span className="inline-flex items-center gap-1.5 text-[10px] text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                      {getStreamStatusText(streamState)}
                    </span>
                  </span>
                  
                  <div className="bg-surface-container/80 backdrop-blur-xl border border-primary/30 rounded-2xl rounded-tl-sm p-6 text-body-md font-body-md text-on-surface shadow-2xl relative overflow-hidden flex flex-col gap-4 min-w-[300px]">
                    <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-primary animate-pulse"></div>
                    
                    {renderAssistantMessage(streamState.response ? streamState.response : {
                      assessment: streamState.assessment,
                      actionPlan: streamState.actionPlan,
                      evidence: streamState.evidence
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Loading Indicator (Initial Phase) */}
            {isLoading && !streamState && (
               <div className="flex gap-4 max-w-[85%] self-start animate-[fadeIn_0.3s_ease-out]">
                 <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                   <span className="material-symbols-outlined text-on-primary text-[18px] animate-spin">sync</span>
                 </div>
                 <div className="flex items-center gap-1">
                   <span className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce"></span>
                   <span className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                   <span className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                 </div>
               </div>
            )}
          </div>
        </div>

        {/* Sticky Input Area */}
        <div className="shrink-0 p-4 pb-6 px-gutter bg-surface-dim/80 backdrop-blur-2xl border-t border-white/5 relative z-20">
          <div className="max-w-[800px] mx-auto">
            <form 
              onSubmit={handleSubmit}
              className="bg-surface-container-low rounded-2xl border border-white/10 p-2 pl-4 flex items-end gap-2 focus-within:border-primary/50 focus-within:bg-surface-container transition-all shadow-lg"
            >
              <textarea 
                className="bg-transparent border-none resize-none w-full outline-none text-body-md font-body-md text-on-surface placeholder:text-on-surface-variant/50 py-3 focus:ring-0 max-h-[150px]" 
                rows={1}
                placeholder="Describe the legal situation or ask a question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = '';
                  target.style.height = Math.min(target.scrollHeight, 150) + 'px';
                }}
              />
              <div className="flex items-center gap-1 pb-1 pr-1 shrink-0">
                <button 
                  type="submit" 
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-primary text-on-primary hover:opacity-90 rounded-full transition-colors flex items-center justify-center shadow-md disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              </div>
            </form>
            <div className="text-center mt-3">
              <span className="text-[10px] font-label-sm text-on-surface-variant/60">AI responses are for guidance and do not constitute formal legal counsel.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Context Panel (Right Sidebar) */}
      <aside 
        className={`w-[340px] flex-shrink-0 border-l border-white/5 bg-surface-container-lowest/90 backdrop-blur-xl flex flex-col h-full transform transition-transform duration-300 ${isContextOpen ? "translate-x-0" : "translate-x-full"} xl:translate-x-0 fixed xl:static right-0 top-0 bottom-0 z-40 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] xl:shadow-none`}
      >
        <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between sticky top-0 bg-surface-container-lowest/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 text-tertiary">
            <span className="material-symbols-outlined text-[20px]">menu_book</span>
            <h2 className="text-title-lg font-title-lg text-on-surface">Referenced Laws</h2>
          </div>
          <button 
            className="text-on-surface-variant hover:text-on-surface xl:hidden transition-colors"
            onClick={() => setIsContextOpen(false)}
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
          {latestApplicableLaws.length > 0 && (
            <div className="mb-2">
              <h3 className="text-label-sm font-label-sm text-primary uppercase tracking-wider mb-3 px-1">Applicable Laws</h3>
              <div className="flex flex-col gap-3">
                {latestApplicableLaws.map((law: any, idx: number) => (
                  <div key={`law-${idx}`} className="bg-surface-container/40 rounded-xl border border-primary/20 p-4 flex flex-col gap-2 hover:bg-surface-container/60 transition-colors shadow-lg shadow-primary/5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
                      <h4 className="text-body-md font-body-md font-bold text-on-surface leading-tight">{law.law}</h4>
                    </div>
                    <div className="inline-flex w-fit mb-1">
                      <span className="text-[10px] font-label-sm px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded uppercase tracking-wider">
                        Section {law.section}
                      </span>
                    </div>
                    <div className="mt-1 bg-surface-container-lowest/50 p-3 rounded-lg border border-white/5 relative">
                      <span className="material-symbols-outlined absolute top-2 right-2 text-white/5 text-[24px]">format_quote</span>
                      <p className="text-[13px] font-body-md text-on-surface-variant leading-relaxed relative z-10">
                        {law.meaning}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentCitations.length > 0 && (
            <div>
              <h3 className="text-label-sm font-label-sm text-tertiary uppercase tracking-wider mb-3 px-1 mt-2">Document Sources</h3>
              <div className="flex flex-col gap-3">
                {currentCitations.map((cit: any, idx: number) => (
                  <div key={`cit-${idx}`} className="bg-surface-container/40 rounded-xl border border-white/5 p-4 flex flex-col gap-3 hover:bg-surface-container/60 transition-colors group cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-label-sm px-2 py-1 bg-surface-container-high rounded text-on-surface-variant uppercase tracking-wider">
                        Source
                      </span>
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-colors">open_in_new</span>
                    </div>
                    <div>
                      <h4 className="text-body-md font-body-md font-bold text-on-surface leading-tight mb-1">{cit.source}</h4>
                      <p className="text-[13px] font-body-md text-on-surface-variant line-clamp-3">{cit.preview}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {latestApplicableLaws.length === 0 && currentCitations.length === 0 && (
            <p className="text-sm text-on-surface-variant text-center mt-10">No references loaded yet.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
