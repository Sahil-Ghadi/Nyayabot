"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getUserChats, updateChatStatus } from "@/lib/firestore";
import Link from "next/link";

export default function HistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getUserChats(user.uid).then((data) => {
        setChats(data);
        setLoading(false);
      });
    }
  }, [user]);

  const handleStatusChange = async (chatId: string, status: "active" | "resolved", e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, status } : c));
    await updateChatStatus(chatId, status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
      </div>
    );
  }

  return (
    <div className="p-gutter max-w-container-max mx-auto w-full flex flex-col gap-8 pb-24">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4">
        <div>
          <h2 className="text-headline-md font-headline-md text-on-surface mb-2">
            All Consultations
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant max-w-2xl">
            Review and manage your past legal inquiries. Click on any record to view the full assessment and continue the dialogue.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button className="bg-transparent border border-white/10 text-on-surface-variant hover:text-on-surface hover:bg-white/5 font-label-sm text-label-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
          <button className="bg-transparent border border-white/10 text-on-surface-variant hover:text-on-surface hover:bg-white/5 font-label-sm text-label-sm px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <span className="material-symbols-outlined text-[18px]">sort</span>
            Sort
          </button>
        </div>
      </header>

      {chats.length === 0 ? (
        <div className="glass-panel rounded-xl p-12 flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10 mt-8">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">chat_bubble_outline</span>
          </div>
          <h3 className="text-title-lg font-title-lg text-on-surface mb-2">No past consultations</h3>
          <p className="text-body-md text-on-surface-variant mb-8 max-w-md">
            You haven't started any legal consultations yet. Start a new one to get AI-powered labour law guidance.
          </p>
          <Link 
            href="/consultation"
            className="bg-primary text-on-primary font-label-sm text-label-sm py-3 px-6 rounded-lg inline-flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Start New Consultation
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => {
                 sessionStorage.setItem("currentChatId", chat.id);
                 router.push("/consultation");
              }}
              className={`glass-panel rounded-xl p-5 flex items-center justify-between gap-6 hover:border-primary/40 hover:bg-white/[0.03] transition-all duration-300 group cursor-pointer relative overflow-hidden ${
                chat.status === 'active' ? 'border-l-4 border-l-error' : ''
              }`}
            >
              {/* Left Section */}
              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-surface-container-highest/50 flex items-center justify-center border border-white/5">
                  <span className={`material-symbols-outlined text-[24px] ${chat.status === 'active' ? 'text-error' : 'text-on-surface-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {chat.status === 'active' ? 'error' : 'chat'}
                  </span>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-title-md font-title-md text-on-surface truncate">
                      {chat.title === "New Consultation" || !chat.title ? "Labour Law Assessment" : chat.title}
                    </h3>
                    {/* Status Pill Dropdown */}
                    <select 
                      onClick={(e) => e.stopPropagation()}
                      value={chat.status || "active"} 
                      onChange={(e) => handleStatusChange(chat.id, e.target.value as any, e)}
                      className={`appearance-none cursor-pointer inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider outline-none transition-all duration-200 hover:scale-105 ${
                        chat.status === 'active' ? 'bg-error/10 border-error/20 text-error' : 
                        'bg-surface-container-high border-white/10 text-on-surface-variant'
                      }`}
                    >
                      <option value="active" className="bg-surface text-on-surface">Active</option>
                      <option value="resolved" className="bg-surface text-on-surface">Resolved</option>
                    </select>
                  </div>
                  <p className="text-body-sm font-body-sm text-on-surface-variant truncate w-full">
                    "Select to view the complete history and details of this consultation thread..."
                  </p>
                </div>
              </div>

              {/* Right Section */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 text-[12px] font-medium text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {chat.updatedAt?.toDate ? new Date(chat.updatedAt.toDate()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : "Recently"}
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors opacity-60 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0">
                  arrow_forward
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
