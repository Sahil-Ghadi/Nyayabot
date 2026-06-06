"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Scale, ShieldAlert, FileText, Briefcase, Users, Clock, ExternalLink } from "lucide-react";

const categories = [
  {
    icon: Scale,
    title: "Salary & Wages",
    desc: "Understanding minimum wage, overtime, and deductions.",
    googleQuery: "The Code on Wages 2019 India employee rights minimum wages",
  },
  {
    icon: ShieldAlert,
    title: "Wrongful Termination",
    desc: "Your rights when facing dismissal without cause.",
    googleQuery: "The Industrial Relations Code 2020 wrongful termination retrenchment India employee rights",
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
    googleQuery: "OSHWC Code 2020 leave rights sick leave casual leave India employee",
  },
  {
    icon: Users,
    title: "Maternity Benefits",
    desc: "Rights, paid leave, and protections under the Act.",
    googleQuery: "Code on Social Security 2020 maternity benefit paid leave 26 weeks India employee",
  },
  {
    icon: Briefcase,
    title: "Workplace Harassment",
    desc: "POSH guidelines and raising official grievances.",
    googleQuery: "POSH Act 2013 India sexual harassment workplace ICC complaint guidelines",
  },
];

import { useEffect, useState } from "react";

export default function LibraryPage() {
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/library/docs')
      .then(res => res.json())
      .then(data => {
        if (data.docs) setUploadedDocs(data.docs);
      })
      .catch(err => console.error("Error loading uploaded docs:", err));
  }, []);

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

      {/* Dynamic Uploaded Documents Section */}
      {uploadedDocs.length > 0 && (
        <>
          <h2 className="text-2xl font-serif font-bold mt-4 mb-2 text-brand-gold">Newly Added Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {uploadedDocs.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="group glass-panel p-6 rounded-[20px] hover:border-tertiary/30 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] transition-all duration-300 flex flex-col h-full border border-tertiary/10"
              >
                <div className="w-12 h-12 rounded-xl bg-tertiary/10 border border-tertiary/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="w-6 h-6 text-tertiary" />
                </div>

                <h3 className="text-xl font-serif font-bold mb-2 group-hover:text-tertiary transition-colors">{doc.title}</h3>
                <p className="text-brand-text-secondary text-sm leading-relaxed mb-6 flex-1">
                  {doc.desc}
                </p>

                <div className="flex items-center gap-4 mt-auto">
                  <span className="text-xs text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">
                    Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
          <hr className="border-white/5 my-4" />
        </>
      )}

      <h2 className="text-2xl font-serif font-bold mt-4 mb-2">Core Categories</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
