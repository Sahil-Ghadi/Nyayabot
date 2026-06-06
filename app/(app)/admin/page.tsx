"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setNotification({ type: 'error', message: 'Please select a PDF file first.' });
      return;
    }
    if (!title.trim() || !desc.trim() || !adminKey.trim()) {
      setNotification({ type: 'error', message: 'Please provide Title, Description, and Admin Key.' });
      return;
    }

    setIsUploading(true);
    setNotification(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("desc", desc);
    formData.append("adminKey", adminKey);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setNotification({ type: 'success', message: `Success! "${file.name}" has been vectorized and added to the knowledge base.` });
      setFile(null);
      setTitle("");
      setDesc("");
      
      // Auto-dismiss notification
      setTimeout(() => setNotification(null), 5000);
      
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-gutter max-w-container-max mx-auto w-full flex flex-col gap-8 pb-24">
      <header className="mt-4">
        <h2 className="text-headline-md font-headline-md text-on-surface mb-2 flex items-center gap-3">
          <span className="material-symbols-outlined text-[32px] text-tertiary">admin_panel_settings</span>
          Admin Control Panel
        </h2>
        <p className="text-body-md font-body-md text-on-surface-variant max-w-2xl">
          Upload legal documents (PDFs) to automatically parse, vectorize, and inject them into the RAG knowledge base. They will instantly appear in the Library.
        </p>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-[fadeIn_0.3s_ease-out] border ${
          notification.type === 'success' 
            ? 'bg-primary/10 border-primary/20 text-primary-fixed-dim' 
            : 'bg-error/10 border-error/20 text-error'
        }`}>
          <span className="material-symbols-outlined">
            {notification.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <p className="font-body-md text-body-md font-medium">{notification.message}</p>
        </div>
      )}

      <section className="glass-panel rounded-xl p-8 max-w-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl"></div>
        
        <form onSubmit={handleUpload} className="relative z-10 flex flex-col gap-6">
          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-2">Document Title (Library Display)</label>
            <input 
              type="text" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Maternity Benefit Act, 1961"
              className="w-full bg-surface-container/50 border border-white/10 rounded-lg px-4 py-3 text-body-md text-on-surface outline-none focus:border-tertiary/50 focus:bg-surface-container transition-all"
            />
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-2">Brief Description</label>
            <textarea 
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Short summary of the document for the library cards..."
              rows={2}
              className="w-full bg-surface-container/50 border border-white/10 rounded-lg px-4 py-3 text-body-md text-on-surface outline-none focus:border-tertiary/50 focus:bg-surface-container transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-2">Admin Authentication Key</label>
            <div className="relative">
              <input 
                type={showKey ? "text" : "password"}
                value={adminKey}
                onChange={e => setAdminKey(e.target.value)}
                placeholder="Enter secure admin key..."
                className="w-full bg-surface-container/50 border border-white/10 rounded-lg px-4 py-3 pr-12 text-body-md text-on-surface outline-none focus:border-tertiary/50 focus:bg-surface-container transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showKey ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-label-md font-label-md text-on-surface mb-2">PDF Document</label>
            <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              file ? 'border-tertiary/50 bg-tertiary/5' : 'border-white/10 bg-surface-container-low/30 hover:bg-surface-container-low hover:border-white/20'
            }`}>
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <span className={`material-symbols-outlined text-[32px] mb-2 ${file ? 'text-tertiary' : 'text-on-surface-variant'}`}>
                  {file ? 'picture_as_pdf' : 'cloud_upload'}
                </span>
                <p className="mb-2 text-sm text-on-surface-variant">
                  {file ? <span className="font-semibold text-on-surface">{file.name}</span> : <span className="font-semibold">Click to upload</span>}
                </p>
                <p className="text-xs text-on-surface-variant/70">PDF (MAX. 10MB)</p>
              </div>
              <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <button 
            type="submit" 
            disabled={isUploading || !file || !title.trim() || !desc.trim() || !adminKey.trim()}
            className="mt-2 bg-tertiary text-on-tertiary font-label-md text-label-md py-3 px-6 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                Vectorizing Document...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">database</span>
                Upload & Inject to Vector Store
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  );
}
