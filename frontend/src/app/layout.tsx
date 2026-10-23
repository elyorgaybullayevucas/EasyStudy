import type { Metadata } from "next";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "EasyStudy — kurslar va mock imtihonlar", template: "%s | EasyStudy" },
  description: "IELTS, SAT, TOPIK va boshqa xalqaro sertifikatlarga tayyorlov: video kurslar, mock imtihonlar va sertifikatlar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" className="h-full">
      <body className="flex min-h-full flex-col font-sans">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
