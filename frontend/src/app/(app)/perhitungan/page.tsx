"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { fetchRanking, fetchOpdDetail } from "@/lib/api";
import {
  BookOpen,
  HelpCircle,
  ArrowRight,
  Activity,
} from "lucide-react";

interface Ranking {
  rank: number;
  opd_id: number;
  nama_opd: string;
  kode_opd: string;
  total_skor: number;
  kategori: string;
}

interface OpdDetail {
  nama_opd: string;
  kode_opd: string;
  komposisi: { pns: number; pppk: number; pppk_pw: number; jumlah: number };
  counter: {
    total_kewajiban_hadir: number;
    jumlah_hadir: number;
    jumlah_terlambat: number;
    jumlah_pulang_cepat: number;
    jumlah_tidak_hadir: number;
    jumlah_hadir_normal: number;
    hari_kerja: number;
  };
  persentase: { kehadiran: number; pelanggaran: number; hadir_efektif: number; ketidakhadiran: number };
  skor: { kehadiran: number; kepatuhan_jam_kerja: number; ketidakhadiran: number; hadir_efektif: number; total: number };
  kategori: string;
  ranking: { total_skor: number; kehadiran: number; pelanggaran: number };
}

const HARI_KERJA = 22;

const katLabel = (kat: string) =>
  ({
    SANGAT_DISIPLIN: "Sangat Disiplin",
    DISIPLIN: "Disiplin",
    CUKUP: "Cukup",
    KURANG: "Kurang",
  }[kat] || kat);

const katBadge = (kat: string) =>
  ({
    SANGAT_DISIPLIN: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DISIPLIN: "bg-green-50 text-green-700 border-green-200",
    CUKUP: "bg-amber-50 text-amber-600 border-amber-200",
    KURANG: "bg-red-50 text-red-600 border-red-200",
  }[kat] || "bg-slate-50 text-slate-600 border-slate-200");

export default function PerhitunganPage() {
  const { user, loading: authLoading } = useAuth();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [selectedOpd, setSelectedOpd] = useState<number | null>(null);
  const [detail, setDetail] = useState<OpdDetail | null>(null);
  const [tahun, setTahun] = useState(2026);
  const [bulan, setBulan] = useState(5);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionStep, setCorrectionStep] = useState("");
  const [correctionText, setCorrectionText] = useState("");
  const router = useRouter();

  // Handle Authentication and fetch Ranking list
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      const timer = setTimeout(() => {
        setLoading(true);
        fetchRanking(tahun, bulan)
          .then((d) => {
            const list = d.rankings || [];
            setRankings(list);
            if (list.length > 0) {
              setSelectedOpd((prev) => {
                if (prev && list.some((r: Ranking) => r.opd_id === prev)) return prev;
                return list[0].opd_id;
              });
            }
          })
          .catch(console.error)
          .finally(() => setLoading(false));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, router, tahun, bulan]);

  // Fetch detailed information for the selected OPD
  useEffect(() => {
    if (selectedOpd) {
      const timer = setTimeout(() => {
        setDetailLoading(true);
        setDetail(null);
        fetchOpdDetail(selectedOpd, tahun, bulan)
          .then(setDetail)
          .catch(console.error)
          .finally(() => setDetailLoading(false));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [selectedOpd, tahun, bulan]);

  if (authLoading || loading) {
    return <div className="flex items-center justify-center min-h-screen text-slate-400 font-semibold text-sm">Memuat...</div>;
  }
  if (!user) return null;

  const bulanNames = [
    "",
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const selectedRanking = rankings.find((r) => r.opd_id === selectedOpd);

  return (
    <div className="space-y-8 w-full">
      {/* ===== HEADER ===== */}
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 leading-tight">Metode Perhitungan Disiplin</h2>
        <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">
          Operasionalisasi pengukuran disiplin kerja kuantitatif berdasar ketentuan PP No. 94 Tahun 2021 tentang Disiplin PNS.
        </p>
      </div>

      {/* ===== SECTION 1: TEORI & BOBOT ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-800">Kerangka Pengukuran & Bobot Indikator</h3>
        </div>
        
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            Sistem <strong>Senter ASN</strong> menghitung tingkat disiplin OPD menggunakan metode penilaian kuantitatif
            berbasis bukti (evidence-based measurement). Penilaian mengacu pada pemenuhan kewajiban kehadiran dan ketaatan
            jam kerja ASN (PNS, PPPK, dan PPPK Paruh Waktu) selama satu bulan penuh.
          </p>
          <p>
            Total skor dihitung menggunakan pembobotan atas <strong>4 Indikator Utama</strong> dengan distribusi sebagai berikut:
          </p>
        </div>

        {/* Weights Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 text-center">
            <span className="text-xs font-bold text-slate-400 block">Kehadiran</span>
            <span className="font-display text-xl font-extrabold text-teal-800 mt-1 block">25%</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 text-center">
            <span className="text-xs font-bold text-slate-400 block">Kepatuhan Jam</span>
            <span className="font-display text-xl font-extrabold text-teal-800 mt-1 block">20%</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 text-center">
            <span className="text-xs font-bold text-slate-400 block">Absensi</span>
            <span className="font-display text-xl font-extrabold text-teal-800 mt-1 block">15%</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-200/60 text-center">
            <span className="text-xs font-bold text-slate-400 block">Hadir Efektif</span>
            <span className="font-display text-xl font-extrabold text-teal-800 mt-1 block">40%</span>
          </div>
        </div>

        <div className="bg-teal-50/40 border border-teal-100 rounded-2xl p-4 text-xs text-teal-800 leading-relaxed">
          <strong>Hadir Efektif (Bobot 40%)</strong> memiliki porsi terbesar karena mengukur kedisiplinan murni — 
          yaitu persentase hari di mana pegawai hadir bekerja penuh tanpa melakukan keterlambatan maupun pulang cepat.
        </div>
      </div>

      {/* ===== SECTION 2: FORMULASI PERHITUNGAN ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-800">Formulasi Perhitungan</h3>
        </div>

        {/* Definisi Istilah Kunci */}
        <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5 space-y-3.5">
          <h4 className="font-bold text-slate-800 text-sm">Definisi Istilah & Variabel Utama:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-slate-700 block">1. Hadir Fisik</span>
              <p className="text-slate-500 leading-relaxed">
                Total hari kerja di mana pegawai melakukan perekaman masuk di kantor, tanpa memedulikan apakah dia datang terlambat atau pulang mendahului jam kerja.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-teal-800 block">2. Hadir Normal (Hadir Bersih)</span>
              <p className="text-slate-500 leading-relaxed">
                Total hari kehadiran murni yang tertib, di mana pegawai masuk tepat waktu DAN pulang sesuai jam kerja (bebas dari segala catatan keterlambatan atau pulang cepat).
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-700 block">3. Kewajiban Hadir (K)</span>
              <p className="text-slate-500 leading-relaxed">
                Akumulasi hari kerja wajib seluruh pegawai dalam suatu instansi selama satu bulan (Jumlah Pegawai x Hari Kerja Dinas/OPD).
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-700 block">4. Pelanggaran Jam Kerja</span>
              <p className="text-slate-500 leading-relaxed">
                Total kejadian keterlambatan (TM) atau pulang sebelum waktunya (PC) yang terdeteksi selama periode berjalan.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 text-sm">
          {/* Formula 1 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-700 text-sm">1. Total Kewajiban Hadir</h4>
            <p className="text-slate-500 leading-relaxed">
              Menghitung akumulasi kewajiban hadir kerja seluruh pegawai dalam satu bulan (ditentukan secara dinamis per instansi, contoh: 22 hari atau 16 hari).
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-semibold text-slate-800">
              Kewajiban Hadir = Jumlah ASN x Hari Kerja Dinas/OPD
            </div>
          </div>

          {/* Formula 2 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-700 text-sm">2. Persentase Kehadiran Fisik</h4>
            <p className="text-slate-500 leading-relaxed">
              Rasio kehadiran fisik pegawai di kantor dibanding total kewajiban hadir, tanpa memedulikan pelanggaran jam kerja.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-semibold text-slate-800">
              Persentase Kehadiran = (Total Hari Kehadiran / Kewajiban Hadir) x 100%
            </div>
          </div>

          {/* Formula 3 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-700 text-sm">3. Persentase Kepatuhan Jam Kerja</h4>
            <p className="text-slate-500 leading-relaxed">
              Tingkat kepatuhan masuk dan pulang tepat waktu. Dihitung dengan mengurangi nilai murni (100) dengan persentase pelanggaran (Terlambat & Pulang Cepat).
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-semibold text-slate-800">
              Persentase Kepatuhan = 100 - ((Total Hari Terlambat + Pulang Cepat) / Kewajiban Hadir) x 100
            </div>
          </div>

          {/* Formula 4 */}
          <div className="space-y-1.5">
            <h4 className="font-bold text-slate-700 text-sm">4. Persentase Hadir Efektif</h4>
            <p className="text-slate-500 leading-relaxed">
              Tingkat kehadiran murni pegawai yang masuk tepat waktu dan pulang tepat waktu (Hadir Normal).
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-semibold text-slate-800">
              Persentase Hadir Efektif = (Total Hari Hadir Normal / Kewajiban Hadir) x 100%
            </div>
          </div>

          {/* Formula Final */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-700 text-sm">5. Formula Total Skor Akhir</h4>
            <p className="text-slate-500 leading-relaxed">
              Menggabungkan hasil kali persentase murni masing-masing indikator dengan bobot yang telah ditetapkan.
            </p>
            <div className="bg-teal-900 text-teal-100 p-5 rounded-2xl font-semibold leading-relaxed space-y-2">
              <div className="text-teal-400 font-bold text-xs">{"// Formula Skor Disiplin Akhir"}</div>
              <div className="text-sm sm:text-base">Skor Akhir = (Persentase Kehadiran x 25%) + (Persentase Kepatuhan x 20%) + (Persentase Absensi x 15%) + (Persentase Hadir Efektif x 40%)</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SECTION 3: SIMULATOR KASUS OPD (SIMULASI DIBAWAH FORMULA) ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-800">Simulator Kasus OPD</h3>
            <p className="text-xs text-slate-400 font-semibold">Gunakan simulator ini untuk membedah skor dan menanggapi protes Kepala OPD.</p>
          </div>
        </div>

        {/* Filter Selector */}
        <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs font-bold text-slate-400 block mb-1">Tahun</label>
              <select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-primary"
              >
                {[2024, 2025, 2026].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-xs font-bold text-slate-400 block mb-1">Bulan</label>
              <select
                value={bulan}
                onChange={(e) => setBulan(Number(e.target.value))}
                className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-primary"
              >
                {bulanNames.slice(1).map((name, i) => (
                  <option key={i} value={i + 1}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 sm:flex-[3]">
              <label className="text-xs font-bold text-slate-400 block mb-1">Pilih Dinas/Badan (OPD)</label>
              <select
                value={selectedOpd || ""}
                onChange={(e) => setSelectedOpd(Number(e.target.value))}
                className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-primary"
              >
                {rankings.map((r) => (
                  <option key={r.opd_id} value={r.opd_id}>
                    #{r.rank} {r.nama_opd} (Skor: {r.total_skor.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Simulation Steps Output */}
        {detailLoading && (
          <div className="text-center py-12 text-slate-400 text-sm font-medium">
            <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3" />
            Mengkalkulasi ulang data presensi...
          </div>
        )}

        {detail && selectedRanking && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/60 bg-slate-50/50">
              <div>
                <h4 className="text-sm font-bold text-slate-800">{detail.nama_opd}</h4>
                <span className="text-xs text-slate-400 font-semibold">Peringkat #{detail.ranking.total_skor}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${katBadge(detail.kategori)}`}>
                {katLabel(detail.kategori)}
              </span>
            </div>

            {/* Stepped breakdown */}
            <div className="space-y-6 text-sm">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">1</div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 block">Kewajiban Hadir</span>
                  <p className="font-semibold text-slate-700 text-sm">
                    {detail.komposisi.jumlah} ASN x {detail.counter.hari_kerja} Hari Kerja = <span className="text-teal-700">{detail.counter.total_kewajiban_hadir} Hari</span>
                  </p>
                  <span className="text-xs text-slate-400 block font-medium">({detail.komposisi.pns} PNS, {detail.komposisi.pppk} PPPK, {detail.komposisi.pppk_pw} PPPK PW)</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">2</div>
                <div className="space-y-1.5 w-full">
                  <span className="text-xs font-bold text-slate-400 block">Data Agregasi Mentah</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 text-xs font-semibold text-slate-600">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Hadir Fisik: <span className="text-slate-800 block font-bold text-sm mt-0.5">{detail.counter.jumlah_hadir} hr</span></div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Hadir Normal: <span className="text-teal-700 block font-bold text-sm mt-0.5">{detail.counter.jumlah_hadir_normal} hr</span></div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Terlambat: <span className="text-slate-800 block font-bold text-sm mt-0.5">{detail.counter.jumlah_terlambat} kali</span></div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Pulang Cepat: <span className="text-slate-800 block font-bold text-sm mt-0.5">{detail.counter.jumlah_pulang_cepat} kali</span></div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">Tidak Hadir: <span className="text-red-600 block font-bold text-sm mt-0.5">{detail.counter.jumlah_tidak_hadir} hr</span></div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">3</div>
                <div className="space-y-2 w-full">
                  <span className="text-xs font-bold text-slate-400 block">Nilai Persentase Murni</span>
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-3.5 text-slate-650 font-medium">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
                      <span>Persentase Kehadiran:</span>
                      <span className="text-slate-800">({detail.counter.jumlah_hadir} / {detail.counter.total_kewajiban_hadir}) x 100% = <span className="font-bold">{detail.persentase.kehadiran.toFixed(2)}%</span></span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 text-teal-850">
                      <span>Persentase Hadir Efektif:</span>
                      <span className="text-teal-700">({detail.counter.jumlah_hadir_normal} / {detail.counter.total_kewajiban_hadir}) x 100% = <span className="font-bold">{detail.persentase.hadir_efektif.toFixed(2)}%</span></span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5">
                      <span>Persentase Pelanggaran Jam:</span>
                      <span className="text-slate-800">(({detail.counter.jumlah_terlambat} + {detail.counter.jumlah_pulang_cepat}) / {detail.counter.total_kewajiban_hadir}) x 100% = <span className="font-bold">{detail.persentase.pelanggaran.toFixed(2)}%</span></span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 text-red-800">
                      <span>Persentase Ketidakhadiran:</span>
                      <span className="text-red-600">({detail.counter.jumlah_tidak_hadir} / {detail.counter.total_kewajiban_hadir}) x 100% = <span className="font-bold">{detail.persentase.ketidakhadiran.toFixed(2)}%</span></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">4</div>
                <div className="space-y-2 w-full">
                  <span className="text-xs font-bold text-slate-400 block">Kalkulasi Bobot & Skor Akhir</span>
                  <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-2.5 text-slate-600 font-medium">
                    <div className="flex justify-between"><span>Kehadiran (25%):</span> <span>{detail.persentase.kehadiran.toFixed(2)} x 0.25 = {detail.skor.kehadiran.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Kepatuhan Jam (20%):</span> <span>(100 - {detail.persentase.pelanggaran.toFixed(2)}) x 0.20 = {detail.skor.kepatuhan_jam_kerja.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Absensi (15%):</span> <span>(100 - {detail.persentase.ketidakhadiran.toFixed(2)}) x 0.15 = {detail.skor.ketidakhadiran.toFixed(2)}</span></div>
                    <div className="flex justify-between font-semibold text-teal-800"><span>Hadir Efektif (40%):</span> <span>{detail.persentase.hadir_efektif.toFixed(2)} x 0.40 = {detail.skor.hadir_efektif.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-slate-850 border-t border-slate-200 pt-3 mt-3 text-sm">
                      <span>Total Skor Akhir:</span>
                      <span className="text-teal-700 text-lg font-extrabold">{detail.skor.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== SECTION 4: KOREKSI / UMPAN BALIK FORM (DI PALING BAWAH) ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => {
            setShowCorrection(!showCorrection);
            if (showCorrection) {
              setCorrectionStep("");
              setCorrectionText("");
            }
          }}
          className="w-full px-6 py-4 text-left text-sm font-bold text-slate-500 hover:bg-slate-50/50 flex items-center justify-between transition-colors"
        >
          <span className="flex items-center gap-2">
            <span className={`text-[9px] transition-transform duration-200 ${showCorrection ? "rotate-90" : ""}`}>▶</span>
            Pengajuan Peninjauan Kembali / Koreksi Rumus Presensi
          </span>
          <span className="text-xs text-slate-400 font-bold">Tampilkan Formulir</span>
        </button>
        {showCorrection && (
          <div className="bg-slate-50/30 border-t border-slate-200 p-6 space-y-4">
            <p className="text-sm text-slate-500 leading-relaxed">
              Jika Anda menemukan ketidaksesuaian parameter perhitungan (seperti perubahan jumlah hari kerja efektif daerah, 
              penyesuaian bobot indikator, atau koreksi data murni), silakan isi pengajuan di bawah ini.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">Langkah / Bagian yang Dikoreksi</label>
                <select
                  value={correctionStep}
                  onChange={(e) => setCorrectionStep(e.target.value)}
                  className="w-full text-sm font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-primary"
                >
                  <option value="">— Pilih langkah —</option>
                  <option value="kewajiban">1. Total Kewajiban Hadir</option>
                  <option value="agregasi">2. Agregasi Data Mentah</option>
                  <option value="persentase">3. Nilai Persentase Murni</option>
                  <option value="bobot">4. Kalkulasi Bobot & Skor</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Deskripsi Penyesuaian Rumus</label>
              <textarea
                rows={3}
                value={correctionText}
                onChange={(e) => setCorrectionText(e.target.value)}
                placeholder="Contoh: Selama masa libur lebaran, jumlah hari kerja K diubah dari 22 menjadi 18 hari..."
                className="w-full text-sm px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 outline-none focus:border-primary resize-y"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCorrection(false);
                  setCorrectionStep("");
                  setCorrectionText("");
                }}
                className="px-4 py-2 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button className="px-4 py-2.5 text-sm font-bold text-white bg-primary-dark rounded-xl hover:bg-primary transition-colors flex items-center gap-1.5">
                Kirim Pengajuan <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
