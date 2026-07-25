"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Code2,
  Cpu,
  Database,
  Calculator,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  Calendar,
  Lock,
  ChevronRight,
} from "lucide-react";

export default function TentangSistemPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-400 font-semibold text-sm">
        Memuat...
      </div>
    );
  }
  if (!user) return null;

  return (
    <div className="space-y-10 w-full pb-16">
      {/* ===== HERO HEADER ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 md:p-12 shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#0f766e,transparent_60%)] opacity-40" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" /> Core Engine SENTER ASN
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
            Transparansi &amp; Metodologi Sistem SENTER ASN
          </h2>
          <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed">
            Selamat datang di dalaman sistem <strong>SENTER ASN</strong> (Sistem Evaluasi Kinerja Terpadu ASN). 
            Halaman ini didedikasikan bagi para akademisi, penguji, dan birokrat untuk melihat secara transparan bagaimana data presensi diproses, dibersihkan dari galat manusia (*human error*), dan dihitung secara ilmiah.
          </p>
        </div>
      </div>

      {/* ===== METODE PENELITIAN: SAW (DECISION SUPPORT SYSTEM) ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-800 leading-snug">
              Metodologi SPK: Simple Additive Weighting (SAW)
            </h3>
            <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">
              Decision Support System (DSS) / Sistem Pendukung Keputusan (SPK)
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            SENTER ASN dirancang tidak sekadar untuk menampilkan angka mentah, melainkan bertindak sebagai <strong>Sistem Pendukung Keputusan (SPK)</strong>. 
            Sistem kami menerapkan metode <strong>Simple Additive Weighting (SAW)</strong> secara matematis untuk melakukan perangkingan tingkat disiplin seluruh OPD di Kabupaten Tana Toraja.
          </p>
          
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 max-w-2xl mx-auto text-center space-y-3 font-display">
            <div className="text-lg md:text-xl font-extrabold text-slate-800 tracking-wide py-2 flex items-center justify-center gap-1.5">
              <span>V<sub>i</sub></span>
              <span>=</span>
              <span className="text-xl md:text-2xl font-normal">∑</span>
              <span>(w<sub>j</sub> × r<sub>ij</sub>)</span>
            </div>
            <div className="text-xs text-slate-500 font-semibold leading-relaxed">
              Di mana <strong className="text-teal-700">w_j</strong> adalah bobot kriteria, dan <strong className="text-teal-700">r_ij</strong> adalah rating kinerja ternormalisasi dari alternatif (OPD) ke-i pada kriteria ke-j.
            </div>
          </div>

          <p>
            Karena rentang nilai kriteria di SENTER ASN adalah persentase (0% s.d. 100%) dan seluruh kriteria bersifat <strong>Benefit</strong> (semakin tinggi nilai semakin baik), maka normalisasi dapat dilakukan secara linier langsung dari nilai persentasenya.
          </p>
        </div>

        {/* Weights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-4">
          <div className="p-5 rounded-2xl bg-teal-50/30 border border-teal-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">Kriteria C1 (25%)</span>
              <h4 className="font-display font-extrabold text-slate-800 mt-1 leading-snug">Persentase Kehadiran</h4>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-medium">
              Dihitung dari rasio jumlah kehadiran riil pegawai terhadap total kewajiban hadir kalender.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-teal-50/30 border border-teal-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">Kriteria C2 (20%)</span>
              <h4 className="font-display font-extrabold text-slate-800 mt-1 leading-snug">Kepatuhan Jam Kerja</h4>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-medium">
              Ditentukan dari persentase pelanggaran keterlambatan (TM1-TM3, TMM, ITM) dan pulang cepat (PC1-PC3, PCM, IPC).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-teal-50/30 border border-teal-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">Kriteria C3 (15%)</span>
              <h4 className="font-display font-extrabold text-slate-800 mt-1 leading-snug">Nilai Ketidakhadiran</h4>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-medium">
              Diukur secara ketat berdasarkan ketidakhadiran tanpa keterangan (TK) maupun izin tidak masuk penuh (ITMPC).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-teal-50/30 border border-teal-100 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-widest block">Kriteria C4 (40%)</span>
              <h4 className="font-display font-extrabold text-slate-800 mt-1 leading-snug">Persentase Hadir Efektif</h4>
            </div>
            <p className="text-xs text-slate-500 mt-3 font-medium">
              Indikator dengan bobot tertinggi. Menghitung akumulasi kehadiran bersih pegawai berstatus normal atau tugas resmi (HN, IDL, DL, CT, CB, CS, CM, CKAP).
            </p>
          </div>
        </div>
      </div>

      {/* ===== KECERDASAN DETEKSI DATA & HARI KERJA DYNAMIC ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Card A: Deteksi Hari Kerja Statistik */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-800">Deteksi Dinamis Hari Kerja Kalender</h3>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed space-y-3">
              <p>
                Jumlah hari kerja efektif bervariasi setiap bulannya (misalnya Juni = 20 hari kerja). SENTER ASN tidak memaksa admin menginput hari kerja secara manual.
              </p>
              <p>
                Sistem kami menggunakan algoritma statistik <strong>Modus (Nilai Terbanyak)</strong>. Sistem menjumlahkan semua kehadiran, cuti, dinas luar, dan alpa untuk setiap baris pegawai:
              </p>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/50 text-xs font-semibold text-slate-500 space-y-1">
                <div className="flex justify-between">
                  <span>Pegawai A: Hadir (15) + Cuti (1) + DL (4)</span>
                  <span className="text-teal-700 font-bold">= 20 Hari</span>
                </div>
                <div className="flex justify-between">
                  <span>Pegawai B: Hadir Normal (20)</span>
                  <span className="text-teal-700 font-bold">= 20 Hari</span>
                </div>
                <div className="flex justify-between">
                  <span>Pegawai C: Hadir (18) + Alpa (2)</span>
                  <span className="text-teal-700 font-bold">= 20 Hari</span>
                </div>
              </div>
              <p>
                Nilai penjumlahan terpopuler di antara ribuan baris data akan dideteksi sebagai jumlah Hari Kerja Kalender, lalu secara otomatis diuji dan diseragamkan ke seluruh OPD aktif.
              </p>
            </div>
          </div>
        </div>

        {/* Card B: Intelligent Data Cleansing */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-display text-base font-bold text-slate-800">Pembersihan Data Otomatis</h3>
            </div>
            <div className="text-sm text-slate-600 leading-relaxed space-y-3">
              <p>
                Sistem absensi instansi di lapangan sering menghasilkan berkas Excel yang kotor. SENTER ASN memiliki modul kecerdasan pembersihan data (*data cleansing*):
              </p>
              <ul className="space-y-2.5 pt-1">
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Resolusi Typo NIP: Sistem mencocokkan secara fuzzy nama pegawai dengan database master jika terdeteksi kesalahan ketik NIP oleh admin.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Konsolidasi Duplikasi OPD: Otomatis memetakan singkatan nama OPD yang tidak seragam (misal: PM &amp; PTSP terpotong) ke data resmi BKPSDM.</span>
                </li>
                <li className="flex items-start gap-2.5 text-xs font-semibold text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Clean Overwrite Safeguard: Menghapus seluruh data mentah periode terkait sebelum ditimpa berkas revisi baru guna menghindari data yatim (*orphaned records*).</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* ===== MENGAPA WEBSITE LEBIH AKURAT DIBANDINGKAN EXCEL? ===== */}
      <div className="bg-amber-50/40 rounded-3xl border border-amber-200/80 p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3 pb-3 border-b border-amber-200">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-800">
              Studi Kasus: Mengapa Nilai Excel Sering Salah &amp; Website Senter ASN Benar?
            </h3>
            <p className="text-xs text-amber-800 font-bold uppercase mt-0.5">
              Fakta Integritas Data &amp; Truncation Error
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-3">
            <h4 className="font-display font-extrabold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-red-600" /> Masalah Truncation di Formula Excel Admin
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Sebagian besar berkas absensi mentah instansi menggunakan template formula total Hadir Normal (HN) yang terkunci di baris ke-36: <code className="font-mono text-amber-850 bg-amber-100/50 px-1.5 py-0.5 rounded font-bold">=SUM(D2:D36)</code> (karena meniru batas jumlah pegawai BKPSDM).
            </p>
            <p className="text-slate-600 leading-relaxed font-semibold">
              Akibatnya, dinas besar dengan pegawai &gt; 35 orang (seperti BPKPD yang memiliki 91 pegawai), data kehadiran seluruh pegawai dari baris 37 ke bawah terpotong dan TIDAK terhitung dalam total rekap manual Excel.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-display font-extrabold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Solusi Pengolahan Programmatik Website
            </h4>
            <p className="text-slate-600 leading-relaxed">
              SENTER ASN secara cerdas <strong>mengabaikan baris rumus total di Excel</strong>. Sistem membaca data mentah baris demi baris per pegawai secara dinamis hingga akhir data.
            </p>
            <p className="text-slate-600 leading-relaxed font-semibold">
              Kalkulasi agregat diolah di database secara transparan dan murni. Hal ini mencegah manipulasi nilai manual (<em>ditembak nilainya</em>) dan memastikan keadilan laporan kinerja OPD.
            </p>
          </div>
        </div>
      </div>

      {/* ===== TIM PENGEMBANG FOOTER ===== */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <h4 className="font-display font-extrabold text-slate-800 flex items-center justify-center md:justify-start gap-2">
            <Code2 className="w-5 h-5 text-teal-600" /> Salam Hangat dari Tim Pengembang
          </h4>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xl">
            Sistem SENTER ASN dibangun untuk menghadirkan akurasi penuh dan objektivitas data demi mewujudkan tata kelola kepegawaian Kabupaten Tana Toraja yang disiplin, bersih, dan berintegritas tinggi.
          </p>
        </div>
        <div className="flex gap-4 shrink-0">
          <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200 font-display text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Versi Sistem</span>
            <span className="text-sm font-extrabold text-teal-800 mt-0.5 block">v2.0 (Stable)</span>
          </div>
          <div className="px-5 py-3 rounded-2xl bg-white border border-slate-200 font-display text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Lisensi Data</span>
            <span className="text-sm font-extrabold text-teal-800 mt-0.5 block">BKPSDM Tana Toraja</span>
          </div>
        </div>
      </div>
    </div>
  );
}
