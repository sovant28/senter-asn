"use client";

import { useState } from "react";
import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Determine page title based on path
  const getPageTitle = (path: string) => {
    if (path.startsWith("/dashboard")) return "Dashboard Kehadiran";
    if (path.startsWith("/upload")) return "Upload Data Presensi";
    if (path.startsWith("/reports")) return "Laporan PDF";
    if (path.startsWith("/perhitungan")) return "Metode Analisis";
    return "SENTER ASN";
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Mobile Sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Desktop & Mobile Drawer */}
      <Sidebar
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed lg:sticky top-0 left-0 h-screen transition-transform duration-300 ease-in-out`}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          title={getPageTitle(pathname)}
        />
        <main className="flex-grow p-4 md:p-6 lg:p-8 max-w-[1400px] w-full mx-auto transition-all duration-300">
          {children}
        </main>
      </div>
    </div>
  );
}
