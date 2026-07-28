"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", href: "/publik" },
    { name: "Simulator Perhitungan", href: "/perhitungan" },
    { name: "Tentang Sistem", href: "/tentang" },
  ];

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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition-colors duration-200 ${pathname === item.href || (item.href === "/publik" && pathname === "/")
                    ? "text-teal-700"
                    : "text-slate-500 hover:text-teal-600"
                  }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-650 hover:bg-slate-100 rounded-xl transition-colors outline-none"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 flex flex-col gap-2.5 shadow-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href === "/publik" && pathname === "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${isActive
                      ? "bg-teal-50 text-teal-700"
                      : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="text-center sm:text-left leading-relaxed">
            Salam Kinerja & Disiplin ASN • Dibuat dengan ❤️ oleh Tim Pengembang SENTER ASN
          </div>
          <div className="text-slate-400 font-semibold shrink-0">
            SENTER ASN v0.1.0
          </div>
        </div>
      </footer>
    </div>
  );
}
