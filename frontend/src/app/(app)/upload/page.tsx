"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { uploadExcel, runAnalytics, fetchOpdUploadStatus } from "@/lib/api";
import {
  FileUp,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface UploadResult {
  status: string;
  summary?: {
    total_rows?: number;
    success?: number;
    errors?: number;
    warnings?: number;
  };
  errors?: Array<{
    row: number;
    reason: string;
  }>;
}

export default function UploadPage() {
  const { user, loading: authLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [runningAnalytics, setRunningAnalytics] = useState(false);
  const [analyticsDone, setAnalyticsDone] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen text-slate-400 font-semibold text-sm">Memuat...</div>;
  }
  if (!user) return null;

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError("");
    setResult(null);
    try {
      const data = await uploadExcel(file);
      setResult(data);
      setRefreshKey((k) => k + 1);
      if ((data.summary?.errors || 0) > 0 || (data.summary?.success || 0) === 0) {
        setError(`Proses upload selesai dengan ${data.summary?.errors || 0} kesalahan. Periksa detail di bawah.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Proses upload gagal";
      if (msg.includes("401")) {
        setError("Sesi login telah berakhir. Silakan login ulang.");
        router.push("/login");
      } else {
        setError(`Gagal mengunggah file: ${msg}`);
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalytics() {
    setRunningAnalytics(true);
    try {
      await runAnalytics(2026, 6);
      setAnalyticsDone(true);
      setRefreshKey((k) => k + 1);
    } catch {
      setError("Gagal menjalankan mesin kalkulasi. Coba jalankan secara manual.");
    } finally {
      setRunningAnalytics(false);
    }
  }

  return (
    <div className="space-y-8 w-full">
      {/* ===== HEADER ===== */}
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 leading-tight">Upload Presensi Excel</h2>
        <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">
          Unggah berkas laporan presensi bulanan (format SIMPEGNAS). Data OPD dan kepegawaian akan diidentifikasi secara otomatis.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-4 rounded-2xl flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* ===== MAIN UPLOAD CARD ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
        {uploading ? (
          <div className="py-8 space-y-4">
            <Loader2 className="w-12 h-12 text-teal-600 animate-spin mx-auto" />
            <div>
              <p className="text-slate-700 font-bold text-sm">Mengunggah dan memproses dokumen...</p>
              <p className="text-xs text-slate-400 mt-1">
                {file?.name} ({file?.size && file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${((file?.size || 0) / 1024).toFixed(0)} KB`})
              </p>
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto leading-relaxed">
              Koneksi sedang mengirimkan data. Proses pemetaan database kepegawaian dapat memakan waktu 1–2 menit untuk dokumen berukuran besar.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-6">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                <FileUp className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Unggah Laporan Baru</h4>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Pilih dokumen Excel presensi (.xlsx)</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/40 text-center">
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null);
                  setResult(null);
                  setError("");
                }}
                className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100/50 file:cursor-pointer cursor-pointer"
              />
              {file && (
                <div className="mt-3 text-xs font-semibold text-slate-700 bg-white p-2 rounded-lg border border-slate-100 truncate">
                  Dokumen terpilih: {file.name}
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={!file}
              className="w-full py-2.5 bg-primary-dark text-white rounded-xl hover:bg-primary transition disabled:opacity-50 text-xs font-bold"
            >
              Upload & Proses Berkas
            </button>
          </div>
        )}

        {/* ===== RESULTS ACCORDION PANEL ===== */}
        {result && (
          <div className="w-full text-left mt-8 p-5 bg-slate-50/50 rounded-2xl border border-slate-200/60 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
              <h4 className="font-display text-sm font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Hasil Impor Data
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${result.status === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"}`}>
                  {result.status === "success" ? "Sukses" : result.status}
                </span>
              </h4>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-slate-600">
              <div className="bg-white p-3 rounded-xl border border-slate-200/40">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Total Baris</span>
                <span className="text-slate-800 font-bold text-sm">{String(result.summary?.total_rows || 0)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/40">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Sukses Impor</span>
                <span className="text-green-600 font-bold text-sm">{String(result.summary?.success || 0)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/40">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Baris Gagal</span>
                <span className="text-red-600 font-bold text-sm">{String(result.summary?.errors || 0)}</span>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200/40">
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Peringatan</span>
                <span className="text-amber-600 font-bold text-sm">{String(result.summary?.warnings || 0)}</span>
              </div>
            </div>

            {Array.isArray(result.errors) && result.errors.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-red-600 cursor-pointer hover:underline font-bold">
                  Tampilkan {result.errors.length} kesalahan deteksi baris
                </summary>
                <div className="mt-2 max-h-40 overflow-y-auto text-xs text-slate-600 space-y-1 pr-2">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <div key={i} className="bg-red-50/50 p-2 rounded-lg border border-red-100/60 font-medium">
                      Baris {String(e.row)}: {String(e.reason)}
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Run Analytics Button */}
            <div className="mt-4 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <h5 className="text-xs font-bold text-slate-700">Kalkulasi Agregasi Kinerja</h5>
                <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                  Lakukan kalkulasi agar data bulanan dari berkas excel ini terdistribusi ke Dashboard dan Laporan PDF.
                </p>
              </div>
              <div>
                {analyticsDone ? (
                  <p className="text-xs text-green-600 flex items-center gap-1.5 font-bold">
                    <CheckCircle className="w-4 h-4" /> Kalkulasi Selesai! — <Link href="/dashboard" className="underline hover:text-green-700 flex items-center gap-0.5">Ke Dashboard <ArrowRight className="w-3.5 h-3.5" /></Link>
                  </p>
                ) : (
                  <button
                    onClick={handleAnalytics}
                    disabled={runningAnalytics}
                    className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {runningAnalytics ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Menghitung Kinerja...</>
                    ) : (
                      "Jalankan Kalkulasi Disiplin"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== PANEL KONTROL KELENGKAPAN UPLOAD OPD ===== */}
      <OpdUploadControlPanel refreshKey={refreshKey} />
    </div>
  );
}

function OpdUploadControlPanel({ refreshKey }: { refreshKey: number }) {
  const [tahun, setTahun] = useState(2026);
  const [bulan, setBulan] = useState(6);
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState<any>(null);
  const [filterTab, setFilterTab] = useState<"ALL" | "SUDAH" | "BELUM">("ALL");

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchOpdUploadStatus(tahun, bulan);
      setStatusData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [tahun, bulan]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus, refreshKey]);

  const summary = statusData?.summary || { total_opd: 26, sudah_upload: 0, belum_upload: 26, persentase_kelengkapan: 0 };
  const opdList = statusData?.opd_list || [];

  const filteredOpds = opdList.filter((item: any) => {
    if (filterTab === "SUDAH") return item.status === "SUDAH_UPLOAD";
    if (filterTab === "BELUM") return item.status === "BELUM_UPLOAD";
    return true;
  });

  const MONTH_NAMES = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="font-display text-lg font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-teal-600" />
            Panel Kontrol Checklist Upload (26 OPD)
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pantau OPD mana saja yang sudah/belum mengunggah berkas presensi untuk mencegah keterlambatan dan tumpang tindih data.
          </p>
        </div>

        {/* Periode Selector */}
        <div className="flex items-center gap-2">
          <select
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/60">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target OPD</span>
          <span className="text-slate-800 font-extrabold text-xl">{summary.total_opd} OPD</span>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Sudah Upload</span>
          <span className="text-emerald-700 font-extrabold text-xl">{summary.sudah_upload} OPD</span>
        </div>
        <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
          <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block mb-1">Belum Upload</span>
          <span className="text-rose-700 font-extrabold text-xl">{summary.belum_upload} OPD</span>
        </div>
        <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
          <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block mb-1">Kelengkapan</span>
          <span className="text-teal-800 font-extrabold text-xl">{summary.persentase_kelengkapan}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-slate-600">Progres Kelengkapan Data {MONTH_NAMES[bulan - 1]} {tahun}</span>
          <span className="text-teal-700">{summary.sudah_upload} dari {summary.total_opd} OPD</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-600 rounded-full transition-all duration-500"
            style={{ width: `${summary.persentase_kelengkapan}%` }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filterTab === "ALL" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Semua ({summary.total_opd})
          </button>
          <button
            onClick={() => setFilterTab("SUDAH")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filterTab === "SUDAH" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Sudah Upload ({summary.sudah_upload})
          </button>
          <button
            onClick={() => setFilterTab("BELUM")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${filterTab === "BELUM" ? "bg-rose-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
          >
            Belum Upload ({summary.belum_upload})
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-semibold text-xs flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
          Memuat daftar kontrol OPD...
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 text-center w-12">No</th>
                <th className="px-4 py-3">Nama Instansi / OPD</th>
                <th className="px-4 py-3 text-center">Status Upload</th>
                <th className="px-4 py-3 text-center">Jumlah Pegawai</th>
                <th className="px-4 py-3 text-center">Total Skor</th>
                <th className="px-4 py-3 text-center">Kategori</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOpds.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-semibold">
                    Tidak ada OPD dalam kategori filter ini.
                  </td>
                </tr>
              ) : (
                filteredOpds.map((item: any, idx: number) => (
                  <tr key={item.opd_id} className="hover:bg-slate-50/60 transition">
                    <td className="px-4 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-slate-800">{item.nama_opd}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        item.status === "SUDAH_UPLOAD"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === "SUDAH_UPLOAD" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        {item.status === "SUDAH_UPLOAD" ? "Sudah Upload" : "Belum Upload"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700">
                      {item.jumlah_asn > 0 ? `${item.jumlah_asn} ASN` : "-"}
                    </td>
                    <td className="px-4 py-3 text-center font-extrabold text-slate-800">
                      {item.total_skor !== null ? item.total_skor.toFixed(2) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center font-bold">
                      {item.kategori ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
                          {item.kategori}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
