"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { fetchRanking } from "@/lib/api";
import {
  Search,
  Calendar,
} from "lucide-react";

interface Ranking {
  rank: number;
  nama_opd: string;
  kode_opd: string;
  total_skor: number;
  kategori: string;
}

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

const TAHUN_LIST = [2024, 2025, 2026];

export default function RankingPage() {
  const { user, loading: authLoading } = useAuth();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      fetchRanking(selectedYear, selectedMonth)
        .then((d) => {
          setRankings(d.rankings || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router, selectedYear, selectedMonth]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold animate-pulse">Memuat data peringkat...</p>
      </div>
    );
  }

  if (!user) return null;

  const katColor = (kat: string) =>
    ({
      SANGAT_DISIPLIN: "bg-emerald-50 text-emerald-700 border-emerald-200",
      DISIPLIN: "bg-green-50 text-green-700 border-green-200",
      CUKUP: "bg-amber-50 text-amber-600 border-amber-200",
      KURANG: "bg-red-50 text-red-600 border-red-200",
    }[kat] || "bg-slate-50 text-slate-600 border-slate-200");

  const katLabel = (kat: string) =>
    ({
      SANGAT_DISIPLIN: "Sangat Disiplin",
      DISIPLIN: "Disiplin",
      CUKUP: "Cukup",
      KURANG: "Kurang",
    }[kat] || kat);

  const filteredRankings = rankings.filter((r) =>
    r.nama_opd.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeBulanLabel = BULAN_LIST.find((m) => m.value === selectedMonth)?.label || "";

  return (
    <div className="space-y-6">
      {/* Header and Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-800 tracking-tight">Peringkat Disiplin OPD</h1>
          <p className="text-xs text-slate-500 font-medium">
            Evaluasi Peringkat Kepatuhan Periode: <span className="font-semibold text-slate-700">{activeBulanLabel} {selectedYear}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl">
          <Calendar className="w-4 h-4 text-slate-400 ml-2.5 hidden sm:block" />
          
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(Number(e.target.value));
              setLoading(true);
            }}
            className="text-xs font-semibold text-slate-600 bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 cursor-pointer hover:bg-slate-50 rounded-lg transition"
          >
            {BULAN_LIST.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <div className="h-4 w-px bg-slate-100"></div>

          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(Number(e.target.value));
              setLoading(true);
            }}
            className="text-xs font-semibold text-slate-600 bg-transparent border-0 focus:ring-0 focus:outline-none px-2 py-1 cursor-pointer hover:bg-slate-50 rounded-lg transition"
          >
            {TAHUN_LIST.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ranking Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/40">
          <div>
            <h3 className="font-display text-sm font-bold text-slate-800">Daftar Urutan Kepatuhan Instansi</h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Menampilkan {filteredRankings.length} dari {rankings.length} OPD daerah Tana Toraja
            </p>
          </div>
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama OPD..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-primary bg-white text-slate-700 font-medium"
            />
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="px-6 py-4 text-left w-16">Rank</th>
                <th className="px-6 py-4 text-left">Nama Instansi / OPD</th>
                <th className="px-6 py-4 text-right w-32">Skor Kepatuhan</th>
                <th className="px-6 py-4 text-center w-40">Status Kedisiplinan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRankings.length > 0 ? (
                filteredRankings.map((r) => (
                  <tr
                    key={r.kode_opd}
                    className="hover:bg-slate-50/50 transition duration-150 group"
                  >
                    <td className="px-6 py-3.5 font-bold text-slate-500 group-hover:text-slate-800">
                      #{r.rank}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                      {r.nama_opd}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-700">
                      {r.total_skor.toFixed(2)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wider border ${katColor(
                          r.kategori
                        )}`}
                      >
                        {katLabel(r.kategori)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">
                    Tidak ditemukan OPD dengan nama &quot;{searchQuery}&quot;
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
