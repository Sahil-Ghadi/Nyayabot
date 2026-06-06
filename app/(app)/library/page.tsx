"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Scale, ShieldAlert, FileText, Briefcase, Users, Clock, ExternalLink } from "lucide-react";

const categories = [
  {
    icon: Scale,
    title: "Salary & Wages",
    desc: "Understanding minimum wage, overtime, and deductions.",
    googleQuery: "Payment of Wages Act 1936 India employee rights minimum wages",
  },
  {
    icon: ShieldAlert,
    title: "Wrongful Termination",
    desc: "Your rights when facing dismissal without cause.",
    googleQuery: "Industrial Disputes Act wrongful termination retrenchment India employee rights",
  },
  {
    icon: FileText,
    title: "Employment Contracts",
    desc: "Decoding complex clauses, non-competes, and NDAs.",
    googleQuery: "Indian employment contract law non compete clause NDA employee rights",
  },
  {
    icon: Clock,
    title: "Leave Rights",
    desc: "Sick leave, casual leave, and earned privileges.",
    googleQuery: "Factories Act 1948 leave rights sick leave casual leave India employee",
  },
  {
    icon: Users,
    title: "Maternity Benefits",
    desc: "Rights, paid leave, and protections under the Act.",
    googleQuery: "Maternity Benefit Act 1961 India paid leave 26 weeks employee rights",
  },
  {
    icon: Briefcase,
    title: "Workplace Harassment",
    desc: "POSH guidelines and raising official grievances.",
    googleQuery: "POSH Act 2013 India sexual harassment workplace ICC complaint guidelines",
  },
];

export default function LibraryPage() {
  return (
    <div className="flex flex-col gap-8 pb-12">
      <div className="relative z-10">
        <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">
          Rights <span className="gradient-gold">Library</span>
        </h1>
        <p className="text-brand-text-secondary text-lg max-w-2xl">
          A premium knowledge base grounded in Indian employment law. Browse curated articles and legal precedents to understand your rights better.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {categories.map((cat, i) => {
          const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(cat.googleQuery)}`;

          return (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group glass-panel p-6 rounded-[20px] hover:border-brand-gold/30 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] transition-all duration-300 flex flex-col h-full"
            >
              <div className="w-12 h-12 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <cat.icon className="w-6 h-6 text-brand-gold" />
              </div>

              <h3 className="text-xl font-serif font-bold mb-2 group-hover:text-brand-gold transition-colors">{cat.title}</h3>
              <p className="text-brand-text-secondary text-sm leading-relaxed mb-6 flex-1">
                {cat.desc}
              </p>

              <div className="flex items-center gap-4 mt-auto">
                <Link
                  href={`/library/${encodeURIComponent(cat.title)}`}
                  className="flex items-center gap-2 text-sm font-medium text-brand-gold hover:underline transition-all duration-300"
                >
                  <span>Learn More</span>
                  <span className="text-lg">→</span>
                </Link>
                <a
                  href={googleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-medium text-white/50 hover:text-brand-gold px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-brand-gold/30 transition-all duration-300"
                >
                  <ExternalLink className="w-3 h-3" />
                  Google
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
