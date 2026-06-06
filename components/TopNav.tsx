"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    const handleScroll = () => {
      setScrolled(mainContent.scrollTop > 20);
    };

    mainContent.addEventListener('scroll', handleScroll);
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`bg-surface-dim/80 backdrop-blur-md w-full sticky top-0 z-50 transition-all duration-300 ${scrolled ? "shadow-lg border-b border-white/10" : "border-b border-white/5"
        }`}
    >
      <div className="flex justify-between items-center w-full px-gutter h-16 max-w-[1280px] mx-auto">
        {/* Mobile Brand (Hidden on Desktop due to Sidebar) */}
        <div className="lg:hidden flex items-center gap-2">
          <span className="material-symbols-outlined text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
          <span className="text-title-lg font-title-lg font-bold text-primary-fixed-dim">NyayaBot AI</span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4 ml-auto">
          {/* User Name & Avatar */}
          <Link href="/profile" className="flex items-center gap-3 hover:bg-white/5 py-1.5 px-3 rounded-full transition-colors border border-transparent hover:border-white/10">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-title-sm font-title-sm text-on-surface font-semibold tracking-wide">
                {user?.displayName ? user.displayName.split(' ')[0] : 'Legal Pro'}
              </span>
              <span className="text-[10px] text-primary/80 font-medium">Verified User</span>
            </div>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-white/20 shadow-sm" />
            ) : (
              <span className="material-symbols-outlined text-[32px] text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
