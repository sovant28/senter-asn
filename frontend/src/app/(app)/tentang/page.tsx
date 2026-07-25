"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Cpu, Heart } from "lucide-react";

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
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-12 text-slate-700 antialiased selection:bg-teal-100 selection:text-teal-905">
      {/* ===== HERO TITLE ===== */}
      <div className="space-y-4 border-b border-slate-100 pb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold uppercase tracking-wider">
          <Cpu className="w-3 h-3" /> Metodologi &amp; Spesifikasi
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
          Tentang Sistem SENTER ASN
        </h1>
        <p className="text-base text-slate-500 font-medium leading-relaxed max-w-2xl">
          Dokumentasi teknis, landasan teoritis, dan alur perancangan platform evaluasi disiplin terpadu BKPSDM Kabupaten Tana Toraja.
        </p>
      </div>

      {/* ===== LATAR BELAKANG ===== */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="text-teal-600">01.</span> Latar Belakang
        </h2>
        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
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
      </section>

      {/* ===== TUJUAN ===== */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="text-teal-600">02.</span> Tujuan
        </h2>
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
      </section>

      {/* ===== MANFAAT ===== */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="text-teal-600">03.</span> Manfaat
        </h2>
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
      </section>

      {/* ===== DESKRIPSI SISTEM & METODE ===== */}
      <section className="space-y-6">
        <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="text-teal-600">04.</span> Deskripsi Sistem &amp; Metodologi
        </h2>
        
        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            SENTER ASN dikembangkan sebagai <strong>Decision Support System (DSS)</strong> atau Sistem Pendukung Keputusan (SPK) yang memadukan automasi pembersihan data mentah dengan pemodelan penilaian kuantitatif. Tiga pilar utama pengolahan data pada sistem ini meliputi:
          </p>

          {/* Sub 1: SAW */}
          <div className="space-y-3 pt-2">
            <h3 className="font-display text-base font-bold text-slate-800">
              A. Pemodelan Evaluasi dengan Simple Additive Weighting (SAW)
              </h3>
            <p>
              Penentuan nilai disiplin akhir OPD menggunakan metode <strong>Simple Additive Weighting (SAW)</strong>, yaitu mencari penjumlahan terbobot dari rating kinerja alternatif pada seluruh kriteria penilaian benefit. Sistem mengevaluasi empat kriteria utama:
            </p>
            <ul className="list-decimal pl-5 space-y-1.5 font-medium text-slate-600">
              <li>
                <strong>Persentase Kehadiran (C1 - Bobot 25%):</strong> Rasio total kehadiran fisik pegawai (termasuk toleransi dinas) terhadap kewajiban hari kerja.
              </li>
              <li>
                <strong>Nilai Kepatuhan Jam Kerja (C2 - Bobot 20%):</strong> Diukur berdasarkan ketiadaan pelanggaran keterlambatan masuk kerja dan pulang cepat.
              </li>
              <li>
                <strong>Nilai Ketidakhadiran (C3 - Bobot 15%):</strong> Pengurangan nilai akibat alpa atau absen penuh tanpa keterangan sah.
              </li>
              <li>
                <strong>Persentase Hadir Efektif (C4 - Bobot 40%):</strong> Menghitung total kehadiran bersih pegawai berstatus normal atau tugas resmi (Hadir Normal, Izin Dinas Luar, Dinas Luar, Cuti Tahunan/Sakit/Besar/Melahirkan).
              </li>
            </ul>
            
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 font-display my-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rumus Evaluasi SAW</span>
              <div className="text-base font-extrabold text-slate-800 tracking-wide flex items-center gap-1">
                <span>V<sub>i</sub></span>
                <span>=</span>
                <span className="text-lg font-normal">∑</span>
                <span>(w<sub>j</sub> × r<sub>ij</sub>)</span>
              </div>
              <span className="text-[10px] text-slate-450 font-medium text-center">
                Skor Akhir = (0.25 × C1) + (0.20 × C2) + (0.15 × C3) + (0.40 × C4)
              </span>
            </div>
          </div>

          {/* Sub 2: Modus Hari Kerja */}
          <div className="space-y-3 pt-2">
            <h3 className="font-display text-base font-bold text-slate-800">
              B. Deteksi Dinamis Hari Kerja Kalender (Statistik Modus)
            </h3>
            <p>
              Untuk memastikan keadilan perhitungan tanpa input manual, sistem secara otomatis mengkalkulasi jumlah hari kerja kalender menggunakan pendekatan statistik modus. Sistem menghitung akumulasi total baris kehadiran, dinas luar, cuti, dan izin sakit untuk setiap pegawai. Modus (nilai paling sering muncul) di antara ribuan baris data tersebut ditetapkan sebagai hari kerja dasar bulanan secara universal.
            </p>
          </div>

          {/* Sub 3: Pembersihan Data */}
          <div className="space-y-3 pt-2">
            <h3 className="font-display text-base font-bold text-slate-800">
              C. Pembersihan Data dan Penyelarasan Entitas
            </h3>
            <p>
              Modul parsing file pada sistem secara aktif mendeteksi kesalahan ketik pada NIP pegawai dan melakukan pencocokan nama berbasis database master. Selain itu, sistem melakukan penyelarasan nama dinas (OPD) yang terpotong atau memiliki variasi penulisan sehingga data historis tersimpan secara konsisten.
            </p>
          </div>
        </div>
      </section>

      {/* ===== UCAPAN TERIMA KASIH ===== */}
      <section className="space-y-4 pt-4 border-t border-slate-100">
        <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span className="text-teal-600">05.</span> Ucapan Terima Kasih
        </h2>
        <div className="text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            Penyelesaian pengembangan platform <strong>SENTER ASN</strong> ini tidak terlepas dari bimbingan, arahan, dan kontribusi dari berbagai pihak yang menaruh perhatian tinggi terhadap peningkatan kualitas manajemen aparatur sipil negara di daerah.
          </p>
          <p>
            Tim pengembang menyampaikan rasa terima kasih sebesar-besarnya kepada <strong>Badan Kepegawaian dan Pengembangan Sumber Daya Manusia (BKPSDM) Kabupaten Tana Toraja</strong> atas penyediaan data training, masukan parameter kebijakan evaluasi disiplin kerja, serta kesempatan uji coba sistem. Terima kasih pula kami haturkan kepada para administrator kepegawaian OPD atas kontribusinya dalam proses perbaikan kualitas berkas unggahan, serta rekan-rekan peneliti yang telah meluangkan waktu memberikan masukan metodologi ilmiah.
          </p>
        </div>
      </section>

      {/* ===== CREDIT FOOTER ===== */}
      <div className="pt-8 border-t border-slate-100 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
        <span>Dibuat dengan</span>
        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
        <span>oleh Tim Pengembang SENTER ASN</span>
      </div>
    </div>
  );
}
