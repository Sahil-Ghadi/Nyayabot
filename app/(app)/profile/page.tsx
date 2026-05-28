"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Shield, LogOut, Clock, MessageSquarePlus } from "lucide-react";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <div className="flex flex-col h-full space-y-8 animate-fade-in pb-10">
      <div>
        <h1 className="text-3xl font-serif font-bold text-white mb-2">Your Profile</h1>
        <p className="text-brand-text-secondary">Manage your account details and preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center col-span-1 border-glow relative overflow-hidden"
        >
          <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent opacity-50" />
          
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-brand-gold/20 blur-xl rounded-full" />
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full border-2 border-brand-gold relative z-10" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-surface border-2 border-brand-gold flex items-center justify-center relative z-10">
                <User className="w-10 h-10 text-brand-gold" />
              </div>
            )}
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">{user?.displayName || "NyayaBot User"}</h2>
          <p className="text-brand-gold font-medium mb-6 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> Verified Tier
          </p>

          <button 
            onClick={logout}
            className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium flex items-center justify-center gap-2 transition-all duration-300 hover:border-white/20"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </motion.div>

        {/* Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-8 rounded-2xl col-span-1 lg:col-span-2 border-white/5"
        >
          <h3 className="text-xl font-serif font-bold text-white mb-6">Account Details</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <p className="text-sm text-brand-text-secondary mb-1">Email Address</p>
                <p className="text-white font-medium">{user?.email || "No email provided"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <p className="text-sm text-brand-text-secondary mb-1">Account Creation</p>
                <p className="text-white font-medium">Verified User</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
              <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                <MessageSquarePlus className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <p className="text-sm text-brand-text-secondary mb-1">Usage Status</p>
                <p className="text-white font-medium">Unlimited Local Consultations</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
