"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquarePlus, History, BookOpen, Bookmark, User, Settings, LogOut } from "lucide-react";
import clsx from "clsx";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "New Consultation", href: "/consultation", icon: MessageSquarePlus },
  { name: "Case History", href: "/history", icon: History },
  { name: "Rights Library", href: "/library", icon: BookOpen },
  { name: "Saved Cases", href: "/saved", icon: Bookmark },
  { name: "Profile", href: "/profile", icon: User },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-64 shrink-0 p-6 flex flex-col h-screen sticky top-0"
    >
      <div className="glass-panel flex-1 rounded-[24px] p-6 flex flex-col relative overflow-hidden border-glow">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center">
            <span className="font-serif text-black font-bold text-xl">N</span>
          </div>
          <span className="font-serif text-2xl font-bold tracking-wide">NyayaBot</span>
        </div>

        <nav className="flex flex-col gap-2 relative z-10">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 relative group",
                  isActive ? "text-brand-gold" : "text-brand-text-secondary hover:text-brand-gold-soft hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-brand-gold rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto relative z-10 pt-6 border-t border-white/5 flex flex-col gap-4">
          <div className="flex items-center gap-3 px-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border border-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-surface border border-white/10 flex items-center justify-center">
                <User className="w-5 h-5 text-brand-text-secondary" />
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.displayName || "Guest"}</p>
              <p className="text-xs text-brand-text-secondary">Free Tier</p>
            </div>
            {user && (
              <button onClick={logout} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-brand-text-secondary hover:text-white">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
