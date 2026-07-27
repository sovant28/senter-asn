"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/publik" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
            <img src="/logo.png" alt="Logo Tana Toraja" className="w-8 h-10 object-contain" />
            <div>
              <h1 className="font-display font-bold text-slate-800 text-sm md:text-base leading-tight">SENTER ASN</h1>
              <p className="text-xs text-slate-500 font-medium leading-none">BKPSDM Kab. Tana Toraja</p>
            </div>
          </Link>

          <nav className="flex items-center gap-6 text-xs font-bold">
            <Link
              href="/publik"
              className={`transition-colors duration-200 ${
                pathname === "/publik" || pathname === "/"
                  ? "text-teal-700"
                  : "text-slate-500 hover:text-teal-600"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/perhitungan"
              className={`transition-colors duration-200 ${
                pathname === "/perhitungan"
                  ? "text-teal-700"
                  : "text-slate-500 hover:text-teal-600"
              }`}
            >
              Simulator Perhitungan
            </Link>
            <Link
              href="/tentang"
              className={`transition-colors duration-200 ${
                pathname === "/tentang"
                  ? "text-teal-700"
                  : "text-slate-500 hover:text-teal-600"
              }`}
            >
              Tentang Sistem
            </Link>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="text-center sm:text-left leading-relaxed">
            Salam Kinerja & Disiplin ASN • Tabe'! Dibuat dengan ❤️ oleh Tim Pengembang SENTER ASN
          </div>
          <div className="text-slate-400 font-semibold shrink-0">
            SENTER ASN v0.1.0
          </div>
        </div>
      </footer>
    </div>
  );
}
