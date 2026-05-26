"use client";

import { useState } from "react";
import { Upload, FileText, Loader2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminDocumentsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setMessage(null);
    
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage({ text: `Success! Extracted and embedded ${data.chunks} chunks.`, type: "success" });
        setFile(null);
      } else {
        setMessage({ text: data.error || "Failed to upload", type: "error" });
      }
    } catch (error: any) {
      setMessage({ text: error.message || "An error occurred", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto min-h-screen bg-brand-bg text-brand-text-primary">
      <h1 className="text-3xl font-serif font-bold mb-2">Document Management</h1>
      <p className="text-brand-text-secondary mb-8">Upload legal PDFs to process, chunk, and embed them into the RAG vector store.</p>

      <div className="glass-panel p-8 rounded-2xl border border-white/10 mb-8">
        <div className="border-2 border-dashed border-white/20 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <FileText className="w-12 h-12 text-brand-gold mb-4" />
          <h3 className="text-xl font-medium mb-2">Upload Legal Document</h3>
          <p className="text-brand-text-secondary text-sm mb-6">Supported formats: PDF. Max size: 10MB.</p>
          
          <input 
            type="file" 
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden" 
            id="pdf-upload"
          />
          <label 
            htmlFor="pdf-upload"
            className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
          >
            {file ? file.name : "Select PDF File"}
          </label>
          
          {file && (
            <button 
              onClick={handleUpload}
              disabled={isUploading}
              className="mt-6 px-8 py-3 bg-brand-gold text-black font-medium rounded-full flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? "Processing..." : "Process & Embed"}
            </button>
          )}
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-6 p-4 rounded-lg border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
          >
            {message.text}
          </motion.div>
        )}
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-serif font-bold">Processed Corpus</h2>
          <button className="flex items-center gap-2 text-sm px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
            <RefreshCw className="w-4 h-4" /> Rebuild Index
          </button>
        </div>
        <p className="text-brand-text-secondary text-sm">
          Check Firestore `documents` collection to see uploaded documents metadata.
        </p>
      </div>
    </div>
  );
}
