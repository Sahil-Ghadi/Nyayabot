"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

export default function AdminTestingPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    if (!query.trim()) return;
    setIsLoading(true);

    try {
      // Direct call to API to get raw output including citations
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-brand-bg text-brand-text-primary">
      <h1 className="text-3xl font-serif font-bold mb-2">RAG Pipeline Testing</h1>
      <p className="text-brand-text-secondary mb-8">Test the retrieval accuracy, classification, and final generated output.</p>

      <div className="flex gap-4 mb-8">
        <input 
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTest()}
          placeholder="Enter a test query (e.g. 'I was terminated after raising a complaint')"
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-gold/50 transition-colors"
        />
        <button 
          onClick={handleTest}
          disabled={isLoading}
          className="px-6 py-3 bg-brand-gold text-black font-medium rounded-xl flex items-center gap-2 hover:bg-brand-gold-soft transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Test RAG
        </button>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-xl border border-white/10">
            <h3 className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-4">Pipeline Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-brand-text-secondary text-sm">Classification</p>
                <p className="font-mono mt-1 text-white">{result.classification}</p>
              </div>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-white/10">
            <h3 className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-4">Retrieved Chunks ({result.citations?.length || 0})</h3>
            <div className="space-y-4">
              {result.citations?.map((cite: any, i: number) => (
                <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-brand-gold">Source: {cite.source}</span>
                  </div>
                  <p className="text-sm text-brand-text-secondary">{cite.content}</p>
                </div>
              ))}
              {!result.citations?.length && <p className="text-sm text-brand-text-secondary">No chunks retrieved.</p>}
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl border border-white/10">
            <h3 className="text-brand-gold text-xs font-bold uppercase tracking-widest mb-4">Generated Response</h3>
            <div className="text-sm text-white whitespace-pre-wrap leading-relaxed">
              {result.response}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
