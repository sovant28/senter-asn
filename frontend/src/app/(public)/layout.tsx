"use client";

import React from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo Tana Toraja" className="w-8 h-10 object-contain" />
            <div>
              <h1 className="font-display font-bold text-slate-800 text-sm md:text-base leading-tight">SENTER ASN</h1>
              <p className="text-xs text-slate-500 font-medium leading-none">BKPSDM Kab. Tana Toraja</p>
            </div>
          </div>
          
          <a
            href="/login"
            className="px-4 py-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-2xl transition-colors duration-200"
          >
            Portal Admin (Login)
          </a>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
