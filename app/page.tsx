"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BookOpen, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUserProfile } from "@/lib/firestore";

export default function Home() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      createUserProfile(user).then(() => {
        router.push("/dashboard");
      });
    }
  }, [user, router]);

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with soft radial gold glow */}
      <div className="absolute inset-0 bg-brand-bg">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-gold/5 rounded-full blur-[120px] pointer-events-none" />
      </div>

      {/* Subtle particles effect placeholder */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none mix-blend-screen" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-gold/30 bg-brand-gold/5 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-brand-gold shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
          <span className="text-sm font-medium tracking-wide text-brand-gold-soft">NYAYABOT INTELLIGENCE</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-6xl md:text-8xl font-serif font-bold mb-8 leading-tight tracking-tight"
        >
          Know Your <br />
          <span className="gradient-gold">Workplace Rights</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-xl md:text-2xl text-brand-text-secondary max-w-2xl mb-12 font-light leading-relaxed"
        >
          AI-powered legal guidance grounded in Indian employment law. Precision, authority, and clarity when you need it most.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center gap-6"
        >
          {!loading && !user ? (
            <button 
              onClick={signInWithGoogle}
              className="group relative flex items-center gap-2 px-8 py-4 bg-black border border-brand-gold rounded-full text-brand-gold overflow-hidden transition-transform hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-brand-gold translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out" />
              <LogIn className="relative z-10 w-5 h-5 group-hover:text-black transition-colors duration-400" />
              <span className="relative z-10 font-medium group-hover:text-black transition-colors duration-400">Continue with Google</span>
            </button>
          ) : (
            <Link 
              href="/dashboard"
              className="group relative flex items-center gap-2 px-8 py-4 bg-black border border-brand-gold rounded-full text-brand-gold overflow-hidden transition-transform hover:scale-[1.02]"
            >
              <div className="absolute inset-0 bg-brand-gold translate-y-full group-hover:translate-y-0 transition-transform duration-400 ease-out" />
              <span className="relative z-10 font-medium group-hover:text-black transition-colors duration-400">Go to Dashboard</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:text-black transition-colors duration-400" />
            </Link>
          )}
          
          <Link 
            href="/library"
            className="group flex items-center gap-2 px-8 py-4 bg-transparent border border-white/10 rounded-full text-brand-text-primary hover:bg-white/5 transition-colors"
          >
            <BookOpen className="w-5 h-5 text-brand-text-secondary group-hover:text-white transition-colors" />
            <span className="font-medium">Explore Rights Library</span>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
