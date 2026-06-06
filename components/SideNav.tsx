"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";

export function SideNav() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "All Consultations", href: "/history", icon: "chat" },
    { name: "Documents", href: "/library", icon: "folder_open" },
    { name: "Admin Tools", href: "/admin", icon: "admin_panel_settings" },
    { name: "Account", href: "/profile", icon: "account_circle" },
  ];

  return (
    <>
      {/* Mobile Menu Button - Fixed position with high z-index */}
      <button 
        className="md:hidden fixed top-4 left-4 z-[60] w-10 h-10 flex items-center justify-center bg-surface-container/80 backdrop-blur-md rounded-full border border-white/10 text-on-surface"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle Menu"
      >
        <span className="material-symbols-outlined">
          {isMobileMenuOpen ? 'close' : 'menu'}
        </span>
      </button>

      {/* Backdrop for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Side Navigation */}
      <aside className={`
        fixed md:sticky top-0 left-0 h-[100dvh] w-[280px] z-50
        bg-surface-dim/95 backdrop-blur-3xl border-r border-white/5
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 pb-4 shrink-0 mt-8 md:mt-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="NyayaBot Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-title-lg font-title-lg text-on-surface tracking-wide">
              NyayaBot
            </h1>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`
                  flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group
                  ${isActive 
                    ? "bg-primary/10 text-primary-fixed-dim border border-primary/20" 
                    : "text-on-surface-variant hover:bg-white/[0.04] hover:text-on-surface"
                  }
                `}
              >
                <span className={`material-symbols-outlined text-[22px] transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                  {item.icon}
                </span>
                <span className="font-label-md text-label-md tracking-wide">{item.name}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary ml-auto shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 shrink-0 mt-auto border-t border-white/5 bg-surface-container-lowest/30">
          <button 
            onClick={logout}
            className="flex items-center gap-4 w-full px-4 py-3 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-xl transition-all duration-300 font-label-md text-label-md tracking-wide group"
          >
            <span className="material-symbols-outlined text-[22px] group-hover:-translate-x-1 transition-transform">logout</span>
            <span className="font-label-sm text-label-sm">Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
