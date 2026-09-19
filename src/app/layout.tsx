import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "SIMANEV PSSDM — Aplikasi Manajemen Event (Google Apps Script + Blogger)",
  description:
    "Kode sumber Google Apps Script untuk manajemen event Pusat Standardisasi dan Sertifikasi SDM Kelautan dan Perikanan: pendaftaran peserta, QR Code & e-ticket otomatis, scan check-in, validasi kehadiran, dashboard laporan, dan portal Blogger.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 via-cyan-50/40 to-blue-50 text-slate-900 antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
