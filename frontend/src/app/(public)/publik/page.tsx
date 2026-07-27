"use client";

import { useEffect, useState } from "react";
import {
  Award,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Building2,
  Activity,
  Search,
  Sparkles,
  Info,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import { StatsCard } from "@/components/stats-card";

interface Ranking {
  rank: number;
  opd_id: number;
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

export default function PublicDashboardPage() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(6);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    // Fetch from our Next.js API route that caches the backend data using ISR
    fetch(`/api/public/ranking?tahun=${selectedYear}&bulan=${selectedMonth}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load rankings");
        return res.json();
      })
      .then((d) => {
        setRankings(d.rankings || []);
      })
      .catch((err) => {
        console.error("Fetch rankings error:", err);
        setRankings([]);
      })
      .finally(() => setLoading(false));
  }, [selectedYear, selectedMonth]);

  // Statistics calculation
  const dist: Record<string, number> = {
    SANGAT_DISIPLIN: 0,
    DISIPLIN: 0,
    CUKUP: 0,
    PERLU_PEMBINAAN: 0,
  };
  rankings.forEach((r) => {
    if (r.kategori in dist) dist[r.kategori]++;
  });

  const avgSkor =
    rankings.length > 0
      ? rankings.reduce((s, r) => s + r.total_skor, 0) / rankings.length
      : 0;

  // Filter rankings for Top 5 / Bottom 5 dynamic dual-axis chart
  const top5 = rankings.slice(0, 5);
  const bottom5 = [...rankings].slice(-5).reverse();

  const bestOPD = rankings.length > 0 ? rankings[0] : null;
  const worstOPD = rankings.length > 0 ? rankings[rankings.length - 1] : null;

  // Filter for rankings table search
  const filteredRankings = rankings.filter((r) =>
    r.nama_opd.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ECharts Configurations
  const donutOption = {
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderColor: "#f1f5f9",
      borderWidth: 1,
      textStyle: { color: "#334155", fontSize: 11, fontFamily: "Inter, sans-serif" },
      shadowColor: "rgba(0, 0, 0, 0.04)",
      shadowBlur: 8,
    },
    legend: {
      orient: "horizontal",
      bottom: "0%",
      left: "center",
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 12,
      textStyle: { color: "#64748b", fontSize: 11, fontFamily: "Inter, sans-serif", fontWeight: 500 },
    },
    series: [
      {
        name: "Kategori",
        type: "pie",
        radius: ["55%", "75%"],
        center: ["50%", "45%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 13,
            fontWeight: "bold",
            formatter: "{b}\n{c} OPD",
            fontFamily: "Inter, sans-serif",
          },
        },
        data: [
          { value: dist.SANGAT_DISIPLIN, name: "Sangat Disiplin", itemStyle: { color: "#15803d" } },
          { value: dist.DISIPLIN, name: "Disiplin", itemStyle: { color: "#22c55e" } },
          { value: dist.CUKUP, name: "Cukup", itemStyle: { color: "#eab308" } },
          { value: dist.PERLU_PEMBINAAN, name: "Perlu Pembinaan", itemStyle: { color: "#dc2626" } },
        ],
      },
    ],
  };

  const dualBarOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderColor: "#f1f5f9",
      borderWidth: 1,
      textStyle: { color: "#334155", fontSize: 11, fontFamily: "Inter, sans-serif" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        if (!params || params.length === 0) return "";
        const dataIndex = params[0].dataIndex;
        const topOpd = top5[dataIndex];
        const bottomOpd = bottom5[dataIndex];

        let html = `<div style="font-family: Inter, sans-serif; font-size: 11px; padding: 6px; line-height: 1.6; min-width: 220px;">`;
        html += `<div style="font-weight: bold; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 6px;">Perbandingan Rank #${dataIndex + 1}</div>`;
        if (topOpd) {
          html += `<div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: #15803d; display: inline-block; flex-shrink: 0;"></span>
            <span style="color: #64748b; font-weight: 500; width: 50px;">Terbaik:</span> 
            <strong style="color: #15803d; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; vertical-align: bottom;" title="${topOpd.nama_opd}">${topOpd.nama_opd}</strong>
            <span style="color: #334155; font-weight: bold; margin-left: auto;">${topOpd.total_skor.toFixed(2)}</span>
          </div>`;
        }
        if (bottomOpd) {
          html += `<div style="display: flex; align-items: center; gap: 8px;">
            <span style="width: 8px; height: 8px; border-radius: 50%; background-color: #dc2626; display: inline-block; flex-shrink: 0;"></span>
            <span style="color: #64748b; font-weight: 500; width: 50px;">Terbawah:</span> 
            <strong style="color: #991b1b; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: inline-block; vertical-align: bottom;" title="${bottomOpd.nama_opd}">${bottomOpd.nama_opd}</strong>
            <span style="color: #334155; font-weight: bold; margin-left: auto;">${bottomOpd.total_skor.toFixed(2)}</span>
          </div>`;
        }
        html += `</div>`;
        return html;
      }
    },
    grid: { left: "3%", right: "3%", top: "8%", bottom: "8%", containLabel: true },
    xAxis: {
      type: "category",
      data: ["Rank 1", "Rank 2", "Rank 3", "Rank 4", "Rank 5"],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#64748b", fontSize: 10, fontFamily: "Inter, sans-serif", fontWeight: 500 },
    },
    yAxis: {
      type: "value",
      min: -100,
      max: 100,
      splitLine: { lineStyle: { type: "dashed", color: "#f1f5f9" } },
      axisLabel: {
        color: "#94a3b8",
        fontSize: 10,
        fontFamily: "Inter, sans-serif",
        formatter: (val: number) => Math.abs(val).toString(),
      },
    },
    series: [
      {
        name: "Terbaik (Top 5)",
        type: "bar",
        stack: "performance",
        barWidth: 20,
        itemStyle: {
          color: "#0a6c74",
          borderRadius: [4, 4, 0, 0],
        },
        data: top5.map((r) => r.total_skor),
      },
      {
        name: "Terbawah (Lower 5)",
        type: "bar",
        stack: "performance",
        barWidth: 20,
        itemStyle: {
          color: "#dc2626",
          borderRadius: [0, 0, 4, 4],
        },
        data: bottom5.map((r) => -r.total_skor),
      },
    ],
  };

  const getAvgCategory = (score: number) => {
    if (score >= 90) return { label: "Sangat Disiplin", color: "text-success-dark bg-success-light border-success/20" };
    if (score >= 80) return { label: "Disiplin", color: "text-success-dark bg-success-light border-success/20" };
    if (score >= 70) return { label: "Cukup", color: "text-warning bg-warning-light border-warning/20" };
    return { label: "Perlu Pembinaan", color: "text-danger bg-danger-light border-danger/20" };
  };

  const avgCat = getAvgCategory(avgSkor);

  const katColor = (kat: string) =>
    ({
      SANGAT_DISIPLIN: "bg-emerald-50 text-emerald-700 border-emerald-200",
      DISIPLIN: "bg-green-50 text-green-700 border-green-200",
      CUKUP: "bg-amber-50 text-amber-600 border-amber-200",
      PERLU_PEMBINAAN: "bg-red-50 text-red-600 border-red-200",
    }[kat] || "bg-slate-50 text-slate-600 border-slate-200");

  const katLabel = (kat: string) =>
    ({
      SANGAT_DISIPLIN: "Sangat Disiplin",
      DISIPLIN: "Disiplin",
      CUKUP: "Cukup",
      PERLU_PEMBINAAN: "Perlu Pembinaan",
    }[kat] || kat);

  const activeBulanLabel = BULAN_LIST.find((m) => m.value === selectedMonth)?.label || "";

  return (
    <div className="space-y-6">
      {/* Header and Period Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-800 leading-tight">Dashboard Kedisiplinan Publik</h2>
          <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">
            Portal data keterbukaan indeks disiplin kerja Organisasi Perangkat Daerah Kabupaten Tana Toraja.
          </p>
        </div>
        
        {/* Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Month Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="appearance-none pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all duration-200 cursor-pointer"
            >
              {BULAN_LIST.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Year Dropdown */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all duration-200 cursor-pointer"
            >
              {TAHUN_LIST.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold animate-pulse">Memuat data analisis publik...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 font-medium text-sm">
          Belum ada data rekapitulasi disiplin untuk periode {activeBulanLabel} {selectedYear}.
        </div>
      ) : (
        <>
          {/* STATS CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              label={`Rata-rata Skor Kabupaten (${activeBulanLabel})`}
              value={`${avgSkor.toFixed(2)}`}
              icon={Activity}
              iconBgColor="bg-teal-50"
              iconColor="text-teal-600"
              description={`Kategori: ${avgCat.label}`}
            />
            <StatsCard
              label="OPD Sangat Disiplin"
              value={dist.SANGAT_DISIPLIN}
              icon={TrendingUp}
              iconBgColor="bg-green-50"
              iconColor="text-green-700"
              description="OPD dengan skor ≥ 90"
            />
            <StatsCard
              label="OPD Cukup Disiplin"
              value={dist.CUKUP}
              icon={Building2}
              iconBgColor="bg-amber-50"
              iconColor="text-amber-600"
              description="OPD dengan skor 70 - 79.9"
            />
            <StatsCard
              label="OPD Perlu Pembinaan"
              value={dist.PERLU_PEMBINAAN}
              icon={AlertTriangle}
              iconBgColor="bg-red-50"
              iconColor="text-red-600"
              description="OPD dengan skor < 70"
            />
          </div>

          {/* CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Sorotan Kinerja (Left) */}
            <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 flex flex-col p-6 gap-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-800">Sorotan Kinerja Instansi</h3>
                  <p className="text-xs text-slate-400 font-medium">Perbandingan 5 OPD Terbaik vs 5 OPD Terbawah</p>
                </div>
              </div>
              <div className="flex-grow h-[280px] w-full">
                <ReactECharts option={dualBarOption} style={{ height: "100%", width: "100%" }} />
              </div>
            </div>

            {/* Distribusi Kategori (Right) */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-800">Distribusi Kategori</h3>
                  <p className="text-xs text-slate-400 font-medium">Berdasarkan klasifikasi disiplin presensi</p>
                </div>
              </div>
              <div className="flex-grow h-[220px] w-full relative">
                <ReactECharts option={donutOption} style={{ height: "100%", width: "100%" }} />
              </div>
              {/* Summary Highlight Box */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 space-y-2 text-xs">
                {bestOPD && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-yellow-500" /> Terbaik #1
                    </span>
                    <strong className="text-emerald-700 max-w-[150px] truncate">{bestOPD.nama_opd}</strong>
                    <span className="font-bold text-slate-700">{bestOPD.total_skor.toFixed(2)}</span>
                  </div>
                )}
                {worstOPD && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> Terbawah #1
                    </span>
                    <strong className="text-red-700 max-w-[150px] truncate">{worstOPD.nama_opd}</strong>
                    <span className="font-bold text-slate-700">{worstOPD.total_skor.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SEARCH & DETAILED TABLE */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-800">Daftar Peringkat Instansi</h3>
                  <p className="text-xs text-slate-400 font-medium">Hasil rekap lengkap tingkat kedisiplinan seluruh instansi</p>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:max-w-xs">
                <input
                  type="text"
                  placeholder="Cari nama dinas / instansi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all duration-200"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold w-16 text-center">Rank</th>
                    <th className="py-3 px-4 font-semibold">Nama Dinas / Instansi</th>
                    <th className="py-3 px-4 font-semibold text-center w-28">Skor Akhir</th>
                    <th className="py-3 px-4 font-semibold text-center w-36">Kategori</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {filteredRankings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 px-4 text-center text-slate-400">
                        Tidak ada instansi yang cocok dengan kata pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredRankings.map((row) => (
                      <tr key={row.opd_id} className="hover:bg-slate-50/50 transition-colors duration-150">
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold ${
                            row.rank === 1
                              ? "bg-yellow-100 text-yellow-800"
                              : row.rank === 2
                              ? "bg-slate-100 text-slate-800"
                              : row.rank === 3
                              ? "bg-amber-100 text-amber-900"
                              : "text-slate-500"
                          }`}>
                            {row.rank}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{row.nama_opd}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{row.total_skor.toFixed(2)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${katColor(row.kategori)}`}>
                            {katLabel(row.kategori)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* METHODOLOGY INFO BOX */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row gap-4 items-start">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 text-xs text-slate-500 leading-relaxed font-medium">
              <h4 className="font-bold text-slate-800 text-sm">Metodologi & Standardisasi Penilaian</h4>
              <p>
                Nilai kedisiplinan OPD dihitung secara terpusat menggunakan metode <strong>Simple Additive Weighting (SAW)</strong> dengan mengevaluasi empat kriteria utama: Persentase Kehadiran Fisik (bobot 25%), Kepatuhan Jam Kerja (bobot 20%), Tingkat Ketidakhadiran Tanpa Alasan (bobot 15%), dan Persentase Hadir Kerja Efektif (bobot 40%). Perhitungan hari kerja dinamis disesuaikan per periode menggunakan statistik modus kalender. Hal ini menjamin transparansi serta objektivitas evaluasi kinerja tanpa manipulasi manual.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
