"use client";

import { SideNav } from "@/components/SideNav";
import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <span className="material-symbols-outlined animate-spin text-[40px] text-primary">sync</span>
      </div>
    );
  }

  if (!user) {
    return null; // Prevent flash of content before redirect
  }

  return (
    <div className="flex h-screen bg-background text-on-background antialiased selection:bg-primary-container selection:text-on-primary-container overflow-hidden">
      <SideNav />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        <TopNav />
        {children}
      </main>
    </div>
  );
}
