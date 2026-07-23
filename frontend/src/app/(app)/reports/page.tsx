"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getAccessToken } from "@/lib/api";
import { Download, Calendar, FileText } from "lucide-react";

const BULAN_LIST = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

const TAHUN_LIST = [2024, 2025, 2026, 2027];

export default function ReportsPage() {
  const { user, loading: authLoading } = useAuth();
  const [tahun, setTahun] = useState(2026);
  const [bulan, setBulan] = useState(5);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 text-sm">
        Memuat...
      </div>
    );
  }

  if (!user) return null;

  function getPdfUrl() {
    const token = getAccessToken();
    return `http://localhost:8000/api/reports/pdf?tahun=${tahun}&bulan=${bulan}&token=${token}`;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-800">Laporan PDF</h1>
          <p className="text-xs text-slate-400 font-medium mt-0.5">Unduh dan lihat pratinjau laporan eksekutif kedisiplinan ASN</p>
        </div>
      </div>

      {/* Filter and Download Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row items-stretch md:items-end justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tahun
            </label>
            <div className="relative">
              <select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer min-w-[120px] transition-colors"
              >
                {TAHUN_LIST.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Bulan
            </label>
            <div className="relative">
              <select
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                className="appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-4 py-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer min-w-[150px] transition-colors"
              >
                {BULAN_LIST.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <a
          href={getPdfUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl transition-colors font-semibold text-xs min-w-[160px] tracking-wide"
        >
          <Download className="w-4 h-4" /> Download Laporan PDF
        </a>
      </div>

      {/* PDF Preview Card */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden" style={{ height: "65vh" }}>
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-600">Pratinjau Dokumen Laporan</span>
        </div>
        <iframe src={getPdfUrl()} className="w-full h-full border-none" title="PDF Preview" />
      </div>
    </div>
  );
}
