import csv
import os
import random
import sys
from pathlib import Path

from openpyxl import Workbook

ROOT = Path(__file__).resolve().parent.parent
SAMPLES = ROOT / "samples"

OPD_LIST = [
    ("DISDIK", "Dinas Pendidikan", "DINAS", 130),
    ("DINKES", "Dinas Kesehatan", "DINAS", 115),
    ("PUTR", "Dinas Pekerjaan Umum dan Tata Ruang", "DINAS", 60),
    ("PERTANIAN", "Dinas Pertanian", "DINAS", 50),
    ("PERIKANAN", "Dinas Perikanan", "DINAS", 35),
    ("LINGKUNGAN", "Dinas Lingkungan Hidup", "DINAS", 40),
    ("SOSIAL", "Dinas Sosial", "DINAS", 45),
    ("PERHUBUNGAN", "Dinas Perhubungan", "DINAS", 40),
    ("KOMINFO", "Dinas Komunikasi dan Informatika", "DINAS", 30),
    ("PARIWISATA", "Dinas Pariwisata", "DINAS", 25),
    ("KEBUDAYAAN", "Dinas Kebudayaan", "DINAS", 25),
    ("PORA", "Dinas Pemuda dan Olahraga", "DINAS", 25),
    ("PERDAGANGAN", "Dinas Perdagangan", "DINAS", 35),
    ("PERINDUSTRIAN", "Dinas Perindustrian", "DINAS", 30),
    ("TRANS", "Dinas Transmigrasi", "DINAS", 25),
    ("MASYARAKAT", "Dinas Pemberdayaan Masyarakat", "DINAS", 30),
    ("PEMBERDAYAAN", "Dinas Pemberdayaan Perempuan", "DINAS", 25),
    ("BKPSDM", "Badan Kepegawaian dan Pengembangan SDM", "BADAN", 40),
    ("BKUD", "Badan Keuangan Daerah", "BADAN", 45),
    ("BAPPEDA", "Badan Perencanaan Pembangunan Daerah", "BADAN", 35),
    ("BALITBANG", "Badan Penelitian dan Pengembangan", "BADAN", 30),
    ("KESBANGPOL", "Badan Kesatuan Bangsa dan Politik", "BADAN", 25),
    ("BPBD", "Badan Penanggulangan Bencana Daerah", "BADAN", 30),
    ("SETDA", "Sekretariat Daerah", "SEKRETARIAT", 90),
    ("SETWAN", "Sekretariat DPRD", "SEKRETARIAT", 35),
    ("INSPEKTORAT", "Inspektorat", "INSPEKTORAT", 30),
]

NAMA_DEPAN = [
    "Andi", "Budi", "Cici", "Dewi", "Eko", "Fitri", "Gunawan", "Heni",
    "Irfan", "Joko", "Kartika", "Lina", "Maman", "Nina", "Oki", "Putri",
    "Rudi", "Santi", "Tono", "Udin", "Vina", "Wawan", "Yanti", "Zaenal",
    "Agus", "Bambang", "Citra", "Dedi", "Eva", "Fajar", "Gilang", "Hadi",
    "Indra", "Jumadi", "Kusuma", "Lestari", "Mulyono", "Ningsih", "Omar",
]
NAMA_BELAKANG = [
    "Santoso", "Wijaya", "Pratama", "Kusuma", "Hartono", "Saputra", "Nugroho",
    "Setiawan", "Hidayat", "Sari", "Putra", "Maulana", "Susanto", "Permana",
    "Rahayu", "Utami", "Syafira", "Marpaung", "Tambunan", "Hasibuan",
    "Nasution", "Lubis", "Panggabean", "Situmorang", "Siregar", "Sinaga",
    "Pasaribu", "Tobing", "Palembangan", "Rantelino", "Tandi", "Banne",
    "Allo", "Rerung", "Sarira", "Palinggi", "Kalepu", "Salu", "Toding",
]

JENIS_ASN_WEIGHTS = [("PNS", 60), ("PPPK", 30), ("PPPK_PW", 10)]

HARI_KERJA_DEFAULT = 22
TAHUN = 2026
BULAN = 5


def init_output_dirs():
    SAMPLES.mkdir(parents=True, exist_ok=True)
    (ROOT / "scripts").mkdir(parents=True, exist_ok=True)


def generate_master_opd():
    path = SAMPLES / "master-opd.csv"
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["kode_opd", "nama_opd", "tipe_opd", "is_active"])
        for kode, nama, tipe, _ in OPD_LIST:
            w.writerow([kode, nama, tipe, "true"])
    return path


def generate_master_pegawai():
    pegawai_list = []
    pegawai_id = 1

    for kode_opd, nama_opd, _tipe, jml in OPD_LIST:
        for _ in range(jml):
            nip = "".join(str(random.randint(0, 9)) for _ in range(18))
            depan = random.choice(NAMA_DEPAN)
            belakang = random.choice(NAMA_BELAKANG)
            nama = f"{depan} {belakang}"
            jenis_asn = random.choices(
                [j[0] for j in JENIS_ASN_WEIGHTS],
                weights=[j[1] for j in JENIS_ASN_WEIGHTS],
            )[0]
            pegawai_list.append({
                "id": pegawai_id,
                "nip": nip,
                "nama": nama,
                "kode_opd": kode_opd,
                "jenis_asn": jenis_asn,
            })
            pegawai_id += 1

    path = SAMPLES / "master-pegawai.csv"
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["id", "nip", "nama", "kode_opd", "jenis_asn", "is_active"])
        for p in pegawai_list:
            w.writerow([p["id"], p["nip"], p["nama"], p["kode_opd"], p["jenis_asn"], "true"])

    return pegawai_list


def generate_presensi_row(pegawai, opd_kode_map):
    hn = 0
    tm1 = tm2 = tm3 = 0
    pc1 = pc2 = pc3 = 0
    dl = ct = cs = cb = cm = ckap = 0
    itm = ipc = idli = idlo = itmpc = idl = 0
    tk = tb = 0
    ln = lj = 0
    tmm = pcm = 0

    profile = random.random()
    if profile < 0.70:
        hn = random.randint(19, 22)
        tm1 = 0 if random.random() < 0.6 else random.randint(1, 2)
        pc1 = 0 if random.random() < 0.8 else 1
    elif profile < 0.90:
        hn = random.randint(16, 20)
        tm1 = random.randint(1, 4)
        pc1 = random.randint(1, 2)
        if random.random() < 0.3:
            tm2 = random.randint(1, 2)
    elif profile < 0.98:
        hn = random.randint(10, 16)
        tm1 = random.randint(3, 6)
        pc1 = random.randint(2, 4)
        tm2 = random.randint(1, 3)
        if random.random() < 0.3:
            tm3 = random.randint(1, 2)
        if random.random() < 0.3:
            pc2 = random.randint(1, 2)
    else:
        hn = random.randint(3, 10)
        tm1 = random.randint(5, 10)
        pc1 = random.randint(3, 7)
        tm2 = random.randint(2, 5)
        tm3 = random.randint(1, 3)
        pc2 = random.randint(1, 3)
        if random.random() < 0.4:
            pc3 = random.randint(1, 2)

    if random.random() < 0.15:
        dl = random.randint(3, 15)

    if random.random() < 0.05:
        ct = random.randint(2, 5)
    if random.random() < 0.03:
        cs = random.randint(1, 4)

    tmm = tm1 + tm2 + tm3
    pcm = pc1 + pc2 + pc3

    counter_sum = hn + dl + tk + tb + tm1 + tm2 + tm3 + pc1 + pc2 + pc3 + itm + ipc + idli + idlo + itmpc + idl + ct + cs + cb + cm + ckap
    if counter_sum > 31:
        if hn > 0:
            hn = max(0, hn - (counter_sum - 31))
            counter_sum = hn + dl + tk + tb + tm1 + tm2 + tm3 + pc1 + pc2 + pc3 + itm + ipc + idli + idlo + itmpc + idl + ct + cs + cb + cm + ckap
        if counter_sum > 31 and tm1 > 0:
            tm1 = max(0, tm1 - (counter_sum - 31))

    if pegawai["jenis_asn"] == "PPPK_PW" and random.random() < 0.3:
        pegawai["nip"] = None

    return [
        pegawai["id"],
        pegawai["nip"],
        pegawai["nama"],
        TAHUN,
        opd_kode_map.get(pegawai["kode_opd"], pegawai["kode_opd"]),
        BULAN,
        tm1, tm2, tm3, pc1, pc2, pc3, tmm, pcm,
        itm, ipc, idli, idlo, tk, tb, hn, itmpc,
        idl, dl, ct, cs, cb, cm, ckap, lj, ln,
    ]


HEADER_COLS = [
    "NO URUT", "NIP", "NAMA", "TAHUN", "UNIT KERJA", "BULAN",
    "TM1", "TM2", "TM3", "PC1", "PC2", "PC3", "TMM", "PCM",
    "ITM", "IPC", "IDLI", "IDLO", "TK", "TB", "HN", "ITMPC",
    "IDL", "DL", "CT", "CS", "CB", "CM", "CKAP", "LJ", "LN",
]


def generate_presensi_xlsx(pegawai_list):
    opd_kode_map = {k: n for k, n, _, _ in OPD_LIST}

    wb = Workbook()
    ws = wb.active
    ws.title = "Sheet1"
    ws.append(HEADER_COLS)

    for i, pegawai in enumerate(pegawai_list, start=1):
        row_data = [i] + generate_presensi_row(pegawai, opd_kode_map)[1:]
        ws.append(row_data)

    path = SAMPLES / "dummy-presensi-1000rows.xlsx"
    wb.save(path)
    wb.close()
    return path


def main():
    random.seed(42)
    init_output_dirs()

    opd_csv = generate_master_opd()
    pegawai_list = generate_master_pegawai()
    presensi_xlsx = generate_presensi_xlsx(pegawai_list)

    total_pegawai = len(pegawai_list)
    print(f"Generated master OPD:     {opd_csv} ({len(OPD_LIST)} OPDs)")
    print(f"Generated master pegawai: {SAMPLES / 'master-pegawai.csv'} ({total_pegawai} pegawai)")
    print(f"Generated presensi Excel: {presensi_xlsx} ({total_pegawai} rows)")
    print()
    print("Distribution by OPD:")
    opd_counts = {}
    for p in pegawai_list:
        opd_counts[p["kode_opd"]] = opd_counts.get(p["kode_opd"], 0) + 1
    for kode, count in sorted(opd_counts.items(), key=lambda x: -x[1]):
        print(f"  {kode:20s} {count:4d} ASN")
    print()
    print(f"  {'TOTAL':20s} {total_pegawai:4d} ASN")


if __name__ == "__main__":
    main()
