"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { getUserChats, updateChatStatus } from "@/lib/firestore";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [chats, setChats] = useState<any[]>([]);
  const [allChats, setAllChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const loadChats = async () => {
      try {
        const fetchedChats = await getUserChats(user.uid);
        setAllChats(fetchedChats);
        setChats(fetchedChats.slice(0, 5)); // Show 5 most recent for the table
      } catch (e) {
        console.error("Failed to load chats", e);
      } finally {
        setLoading(false);
      }
    };
    loadChats();
  }, [user]);

  const handleStatusChange = async (chatId: string, status: "active" | "resolved") => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, status } : c));
    setAllChats(prev => prev.map(c => c.id === chatId ? { ...c, status } : c));
    await updateChatStatus(chatId, status);
  };
  
  // Format current date
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="p-gutter max-w-container-max mx-auto w-full flex flex-col gap-8 pb-24">
      {/* Welcome Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4">
        <div>
          <h2 className="text-headline-md font-headline-md text-on-surface mb-2">
            Good afternoon, {user?.displayName ? user.displayName.split(' ')[0] : 'Professional'}.
          </h2>
          <p className="text-body-md font-body-md text-on-surface-variant max-w-2xl">
            Your legal workspace is ready. You have matters requiring attention today.
          </p>
        </div>
        <div className="text-label-sm font-label-sm text-outline px-4 py-2 rounded-full border border-white/10 bg-surface-container-low/50 glass-panel">
          {today}
        </div>
      </header>

      {/* Quick Action & Upload Hero */}
      <section className="glass-panel rounded-xl p-card-padding flex flex-col md:flex-row gap-8 items-center bg-surface-container-low/60 relative overflow-hidden group">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700"></div>
        <div className="flex-1 space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-label-sm text-label-sm mb-2">
            <span className="material-symbols-outlined text-[16px]">psychiatry</span> AI Assistant Ready
          </div>
          <h3 className="text-title-lg font-title-lg text-on-surface">Analyze a new Labour Law scenario</h3>
          <p className="text-body-md font-body-md text-on-surface-variant">
            Upload an employment contract, dispute notice, or simply type your query to receive immediate, precedent-backed guidance.
          </p>
          <Link href="/consultation" className="mt-4 bg-primary text-on-primary font-label-sm text-label-sm py-3 px-6 rounded-lg inline-flex items-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
            Start New Consultation
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </Link>
        </div>
        
      </section>

      {/* Overview Widgets */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-stack-gap">
        {/* Active Issues Widget */}
        <div className="glass-panel rounded-xl p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors duration-300 group cursor-pointer relative overflow-hidden">
          <div className="absolute w-1 h-full bg-error left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-error-container/20 flex items-center justify-center border border-error/20">
              <span className="material-symbols-outlined text-error text-[20px]">warning</span>
            </div>
            <Link href="/history" className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity hover:text-on-surface">open_in_new</Link>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Active Issues</p>
            <div className="flex items-baseline gap-3">
              <h4 className="text-display-lg-mobile font-display-lg-mobile text-on-surface">
                {loading ? '-' : allChats.filter(c => c.status === 'active').length}
              </h4>
              <span className="font-label-sm text-label-sm text-error flex items-center">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span> Action Req.
              </span>
            </div>
          </div>
        </div>

        {/* Resolved Cases Widget */}
        <div className="glass-panel rounded-xl p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors duration-300 group cursor-pointer relative overflow-hidden">
          <div className="absolute w-1 h-full bg-primary left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/20">
              <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]">check_circle</span>
            </div>
            <Link href="/history" className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity hover:text-on-surface">open_in_new</Link>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Resolved Cases</p>
            <div className="flex items-baseline gap-3">
              <h4 className="text-display-lg-mobile font-display-lg-mobile text-on-surface">
                {loading ? '-' : allChats.filter(c => c.status === 'resolved').length}
              </h4>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Completed</span>
            </div>
          </div>
        </div>

        {/* Total Consultations Widget */}
        <div className="glass-panel rounded-xl p-6 flex flex-col gap-4 hover:border-primary/30 transition-colors duration-300 group cursor-pointer relative overflow-hidden">
          <div className="absolute w-1 h-full bg-tertiary left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center border border-tertiary/20">
              <span className="material-symbols-outlined text-tertiary-fixed-dim text-[20px]">forum</span>
            </div>
            <Link href="/history" className="material-symbols-outlined text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity hover:text-on-surface">open_in_new</Link>
          </div>
          <div>
            <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">Total Consultations</p>
            <div className="flex items-baseline gap-3">
              <h4 className="text-display-lg-mobile font-display-lg-mobile text-on-surface">
                {loading ? '-' : allChats.length}
              </h4>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Lifetime usage</span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Consultations Table */}
      <section className="glass-panel rounded-xl overflow-hidden flex flex-col shadow-xl">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-surface-container-lowest/40">
          <h3 className="text-title-lg font-title-lg text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-fixed-dim">forum</span>
            Recent Consultations
          </h3>
          <Link href="/history" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1">
            View All <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </Link>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-surface-container-low/30">
                <th className="py-4 px-6 font-label-sm text-label-sm text-outline uppercase tracking-wider">Matter Description</th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-outline uppercase tracking-wider">Date</th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-outline uppercase tracking-wider">Status</th>
                <th className="py-4 px-6 font-label-sm text-label-sm text-outline uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-on-surface-variant font-body-md">Loading your consultations...</td>
                </tr>
              ) : chats.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-on-surface-variant font-body-md">No recent consultations found.</td>
                </tr>
              ) : (
                chats.map(chat => (
                  <tr key={chat.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-1 h-8 rounded-full ${chat.status === 'resolved' ? 'bg-primary' : 'bg-error'}`}></div>
                        <div>
                          <p className="font-body-md text-body-md text-on-surface font-semibold">
                            {chat.title === "New Consultation" || !chat.title ? "Labour Law Assessment" : chat.title}
                          </p>
                          <p className="text-[13px] text-on-surface-variant mt-0.5">ID: {chat.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-body-md font-body-md text-on-surface-variant">
                      {chat.updatedAt?.toDate ? chat.updatedAt.toDate().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }) : 'Just now'}
                    </td>
                    <td className="py-4 px-6 relative">
                      <select 
                        value={chat.status === "pending" ? "active" : chat.status || "active"} 
                        onChange={(e) => handleStatusChange(chat.id, e.target.value as any)}
                        className={`appearance-none cursor-pointer inline-flex items-center px-3 py-1.5 rounded-full border font-label-sm text-label-sm outline-none transition-all duration-200 hover:scale-105 ${
                          chat.status === 'resolved' ? 'bg-primary/10 border-primary/30 text-primary-fixed-dim' : 
                          'bg-error-container/20 border-error/30 text-error'
                        }`}
                      >
                        <option value="active" className="bg-surface text-on-surface">🔴 Active</option>
                        <option value="resolved" className="bg-surface text-on-surface">🟢 Resolved</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => {
                          sessionStorage.setItem("currentChatId", chat.id);
                          router.push("/consultation");
                        }}
                        className="bg-transparent border border-white/10 text-primary font-label-sm text-label-sm px-4 py-2 rounded-lg hover:bg-white/5 transition-colors opacity-80 group-hover:opacity-100"
                      >
                        Resume
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
