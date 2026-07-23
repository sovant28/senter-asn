"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { fetchRanking } from "@/lib/api";
import { LayoutDashboard, Upload, FileText, LogOut, TrendingUp, Users, AlertTriangle, Award, Shield, Calculator } from "lucide-react";
import ReactECharts from "echarts-for-react";
import Link from "next/link";

interface Ranking {
  rank: number;
  nama_opd: string;
  kode_opd: string;
  total_skor: number;
  kategori: string;
}

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) {
      fetchRanking(2026, 5).then((d) => setRankings(d.rankings)).catch(console.error).finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">Memuat...</div>;
  if (!user) return null;

  const dist: Record<string, number> = { SANGAT_DISIPLIN: 0, DISIPLIN: 0, CUKUP: 0, KURANG: 0 };
  rankings.forEach((r) => { if (r.kategori in dist) dist[r.kategori]++; });
  const avgSkor = rankings.length > 0 ? rankings.reduce((s, r) => s + r.total_skor, 0) / rankings.length : 0;

  const pieOption = {
    tooltip: { trigger: "item" as const },
    legend: { orient: "vertical" as const, left: "left", top: 10 },
    series: [{
      name: "Kategori", type: "pie", radius: ["50%", "75%"],
      data: [
        { value: dist.SANGAT_DISIPLIN, name: "Sangat Disiplin", itemStyle: { color: "#15803d" } },
        { value: dist.DISIPLIN, name: "Disiplin", itemStyle: { color: "#22c55e" } },
        { value: dist.CUKUP, name: "Cukup", itemStyle: { color: "#eab308" } },
        { value: dist.KURANG, name: "Kurang", itemStyle: { color: "#dc2626" } },
      ],
      label: { show: false },
    }],
  };

  const barOption = {
    tooltip: { trigger: "axis" as const },
    grid: { left: 120, right: 30, top: 10, bottom: 20 },
    xAxis: { type: "value" as const, max: 100, axisLabel: { fontSize: 10 } },
    yAxis: { type: "category" as const, data: rankings.slice(0, 10).map((r) => r.nama_opd.substring(0, 25)), axisLabel: { fontSize: 9 }, inverse: true },
    series: [{
      type: "bar", data: rankings.slice(0, 10).map((r) => r.total_skor),
      itemStyle: {
        color: (params: { dataIndex: number }) => {
          const kategories = rankings.slice(0, 10).map((r) => r.kategori);
          const colors: Record<string, string> = { SANGAT_DISIPLIN: "#15803d", DISIPLIN: "#22c55e", CUKUP: "#eab308", KURANG: "#dc2626" };
          return colors[kategories[params.dataIndex]] || "#6b7280";
        },
      },
      label: { show: true, position: "right" as const, fontSize: 10, formatter: "{c}" },
    }],
  };

  const katColor = (kat: string) => ({
    SANGAT_DISIPLIN: "bg-green-700 text-white", DISIPLIN: "bg-green-500 text-white",
    CUKUP: "bg-yellow-400 text-black", KURANG: "bg-red-600 text-white",
  })[kat] || "bg-gray-400 text-white";

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" /><span className="font-bold">SENTER ASN</span>
          <span className="text-blue-300 text-xs ml-2">BKPSDM Tana Toraja</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200">{user.nama_lengkap} ({user.role})</span>
          <button onClick={logout} className="flex items-center gap-1 text-sm text-blue-200 hover:text-white"><LogOut className="w-4 h-4" /> Keluar</button>
        </div>
      </nav>
      <div className="flex gap-2 px-6 py-3 bg-white border-b">
        <Link href="/dashboard" className="flex items-center gap-1 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium"><LayoutDashboard className="w-4 h-4" /> Dashboard</Link>
        <Link href="/upload" className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"><Upload className="w-4 h-4" /> Upload</Link>
        <Link href="/reports" className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"><FileText className="w-4 h-4" /> Laporan PDF</Link>
        <Link href="/perhitungan" className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"><Calculator className="w-4 h-4" /> Metode</Link>
      </div>
      <main className="max-w-7xl mx-auto px-6 py-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Dashboard — Mei 2026</h2>
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { icon: Users, label: "Total OPD", value: rankings.length, color: "bg-blue-100 text-blue-800" },
            { icon: Award, label: "Rata-rata Skor", value: avgSkor.toFixed(1), color: "bg-green-100 text-green-800" },
            { icon: TrendingUp, label: "Sangat Disiplin", value: dist.SANGAT_DISIPLIN, color: "bg-emerald-100 text-emerald-800" },
            { icon: AlertTriangle, label: "Perlu Pembinaan", value: dist.KURANG, color: "bg-red-100 text-red-800" },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-xs border">
              <div className="flex items-center gap-2 mb-2"><div className={`p-2 rounded-lg ${card.color}`}><card.icon className="w-4 h-4" /></div><span className="text-xs text-gray-500">{card.label}</span></div>
              <span className="text-2xl font-bold">{card.value}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-xs border"><h3 className="font-semibold text-gray-800 mb-2">Distribusi Kategori</h3><ReactECharts option={pieOption} style={{ height: 220 }} /></div>
          <div className="bg-white rounded-xl p-4 shadow-xs border"><h3 className="font-semibold text-gray-800 mb-2">Top 10 OPD</h3><ReactECharts option={barOption} style={{ height: 280 }} /></div>
        </div>
        <div className="bg-white rounded-xl shadow-xs border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-blue-900 text-white">
              <tr><th className="px-4 py-3 text-left">Rank</th><th className="px-4 py-3 text-left">Nama OPD</th><th className="px-4 py-3 text-right">Total Skor</th><th className="px-4 py-3 text-center">Kategori</th></tr>
            </thead>
            <tbody>
              {rankings.map((r, i) => (
                <tr key={r.kode_opd} className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="px-4 py-2.5 font-medium">{r.rank}</td><td className="px-4 py-2.5">{r.nama_opd}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{r.total_skor.toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${katColor(r.kategori)}`}>{r.kategori.replace(/_/g, " ")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
