"use client";

import { useAuth } from "@/lib/auth";
import { Menu, Bell, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

interface TopbarProps {
  onMenuClick: () => void;
  title: string;
}

export function Topbar({ onMenuClick, title }: TopbarProps) {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const timer = setTimeout(() => {
      setCurrentDate(new Date().toLocaleDateString("id-ID", options));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!user) return null;

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs / Page Title */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 tracking-wider">
            <span>SENTER ASN</span>
            <span>/</span>
            <span className="text-slate-500">{title}</span>
          </div>
          <h2 className="font-display text-sm font-bold text-slate-800 leading-tight">
            {title}
          </h2>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Date Display */}
        <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
          <Calendar className="w-4 h-4 text-primary" />
          <span>{currentDate}</span>
        </div>

        {/* Notifications Mockup */}
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-200 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-white"></span>
        </button>

        {/* Simple Divider */}
        <div className="h-6 w-px bg-slate-100 hidden sm:block"></div>

        {/* User Quick Info */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-700 leading-tight">
              {user.nama_lengkap}
            </p>
            <p className="text-[10px] font-semibold text-slate-400 leading-none capitalize">
              Role: {user.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
