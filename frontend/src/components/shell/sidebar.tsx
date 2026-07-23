"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Calculator,
  LogOut,
  Shield,
  User,
  Award,
} from "lucide-react";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

export function Sidebar({ className = "", onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Peringkat OPD", href: "/ranking", icon: Award },
    { name: "Upload Excel", href: "/upload", icon: Upload },
    { name: "Laporan PDF", href: "/reports", icon: FileText },
    { name: "Metode Perhitungan", href: "/perhitungan", icon: Calculator },
  ];

  if (!user) return null;

  return (
    <aside
      className={`w-64 bg-white border-r border-slate-100 flex flex-col h-screen fixed lg:sticky top-0 z-30 transition-transform duration-300 ${className}`}
    >
      {/* Brand Header */}
      <div className="h-20 px-6 border-b border-slate-100 flex items-center gap-3">
        <img src="/logo.png" alt="Logo Pemkab Tana Toraja" className="w-9 h-11 object-contain drop-shadow-sm" />
        <div>
          <h1 className="font-display font-extrabold text-slate-800 tracking-tight leading-none text-base">
            SENTER ASN
          </h1>
          <span className="text-[10px] font-bold text-teal-700 block mt-1">
            BKPSDM Kab. Tana Toraja
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-bold tracking-wider text-slate-400">
            Menu Utama
          </span>
        </div>
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 group ${
                isActive
                  ? "bg-primary-light text-primary-dark font-bold"
                  : "text-slate-600 hover:bg-slate-50/50 hover:text-slate-900 font-semibold"
              }`}
            >
              <item.icon
                className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${
                  isActive ? "text-primary-dark" : "text-slate-400 group-hover:text-slate-500"
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white border border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center text-primary-dark font-bold text-sm shrink-0">
            {user.nama_lengkap ? user.nama_lengkap.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-700 truncate leading-snug">
              {user.nama_lengkap}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 truncate leading-none capitalize">
              {user.role}
            </p>
          </div>
          <button
            onClick={logout}
            title="Keluar"
            className="p-2 text-slate-400 hover:text-danger hover:bg-danger-light rounded-lg transition-colors duration-200 shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
