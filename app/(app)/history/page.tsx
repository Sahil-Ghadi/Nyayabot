"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getUserChats } from "@/lib/firestore";
import { motion } from "framer-motion";
import { History, MessageSquare, ChevronRight, Loader2 } from "lucide-react";

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-fade-in pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-white mb-2 flex items-center gap-3">
          <History className="w-8 h-8 text-brand-gold" />
          Case History
        </h1>
        <p className="text-brand-text-secondary">View and continue your previous legal consultations.</p>
      </div>

      {chats.length === 0 ? (
        <div className="glass-panel p-12 rounded-2xl flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10">
          <MessageSquare className="w-12 h-12 text-brand-gold mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No past consultations</h3>
          <p className="text-brand-text-secondary mb-6">You haven't started any consultations yet.</p>
          <button 
            onClick={() => router.push("/consultation")}
            className="px-6 py-3 bg-brand-gold text-black font-medium rounded-full hover:scale-105 transition-transform"
          >
            Start New Consultation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chats.map((chat, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={chat.id}
              onClick={() => {
                 sessionStorage.setItem("currentChatId", chat.id);
                 router.push("/consultation");
              }}
              className="glass-panel p-6 rounded-2xl cursor-pointer group hover:border-brand-gold/50 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/5 rounded-full blur-3xl group-hover:bg-brand-gold/10 transition-colors" />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-brand-gold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-brand-gold transition-colors" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 relative z-10">{chat.title}</h3>
              <p className="text-sm text-brand-text-secondary flex items-center gap-2 relative z-10">
                <History className="w-3.5 h-3.5" />
                {chat.updatedAt?.toDate ? new Date(chat.updatedAt.toDate()).toLocaleDateString() : "Recently"}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
