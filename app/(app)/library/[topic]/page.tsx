import { similaritySearch } from "@/lib/rag/vectorStore";
import { Scale } from "lucide-react";

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  // In Next.js 15+, dynamic route params are asynchronous and must be awaited!
  const resolvedParams = await params;
  const decodedTopic = decodeURIComponent(resolvedParams.topic);

  // Search the vector store for the exact category title to pull relevant legal rights
  const results = await similaritySearch(`What are the legal rights and laws regarding ${decodedTopic}?`, 8);

  return (
    <div className="flex flex-col gap-8 pb-12 animate-fade-in">
      <div className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center">
          <Scale className="w-6 h-6 text-brand-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-serif font-bold text-white mb-1">{decodedTopic}</h1>
          <p className="text-brand-text-secondary">Explore legal rights and case precedents.</p>
        </div>
      </div>

      <div className="space-y-6">
        {results.length === 0 ? (
          <div className="glass-panel p-8 text-center rounded-2xl">
            <p className="text-brand-text-secondary">No specific legal documents found for this topic yet.</p>
          </div>
        ) : (
          results.map((result: any, idx: number) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-brand-gold/30 transition-colors">
              <p className="text-white text-sm leading-relaxed mb-4">{result.content}</p>
              <div className="flex justify-between items-center text-xs text-brand-gold font-medium bg-white/5 px-3 py-2 rounded-lg">
                <span>Source: {result.source}</span>
                <span>Match Score: {(result.relevanceScore * 100).toFixed(1)}%</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
