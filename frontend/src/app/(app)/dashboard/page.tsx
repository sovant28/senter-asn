"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { fetchRanking, fetchPeriods } from "@/lib/api";
import {
  Award,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Building2,
  Activity,
  FileUp,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import { StatsCard } from "@/components/stats-card";
import Link from "next/link";

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

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(6);
  const [periodDetected, setPeriodDetected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user && !periodDetected) {
      fetchPeriods()
        .then((res) => {
          if (res?.periods && res.periods.length > 0) {
            setSelectedYear(res.periods[0].tahun);
            setSelectedMonth(res.periods[0].bulan);
          }
        })
        .catch(console.error)
        .finally(() => setPeriodDetected(true));
    }
  }, [user, authLoading, router, periodDetected]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchRanking(selectedYear, selectedMonth)
        .then((d) => {
          setRankings(d.rankings || []);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user, selectedYear, selectedMonth]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold animate-pulse">Memuat data analisis...</p>
      </div>
    );
  }

  if (!user) return null;

  // Calculate statistics
  const dist: Record<string, number> = {
    SANGAT_DISIPLIN: 0,
    DISIPLIN: 0,
    CUKUP: 0,
    KURANG: 0,
  };
  rankings.forEach((r) => {
    if (r.kategori in dist) dist[r.kategori]++;
  });

  const avgSkor =
    rankings.length > 0
      ? rankings.reduce((s, r) => s + r.total_skor, 0) / rankings.length
      : 0;

  // Dynamic status category for average score
  const getAvgCategory = (score: number) => {
    if (score >= 90) return { label: "Sangat Disiplin", color: "text-success-dark bg-success-light border-success/20" };
    if (score >= 80) return { label: "Disiplin", color: "text-success-dark bg-success-light border-success/20" };
    if (score >= 70) return { label: "Cukup", color: "text-warning bg-warning-light border-warning/20" };
    return { label: "Kurang", color: "text-danger bg-danger-light border-danger/20" };
  };

  const avgCat = getAvgCategory(avgSkor);

  // Filter rankings for Top 5 / Bottom 5 dynamic dual-axis chart
  const top5 = rankings.slice(0, 5);
  const bottom5 = [...rankings].slice(-5).reverse();

  const bestOPD = rankings.length > 0 ? rankings[0] : null;
  const worstOPD = rankings.length > 0 ? rankings[rankings.length - 1] : null;

  // Filter for Public Service OPDs
  const publicServicesKeywords = ["kesehatan", "rsud", "pendidikan", "kependudukan", "perhubungan", "sosial", "penanaman"];
  const publicServices = rankings.filter(r =>
    publicServicesKeywords.some(keyword => r.nama_opd.toLowerCase().includes(keyword))
  ).slice(0, 5);

  // ECharts options
  const pieOption = {
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
          { value: dist.KURANG, name: "Kurang", itemStyle: { color: "#dc2626" } },
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
        barWidth: 16,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: "#15803d",
        },
        label: {
          show: false,
        },
        data: top5.map((r) => r.total_skor),
      },
      {
        name: "Terbawah (Bottom 5)",
        type: "bar",
        stack: "performance",
        barWidth: 16,
        itemStyle: {
          borderRadius: [0, 0, 4, 4],
          color: "#dc2626",
        },
        label: {
          show: false,
        },
        data: bottom5.map((r) => -r.total_skor),
      },
    ],
  };

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



  const activeBulanLabel = BULAN_LIST.find((m) => m.value === selectedMonth)?.label || "";

  return (
    <div className="space-y-6">
      {/* Header and Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-slate-800 tracking-tight">Ringkasan Eksekutif</h1>
          <p className="text-xs text-slate-500 font-medium">
            Periode Laporan: <span className="font-semibold text-slate-700">{activeBulanLabel} {selectedYear}</span>
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

      {/* Onboarding Welcome Banner when empty */}
      {rankings.length === 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 text-teal-800 rounded-full text-xs font-bold border border-teal-200">
                <Building2 className="w-3.5 h-3.5 text-teal-700" />
                SENTER ASN — BKPSDM
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight leading-tight">
                Sistem Evaluasi & Rekapitulasi Disiplin Kerja ASN
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Belum ada data presensi yang terdaftar untuk periode <strong className="text-slate-800 font-bold">{activeBulanLabel} {selectedYear}</strong>. Silakan unggah berkas mentah Excel presensi instansi di menu Upload untuk menghasilkan analisis disiplin dan rekapitulasi otomatis.
              </p>
            </div>
            <div className="shrink-0">
              <Link
                href="/upload"
                className="px-5 py-3 bg-primary-dark hover:bg-primary text-white font-bold rounded-xl text-xs transition flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <FileUp className="w-4 h-4" /> Unggah Berkas Presensi Mentah <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner (BordUp Style) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-dark via-primary to-[#085a61] text-teal-50 rounded-3xl p-6 sm:p-8 border border-slate-200">
        {/* Abstract decorative background elements */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-primary/10 rounded-full blur-2xl translate-y-1/2 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="text-[10px] font-bold tracking-widest text-primary-light/85">
              Evaluasi Kedisiplinan Kehadiran
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Senter ASN BKPSDM
            </h2>
            <p className="text-xs text-[#ccfbf1]/95 font-medium leading-relaxed">
              Halo, <span className="font-bold text-white">{user.nama_lengkap}</span>. Sistem early warning presensi menunjukkan tingkat kepatuhan rata-rata dinas saat ini berada pada tingkat kedisiplinan yang memadai.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 flex items-center gap-4 shrink-0">
            <div>
              <p className="text-[10px] font-bold text-[#ccfbf1]/90 tracking-wider">
                Indeks Rata-rata
              </p>
              <p className="text-3xl font-black tracking-tight mt-0.5">
                {avgSkor.toFixed(1)}
              </p>
            </div>
            <div className="h-10 w-px bg-white/20"></div>
            <div>
              <p className="text-[10px] font-bold text-[#ccfbf1]/90 tracking-wider">
                Status Rata-rata
              </p>
              <span className={`inline-block text-[10px] font-extrabold px-2.5 py-1 rounded-full border mt-1 ${avgCat.color}`}>
                {avgCat.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total OPD Terdaftar"
          value={rankings.length}
          icon={Building2}
          iconBgColor="bg-primary-light"
          iconColor="text-primary-dark"
          description="Dinas dan badan daerah"
        />
        <StatsCard
          label="Rata-rata Skor"
          value={avgSkor.toFixed(1)}
          icon={Award}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-700"
          description="Skor kepatuhan ASN"
        />
        <StatsCard
          label="Sangat Disiplin"
          value={dist.SANGAT_DISIPLIN}
          icon={TrendingUp}
          iconBgColor="bg-green-50"
          iconColor="text-green-700"
          description="OPD dengan skor ≥ 90"
        />
        <StatsCard
          label="Perlu Pembinaan"
          value={dist.KURANG}
          icon={AlertTriangle}
          iconBgColor="bg-danger-light"
          iconColor="text-danger"
          description="OPD dengan skor < 70"
        />
      </div>

      {/* Grid for Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Horizontal Bar Chart (Cash Flow Style) */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 flex flex-col md:flex-row p-6 gap-6">
          {/* Left Side: ECharts dual bar chart */}
          <div className="flex-grow min-w-0 flex flex-col">
            <div className="mb-4 flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-slate-800">Sorotan Kinerja Instansi</h3>
                <p className="text-[11px] text-slate-400 font-medium">Perbandingan 5 instansi terbaik (atas) vs 5 terbawah (bawah)</p>
              </div>
            </div>
            <div className="flex-grow min-h-[250px] flex items-center justify-center">
              {rankings.length > 0 ? (
                <ReactECharts option={dualBarOption} style={{ height: "260px", width: "100%" }} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Tidak ada data tersedia
                </div>
              )}
            </div>
          </div>

          {/* Vertical Separator */}
          <div className="hidden md:block w-px bg-slate-100 self-stretch"></div>

          {/* Right Side: Summary stats panel */}
          <div className="w-full md:w-44 flex flex-col justify-center gap-6 py-2 shrink-0">
            {/* Best OPD Highlight */}
            {bestOPD ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400">Peringkat Teratas</span>
                  <h4 className="font-display text-2xl font-extrabold text-slate-800 leading-tight">
                    {bestOPD.total_skor.toFixed(2)}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5" title={bestOPD.nama_opd}>
                    {bestOPD.nama_opd}
                  </p>
                </div>
              </div>
            ) : null}

            <div className="h-px bg-slate-100 md:w-full"></div>

            {/* Worst OPD Highlight */}
            {worstOPD ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-400">Peringkat Terbawah</span>
                  <h4 className="font-display text-2xl font-extrabold text-slate-800 leading-tight">
                    {worstOPD.total_skor.toFixed(2)}
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5" title={worstOPD.nama_opd}>
                    {worstOPD.nama_opd}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 flex flex-col">
          <div className="mb-4">
            <h3 className="font-display text-sm font-bold text-slate-800">Distribusi Kategori</h3>
            <p className="text-[11px] text-slate-400 font-medium">Berdasarkan klasifikasi disiplin presensi</p>
          </div>
          <div className="flex-grow min-h-[220px] flex items-center justify-center">
            <ReactECharts option={pieOption} style={{ height: "240px", width: "100%" }} />
          </div>
        </div>
      </div>

      {/* Pelayanan Publik Utama Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col">
        <div className="mb-6 flex items-center gap-2">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-slate-800">Pelayanan Publik Utama</h3>
            <p className="text-[11px] text-slate-400 font-medium">Pemantauan disiplin instansi garis depan pelayanan masyarakat</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {publicServices.length > 0 ? (
            publicServices.map((r) => {
              // Determine bar color based on score
              let barColor = "bg-red-500";
              if (r.total_skor >= 90) barColor = "bg-green-600";
              else if (r.total_skor >= 80) barColor = "bg-emerald-500";
              else if (r.total_skor >= 70) barColor = "bg-amber-500";

              return (
                <div key={r.kode_opd} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/30 flex flex-col justify-between space-y-3">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-700 truncate" title={r.nama_opd}>
                      {r.nama_opd}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">Peringkat #{r.rank}</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-lg font-extrabold text-slate-800">{r.total_skor.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${katColor(r.kategori)}`}>
                        {katLabel(r.kategori)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${r.total_skor}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-slate-400 text-xs py-8">
              Tidak ada data pelayanan publik
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
