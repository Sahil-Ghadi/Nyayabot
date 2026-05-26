import type { Metadata } from "next";
import { Geist, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "500", "700"],
});

export const metadata: Metadata = {
  title: "NyayaBot | Premium AI Legal Guidance",
  description: "AI-powered Employee Rights Awareness Platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${cormorant.variable} antialiased dark`}
    >
      <body className="bg-brand-bg text-brand-text-primary min-h-screen flex flex-col selection:bg-brand-gold selection:text-black">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
