"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  BookOpen,
  Target,
  Award,
  Cpu,
  Heart,
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
    <div className="space-y-8 w-full">
      {/* ===== HEADER ===== */}
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-800 leading-tight">Tentang Sistem SENTER ASN</h2>
        <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">
          Dokumentasi teknis, landasan teoritis, dan alur perancangan platform evaluasi disiplin terpadu BKPSDM Kabupaten Tana Toraja.
        </p>
      </div>

      {/* ===== CARD 1: LATAR BELAKANG ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-800">1. Latar Belakang</h3>
        </div>
        
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            Pengukuran kedisiplinan Aparatur Sipil Negara (ASN) merupakan salah satu pilar krusial dalam reformasi birokrasi dan peningkatan kualitas pelayanan publik. Selama ini, rekapitulasi data kehadiran dan kepatuhan jam kerja di tingkat Organisasi Perangkat Daerah (OPD) sering kali dilakukan secara manual menggunakan perangkat lunak spreadsheet konvensional.
          </p>
          <p>
            Pendekatan manual ini rentan terhadap beberapa kendala mendasar. Galat manusia (*human error*) berupa kesalahan penulisan NIP, inkonsistensi penulisan nama instansi, hingga rumus kalkulasi yang tidak seragam (seperti rentang penjumlahan total yang terpotong) sering kali menyebabkan deviasi nilai rekapitulasi. Di samping itu, ketiadaan standardisasi penghitungan hari kerja efektif bulanan memperlemah objektivitas hasil evaluasi disiplin kerja kuantitatif.
          </p>
          <p>
            Oleh karena itu, diperlukan sebuah platform berbasis web yang terintegrasi untuk mengotomatisasi pengolahan data mentah absensi secara objektif, transparan, dan dapat dipertanggungjawabkan sesuai dengan ketentuan regulasi kepegawaian yang berlaku.
          </p>
        </div>
      </div>

      {/* ===== CARD 2: TUJUAN ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <Target className="w-4 h-4" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-800">2. Tujuan</h3>
        </div>
        
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            Pengembangan sistem <strong>SENTER ASN</strong> diarahkan untuk mencapai sasaran-sasaran strategis berikut:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 font-medium">
            <li>
              <strong>Standardisasi Perhitungan:</strong> Menyatukan seluruh parameter evaluasi kehadiran dan kepatuhan jam kerja ASN di bawah satu mesin kalkulasi terpusat untuk meniadakan perbedaan versi perhitungan.
            </li>
            <li>
              <strong>Integritas dan Validasi Data:</strong> Mengeliminasi kesalahan penulisan identitas pegawai (NIP) dan OPD duplikat melalui modul pembersihan data otomatis saat berkas diunggah.
            </li>
            <li>
              <strong>Transparansi Penilaian:</strong> Menyajikan visualisasi skor yang dapat ditelusuri secara terperinci hingga ke level individu pegawai guna mencegah manipulasi nilai manual.
            </li>
            <li>
              <strong>Pendukung Keputusan Strategis:</strong> Membantu pimpinan daerah dan BKPSDM dalam mengidentifikasi OPD yang memerlukan pembinaan disiplin secara cepat dan akurat.
            </li>
          </ul>
        </div>
      </div>

      {/* ===== CARD 3: MANFAAT ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <Award className="w-4 h-4" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-800">3. Manfaat</h3>
        </div>
        
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            Kehadiran platform SENTER ASN memberikan kontribusi nyata bagi ekosistem birokrasi Kabupaten Tana Toraja:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-600 font-medium">
            <li>
              <strong>Bagi BKPSDM:</strong> Mempercepat proses kompilasi laporan bulanan dari hari ke menit, serta menjamin keabsahan data laporan disiplin sebelum diajukan ke pimpinan daerah.
            </li>
            <li>
              <strong>Bagi Pimpinan Daerah (Bupati &amp; Sekda):</strong> Memperoleh potret disiplin kerja instansi secara objektif berbasis bukti (*evidence-based*) sebagai basis pemberian penghargaan (*reward*) atau pembinaan (*punishment*).
            </li>
            <li>
              <strong>Bagi Administrator OPD:</strong> Mempermudah proses pengunggahan laporan bulanan dengan sistem pembersihan otomatis yang fleksibel terhadap perubahan penulisan kolom.
            </li>
            <li>
              <strong>Bagi Institusi Akademik &amp; Riset:</strong> Menjadi model rujukan penerapan teknologi informasi terapan dalam ranah tata kelola pemerintahan (e-Government).
            </li>
          </ul>
        </div>
      </div>

      {/* ===== CARD 4: DESKRIPSI SISTEM ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-800">4. Deskripsi Sistem &amp; Metodologi</h3>
        </div>

        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            SENTER ASN dikembangkan sebagai <strong>Decision Support System (DSS)</strong> atau Sistem Pendukung Keputusan (SPK) yang memadukan automasi pembersihan data mentah dengan pemodelan penilaian kuantitatif. Tiga pilar utama pengolahan data pada sistem ini meliputi:
          </p>
        </div>

        {/* Sub-Section: SAW */}
        <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5 space-y-4">
          <h4 className="font-bold text-slate-800 text-sm">A. Pemodelan Evaluasi dengan Simple Additive Weighting (SAW)</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Penentuan nilai disiplin akhir OPD menggunakan metode <strong>Simple Additive Weighting (SAW)</strong>, yaitu mencari penjumlahan terbobot dari rating kinerja alternatif pada seluruh kriteria penilaian benefit.
          </p>

          <div className="bg-slate-100/50 p-4 rounded-xl border border-slate-200/60 text-slate-800 text-center font-display py-3.5 flex items-center justify-center gap-1.5">
            <span className="font-extrabold text-base md:text-lg">V<sub>i</sub></span>
            <span className="font-extrabold text-base md:text-lg">=</span>
            <span className="text-xl md:text-2xl font-normal">∑</span>
            <span className="font-extrabold text-base md:text-lg">(w<sub>j</sub> × r<sub>ij</sub>)</span>
          </div>

          {/* Keterangan Notasi Matematika */}
          <div className="bg-slate-50/80 rounded-xl border border-slate-200/50 p-4 space-y-2 text-xs">
            <span className="font-bold text-slate-700 block">Keterangan Notasi:</span>
            <div className="space-y-1.5 text-slate-600 leading-relaxed pl-1 font-medium">
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0 w-8">V<sub>i</sub></span>
                <span>: Hasil preferensi akhir atau total skor kedisiplinan OPD ke-i.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0 w-8">w<sub>j</sub></span>
                <span>: Bobot kepentingan kriteria ke-j (yaitu C1 = 25%, C2 = 20%, C3 = 15%, C4 = 40%).</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0 w-8">r<sub>ij</sub></span>
                <span>: Rating kinerja atau persentase murni OPD ke-i pada kriteria ke-j.</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-slate-800 shrink-0 w-8">∑</span>
                <span>: Simbol penjumlahan untuk mengakumulasikan seluruh perkalian bobot dengan nilai kriteria.</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Sistem mengevaluasi empat kriteria utama:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <span className="font-bold text-slate-700 block">1. Persentase Kehadiran (C1 - Bobot 25%)</span>
              <p className="text-slate-500 leading-relaxed">
                Rasio total kehadiran fisik pegawai (termasuk toleransi dinas) terhadap kewajiban hari kerja.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-700 block">2. Nilai Kepatuhan Jam Kerja (C2 - Bobot 20%)</span>
              <p className="text-slate-500 leading-relaxed">
                Diukur berdasarkan ketiadaan pelanggaran keterlambatan masuk kerja dan pulang cepat.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-slate-700 block">3. Nilai Ketidakhadiran (C3 - Bobot 15%)</span>
              <p className="text-slate-500 leading-relaxed">
                Pengurangan nilai akibat alpa atau absen penuh tanpa keterangan sah.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-bold text-teal-800 block">4. Persentase Hadir Efektif (C4 - Bobot 40%)</span>
              <p className="text-slate-500 leading-relaxed">
                Menghitung total kehadiran bersih pegawai berstatus normal atau tugas resmi (Hadir Normal, Izin Dinas Luar, Dinas Luar, Cuti Tahunan/Sakit/Besar/Melahirkan).
              </p>
            </div>
          </div>

          <div className="bg-teal-900 text-teal-100 p-5 rounded-2xl font-semibold leading-relaxed space-y-2">
            <div className="text-teal-400 font-bold text-xs">{"// Formula Penilaian SAW (Preferensi Akhir)"}</div>
            <div className="text-sm sm:text-base flex items-center gap-1.5 font-mono">
              <span>Skor Akhir =</span>
              <span>(C1 × 25%)</span>
              <span>+</span>
              <span>(C2 × 20%)</span>
              <span>+</span>
              <span>(C3 × 15%)</span>
              <span>+</span>
              <span>(C4 × 40%)</span>
            </div>
          </div>
        </div>

        {/* Sub-Section: Modus */}
        <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5 space-y-3.5">
          <h4 className="font-bold text-slate-800 text-sm">B. Deteksi Dinamis Hari Kerja Kalender (Statistik Modus)</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Untuk memastikan keadilan perhitungan tanpa input manual, sistem secara otomatis mengkalkulasi jumlah hari kerja kalender menggunakan pendekatan statistik modus. Sistem menghitung akumulasi total baris kehadiran, dinas luar, cuti, dan izin sakit untuk setiap pegawai. Modus (nilai paling sering muncul) di antara ribuan baris data tersebut ditetapkan sebagai hari kerja dasar bulanan secara universal.
          </p>
        </div>

        {/* Sub-Section: Data Cleansing */}
        <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5 space-y-3.5">
          <h4 className="font-bold text-slate-800 text-sm">C. Pembersihan Data dan Penyelarasan Entitas</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Modul parsing file pada sistem secara aktif mendeteksi kesalahan ketik pada NIP pegawai dan melakukan pencocokan nama berbasis database master. Selain itu, sistem melakukan penyelarasan nama dinas (OPD) yang terpotong atau memiliki variasi penulisan sehingga data historis tersimpan secara konsisten.
          </p>
        </div>
      </div>

      {/* ===== CARD 5: UCAPAN TERIMA KASIH ===== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <Heart className="w-4 h-4" />
          </div>
          <h3 className="font-display text-base font-bold text-slate-800">5. Ucapan Terima Kasih</h3>
        </div>
        
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          <p>
            Penyelesaian pengembangan platform <strong>SENTER ASN</strong> ini tidak terlepas dari bimbingan, arahan, dan kontribusi dari berbagai pihak yang menaruh perhatian tinggi terhadap peningkatan kualitas manajemen aparatur sipil negara di daerah.
          </p>
          <p>
            Tim pengembang menyampaikan rasa terima kasih sebesar-besarnya kepada <strong>Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM) Kabupaten Tana Toraja</strong> atas penyediaan data training, masukan parameter kebijakan evaluasi disiplin kerja, serta kesempatan uji coba sistem. Terima kasih pula kami haturkan kepada para administrator kepegawaian OPD atas kontribusinya dalam proses perbaikan kualitas berkas unggahan, serta rekan-rekan peneliti yang telah meluangkan waktu memberikan masukan metodologi ilmiah.
          </p>
        </div>
      </div>

      {/* ===== CREDIT FOOTER ===== */}
      <div className="pt-4 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
        <span>Dibuat dengan</span>
        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
        <span>oleh Tim Pengembang SENTER ASN</span>
      </div>
    </div>
  );
}
