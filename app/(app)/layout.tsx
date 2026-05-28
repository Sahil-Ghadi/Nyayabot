import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-brand-bg relative overflow-hidden">
      {/* Background glow for the whole app */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-gold/5 rounded-full blur-[150px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      
      <Sidebar />
      <main className="flex-1 overflow-y-auto h-screen p-8 relative z-10 scroll-smooth">
        <div className="w-full max-w-screen-2xl mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
