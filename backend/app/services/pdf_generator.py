import io
import os
import tempfile
import uuid
from datetime import date

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from reportlab.lib import colors as rl_colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas as rl_canvas

from app.schemas.pdf import LaporanData, OPDLaporan

SENTER_COLORS = {
    "primary_dark": "#0f766e",     # brand teal/dark green
    "primary": "#0a6c74",          # brand teal secondary
    "success_dark": "#15803d",     # hijau Sangat Disiplin
    "success": "#22c55e",          # hijau Disiplin
    "warning": "#eab308",          # kuning Cukup
    "danger": "#dc2626",           # merah Kurang
    "neutral": "#64748b",          # slate neutral
    "bg_cream": "#fef3c7",
    "white": "#ffffff",
    "light_gray": "#f8fafc",
}

KATEGORI_COLOR_MAP = {
    "SANGAT_DISIPLIN": SENTER_COLORS["success_dark"],
    "DISIPLIN": SENTER_COLORS["success"],
    "CUKUP": SENTER_COLORS["warning"],
    "KURANG": SENTER_COLORS["danger"],
}

PAGE_W, PAGE_H = A4
MARGIN = 14 * mm
BODY_W = PAGE_W - 2 * MARGIN
BODY_H = PAGE_H - 2 * MARGIN
COL_W = BODY_W / 2 - 8


class SenterAsnPDFGenerator:
    def __init__(self, data: LaporanData):
        self.data = data
        self.buf = io.BytesIO()
        self.c = rl_canvas.Canvas(self.buf, pagesize=A4)
        self.page_num = 0
        self.temp_files: list[str] = []
        self._first_page = True

    def generate(self) -> bytes:
        self._page_1_cover()
        self._page_2_ketidakhadiran()
        self._page_3_pelanggaran()
        self._page_4_kehadiran_fisik()
        self._page_5_kehadiran_efektif()
        self._page_6_total_skor()
        self._page_7_evaluasi()
        self.c.save()
        self._cleanup()
        return self.buf.getvalue()

    def save(self, path: str) -> str:
        pdf_bytes = self.generate()
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)
        with open(path, "wb") as f:
            f.write(pdf_bytes)
        return path

    def _cleanup(self):
        for f in self.temp_files:
            try:
                os.unlink(f)
            except OSError:
                pass

    def _new_page(self):
        if self._first_page:
            self._first_page = False
        else:
            self.c.showPage()
        self.page_num += 1
        self._draw_header_footer()

    def _draw_header_footer(self):
        if self.page_num == 1:
            return
        c = self.c
        
        # Footer thin divider line
        c.setStrokeColor(self._hex("#e2e8f0"))
        c.setLineWidth(0.3)
        c.line(MARGIN, MARGIN - 3, PAGE_W - MARGIN, MARGIN - 3)
        
        # Footer text
        c.setFont("Helvetica", 7)
        c.setFillColor(self._hex(SENTER_COLORS["neutral"]))
        c.drawString(MARGIN, MARGIN - 11, "Laporan Disiplin ASN — BKPSDM Kab. Tana Toraja")
        c.drawRightString(
            PAGE_W - MARGIN, MARGIN - 11,
            f"Halaman {self.page_num}",
        )
        c.drawCentredString(
            PAGE_W / 2, MARGIN - 11,
            f"SENTER ASN | {self.data.bulan_name.title()} {self.data.tahun}",
        )

    def _hex(self, hex_color: str) -> rl_colors.HexColor:
        return rl_colors.HexColor(hex_color)

    def _draw_wrapped_text(self, x, y, w, text, line_height=11, font_name="Helvetica", font_size=7.5):
        c = self.c
        c.setFont(font_name, font_size)
        
        # If it's a list, render each item as a bullet point with word wrapping
        if isinstance(text, list):
            current_y = y
            for item in text:
                # Draw small green bullet dot
                c.setFillColor(self._hex("#15803d"))
                c.circle(x + 4, current_y + 2.5, 1.5, fill=1, stroke=0)
                
                # Wrap item text
                c.setFillColor(self._hex("#334155"))
                words = item.split(" ")
                lines = []
                current_line = []
                # Restrict wrap width to leave space for bullet dot
                wrap_w = w - 15
                for word in words:
                    test_line = " ".join(current_line + [word])
                    width = c.stringWidth(test_line, font_name, font_size)
                    if width <= wrap_w:
                        current_line.append(word)
                    else:
                        lines.append(" ".join(current_line))
                        current_line = [word]
                if current_line:
                    lines.append(" ".join(current_line))
                
                # Draw lines
                for line in lines:
                    c.drawString(x + 15, current_y, line)
                    current_y -= line_height
                
                # Extra gap between bullet points
                current_y -= 2
        else:
            # Single paragraph text wrapping
            words = text.split(" ")
            lines = []
            current_line = []
            
            for word in words:
                test_line = " ".join(current_line + [word])
                width = c.stringWidth(test_line, font_name, font_size)
                if width <= w:
                    current_line.append(word)
                else:
                    lines.append(" ".join(current_line))
                    current_line = [word]
            if current_line:
                lines.append(" ".join(current_line))
                
            for i, line in enumerate(lines):
                c.drawString(x, y - i * line_height, line)

    # ─── PAGE 1: COVER ──────────────────────────────────────────────────

    def _page_1_cover(self):
        self._new_page()
        c = self.c
        
        # Premium clean off-white background
        c.setFillColor(self._hex("#f8fafc"))
        c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        
        # Top banner accent band
        c.setFillColor(self._hex("#15803d"))
        c.rect(0, PAGE_H - 14, PAGE_W, 14, fill=1, stroke=0)
        
        # Left margin decorative vertical band
        c.setFillColor(self._hex("#0a6c74"))
        c.rect(MARGIN, MARGIN, 4, PAGE_H - 2 * MARGIN, fill=1, stroke=0)
        
        # Title block (left-aligned relative to the vertical band)
        start_x = MARGIN + 20
        mid_y = PAGE_H / 2
        
        c.setFillColor(self._hex("#0f766e"))
        c.setFont("Helvetica-Bold", 36)
        c.drawString(start_x, mid_y + 80, "SENTER ASN")
        
        c.setFillColor(self._hex("#1e293b"))
        c.setFont("Helvetica", 14)
        c.drawString(start_x, mid_y + 55, "Sistem Early Warning Presensi")
        c.drawString(start_x, mid_y + 35, "Aparatur Sipil Negara")
        
        # Horizontal divider line on cover
        c.setStrokeColor(self._hex("#cbd5e1"))
        c.setLineWidth(0.8)
        c.line(start_x, mid_y + 10, start_x + 280, mid_y + 10)
        
        c.setFillColor(self._hex("#475569"))
        c.setFont("Helvetica-Bold", 10)
        c.drawString(start_x, mid_y - 15, "LAPORAN KEDISIPLINAN KINERJA INSTANSI")
        
        c.setFont("Helvetica", 9)
        c.drawString(start_x, mid_y - 65, "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia")
        c.drawString(start_x, mid_y - 80, "Pemerintah Kabupaten Tana Toraja")
        c.drawString(start_x, mid_y - 105, f"Bulan Laporan: {self.data.bulan_name.title()} {self.data.tahun}")
        c.drawString(start_x, mid_y - 120, f"Tanggal Cetak: {date.today().strftime('%d-%m-%Y')}")

    # ─── PAGE 2: KETIDAKHADIRAN (ALPA) ─────────────────────────────────

    def _page_2_ketidakhadiran(self):
        self._new_page()
        top = PAGE_H - MARGIN - 42
        self._page_title("KETIDAKHADIRAN (ALPA) ASN")

        # Table full-width (BODY_W) to avoid truncation
        self._render_ranking_table(
            MARGIN, top, BODY_W,
            "RANKING PERSENTASE KETIDAKHADIRAN (ALPA) - 26 OPD",
            self.data.ranking_ketidakhadiran,
            "persentase_ketidakhadiran",
            ascending=True,
        )

        # Highlight Boxes directly below the table
        y = top - 26 * 13.5 - 20
        self._highlight_top_bottom(
            MARGIN, y, COL_W,
            "Ketidakhadiran Terendah (Top 3)",
            self.data.ranking_ketidakhadiran[:3], "persentase_ketidakhadiran", danger=False,
        )
        self._highlight_top_bottom(
            PAGE_W / 2 + 4, y, COL_W,
            "Ketidakhadiran Tertinggi (Worst 3)",
            self.data.ranking_ketidakhadiran[-3:][::-1], "persentase_ketidakhadiran", danger=True,
        )
        
        # Bullet Insight Box at bottom
        desc = (
            "Laporan ini menyajikan analisis persentase ketidakhadiran tanpa keterangan sah (alpa) di "
            "lingkungan Pemerintah Kabupaten Tana Toraja. Ketidakhadiran tanpa izin merupakan pelanggaran "
            "langsung terhadap disiplin pegawai yang dapat menurunkan efektivitas operasional instansi "
            "secara signifikan. Sebagian besar instansi telah berhasil mempertahankan tingkat alpa sebesar "
            "0.00%, namun beberapa OPD dengan tugas pelayanan dasar masih menunjukkan adanya fluktuasi ketidakhadiran. "
            "Pimpinan daerah diharapkan memberikan pengawasan berkala dan instruksi pembinaan langsung kepada "
            "instansi yang berada pada kategori Cukup dan Kurang guna memitigasi risiko kelumpuhan layanan administratif."
        )
        self._render_insight_card(
            MARGIN, MARGIN + 10, BODY_W, 65,
            "Analisis Temuan Kepatuhan & Risiko Ketidakhadiran", desc
        )

    # ─── PAGE 3: PELANGGARAN JAM KERJA (TM / PC) ──────────────────────

    def _page_3_pelanggaran(self):
        self._new_page()
        top = PAGE_H - MARGIN - 42
        self._page_title("PELANGGARAN JAM KERJA (TM / PC)")

        self._render_ranking_table(
            MARGIN, top, BODY_W,
            "RANKING PERSENTASE PELANGGARAN JAM KERJA (TM / PC) - 26 OPD",
            self.data.ranking_pelanggaran,
            "persentase_pelanggaran",
            ascending=True,
        )

        y = top - 26 * 13.5 - 20
        self._highlight_top_bottom(
            MARGIN, y, COL_W,
            "Pelanggaran Jam Kerja Terendah (Top 3)",
            self.data.ranking_pelanggaran[:3], "persentase_pelanggaran", danger=False,
        )
        self._highlight_top_bottom(
            PAGE_W / 2 + 4, y, COL_W,
            "Pelanggaran Jam Kerja Tertinggi (Worst 3)",
            self.data.ranking_pelanggaran[-3:][::-1], "persentase_pelanggaran", danger=True,
        )

        desc = (
            "Laporan ini mengukur tingkat pelanggaran jam kerja pegawai, yang dihitung berdasarkan akumulasi "
            "keterlambatan masuk kerja (TM) dan pulang cepat sebelum waktunya (PC). Keteraturan dan ketepatan waktu kehadiran "
            "merupakan tolok ukur profesionalisme ASN yang berdampak langsung pada pelayanan masyarakat pada jam sibuk. "
            "Persentase pelanggaran yang tinggi mengindikasikan adanya kelonggaran dalam pengawasan internal di tingkat OPD. "
            "Rekomendasi tindakan difokuskan pada penguatan peran Kepala OPD untuk mengoptimalkan pengawasan presensi "
            "harian serta penyesuaian pemberian TPP berbasis kedisiplinan waktu masuk dan pulang."
        )
        self._render_insight_card(
            MARGIN, MARGIN + 10, BODY_W, 65,
            "Analisis Temuan Kedisiplinan Waktu Kerja", desc
        )

    # ─── PAGE 4: KEHADIRAN FISIK ───────────────────────────────────────

    def _page_4_kehadiran_fisik(self):
        self._new_page()
        top = PAGE_H - MARGIN - 42
        self._page_title("KEHADIRAN FISIK ASN")

        self._render_ranking_table(
            MARGIN, top, BODY_W,
            "RANKING PERSENTASE KEHADIRAN FISIK - 26 OPD",
            self.data.ranking_kehadiran,
            "persentase_kehadiran",
            ascending=False,
        )

        y = top - 26 * 13.5 - 20
        self._highlight_top_bottom(
            MARGIN, y, COL_W,
            "Kehadiran Fisik Tertinggi (Top 3)",
            self.data.ranking_kehadiran[:3], "persentase_kehadiran", danger=False,
        )
        self._highlight_top_bottom(
            PAGE_W / 2 + 4, y, COL_W,
            "Kehadiran Fisik Terendah (Worst 3)",
            self.data.ranking_kehadiran[-3:][::-1], "persentase_kehadiran", danger=True,
        )

        desc = (
            "Laporan ini menggambarkan tingkat kehadiran fisik riil ASN di masing-masing unit kerja sepanjang "
            "bulan berjalan. Persentase kehadiran fisik dihitung secara proporsional berdasarkan jumlah hari kerja "
            "dinamis masing-masing OPD (di mana instansi pelayanan kesehatan seperti Puskesmas memiliki hari kerja "
            "lebih tinggi dibandingkan dinas administratif). Rata-rata kehadiran fisik yang tinggi mencerminkan komitmen "
            "kehadiran yang baik, namun harus terus disinkronkan dengan jam kerja efektif untuk memastikan kontribusi "
            "produktif nyata dari aparatur selama berada di lingkungan kantor."
        )
        self._render_insight_card(
            MARGIN, MARGIN + 10, BODY_W, 65,
            "Analisis Komitmen Kehadiran Fisik Instansi", desc
        )

    # ─── PAGE 5: KEHADIRAN EFEKTIF ─────────────────────────────────────

    def _page_5_kehadiran_efektif(self):
        self._new_page()
        top = PAGE_H - MARGIN - 42
        self._page_title("KEHADIRAN EFEKTIF ASN")

        self._render_ranking_table(
            MARGIN, top, BODY_W,
            "RANKING PERSENTASE KEHADIRAN EFEKTIF - 26 OPD",
            self.data.ranking_efektif,
            "persentase_hadir_efektif",
            ascending=False,
        )

        y = top - 26 * 13.5 - 20
        self._highlight_top_bottom(
            MARGIN, y, COL_W,
            "Kehadiran Efektif Tertinggi (Top 3)",
            self.data.ranking_efektif[:3], "persentase_hadir_efektif", danger=False,
        )
        self._highlight_top_bottom(
            PAGE_W / 2 + 4, y, COL_W,
            "Kehadiran Efektif Terendah (Worst 3)",
            self.data.ranking_efektif[-3:][::-1], "persentase_hadir_efektif", danger=True,
        )

        desc = (
            "Kehadiran efektif merupakan indikator kunci produktivitas jam kerja ASN. Metrik ini mengkalkulasi waktu "
            "kerja bersih pegawai setelah dikurangi potongan pelanggaran waktu seperti keterlambatan dan kepulangan cepat. "
            "Tingginya kehadiran fisik tidak memberikan dampak maksimal jika tingkat kehadiran efektif rendah akibat "
            "kurangnya kepatuhan jam kerja regulatif. Pimpinan daerah dihimbau untuk menggunakan nilai kehadiran efektif ini "
            "sebagai basis utama penilaian kinerja organisasi, perencanaan kebutuhan pegawai, serta penentuan indeks reformasi birokrasi."
        )
        self._render_insight_card(
            MARGIN, MARGIN + 10, BODY_W, 65,
            "Analisis Jam Kerja Produktif & Efektivitas ASN", desc
        )

    # ─── PAGE 6: TOTAL SKOR KEDISIPLINAN ───────────────────────────────

    def _page_6_total_skor(self):
        self._new_page()
        top = PAGE_H - MARGIN - 38
        self._page_title("TOTAL SKOR KEDISIPLINAN")

        self._render_score_table(MARGIN, top, BODY_W, self.data.ranking_total_skor)

        desc = (
            "Total Skor akhir menggabungkan empat indikator utama dengan pembobotan proporsional: Kehadiran Fisik (25%), "
            "Kepatuhan Jam Kerja (20%), Pengurangan Ketidakhadiran (15%), dan Kehadiran Efektif (40%). Formula evaluasi "
            "ini dirancang secara berimbang guna mendorong peningkatan integritas pelayanan. Pembatasan skor maksimal 100.00 "
            "menjamin penilaian objektif dan berkeadilan bagi seluruh instansi, sekaligus mempermudah penentuan OPD "
            "berkinerja terbaik untuk diberikan apresiasi atau zona risiko tinggi bagi yang memerlukan evaluasi Inspektorat."
        )
        self._render_insight_card(
            MARGIN, MARGIN + 65, BODY_W, 65,
            "Rangkuman Evaluasi Total Skor & Rekomendasi", desc
        )

        # Legend block inside a nice container
        bottom_y = MARGIN + 35
        c = self.c
        c.setFillColor(self._hex("#f8fafc"))
        c.setStrokeColor(self._hex("#e2e8f0"))
        c.setLineWidth(0.5)
        c.roundRect(MARGIN, bottom_y - 6, BODY_W, 20, 4, fill=1, stroke=1)
        
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(self._hex(SENTER_COLORS["primary_dark"]))
        c.drawString(MARGIN + 12, bottom_y, "Legenda Kategori:")
        
        cats = [
            ("Sangat Disiplin (skor >= 90)", SENTER_COLORS["success_dark"]),
            ("Disiplin (skor 80 - 89.9)", SENTER_COLORS["success"]),
            ("Cukup (skor 70 - 79.9)", SENTER_COLORS["warning"]),
            ("Kurang (skor < 70)", SENTER_COLORS["danger"]),
        ]
        bx = MARGIN + 120
        for label, color in cats:
            c.setFillColor(self._hex(color))
            c.roundRect(bx, bottom_y - 2.5, 7, 7, 1.5, fill=1, stroke=0)
            c.setFillColor(self._hex(SENTER_COLORS["neutral"]))
            c.setFont("Helvetica", 6.5)
            c.drawString(bx + 11, bottom_y - 1.5, label)
            bx += 110

    # ─── PAGE 7: EVALUASI & RINGKASAN ──────────────────────────────────

    def _page_7_evaluasi(self):
        self._new_page()
        c = self.c

        self._page_title("EVALUASI KEHADIRAN DAN KEPATUHAN")

        pie_path = self._generate_pie_chart()
        bar_path = self._generate_bar_chart()
        chart_top = PAGE_H - MARGIN - 90
        
        # Left side: Pie Chart image from matplotlib
        c.drawImage(pie_path, MARGIN, chart_top - 200, width=220, height=220)

        # Right side: Symmetrical Bar Chart image from matplotlib
        c.drawImage(bar_path, PAGE_W / 2 + 5, chart_top - 195, width=245, height=215)

        # Best vs Worst Highlights Boxes
        boxes_y = 390
        box_h = 75
        self._render_pembinaan_box(MARGIN, boxes_y, COL_W, box_h)
        self._render_terbaik_box(PAGE_W / 2 + 4, boxes_y, COL_W, box_h)
        
        # Executive Summary Dashboard Card
        self._render_summary_card(MARGIN, 305, BODY_W, 65)

        # Tahap 8: Pemantauan Disiplin Pelayanan Publik Utama (Fixed Typo)
        self._render_public_services_grid(MARGIN, 200, BODY_W, 95)

        # Catatan Rekomendasi Pimpinan (Risk-First POV)
        p5_insights = [
            "Inspektorat Daerah direkomendasikan melakukan audit kepatuhan khusus pada OPD dengan tingkat risiko tinggi (Kurang).",
            "BKPSDM agar mengoptimalkan notifikasi peringatan dini di dashboard SENTER ASN sebelum tingkat kehadiran merosot.",
            "Kebijakan pemotongan TPP daerah diharapkan diselaraskan secara presisi dengan skor laporan kedisiplinan bulanan ini."
        ]
        self._render_insight_card(
            MARGIN, MARGIN + 10, BODY_W, 110,
            "Rencana Aksi & Rekomendasi Tindak Lanjut Pimpinan", p5_insights
        )

    def _render_summary_card(self, x, y, w, h):
        c = self.c
        
        # Calculate Kabupaten stats
        all_opds = self.data.ranking_total_skor
        avg_skor = sum(o.total_skor for o in all_opds) / len(all_opds) if all_opds else 0
        best_opd = self.data.top_5[0] if self.data.top_5 else None
        worst_opd = self.data.bottom_5[0] if self.data.bottom_5 else None
        
        # Outer Card Container
        c.setFillColor(self._hex("#f8fafc"))
        c.setStrokeColor(self._hex("#e2e8f0"))
        c.setLineWidth(0.5)
        c.roundRect(x, y, w, h, 6, fill=1, stroke=1)
        
        # Col 1: Rata-rata Skor Kabupaten
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(self._hex(SENTER_COLORS["neutral"]))
        c.drawString(x + 15, y + 42, "RATA-RATA SKOR KABUPATEN")
        c.setFont("Helvetica-Bold", 16)
        c.setFillColor(self._hex("#0a6c74"))
        c.drawString(x + 15, y + 16, f"{avg_skor:.2f}")
        
        # Col dividers
        c.setStrokeColor(self._hex("#e2e8f0"))
        c.setLineWidth(0.5)
        c.line(x + 160, y + 10, x + 160, y + 52)
        
        # Col 2: Instansi Terbaik (Rank #1)
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(self._hex(SENTER_COLORS["neutral"]))
        c.drawString(x + 175, y + 42, "INSTANSI TERBAIK (RANK #1)")
        if best_opd:
            c.setFont("Helvetica-Bold", 8)
            c.setFillColor(self._hex("#15803d"))
            c.drawString(x + 175, y + 26, best_opd.nama_opd[:28])
            c.setFont("Helvetica", 7.5)
            c.setFillColor(self._hex(SENTER_COLORS["neutral"]))
            c.drawString(x + 175, y + 14, f"Skor Kepatuhan: {best_opd.total_skor:.2f}")
            
        c.line(x + 350, y + 10, x + 350, y + 52)
        
        # Col 3: Skor Terbawah
        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(self._hex(SENTER_COLORS["neutral"]))
        c.drawString(x + 365, y + 42, "SKOR TERBAWAH")
        if worst_opd:
            c.setFont("Helvetica-Bold", 8)
            c.setFillColor(self._hex("#dc2626"))
            c.drawString(x + 365, y + 26, worst_opd.nama_opd[:28])
            c.setFont("Helvetica", 7.5)
            c.setFillColor(self._hex(SENTER_COLORS["neutral"]))
            c.drawString(x + 365, y + 14, f"Skor Kepatuhan: {worst_opd.total_skor:.2f}")

    def _render_pembinaan_box(self, x, y, w, h):
        c = self.c
        c.setFillColor(self._hex("#fef2f2"))
        c.setStrokeColor(self._hex("#fecaca"))
        c.setLineWidth(0.5)
        c.roundRect(x, y, w, h, 6, fill=1, stroke=1)
        
        c.setFillColor(self._hex("#dc2626"))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 10, y + h - 14, "OPD YANG MEMERLUKAN PEMBINAAN")
        
        c.setFont("Helvetica-Bold", 6.5)
        c.setFillColor(self._hex("#991b1b"))
        for i, opd in enumerate(self.data.bottom_5[:5]):
            y_pos = y + h - 26 - i * 10
            c.drawString(x + 12, y_pos, f"{i + 1}. {opd.nama_opd[:34]}")
            c.drawRightString(x + w - 12, y_pos, f"{opd.total_skor:.1f}")

    def _render_terbaik_box(self, x, y, w, h):
        c = self.c
        c.setFillColor(self._hex("#f0fdf4"))
        c.setStrokeColor(self._hex("#bbf7d0"))
        c.setLineWidth(0.5)
        c.roundRect(x, y, w, h, 6, fill=1, stroke=1)
        
        c.setFillColor(self._hex("#15803d"))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 10, y + h - 14, "OPD TERBAIK")
        
        c.setFont("Helvetica-Bold", 6.5)
        c.setFillColor(self._hex("#166534"))
        for i, opd in enumerate(self.data.top_5[:5]):
            y_pos = y + h - 26 - i * 10
            c.drawString(x + 12, y_pos, f"{i + 1}. {opd.nama_opd[:34]}")
            c.drawRightString(x + w - 12, y_pos, f"{opd.total_skor:.1f}")

    def _render_public_services_grid(self, x, y, w, h):
        c = self.c
        
        # Find 6 key public service OPDs
        def find_opd(kw):
            for o in self.data.ranking_total_skor:
                if kw.lower() in o.nama_opd.lower():
                    return o
            return None
            
        targets = [
            ("Dinas Kesehatan", "kesehatan"),
            ("RSUD Lakipadada", "rsud"),
            ("Dinas Pendidikan", "pendidikan"),
            ("Dispendukcapil", "kependudukan"),
            ("Dinas Perhubungan", "perhubungan"),
            ("Dinas Sosial", "sosial")
        ]
        
        opd_data = []
        for label, kw in targets:
            o = find_opd(kw)
            if o:
                opd_data.append((label, o.total_skor, o.kategori))
            else:
                opd_data.append((label, 0.0, "KURANG"))
                
        # Outer Card Container
        c.setFillColor(self._hex("#f8fafc"))
        c.setStrokeColor(self._hex("#e2e8f0"))
        c.setLineWidth(0.5)
        c.roundRect(x, y, w, h, 6, fill=1, stroke=1)
        
        # Section Header (Tahap 8: Fixed Typo PEMANTAUAN)
        c.setFillColor(self._hex(SENTER_COLORS["primary_dark"]))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 12, y + h - 16, "PEMANTAUAN DISIPLIN PELAYANAN PUBLIK UTAMA")
        
        # 3 columns x 2 rows
        col_w = (w - 30) / 3
        row_h = 24
        
        for i, (label, score, kategori) in enumerate(opd_data):
            col_idx = i % 3
            row_idx = i // 3
            
            item_x = x + 15 + col_idx * col_w
            item_y = y + h - 38 - row_idx * row_h
            
            # Draw category color dot
            dot_color = KATEGORI_COLOR_MAP.get(kategori, SENTER_COLORS["neutral"])
            c.setFillColor(self._hex(dot_color))
            c.roundRect(item_x, item_y + 1, 6, 6, 1.5, fill=1, stroke=0)
            
            # Draw label name
            c.setFillColor(self._hex("#1e293b"))
            c.setFont("Helvetica-Bold", 7.5)
            c.drawString(item_x + 12, item_y + 1, label)
            
            # Draw score details
            c.setFillColor(self._hex(dot_color))
            c.setFont("Helvetica-Bold", 7.5)
            c.drawString(item_x + 12, item_y - 7, f"Skor Kepatuhan: {score:.2f}")

    # ─── REUSABLE COMPONENTS ────────────────────────────────────────────

    def _page_title(self, title: str):
        c = self.c
        top_y = PAGE_H - MARGIN
        
        # Subtle light top header band container
        c.setFillColor(self._hex("#f8fafc"))
        c.setStrokeColor(self._hex("#e2e8f0"))
        c.setLineWidth(0.5)
        c.roundRect(MARGIN, top_y - 28, BODY_W, 28, 4, fill=1, stroke=1)
        
        # Left title text
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(self._hex(SENTER_COLORS["primary_dark"]))
        c.drawString(MARGIN + 10, top_y - 18, title)
        
        # Right metadata info
        c.setFont("Helvetica", 7)
        c.setFillColor(self._hex(SENTER_COLORS["neutral"]))
        c.drawRightString(PAGE_W - MARGIN - 10, top_y - 18, f"Periode: {self.data.bulan_name.title()} {self.data.tahun} | Sumber: SIMPEGNAS")

    def _render_ranking_table(
        self, x, y, w, title, data, sort_key, ascending=False, max_rows=26,
    ):
        c = self.c
        row_h = 13.5
        header_h = 20
        total_h = header_h + max_rows * row_h

        # Outer border card container
        c.setFillColor(self._hex("#ffffff"))
        c.setStrokeColor(self._hex("#e2e8f0"))
        c.setLineWidth(0.5)
        c.roundRect(x, y - total_h, w, total_h, 6, fill=1, stroke=1)

        # Header background
        c.setFillColor(self._hex("#f1f5f9"))
        c.rect(x + 0.25, y - header_h, w - 0.5, header_h - 0.25, fill=1, stroke=0)
        
        # Header text
        c.setFillColor(self._hex("#334155"))
        c.setFont("Helvetica-Bold", 7.5)
        c.drawString(x + 8, y - header_h + 7, title)

        for rank, opd in enumerate(data[:max_rows]):
            row_y = y - header_h - (rank + 1) * row_h

            # Alternating rows
            if rank % 2 == 1:
                c.setFillColor(self._hex("#f8fafc"))
                c.rect(x + 0.25, row_y + 0.25, w - 0.5, row_h - 0.5, fill=1, stroke=0)

            # Very thin divider
            if rank < max_rows - 1:
                c.setStrokeColor(self._hex("#f1f5f9"))
                c.setLineWidth(0.3)
                c.line(x, row_y, x + w, row_y)

            # Number badge
            c.setFillColor(self._hex("#64748b"))
            c.setFont("Helvetica-Bold", 6.5)
            c.drawString(x + 8, row_y + 3.5, f"{rank + 1}")

            # OPD name - increased to 75 characters since width is now full-width (515)
            c.setFillColor(self._hex("#1e293b"))
            c.setFont("Helvetica", 7)
            c.drawString(x + 22, row_y + 3.5, opd.nama_opd[:75])

            # Value with color category
            val = getattr(opd, sort_key)
            c.setFont("Helvetica-Bold", 7)
            kat_color = KATEGORI_COLOR_MAP.get(opd.kategori, SENTER_COLORS["neutral"])
            suffix = "%" if "persentase" in sort_key else ""
            c.setFillColor(self._hex(kat_color))
            c.drawRightString(x + w - 10, row_y + 3.5, f"{val:.2f}{suffix}")

    def _highlight_top_bottom(self, x, y, w, subtitle, items, key, danger=False):
        c = self.c
        h = 54
        
        # Light styling cards matching visual guidelines
        if danger:
            bg_color = "#fef2f2"       # bg-red-50
            border_color = "#fecaca"   # border-red-200
            text_color = "#991b1b"     # text-red-800
            title_color = "#dc2626"    # text-red-600
        else:
            bg_color = "#f0fdf4"       # bg-green-50
            border_color = "#bbf7d0"   # border-green-200
            text_color = "#166534"     # text-green-800
            title_color = "#15803d"    # text-green-600
            
        c.setFillColor(self._hex(bg_color))
        c.setStrokeColor(self._hex(border_color))
        c.setLineWidth(0.5)
        c.roundRect(x, y - h, w, h, 6, fill=1, stroke=1)

        c.setFillColor(self._hex(title_color))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(x + 10, y - 14, subtitle)

        c.setFont("Helvetica-Bold", 7)
        c.setFillColor(self._hex(text_color))
        for i, item in enumerate(items[:3]):
            val = getattr(item, key)
            y_row = y - 26 - i * 9
            c.drawString(
                x + 12, y_row,
                f"{i + 1}. {item.nama_opd[:34]}",
            )
            suffix = "%" if "persentase" in key else ""
            c.drawRightString(
                x + w - 12, y_row,
                f"{val:.2f}{suffix}"
            )

    def _render_score_table(self, x, y, w, data):
        c = self.c
        header_h = 18
        row_h = 13.5
        max_rows = 26
        total_h = header_h + max_rows * row_h
        
        # Outer border container
        c.setFillColor(self._hex("#ffffff"))
        c.setStrokeColor(self._hex("#e2e8f0"))
        c.setLineWidth(0.5)
        c.roundRect(x, y - total_h, w, total_h, 6, fill=1, stroke=1)

        cols = [
            ("No", 25), ("Nama Instansi / OPD", 210),
            ("Hadir", 45), ("Kepatuhan", 52),
            ("Alpa", 45), ("Efektif", 45),
            ("Total", 43), ("Kategori", 50),
        ]

        # Header background
        c.setFillColor(self._hex("#f1f5f9"))
        c.rect(x + 0.25, y - header_h, w - 0.5, header_h - 0.25, fill=1, stroke=0)
        
        col_x = x
        c.setFillColor(self._hex("#334155"))
        c.setFont("Helvetica-Bold", 7)
        for label, cw in cols:
            c.drawString(col_x + 6, y - header_h + 6, label)
            col_x += cw

        for rank, opd in enumerate(data[:max_rows]):
            row_y = y - header_h - (rank + 1) * row_h

            # Alternating row bg
            if rank % 2 == 1:
                c.setFillColor(self._hex("#f8fafc"))
                c.rect(x + 0.25, row_y + 0.25, w - 0.5, row_h - 0.5, fill=1, stroke=0)

            # Divider line
            if rank < max_rows - 1:
                c.setStrokeColor(self._hex("#f1f5f9"))
                c.setLineWidth(0.3)
                c.line(x, row_y, x + w, row_y)

            col_x = x
            # Number
            c.setFont("Helvetica-Bold", 6.5)
            c.setFillColor(self._hex("#64748b"))
            c.drawString(col_x + 6, row_y + 3.5, str(rank + 1))
            col_x += 25

            # OPD name - increased to 42 characters since width is now full-width (515)
            c.setFillColor(self._hex("#1e293b"))
            c.setFont("Helvetica", 7)
            c.drawString(col_x + 6, row_y + 3.5, opd.nama_opd[:42])
            col_x += 210

            c.setFont("Helvetica-Bold", 7)
            vals = [
                (opd.skor_kehadiran, 45),
                (opd.skor_kepatuhan_jam_kerja, 52),
                (opd.skor_ketidakhadiran, 45),
                (opd.skor_hadir_efektif, 45),
            ]
            for val, vw in vals:
                c.setFillColor(self._hex(SENTER_COLORS["primary_dark"]))
                c.drawString(col_x + 8, row_y + 3.5, f"{val:.1f}")
                col_x += vw

            total_color = KATEGORI_COLOR_MAP.get(opd.kategori, SENTER_COLORS["neutral"])
            c.setFillColor(self._hex(total_color))
            c.drawString(col_x + 8, row_y + 3.5, f"{opd.total_skor:.2f}")
            col_x += 43

            kat_label = opd.kategori.replace("_", " ").title()
            c.drawString(col_x + 6, row_y + 3.5, kat_label[:14])

    def _render_insight_card(self, x, y, w, h, title, text):
        c = self.c
        
        # Background card
        c.setFillColor(self._hex("#f8fafc"))
        c.setStrokeColor(self._hex("#e2e8f0"))
        c.setLineWidth(0.5)
        c.roundRect(x, y, w, h, 6, fill=1, stroke=1)
        
        # Title
        c.setFillColor(self._hex(SENTER_COLORS["primary_dark"]))
        c.setFont("Helvetica-Bold", 8.5)
        c.drawString(x + 12, y + h - 16, title)
        
        # Dynamic text wrap paragraph instead of bullet points (Tahap 6)
        c.setFillColor(self._hex("#334155"))
        line_spacing = 11
        if h > 80:
            line_spacing = 12  # More breathing room for larger catatans
            
        self._draw_wrapped_text(
            x + 16, y + h - 30, w - 32,
            text,
            line_height=line_spacing,
            font_name="Helvetica",
            font_size=7.5
        )

    # ─── CHARTS ─────────────────────────────────────────────────────────

    def _generate_pie_chart(self) -> str:
        dist = self.data.distribusi_kategori
        labels = ["Sangat Disiplin", "Disiplin", "Cukup", "Kurang"]
        sizes = [dist["SANGAT_DISIPLIN"], dist["DISIPLIN"], dist["CUKUP"], dist["KURANG"]]
        colors = ["#15803d", "#22c55e", "#eab308", "#dc2626"]

        fig, ax = plt.subplots(figsize=(2.8, 2.8))
        wedges, texts, autotexts = ax.pie(
            sizes, labels=None, colors=colors, autopct="%1.0f%%",
            startangle=90, wedgeprops={"edgecolor": "white", "linewidth": 2},
        )
        ax.axis("equal")
        ax.legend(wedges, labels, loc="center left", bbox_to_anchor=(0.95, 0.5), fontsize=7, frameon=False)
        for t in autotexts:
            t.set_fontsize(7.5)
            t.set_color("white")
            t.set_weight("bold")

        path = tempfile.mktemp(suffix=".png")
        plt.savefig(path, dpi=150, bbox_inches="tight", transparent=True)
        plt.close(fig)
        self.temp_files.append(path)
        return path

    def _generate_bar_chart(self) -> str:
        top5 = self.data.top_5[:5]
        bottom5 = self.data.bottom_5[:5]
        
        # Subplots: Top 5 on Left (Upwards), Bottom 5 on Right (Downwards)
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(4.0, 2.2), sharey=False)
        fig.patch.set_facecolor('none')  # Transparent background
        
        ranks = [f"R{i+1}" for i in range(5)]
        top_scores = [opd.total_skor for opd in top5]
        bottom_scores = [opd.total_skor for opd in bottom5]
        
        # Left Subplot: Top 5 (Green, Up)
        ax1.bar(ranks, top_scores, color="#15803d", width=0.45, edgecolor="white", linewidth=0.5)
        ax1.set_ylim(0, 110)
        ax1.spines['top'].set_visible(False)
        ax1.spines['right'].set_visible(False)
        ax1.spines['left'].set_color('#cbd5e1')
        ax1.spines['bottom'].set_color('#cbd5e1')
        ax1.tick_params(colors='#475569', labelsize=6.5)
        ax1.set_title("Top 5 Terbaik (Skor)", fontsize=7.5, fontweight="bold", color="#0f766e")
        ax1.grid(axis='y', linestyle='--', linewidth=0.5, alpha=0.5)
        
        # Right Subplot: Lower 5 (Red, Down)
        neg_bottom_scores = [-val for val in bottom_scores]
        ax2.bar(ranks, neg_bottom_scores, color="#dc2626", width=0.45, edgecolor="white", linewidth=0.5)
        ax2.set_ylim(-110, 0)
        ax2.spines['bottom'].set_visible(False)
        ax2.spines['right'].set_visible(False)
        ax2.spines['top'].set_color('#cbd5e1')
        ax2.spines['left'].set_color('#cbd5e1')
        ax2.tick_params(colors='#475569', labelsize=6.5)
        
        # Format ticks to show positive values on y-axis for down bars
        import matplotlib.ticker as ticker
        ax2.yaxis.set_major_formatter(ticker.FuncFormatter(lambda val, pos: f"{abs(val):.0f}"))
        
        ax2.set_title("Lower 5 Terbawah (Skor)", fontsize=7.5, fontweight="bold", color="#991b1b")
        ax2.grid(axis='y', linestyle='--', linewidth=0.5, alpha=0.5)
        
        plt.tight_layout()
        path = tempfile.mktemp(suffix=".png")
        plt.savefig(path, dpi=150, bbox_inches="tight", transparent=True)
        plt.close(fig)
        self.temp_files.append(path)
        return path
