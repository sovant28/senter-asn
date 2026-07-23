# Module 05 — Dashboard (PWA)

> Tanggung jawab: Tampilan web interaktif untuk monitoring disiplin ASN, bisa diakses dari desktop & mobile (PWA).

---

## 🎯 Tujuan

Menyediakan interface yang:
1. **Executive-friendly** —一眼 lihat kondisi semua OPD
2. **Interaktif** — klik untuk drill-down
3. **Real-time** — data selalu update
4. **Mobile-friendly** — PWA, installable, offline-capable
5. **Multi-role** — different view untuk different role

---

## 📱 Pages & Routes

| Path | Page | Role | Deskripsi |
|------|------|------|-----------|
| `/login` | Login | All | Form login |
| `/` | Redirect | All | Auto-redirect sesuai role |
| `/dashboard` | Dashboard Eksekutif | Eksekutif, HR, Admin | Overview semua OPD |
| `/opd/[id]` | Detail OPD | All (filtered) | Detail 1 OPD |
| `/upload` | Upload Presensi | HR, Admin | Upload Excel |
| `/upload/history` | Riwayat Upload | HR, Admin | List upload sebelumnya |
| `/reports` | Laporan PDF | HR, Eksekutif | Generate & download PDF |
| `/employees` | Daftar Pegawai | HR, Admin | List 1000+ pegawai |
| `/admin/users` | User Management | Admin | CRUD user & role |
| `/admin/opd` | Master OPD | Admin | CRUD OPD |
| `/profile` | Profil Saya | All | Edit profil sendiri |
| `/settings` | Settings | All | Preferences |

---

## 🏗️ Implementasi

### Tech Stack
- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** (utility-first, responsive)
- **ShadCN/UI** (component library)
- **ECharts** (charts)
- **TanStack Query** (data fetching & caching)
- **Zustand** (client state, auth)
- **NextAuth.js** (auth)
- **next-pwa** (PWA manifest, service worker)

### Lokasi File
- `frontend/app/` — App Router pages
- `frontend/components/` — reusable components
- `frontend/lib/api.ts` — API client
- `frontend/lib/auth.ts` — auth helpers
- `frontend/lib/format.ts` — formatters (date, number, %)
- `frontend/public/manifest.json` — PWA manifest
- `frontend/public/sw.js` — service worker (auto-generated)

---

## 📊 Dashboard Eksekutif (`/dashboard`)

### Layout

```
┌────────────────────────────────────────────────────────┐
│  HEADER (sticky)                                       │
│  [Logo SENTER] [Periode: Mei 2026 ▼] [User] [Logout]  │
├────────────────────────────────────────────────────────┤
│  KPI CARDS (4 cards, 1 row)                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Total    │ │ Rata-rata│ │ OPD      │ │ OPD      │  │
│  │ ASN      │ │ Kehadiran│ │ Terbaik  │ │ Perlu    │  │
│  │ 1,042    │ │ 95.3%    │ │ 3        │ │ Pembinaa │  │
│  │          │ │          │ │          │ │ n: 5     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
├────────────────────────────────────────────────────────┤
│  MAIN CHARTS (2 columns)                               │
│  ┌──────────────────────┐ ┌──────────────────────┐    │
│  │ Ranking 26 OPD       │ │ Distribusi Kategori  │    │
│  │ (horizontal bar)     │ │ (donut chart)        │    │
│  │                      │ │                      │    │
│  └──────────────────────┘ └──────────────────────┘    │
├────────────────────────────────────────────────────────┤
│  TABEL RANKING (full width)                            │
│  Tabel interaktif 26 OPD dengan filter & search       │
└────────────────────────────────────────────────────────┘
```

### Komponen

```typescript
// frontend/app/dashboard/page.tsx
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { RankingBarChart } from "@/components/charts/RankingBarChart";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { RankingTable } from "@/components/dashboard/RankingTable";
import { PeriodSelector } from "@/components/inputs/PeriodSelector";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardData();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PeriodSelector />

      <DashboardKPIs data={data?.kpis} loading={isLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RankingBarChart data={data?.ranking} />
        <CategoryDonut data={data?.distribusi} />
      </div>

      <RankingTable data={data?.ranking} />
    </div>
  );
}
```

### KPI Card Component

```typescript
// frontend/components/dashboard/KpiCard.tsx
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Award, AlertTriangle } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: "users" | "trending" | "award" | "alert";
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "success" | "warning" | "danger";
}

export function KPICard({ title, value, subtitle, icon, color = "primary" }: KPICardProps) {
  const Icon = { users: Users, trending: TrendingUp, award: Award, alert: AlertTriangle }[icon];
  const colorClass = {
    primary: "text-blue-600 bg-blue-50",
    success: "text-green-600 bg-green-50",
    warning: "text-yellow-600 bg-yellow-50",
    danger: "text-red-600 bg-red-50",
  }[color];

  return (
    <Card>
      <CardContent className="flex items-start justify-between p-6">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Ranking Bar Chart (ECharts)

```typescript
// frontend/components/charts/RankingBarChart.tsx
import EChartsReact from "echarts-for-react";

interface RankingBarChartProps {
  data: Array<{ nama_opd: string; total_skor: number; kategori: string }>;
}

export function RankingBarChart({ data }: RankingBarChartProps) {
  const sorted = [...data].sort((a, b) => a.total_skor - b.total_skor); // ascending untuk horizontal bar

  const option = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "20%", right: "10%" },
    xAxis: { type: "value", max: 100 },
    yAxis: { type: "category", data: sorted.map(d => d.nama_opd) },
    series: [{
      type: "bar",
      data: sorted.map(d => ({
        value: d.total_skor,
        itemStyle: {
          color: getColorByKategori(d.kategori)
        }
      })),
      label: { show: true, position: "right", formatter: "{c}" }
    }]
  };

  return <EChartsReact option={option} style={{ height: "600px" }} />;
}

function getColorByKategori(kat: string): string {
  return {
    "SANGAT_DISIPLIN": "#15803d",
    "DISIPLIN": "#22c55e",
    "CUKUP": "#eab308",
    "KURANG": "#dc2626",
  }[kat] || "#6b7280";
}
```

### Ranking Table (Interaktif)

```typescript
// frontend/components/dashboard/RankingTable.tsx
import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface RankingTableProps {
  data: Array<RankingOPD>;
}

export function RankingTable({ data }: RankingTableProps) {
  const [sortBy, setSortBy] = useState<keyof RankingOPD>("ranking_total_skor");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState("");

  const sorted = [...data]
    .filter(d => d.nama_opd.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortDir === "asc" ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

  return (
    <div>
      <input
        type="text"
        placeholder="Cari OPD..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="mb-4 px-3 py-2 border rounded"
      />
      <table className="w-full">
        <thead>
          <tr>
            <th>No</th>
            <SortableTh field="nama_opd" ...>OPD</SortableTh>
            <SortableTh field="total_skor" ...>Skor</SortableTh>
            <SortableTh field="kategori" ...>Kategori</SortableTh>
            {/* ... */}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr key={row.opd_id} className="hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/opd/${row.opd_id}`)}>
              <td>{idx + 1}</td>
              <td>{row.nama_opd}</td>
              <td className="text-right font-mono">{row.total_skor.toFixed(2)}</td>
              <td><KategoriBadge kategori={row.kategori} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🎨 Panduan Desain & Style Baru (Inspirasi BordUp)

Sejak Juli 2026, halaman Dashboard SENTER ASN telah didesain ulang dengan gaya visual premium yang terinspirasi dari HR Dashboard modern (BordUp). Berikut adalah detail spesifikasi dan aturan desain yang wajib diikuti untuk menjaga konsistensi visual:

### 1. Warna & Token CSS (Tailwind v4 `@theme`)
Warna dasar menggunakan warna **Hijau & Hijau Turunannya (Teal/Emerald)** untuk harmoni warna yang senada, dikombinasikan dengan latar belakang putih polos dan border abu-abu yang memperjelas struktur kotak data tanpa bayangan.
- **Latar Belakang Utama:** `bg-white` (#ffffff)
- **Latar Belakang Card:** `bg-white` (#ffffff)
- **Border Subtle (Kotak Card):** `border-slate-200` (#e2e8f0)
- **Warna Aksen Hijau/Teal:**
  - Primary Dark: `--color-primary-dark: #0a6c74` (deep teal)
  - Primary: `--color-primary: #0f766e` (teal)
  - Primary Light: `--color-primary-light: #f0fdfa` (very light teal-green)
  - Success Light: `--color-success-light: #f0fdf4` (soft green)
  - Danger Light: `--color-danger-light: #fef2f2` (soft red)

### 2. Tipografi
- **Font Utama:** Inter (sans-serif) dengan *optical sizing*.
- **Display Font:** Menggunakan varian *font-display* untuk angka statistik guna memberikan kesan premium dan keterbacaan tinggi.
- **Hierarki:** Menggunakan bobot *medium* untuk teks body dan *bold* untuk *data points*.

### 3. Struktur Shared Layout Shell
Seluruh halaman utama di bawah dashboard menggunakan Route Group Next.js `(app)` yang mewarisi layout visual berikut:
- **Sidebar Kiri (`src/components/shell/sidebar.tsx`):**
  - Lebar tetap `w-64` pada layar desktop, bersembunyi dengan mode geser (drawer) pada mobile.
  - Memuat logo **Senter ASN** dengan ikon `Shield` berlatar teal gelap (`bg-primary-dark`).
  - Item menu non-aktif menggunakan **font abu-abu gelap (dark grey - `text-slate-600`)** dengan ketebalan semi-bold.
  - Item menu aktif menggunakan background hijau pastel (`bg-primary-light`) dengan **font hijau gelap (`text-primary-dark` / `#0a6c74`)** yang tebal, tanpa bayangan.
  - Sub-kategori menu (heading) menggunakan huruf dengan penulisan Title Case (seperti "Menu Utama") berwarna abu-abu terang dengan spasi lebar (`text-[10px] font-bold tracking-wider text-slate-400`), tanpa huruf besar semua (UPPERCASE).
  - Profil pengguna (`nama_lengkap`, `role`) terintegrasi di bagian bawah dengan wadah ber-border grey tipis (`border-slate-100`), tanpa bayangan.
- **Topbar Atas (`src/components/shell/topbar.tsx`):**
  - Tinggi tetap `h-16` dengan posisi sticky.
  - Menampilkan nama modul aktif (misal: "Dashboard Kehadiran") dan tanggal hari ini dalam format lokal Indonesia (`Intl.DateTimeFormatOptions` lengkap).
  - Membawa tombol hamburger menu di mobile untuk membuka sidebar.

### 4. Komponen Kartu KPI (`src/components/stats-card.tsx`)
Menggantikan stats card lama dengan visualisasi yang lebih elegan:
- Menggunakan sudut melengkung `rounded-2xl` dengan **border grey (`border-slate-200`)** tanpa bayangan.
- Ikon dibungkus dalam wadah bulat (`rounded-full`) dengan warna pastel yang mewakili kategorinya.
- Menyediakan prop `description` di bagian bawah untuk memberikan info konteks angka.

### 5. Konfigurasi Grafik ECharts Modern
- **Donut Chart (Kategori Kehadiran):**
  - Menggunakan celah pemisah antar slice (`borderWidth: 2`, `borderColor: '#fff'`).
  - Sudut lengkung slice pie `borderRadius: 8`.
  - Ratio ketebalan ring donut `radius: ["55%", "75%"]`.
  - Legenda horizontal diletakkan secara rapi di bagian bawah (`bottom: "0%"`).
  - Wadah grafik dibatasi oleh **border grey (`border-slate-200`)** tanpa bayangan dan diposisikan di **kolom kanan (`lg:col-span-2`)**.
- **Grafik Sorotan Kinerja Instansi (Gaya Cash Flow):**
  - Menggabungkan data **Top 5** (terbaik) dan **Bottom 5** (terbawah) ke dalam satu grafik vertikal dua arah terintegrasi pada **kolom kiri (`lg:col-span-3`)**.
  - Sumbu X menyajikan Peringkat (Rank 1 hingga 5).
  - Sumbu Y positif (arah atas) menampilkan skor Top 5 dengan warna **deep teal (`#0a6c74`)**.
  - Sumbu Y negatif (arah bawah) menampilkan skor Bottom 5 dengan warna **emerald green (`#10b981`)** (nilai negatif diplot ke bawah dan diformat menjadi nilai absolut positif pada label sumbu).
  - Di sebelah kanan grafik, terdapat panel ringkasan vertikal yang menyoroti instansi terbaik nomor #1 (ikon medali emas `Award`) dan instansi terendah nomor #1 (ikon tanda peringatan `AlertTriangle`) secara dinamis lengkap dengan nama OPD dan skor numeriknya.
  - Tooltip interaktif memetakan perbandingan OPD terbaik vs terburuk secara real-time pada setiap indeks hover.

### 6. Pemantauan Pelayanan Publik Utama
Dirancang khusus untuk memfasilitasi kebutuhan pengawasan pelayanan publik strategis oleh Bupati atau Sekda:
- Memonitor secara spesifik 5 instansi garis depan pelayanan masyarakat (seperti Dinas Kesehatan, RSUD Lakipadada, Dinas Pendidikan, Dispendukcapil, Dinas Perhubungan, Dinas Sosial, dll) yang disaring secara cerdas berdasarkan nama instansi.
- Ditampilkan secara modern sebagai **grid 5 kolom full-width** di bawah grafik, di mana masing-masing instansi memiliki panel info tersendiri (nama dinas, progress bar berwarna dinamis, skor numerik, dan badge kategori).

### 7. Tabel Peringkat OPD
- **Container Tabel:** Dibungkus wadah melengkung `rounded-3xl` ber-**border grey (`border-slate-200`)** tanpa bayangan.
- **Header Tabel:** Menggunakan warna latar belakang abu-abu terang `bg-slate-50` dengan warna teks `text-slate-500` yang tebal.
- **Row Styling:** Memiliki efek hover baris `hover:bg-slate-50/50` dan dipisahkan oleh garis border horizontal tipis.
- **Badges Status:** Kategori disiplin menggunakan badge bulat penuh (`rounded-full`) dengan border tipis dan font tebal berukuran `text-[10px]`.
- **Pencarian Real-time:** Di bagian header tabel, ditambahkan kolom input teks pencarian OPD yang terintegrasi secara fungsional (memfilter baris tabel secara real-time berdasarkan input keyboard).

---

## 📄 Upload Page (`/upload`)

Halaman ini memungkinkan administrator BKPSDM mengunggah berkas laporan presensi bulanan hasil ekspor dari SIMPEGNAS. Halaman ini diintegrasikan ke dalam shell utama agar seragam dengan dashboard (Sidebar & Topbar).

### Fitur Utama:
- **Flat UI Card Container:** Area unggah berkas dengan aksen warna teal yang bersih, ber-border abu-abu (`border-slate-200`) tanpa efek bayangan.
- **Deteksi Otomatis & Pemrosesan:** Berkas Excel yang diunggah diproses secara asinkron di backend untuk mengidentifikasi dan mendaftarkan OPD serta pegawai baru secara otomatis.
- **Hasil Impor Data:** Setelah upload selesai, sistem memunculkan panel rekap hasil impor (Total Baris, Sukses Impor, Baris Gagal, Peringatan) dalam format lencana (badges) tanpa casing UPPERCASE.
- **Pemeriksaan Detail Error:** Admin dapat mengekspansi daftar error baris untuk melihat secara mendetail baris mana saja yang gagal diimpor beserta alasannya.
- **Kalkulasi Agregasi Kinerja:** Disediakan tombol jalan pintas di dalam hasil impor untuk langsung mengeksekusi mesin kalkulasi analisis (`runAnalytics`) untuk periode berjalan secara manual dari UI.

---

## 📄 Metode Perhitungan Page (`/perhitungan`)

Halaman ini menyajikan dasar hukum, kerangka teori, bobot indikator, definisi variabel penting, dan formulasi perhitungan secara terperinci. Halaman ini diintegrasikan ke dalam shell utama agar seragam dengan dashboard (Sidebar & Topbar) serta disajikan dalam **tata letak 1 kolom murni** untuk kegunaan pembacaan yang optimal.

### Fitur Utama:
- **Kerangka Pengukuran & Bobot Indikator:** Menjelaskan pembagian bobot (Kehadiran 25%, Kepatuhan Jam 20%, Absensi 15%, dan Hadir Efektif 40%).
- **Definisi Istilah & Variabel Utama:** Penjelasan eksplisit untuk membedakan antara **Hadir Fisik** (total kehadiran di kantor) dan **Hadir Normal / Bersih** (kehadiran penuh tepat waktu tanpa ada catatan keterlambatan atau pulang cepat).
- **Formulasi Perhitungan:** Menampilkan formula perhitungan terperinci dalam format teks bahasa Indonesia biasa yang mudah dipahami (bebas LaTeX untuk menjamin kebersihan rendering teks).
- **Simulator Kasus OPD (Interactive Sandbox):** Terintegrasi langsung di bawah formulasi. Admin dapat memfilter periode dan OPD untuk membongkar perhitungan langkah demi langkah (Step 1-4) menggunakan data riil instansi terpilih secara real-time. Pada Langkah 3, simulasi menampilkan pembagian operasi matematika murni untuk tiap indikator agar transparan saat menghadapi komplain Kepala Dinas.
- **Formulir Pengajuan Koreksi:** Menyediakan formulir masukan/peninjauan kembali parameter di bagian paling bawah halaman.

---

## 📱 PWA Setup

### Manifest
```json
// frontend/public/manifest.json
{
  "name": "SENTER ASN",
  "short_name": "SENTER",
  "description": "Sistem Early Warning Presensi ASN",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1e3a8a",
  "theme_color": "#1e3a8a",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### next-pwa config
```javascript
// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // ... Next.js config
});
```

### Offline Strategy
- **Static assets:** cache-first (logo, fonts, CSS, JS)
- **API GET requests:** network-first, fallback to cache
- **API POST requests:** network-only (tidak bisa offline)
- **Pages:** cache halaman yang pernah dibuka

---

## 📱 Mobile Responsiveness

Breakpoints (Tailwind):
- `sm`: 640px
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)

Layout:
- **Mobile (< 768px):** Single column, KPI cards stack vertical
- **Tablet (768-1024px):** 2-column untuk chart, KPI cards 2x2
- **Desktop (> 1024px):** Full layout seperti di atas

---

## ♿ Accessibility

- ✅ Semantic HTML (header, nav, main, footer)
- ✅ ARIA labels untuk icon buttons
- ✅ Color contrast ≥ 4.5:1 (WCAG AA)
- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ Screen reader friendly
- ✅ Focus indicator visible
- ✅ Form labels yang jelas
- ✅ Error messages yang deskriptif

---

## 🧪 Testing

### Unit Tests
- [x] Component render correctly
- [x] Hooks (useDashboardData, useAuth) bekerja
- [x] Formatters (date, number) benar

### Integration Tests
- [x] Login flow
- [x] Upload flow (mock API)
- [x] Dashboard load data

### E2E Tests (Playwright)
- [x] User bisa login
- [x] HR bisa upload Excel
- [x] Dashboard menampilkan ranking
- [x] Klik OPD → detail page
- [x] Download PDF

### Visual Regression
- [x] Screenshot dashboard
- [x] Compare dengan baseline

---

## 🔗 Integrasi dengan Modul Lain

- **API:** consume dari backend FastAPI (Module 02-04)
- **Auth:** NextAuth.js (Module 06)
- **State:** Zustand untuk global state (user, theme)
- **Data:** TanStack Query untuk server state (cached, refetch)
- **PWA:** next-pwa untuk service worker & manifest

---

## 📚 Referensi

- [Next.js docs](https://nextjs.org/docs)
- [Tailwind CSS docs](https://tailwindcss.com/docs)
- [ShadCN/UI](https://ui.shadcn.com/)
- [ECharts docs](https://echarts.apache.org/en/index.html)
- [TanStack Query](https://tanstack.com/query/latest)
- [NextAuth.js](https://next-auth.js.org/)
- [next-pwa](https://github.com/shadowwalker/next-pwa)

---

> **Module selanjutnya: [`06-auth-rbac.md`](06-auth-rbac.md)** — authentication & role-based access control.
