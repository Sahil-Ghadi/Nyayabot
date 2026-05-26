"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Bookmark, BookOpen, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserChats } from "@/lib/firestore";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      getUserChats(user.uid).then(setChats);
    }
  }, [user]);

  if (loading) return null;

  const stats = [
    { label: "Total Consultations", value: chats.length.toString(), icon: MessageSquare },
    { label: "Saved Cases", value: "0", icon: Bookmark },
    { label: "Articles Viewed", value: "0", icon: BookOpen },
    { label: "Recent Activity", value: chats.length > 0 ? "Today" : "None", icon: Clock },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden glass-panel rounded-[24px] p-8 sm:p-12 border border-brand-gold/20 shadow-[0_0_40px_rgba(212,175,55,0.05)]"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-brand-gold/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">
            Welcome back, <span className="gradient-gold">{user?.displayName?.split(" ")[0] || "Guest"}</span>
          </h1>
          <p className="text-brand-text-secondary text-lg">
            Your legal workspace is ready. You have {chats.length} active consultations.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass-panel p-6 rounded-2xl border-white/5 hover:-translate-y-1 transition-transform duration-300 group"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-brand-gold/10 transition-colors">
              <stat.icon className="w-6 h-6 text-brand-gold" />
            </div>
            <p className="text-3xl font-bold font-serif mb-1 group-hover:text-brand-gold transition-colors">{stat.value}</p>
            <p className="text-brand-text-secondary text-sm font-medium">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="glass-panel rounded-3xl p-8 border-white/5"
      >
        <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-2">
          <span className="w-1.5 h-6 bg-brand-gold rounded-full block" />
          Recent Consultations
        </h2>
        
        <div className="space-y-4">
          {chats.length === 0 ? (
            <p className="text-brand-text-secondary text-sm">No consultations found. Start a new one to get legal guidance.</p>
          ) : (
            chats.slice(0, 5).map((item) => (
              <div 
                key={item.id} 
                onClick={() => router.push("/consultation")}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 cursor-pointer group"
              >
                <div>
                  <h3 className="font-medium text-lg group-hover:text-brand-gold transition-colors truncate max-w-md">{item.title}</h3>
                  <p className="text-sm text-brand-text-secondary mt-1">
                    {item.updatedAt?.toDate ? item.updatedAt.toDate().toLocaleDateString() : 'Recently'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-brand-gold/50">
                    <MessageSquare className="w-4 h-4 text-brand-text-secondary group-hover:text-brand-gold" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}
