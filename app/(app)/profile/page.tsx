"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Shield, LogOut, Clock, MessageSquarePlus, Scale, BarChart3, AlertTriangle, Briefcase, CalendarOff, Loader2 } from "lucide-react";
import { getUserChats, getMessages } from "@/lib/firestore";

// Only legal categories — GREETING and NON_LEGAL are excluded
const LEGAL_CATEGORIES = ["POSH", "SALARY_DISPUTE", "WRONGFUL_TERMINATION", "LEAVE_DENIAL", "OTHER_LABOUR"] as const;

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: any; description: string }> = {
  POSH: {
    label: "POSH / Harassment",
    color: "#E85D75",
    icon: Shield,
    description: "Sexual harassment & workplace misconduct cases",
  },
  SALARY_DISPUTE: {
    label: "Salary Disputes",
    color: "#D4AF37",
    icon: Briefcase,
    description: "Wage, pay, overtime & bonus related issues",
  },
  WRONGFUL_TERMINATION: {
    label: "Wrongful Termination",
    color: "#F59E0B",
    icon: AlertTriangle,
    description: "Unlawful firing, retrenchment & layoff disputes",
  },
  LEAVE_DENIAL: {
    label: "Leave Denial",
    color: "#6366F1",
    icon: CalendarOff,
    description: "Denied leave, maternity & medical leave issues",
  },
  OTHER_LABOUR: {
    label: "Other Labour Issues",
    color: "#8B5CF6",
    icon: Scale,
    description: "General labour law & workplace disputes",
  },
};

interface CategoryStats {
  category: string;
  count: number;
}

// ── SVG Donut Chart Component ─────────────────────────────────────────────────
function DonutChart({ data, total }: { data: CategoryStats[]; total: number }) {
  if (total === 0) return null;

  const radius = 80;
  const strokeWidth = 28;
  const center = 110;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="220" height="220" viewBox="0 0 220 220">
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {data.map((item, i) => {
          const config = CATEGORY_CONFIG[item.category];
          if (!config) return null;
          const segmentLength = (item.count / total) * circumference;
          const offset = cumulativeOffset;
          cumulativeOffset += segmentLength;

          return (
            <motion.circle
              key={item.category}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={config.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${center} ${center})`}
              initial={{ opacity: 0, strokeDasharray: `0 ${circumference}` }}
              animate={{ opacity: 1, strokeDasharray: `${segmentLength} ${circumference - segmentLength}` }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 6px ${config.color}40)` }}
            />
          );
        })}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
          className="text-4xl font-bold font-serif text-white"
        >
          {total}
        </motion.span>
        <span className="text-xs text-brand-text-secondary tracking-wider uppercase mt-1">
          Legal Queries
        </span>
      </div>
    </div>
  );
}

// ── Horizontal Bar Component ──────────────────────────────────────────────────
function CategoryBar({ item, maxCount, index }: { item: CategoryStats; maxCount: number; index: number }) {
  const config = CATEGORY_CONFIG[item.category];
  if (!config) return null;
  const Icon = config.icon;
  const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: `${config.color}15`, border: `1px solid ${config.color}30` }}
          >
            <Icon className="w-4 h-4" style={{ color: config.color }} />
          </div>
          <div>
            <p className="text-sm font-medium text-white group-hover:text-brand-gold transition-colors">{config.label}</p>
            <p className="text-[10px] text-brand-text-secondary hidden sm:block">{config.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold font-serif text-white">{item.count}</span>
          <span className="text-[10px] text-brand-text-secondary tracking-wider">
            queries
          </span>
        </div>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${config.color}, ${config.color}AA)`,
            boxShadow: `0 0 12px ${config.color}40`,
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay: 0.3 + index * 0.1, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

// ── Main Profile Page ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [statsData, setStatsData] = useState<CategoryStats[]>([]);
  const [totalLegal, setTotalLegal] = useState(0);
  const [totalConsultations, setTotalConsultations] = useState(0);
  const [topCategory, setTopCategory] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const chats = await getUserChats(user.uid);
        setTotalConsultations(chats.length);

        // Count classifications across all chats
        const counts: Record<string, number> = {};
        LEGAL_CATEGORIES.forEach((c) => (counts[c] = 0));

        for (const chat of chats) {
          const messages = await getMessages(chat.id);
          for (const msg of messages) {
            const classification =
              (msg as any).classification ||
              (msg as any).metadata?.classification;
            if (classification && LEGAL_CATEGORIES.includes(classification as any)) {
              counts[classification] = (counts[classification] || 0) + 1;
            }
          }
        }

        const result: CategoryStats[] = LEGAL_CATEGORIES.map((c) => ({
          category: c,
          count: counts[c] || 0,
        })).sort((a, b) => b.count - a.count);

        const total = result.reduce((sum, r) => sum + r.count, 0);
        setStatsData(result);
        setTotalLegal(total);
        setTopCategory(total > 0 ? result[0].category : null);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

  const topConfig = topCategory ? CATEGORY_CONFIG[topCategory] : null;

  return (
    <div className="flex flex-col min-h-full space-y-8 animate-fade-in pb-24">
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

      {/* ── Legal Statistics Section ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-serif font-bold mb-6 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-brand-gold rounded-full block" />
          Legal Consultation Statistics
        </h2>

        {loadingStats ? (
          <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center gap-4 border-white/5">
            <Loader2 className="w-8 h-8 text-brand-gold animate-spin" />
            <p className="text-brand-text-secondary text-sm">Analyzing your legal history...</p>
          </div>
        ) : totalLegal === 0 ? (
          <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center gap-4 border-white/5">
            <Scale className="w-12 h-12 text-brand-text-secondary opacity-30" />
            <p className="text-brand-text-secondary text-lg font-serif">No legal consultations yet</p>
            <p className="text-brand-text-secondary text-sm opacity-60">
              Start a consultation to see your legal history breakdown here.
            </p>
          </div>
        ) : (
          <>
            {/* Quick Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-panel p-5 rounded-2xl border-white/5 hover:-translate-y-0.5 transition-transform duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-brand-gold" />
                  </div>
                  <p className="text-xs text-brand-text-secondary tracking-wider uppercase">Total Consultations</p>
                </div>
                <p className="text-3xl font-bold font-serif text-white">{totalConsultations}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="glass-panel p-5 rounded-2xl border-white/5 hover:-translate-y-0.5 transition-transform duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center">
                    <Scale className="w-5 h-5 text-brand-gold" />
                  </div>
                  <p className="text-xs text-brand-text-secondary tracking-wider uppercase">Legal Queries</p>
                </div>
                <p className="text-3xl font-bold font-serif text-white">{totalLegal}</p>
              </motion.div>

              {topConfig && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="glass-panel p-5 rounded-2xl border-white/5 hover:-translate-y-0.5 transition-transform duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${topConfig.color}15` }}
                    >
                      <topConfig.icon className="w-5 h-5" style={{ color: topConfig.color }} />
                    </div>
                    <p className="text-xs text-brand-text-secondary tracking-wider uppercase">Top Category</p>
                  </div>
                  <p className="text-lg font-bold text-white truncate">{topConfig.label}</p>
                </motion.div>
              )}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Donut Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="glass-panel p-8 rounded-2xl border-white/5 lg:col-span-2 flex flex-col items-center justify-center"
              >
                <h4 className="text-sm font-bold text-brand-text-secondary tracking-wider uppercase mb-6 self-start flex items-center gap-2">
                  <span className="w-1 h-4 bg-brand-gold rounded-full block" />
                  Category Distribution
                </h4>
                <DonutChart data={statsData.filter((d) => d.count > 0)} total={totalLegal} />

                {/* Legend */}
                <div className="mt-6 grid grid-cols-1 gap-2 w-full">
                  {statsData
                    .filter((d) => d.count > 0)
                    .map((item) => {
                      const config = CATEGORY_CONFIG[item.category];
                      if (!config) return null;
                      return (
                        <div key={item.category} className="flex items-center gap-2 text-xs">
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: config.color, boxShadow: `0 0 6px ${config.color}60` }}
                          />
                          <span className="text-brand-text-secondary">{config.label}</span>
                          <span className="ml-auto text-white font-medium">
                            {Math.round((item.count / totalLegal) * 100)}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              </motion.div>

              {/* Horizontal Bar Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="glass-panel p-8 rounded-2xl border-white/5 lg:col-span-3"
              >
                <h4 className="text-sm font-bold text-brand-text-secondary tracking-wider uppercase mb-6 flex items-center gap-2">
                  <span className="w-1 h-4 bg-brand-gold rounded-full block" />
                  Detailed Breakdown
                </h4>
                <div className="space-y-6">
                  {statsData.map((item, index) => (
                    <CategoryBar
                      key={item.category}
                      item={item}
                      maxCount={statsData[0]?.count || 1}
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
