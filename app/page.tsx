"use client";

import Link from "next/link";
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

  const handleConsultationClick = async () => {
    if (!user) {
      await signInWithGoogle();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col selection:bg-primary/30 selection:text-primary overflow-x-hidden">
      {/* Ambient Background Glows */}
      <div className="ambient-glow top-0 left-0 translate-x-[-20%] translate-y-[-20%]"></div>
      <div className="ambient-glow top-[40%] right-0 translate-x-[20%]"></div>
      
      {/* TopNavBar */}
      <header className="bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md sticky w-full top-0 z-50 border-b border-white/10 dark:border-white/5">
        <div className="flex justify-between items-center w-full px-gutter h-16 max-w-container-max mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="NyayaBot Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-title-lg font-title-lg font-bold text-primary dark:text-primary-fixed-dim tracking-tight">
              NyayaBot AI
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleConsultationClick}
              disabled={loading}
              className="bg-inverse-primary hover:bg-inverse-primary/90 text-on-primary font-label-sm text-label-sm px-4 py-2 rounded-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? "Loading..." : user ? "Dashboard" : "Start Consultation"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full max-w-container-max mx-auto px-gutter py-12 md:py-24 flex flex-col gap-24 relative z-10">
        {/* Hero Section */}
        <section className="flex flex-col lg:flex-row items-center gap-12 relative">
          <div className="flex-1 flex flex-col gap-6 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-outline/30 bg-surface-container-low/50 w-fit backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
              <span className="text-label-sm font-label-sm text-on-surface-variant">Intelligent Labour Law Assistant</span>
            </div>
            <h1 className="text-display-lg-mobile md:text-display-lg font-display-lg-mobile md:font-display-lg text-on-surface">
              AI-Powered Legal Guidance for the Indian Workforce
            </h1>
            <p className="text-body-md font-body-md text-on-surface-variant max-w-2xl text-lg">
              Navigate complex workplace disputes with clarity and confidence. NyayaBot provides immediate, confidential, and accurate legal assessments based on current Indian Labour Laws.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <button
                onClick={handleConsultationClick}
                disabled={loading}
                className="bg-inverse-primary hover:bg-inverse-primary/90 text-on-primary font-label-sm text-label-sm px-6 py-3 rounded-lg transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-lg shadow-inverse-primary/20 flex items-center gap-2"
              >
                <span>{loading ? "Loading..." : "Start Consultation"}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <Link href="/library" className="bg-transparent border border-outline/30 hover:bg-surface-container-low text-on-surface font-label-sm text-label-sm px-6 py-3 rounded-lg transition-all flex items-center gap-2">
                <span>Learn More</span>
              </Link>
            </div>
          </div>
          
          <div className="flex-1 w-full max-w-md lg:max-w-none relative z-10">
            {/* Abstract Legal Document Illustration */}
            <div className="glass-card rounded-xl p-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent z-0"></div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">gavel</span>
                  </div>
                  <div>
                    <h3 className="text-label-sm font-label-sm text-on-surface">NyayaBot Analysis</h3>
                    <p className="text-xs text-on-surface-variant">Case #8492 - Wrongful Termination</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 bg-surface-container-high rounded w-3/4"></div>
                  <div className="h-2 bg-surface-container-high rounded w-full"></div>
                  <div className="h-2 bg-surface-container-high rounded w-5/6"></div>
                </div>
                <div className="mt-6 p-4 rounded-lg bg-surface-container-low border-l-2 border-tertiary">
                  <p className="text-sm text-on-surface-variant">
                    <strong className="text-on-surface block mb-1">Assessment:</strong>
                    Based on The Industrial Relations Code, 2020, the termination without prior notice or retrenchment compensation violates Section 70.
                  </p>
                </div>
              </div>
            </div>
            {/* Decorative blurred background element for hero card */}
            <div className="absolute -inset-4 bg-primary/20 blur-3xl -z-10 rounded-full opacity-50 mix-blend-screen"></div>
          </div>
        </section>

        {/* Features Grid (Bento Style) */}
        <section className="flex flex-col gap-12">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-headline-md font-headline-md text-on-surface">Comprehensive Dispute Resolution</h2>
            <p className="text-body-md font-body-md text-on-surface-variant">Expert guidance across critical domains of Indian employment law.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card glass-card-hover rounded-xl p-card-padding flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary border border-primary/20">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>policy</span>
              </div>
              <h3 className="text-title-lg font-title-lg text-on-surface">POSH Act</h3>
              <p className="text-body-md font-body-md text-on-surface-variant text-sm">
                Guidance on the Prevention of Sexual Harassment at Workplace act, filing complaints, and understanding employer obligations.
              </p>
            </div>
            <div className="glass-card glass-card-hover rounded-xl p-card-padding flex flex-col gap-4 lg:translate-y-4">
              <div className="w-12 h-12 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary border border-tertiary/20">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
              </div>
              <h3 className="text-title-lg font-title-lg text-on-surface">Salary Disputes</h3>
              <p className="text-body-md font-body-md text-on-surface-variant text-sm">
                Resolve issues regarding unpaid wages, unauthorized deductions, and compliance with the Payment of Wages Act.
              </p>
            </div>
            <div className="glass-card glass-card-hover rounded-xl p-card-padding flex flex-col gap-4">
              <div className="w-12 h-12 rounded-lg bg-error-container/20 flex items-center justify-center text-error border border-error/20">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>block</span>
              </div>
              <h3 className="text-title-lg font-title-lg text-on-surface">Wrongful Termination</h3>
              <p className="text-body-md font-body-md text-on-surface-variant text-sm">
                Assess the legality of dismissals, notice periods, and retrenchment compensation under the Industrial Relations Code.
              </p>
            </div>
            <div className="glass-card glass-card-hover rounded-xl p-card-padding flex flex-col gap-4 lg:translate-y-4">
              <div className="w-12 h-12 rounded-lg bg-secondary-container/30 flex items-center justify-center text-secondary-fixed border border-secondary/20">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>event_busy</span>
              </div>
              <h3 className="text-title-lg font-title-lg text-on-surface">Leave Denial</h3>
              <p className="text-body-md font-body-md text-on-surface-variant text-sm">
                Understand your rights regarding earned leaves, maternity benefits, and statutory holidays across different states.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-12 flex flex-col gap-12 relative">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-headline-md font-headline-md text-on-surface">How NyayaBot Works</h2>
            <p className="text-body-md font-body-md text-on-surface-variant">A streamlined process to transform confusion into actionable legal strategy.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent -z-10"></div>
            
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-24 h-24 rounded-full glass-card flex items-center justify-center border border-white/10 shadow-lg relative">
                <span className="material-symbols-outlined text-4xl text-primary">chat_bubble</span>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-label-sm font-label-sm text-on-surface border border-white/10">1</div>
              </div>
              <h3 className="text-title-lg font-title-lg text-on-surface mt-2">Ask</h3>
              <p className="text-body-md font-body-md text-on-surface-variant text-sm px-4">
                Describe your situation in plain language. Our AI understands context and conversational input.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-24 h-24 rounded-full glass-card flex items-center justify-center border border-white/10 shadow-lg relative">
                <span className="material-symbols-outlined text-4xl text-tertiary">analytics</span>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-label-sm font-label-sm text-on-surface border border-white/10">2</div>
              </div>
              <h3 className="text-title-lg font-title-lg text-on-surface mt-2">Assess</h3>
              <p className="text-body-md font-body-md text-on-surface-variant text-sm px-4">
                NyayaBot cross-references your details against thousands of Indian legal precedents and statutes.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-24 h-24 rounded-full glass-card flex items-center justify-center border border-white/10 shadow-lg relative">
                <span className="material-symbols-outlined text-4xl text-primary-fixed-dim">gavel</span>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-label-sm font-label-sm text-on-surface border border-white/10">3</div>
              </div>
              <h3 className="text-title-lg font-title-lg text-on-surface mt-2">Action</h3>
              <p className="text-body-md font-body-md text-on-surface-variant text-sm px-4">
                Receive a clear summary of your rights and a step-by-step guide on how to proceed formally.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest dark:bg-surface-container-lowest w-full py-12 border-t border-white/10 mt-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center px-gutter gap-stack-gap max-w-container-max mx-auto">
          <div className="text-label-sm font-label-sm text-on-surface-variant">
            © 2026 NyayaBot AI. Legal Clarity for India's Workforce.
          </div>
          <nav className="flex flex-wrap justify-center gap-6">
            <Link className="text-tertiary dark:text-tertiary-fixed-dim text-body-md font-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy Policy</Link>
            <Link className="text-tertiary dark:text-tertiary-fixed-dim text-body-md font-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Terms of Service</Link>
            <Link className="text-tertiary dark:text-tertiary-fixed-dim text-body-md font-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Labour Ministry Docs</Link>
            <Link className="text-tertiary dark:text-tertiary-fixed-dim text-body-md font-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Contact Support</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
