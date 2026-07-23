# Module 04 — PDF Generator

> Tanggung jawab: Render laporan PDF 5 halaman sesuai template SENTER ASN, dengan data presensi agregat.

---

## 🎯 Tujuan

Menghasilkan PDF yang:
1. **Match dengan design reference** (`samples/output-sample.pdf`)
2. **5 halaman konsisten** dengan branding SENTER ASN
3. **Color-coded** sesuai kategori disiplin
4. **Ready for executive** — tinggal presentasi

---

## 📄 Struktur 5 Halaman

| Halaman | Judul | Konten Utama |
|---------|-------|--------------|
| 1 | Cover | Logo SENTER ASN, judul, BKPSDM Kab. Tana Toraja |
| 2 | Ketidakhadiran & Pelanggaran Jam Kerja | 2 tabel ranking, 2 highlight box |
| 3 | Kehadiran & Kehadiran Efektif | 2 tabel ranking, 2 highlight box |
| 4 | Total Skor Kedisiplinan | Tabel skor + kategori, highlight, indikator, fakta |
| 5 | Evaluasi Executive Summary | Pie chart, top 5 bar chart, OPD pembinaan, highlight terbaik |

Detail visual ada di file `samples/output-sample.pdf`.

---

## 🎨 Branding

### Colors
```python
SENTER_COLORS = {
    "primary_dark": "#1e3a8a",     # biru tua
    "primary": "#2563eb",           # biru
    "success_dark": "#15803d",      # hijau tua (Sangat Disiplin)
    "success": "#22c55e",            # hijau (Disiplin)
    "warning": "#eab308",            # kuning (Cukup)
    "danger": "#dc2626",             # merah (Kurang)
    "neutral": "#6b7280",            # abu-abu
    "bg_cream": "#fef3c7",           # krem (highlight box)
    "white": "#ffffff",
}
```

### Fonts
- **Primary:** Inter / Poppins (sans-serif modern)
- **Bold untuk judul:** weight 700
- **Body:** weight 400-500
- Fallback ke Helvetica (built-in ReportLab) jika custom font tidak tersedia

### Layout
- Page size: A4 (210 × 297 mm)
- Margin: 10mm
- Header/footer: setiap halaman

---

## 🏗️ Implementasi

### Lokasi File
- `backend/app/services/pdf_generator.py` — main generator
- `backend/app/services/pdf_components/` — reusable components
  - `cover.py`
  - `ranking_table.py`
  - `highlight_box.py`
  - `score_table.py`
  - `pie_chart.py`
  - `bar_chart.py`
  - `header_footer.py`
- `backend/assets/pdf/` — fonts, logo, images
- `backend/tests/test_pdf_generator.py`

### Library
- **ReportLab** — main PDF generation
- **Pillow** — image processing
- **Matplotlib** — chart generation (saved to PNG, embedded)

### Arsitektur Modular

```python
# backend/app/services/pdf_generator.py
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from app.services.pdf_components.cover import render_cover
from app.services.pdf_components.ranking_table import render_ranking_table
# ...

class SenterAsnPDFGenerator:
    def __init__(self, output_path: str):
        self.output_path = output_path
        self.canvas = canvas.Canvas(output_path, pagesize=A4)
        self.page_width, self.page_height = A4
        self.page_number = 0

    def generate(self, data: LaporanData) -> str:
        """Generate full PDF, return path"""
        # Halaman 1: Cover
        self._render_halaman_1_cover(data)

        # Halaman 2: Ketidakhadiran & Pelanggaran
        self._render_halaman_2_ketidakhadiran_pelanggaran(data)

        # Halaman 3: Kehadiran & Kehadiran Efektif
        self._render_halaman_3_kehadiran_efektif(data)

        # Halaman 4: Total Skor
        self._render_halaman_4_total_skor(data)

        # Halaman 5: Evaluasi Summary
        self._render_halaman_5_evaluasi(data)

        self.canvas.save()
        return self.output_path

    def _new_page(self):
        self.canvas.showPage()
        self.page_number += 1
        self._draw_header_footer()

    def _draw_header_footer(self):
        # Logo kecil di header
        # Page number di footer
        # BKPSDM branding
        pass
```

---

## 📄 Per-Halaman Detail

### Halaman 1 — Cover

```python
def _render_halaman_1_cover(self, data: LaporanData):
    self._new_page()
    # Background gradient (optional, butuh image)
    # Logo besar SENTER ASN (centered)
    # Judul besar: "Sistem Early Warning Presensi (SENTER ASN)"
    # Subtitle: BKPSDM Kab. Tana Toraja
    # Decorative elements
```

**Image asset:** `backend/assets/pdf/cover-bg.jpg` (background gradient)

### Halaman 2 — Ketidakhadiran & Pelanggaran Jam Kerja

**Layout (2 kolom):**

```
┌──────────────────────┬──────────────────────┐
│  KETIDAKHADIRAN       │  PELANGGARAN JAM     │
│  Tabel 26 OPD         │  Tabel 26 OPD        │
│  (ranked ascending)   │  (ranked ascending)  │
│                       │                      │
│  + Highlight box      │  + Highlight box     │
│  (top 3 & bottom 3)   │  (top 3 & bottom 3)  │
└──────────────────────┴──────────────────────┘
              + Center quote box
```

```python
def _render_halaman_2_ketidakhadiran_pelanggaran(self, data):
    self._new_page()
    # Title
    self.canvas.drawString(50, height-50, "LAPORAN DISIPLIN ASN OPD")
    self.canvas.drawString(50, height-80, "KETIDAKHADIRAN & PELANGGARAN JAM KERJA")
    self.canvas.drawString(50, height-100, f"Berdasarkan Data SIMPEGNAS Bulan {data.bulan_name}")

    # Tabel kiri: ketidakhadiran (ranked ascending = terbaik di atas)
    self._render_tabel_ranking(
        x=30, y=height-200,
        title="PERSENTASE KETIDAKHADIRAN",
        data=data.ranking_ketidakhadiran,
        sort_key="pct_ketidakhadiran",
        ascending=True,
    )

    # Tabel kanan: pelanggaran (ranked ascending)
    self._render_tabel_ranking(
        x=width/2 + 10, y=height-200,
        title="PERSENTASE PELANGGARAN JAM KERJA",
        data=data.ranking_pelanggaran,
        sort_key="pct_pelanggaran",
        ascending=True,
    )

    # Highlight boxes (bottom)
    self._render_highlight_box(x=30, y=50, type="ketidakhadiran_terendah", data=data)
    self._render_highlight_box(x=width/2 + 10, y=50, type="ketidakhadiran_tertinggi", data=data)

    # Center quote
    self._render_quote_box("Disiplin adalah kunci pelayanan publik yang berkualitas.")
```

### Halaman 3 — Kehadiran & Kehadiran Efektif

Sama strukturnya dengan halaman 2, tapi:
- Tabel kiri: **Persentase Kehadiran** (ranked descending = terbaik di atas)
- Tabel kanan: **Persentase Kehadiran Efektif** (ranked descending)
- Quote: "Disiplin Membangun Kepercayaan"

### Halaman 4 — Total Skor

**Layout:**

```
┌──────────────────────────────────────────┐
│  5 Kartu indikator di atas (1 row)      │
│  [Skor Kehadiran 25%] [Kepatuhan 20%]   │
│  [Ketidakhadiran 15%] [Hadir Efektif 40%]│
│  [Total Skor]                            │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  Tabel ranking 26 OPD dengan 7 kolom:    │
│  No | Nama OPD | Kehadiran(25) |         │
│  Kepatuhan(20) | Ketidakhadiran(15) |    │
│  Hadir Efektif(40) | Total | Kategori   │
│  (color-coded)                           │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  [Highlight: Terbaik] [Indikator]        │
│  [Perhatian]           [Kategori]        │
│                         [Fakta Menarik]  │
└──────────────────────────────────────────┘
```

```python
def _render_halaman_4_total_skor(self, data):
    self._new_page()
    # 5 kartu indikator
    self._render_indicator_cards(y=height-150, data=data)

    # Tabel skor
    self._render_tabel_total_skor(
        y=height-220, data=data.ranking_total_skor
    )

    # Highlight & info boxes
    self._render_highlight_terbaik(...)
    self._render_indikator_kategori(...)
    self._render_highlight_perhatian(...)
    self._render_fakta_menarik(...)
```

### Halaman 5 — Evaluasi Summary

**Layout:**

```
┌──────────────────────────────────────────┐
│  Header: EVALUASI KEHADIRAN DAN KEPATUHAN│
│  Subtitle: PERIODE MONITORING: BULAN MEI │
└──────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  3 insight cards (kehadiran, kepatuhan, │
│  efektif)                               │
└──────────────────────────────────────────┘
┌────────────────────┬─────────────────────┐
│  PIE CHART         │  TOP 5 BAR CHART    │
│  Distribusi        │  (horizontal bars   │
│  Kategori          │   dengan skor)      │
│  Disiplin OPD      │                     │
└────────────────────┴─────────────────────┘
┌────────────────────┬─────────────────────┐
│  OPD YANG          │  HIGHLIGHT OPD      │
│  MEMERLUKAN        │  TERBAIK            │
│  PEMBINAAN         │  (dengan trophy)    │
│  (top 5 worst)     │                     │
└────────────────────┴─────────────────────┘
┌──────────────────────────────────────────┐
│  RINGKASAN HASIL (3 cards)              │
└──────────────────────────────────────────┘
```

```python
def _render_halaman_5_evaluasi(self, data):
    self._new_page()
    # Header dengan logo
    self._render_evaluasi_header(...)

    # 3 insight cards
    self._render_insight_cards(...)

    # Pie chart (matplotlib → PNG → embed)
    pie_image = self._generate_pie_chart(data.distribusi_kategori)
    self.canvas.drawImage(pie_image, x=30, y=height/2, width=250, height=250)

    # Top 5 bar chart
    bar_image = self._generate_bar_chart(data.top_5_terbaik)
    self.canvas.drawImage(bar_image, x=300, y=height/2, width=250, height=250)

    # Bottom boxes
    self._render_opd_pembinaan(...)
    self._render_highlight_terbaik(...)
    self._render_ringkasan(...)
```

---

## 🖼️ Chart Generation

### Pie Chart (Distribusi Kategori)
```python
import matplotlib.pyplot as plt

def _generate_pie_chart(self, distribusi: dict) -> str:
    """Return path ke PNG temporary"""
    fig, ax = plt.subplots(figsize=(4, 4))

    labels = ['Sangat Disiplin', 'Disiplin', 'Cukup', 'Kurang']
    sizes = [
        distribusi['SANGAT_DISIPLIN'],
        distribusi['DISIPLIN'],
        distribusi['CUKUP'],
        distribusi['KURANG'],
    ]
    colors = ['#15803d', '#22c55e', '#eab308', '#dc2626']

    ax.pie(sizes, labels=labels, colors=colors, autopct='%1.0f',
           startangle=90, wedgeprops={'edgecolor': 'white', 'linewidth': 2})
    ax.axis('equal')

    # Save to temp
    temp_path = f"/tmp/pie_{uuid4()}.png"
    plt.savefig(temp_path, dpi=150, bbox_inches='tight', transparent=True)
    plt.close()
    return temp_path
```

### Bar Chart (Top 5)
```python
def _generate_bar_chart(self, top_5: list[dict]) -> str:
    fig, ax = plt.subplots(figsize=(4, 3))

    names = [item['nama_opd'] for item in top_5]
    scores = [item['total_skor'] for item in top_5]

    bars = ax.barh(range(len(names)), scores, color='#22c55e')
    ax.set_yticks(range(len(names)))
    ax.set_yticklabels(names)
    ax.invert_yaxis()  # #1 di atas
    ax.set_xlim(0, 100)

    # Label skor di ujung bar
    for bar, score in zip(bars, scores):
        ax.text(score + 1, bar.get_y() + bar.get_height()/2,
                f'{score:.2f}', va='center')

    temp_path = f"/tmp/bar_{uuid4()}.png"
    plt.savefig(temp_path, dpi=150, bbox_inches='tight')
    plt.close()
    return temp_path
```

---

## 📊 Tabel Ranking (Reusable Component)

```python
def _render_tabel_ranking(
    self, x, y, title, data, sort_key, ascending=True, max_rows=26
):
    """Render tabel ranking dengan header & 26 baris OPD"""
    # Header box
    self.canvas.setFillColor(SENTER_COLORS['primary_dark'])
    self.canvas.rect(x, y, col_width, 30, fill=1)
    self.canvas.setFillColor('white')
    self.canvas.drawString(x+10, y+10, title)

    # Sort data
    sorted_data = sorted(data, key=lambda d: d[sort_key], reverse=not ascending)

    # Rows
    for i, row in enumerate(sorted_data[:max_rows]):
        row_y = y - 25 - (i * 14)
        # Background alternating
        if i % 2 == 0:
            self.canvas.setFillColor('#f9fafb')
            self.canvas.rect(x, row_y, col_width, 14, fill=1)

        # Number badge (1-26)
        self.canvas.setFillColor(SENTER_COLORS['primary'])
        self.canvas.circle(x+10, row_y+7, 6, fill=1)
        self.canvas.setFillColor('white')
        self.canvas.drawCentredString(x+10, row_y+4, str(i+1))

        # OPD name
        self.canvas.setFillColor('black')
        self.canvas.drawString(x+25, row_y+3, row['nama_opd'][:40])

        # Value
        self.canvas.setFillColor(SENTER_COLORS['primary_dark'])
        self.canvas.drawRightString(x+col_width-10, row_y+3,
                                     f"{row[sort_key]:.2f}")
```

---

## ✅ Acceptance Criteria

PDF yang dihasilkan harus:
- [ ] Match dengan `samples/output-sample.pdf` dalam hal layout & konten
- [ ] 5 halaman, A4
- [ ] Tabel ranking 26 OPD terurut benar
- [ ] Color-coded kategori sesuai threshold
- [ ] Highlight top 3 & bottom 3 benar
- [ ] Pie chart & bar chart ter-render dengan data benar
- [ ] Karakter Indonesia (UTF-8) tampil benar
- [ ] File size < 5 MB
- [ ] Generated dalam < 10 detik

### Verification Script
```python
# scripts/verify_output.py
"""Bandingkan output PDF kita dengan reference"""
import subprocess
from pathlib import Path

def verify(pdf_path: Path, reference_path: Path) -> bool:
    """Extract text dari kedua PDF, compare kata kunci"""
    out_text = subprocess.check_output(['pdftotext', pdf_path])
    ref_text = subprocess.check_output(['pdftotext', reference_path])

    # Check key strings
    keys = [
        "SENTER ASN", "BKPSDM", "PERSENTASE KEHADIRAN",
        "Sangat Disiplin", "Disiplin", "Cukup", "Kurang"
    ]
    for key in keys:
        if key not in out_text.decode('utf-8'):
            print(f"MISSING: {key}")
            return False
    return True
```

---

## 🔗 Integrasi dengan Modul Lain

- **Input:** `PresensiAgregatOPD` rows (from Module 03) + `OPD` master (from Module 02)
- **Output:** PDF file path
- **Trigger:** via API `GET /api/reports/pdf?periode=2026-05`
- **Storage:** simpan di MinIO, return signed URL untuk download

---

## 📚 Referensi

- [`samples/output-sample.pdf`](../../samples/output-sample.pdf) — design reference
- [ReportLab docs](https://www.reportlab.com/docs/reportlab-userguide.pdf)
- [Matplotlib docs](https://matplotlib.org/stable/contents.html)

---

> **Module selanjutnya: [`05-dashboard.md`](05-dashboard.md)** — interactive web dashboard.
