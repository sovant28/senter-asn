"""Seed Supabase database with dummy data.

Usage: python scripts/seed-supabase.py

Assumes alembic migration already applied (schema exists).
Reads CSV + Excel from samples/ and inserts into Supabase.

DATABASE_URL_SYNC env var must be set (or pass via --url).
"""

import csv
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

import bcrypt
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

from app.models.master import OPD, Pegawai, User
from app.models.presensi import PresensiRaw, PresensiAgregatOPD, UploadLog
from app.schemas.presensi import EXCEL_HEADER_COLS
from app.services.excel_parser import ExcelPresensiParser
from app.services.analytics import (
    AnalyticsService,
    hitung_counter_agregat,
    hitung_persentase,
    hitung_skor,
    tentukan_kategori,
)
from app.schemas.analytics import PresensiRowAggr

SUPABASE_URL = os.getenv("DATABASE_URL_SYNC", "")

if not SUPABASE_URL:
    print("ERROR: DATABASE_URL_SYNC env var not set.")
    print("Example:")
    print("  export DATABASE_URL_SYNC='postgresql://user:pass@host:5432/dbname'")
    sys.exit(1)

print(f"Connecting to: {SUPABASE_URL[:50]}...")
engine = create_engine(SUPABASE_URL, echo=False)
session = Session(engine)

SAMPLES = ROOT / "samples"
TAHUN = 2026
BULAN = 5


def seed_opd():
    path = SAMPLES / "master-opd.csv"
    if not path.exists():
        print("  SKIP: master-opd.csv not found")
        return

    count = 0
    with open(path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            existing = session.query(OPD).filter_by(kode_opd=row["kode_opd"]).first()
            if existing:
                continue
            opd = OPD(
                kode_opd=row["kode_opd"],
                nama_opd=row["nama_opd"],
                tipe_opd=row["tipe_opd"],
                is_active=row.get("is_active", "true") == "true",
            )
            session.add(opd)
            count += 1

    session.commit()
    print(f"  OPD: {count} inserted")


def seed_pegawai():
    path = SAMPLES / "master-pegawai.csv"
    if not path.exists():
        print("  SKIP: master-pegawai.csv not found")
        return

    opd_map = {o.kode_opd: o for o in session.query(OPD).all()}
    count = 0

    with open(path) as f:
        reader = csv.DictReader(f)
        for row in reader:
            nip = row["nip"].strip()
            existing = session.query(Pegawai).filter_by(nip=nip).first()
            if existing:
                continue

            kode = row["kode_opd"].strip()
            opd = opd_map.get(kode)
            if not opd:
                print(f"  WARN: OPD not found: {kode}")
                continue

            pgw = Pegawai(
                nip=nip,
                nama=row["nama"].strip(),
                opd_id=opd.id,
                jenis_asn=row["jenis_asn"].strip(),
            )
            session.add(pgw)
            count += 1

    session.commit()
    print(f"  Pegawai: {count} inserted")


def seed_admin():
    existing = session.query(User).filter_by(username="admin").first()
    if existing:
        print("  ADMIN: already exists, skip")
        return

    password = "AdminSenter2026!"
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    admin = User(
        username="admin",
        email="admin@bkpsdm-tanatoraja.go.id",
        password_hash=hashed,
        nama_lengkap="Administrator SENTER ASN",
        role="SUPER_ADMIN",
    )
    session.add(admin)
    session.commit()

    print(f"  ADMIN: created (username=admin, password={password})")
    print("  ⚠️  Ganti password setelah login pertama!")


def seed_hr():
    existing = session.query(User).filter_by(username="hr").first()
    if existing:
        print("  HR: already exists, skip")
        return

    hr_user = User(
        username="hr",
        email="hr@bkpsdm-tanatoraja.go.id",
        password_hash=bcrypt.hashpw("HrSenter2026!".encode(), bcrypt.gensalt()).decode(),
        nama_lengkap="HR Manager",
        role="HR_MANAGER",
    )
    session.add(hr_user)
    session.commit()
    print("  HR: created (username=hr, password=HrSenter2026!)")


def seed_presensi():
    xlsx_path = SAMPLES / "dummy-presensi-1000rows.xlsx"
    if not xlsx_path.exists():
        print("  SKIP: dummy-presensi-1000rows.xlsx not found")
        return

    pegawai_map = {}
    for p in session.query(Pegawai).all():
        key = (p.nip, p.nama)
        pegawai_map[p.nip] = p
        pegawai_map[p.nama] = p

    parser = ExcelPresensiParser()
    result = parser.parse(str(xlsx_path))

    upload_log = UploadLog(
        id=UUID("a0000000-0000-0000-0000-000000000001"),
        uploaded_by=1,
        file_hash_sha256=result.metadata.file_hash,
        file_size_bytes=result.metadata.file_size_bytes,
        file_name_original="dummy-presensi-1000rows.xlsx",
        rows_imported=result.metadata.success_rows,
        rows_rejected=result.metadata.error_rows,
        status="SUCCESS",
        tahun=TAHUN,
        bulan=BULAN,
        started_at=datetime.now(timezone.utc),
        finished_at=datetime.now(timezone.utc),
    )
    session.add(upload_log)

    inserted = 0
    for row in result.rows:
        pgw = pegawai_map.get(row.nip) or pegawai_map.get(row.nama)
        if not pgw:
            continue

        raw = PresensiRaw(
            upload_id=upload_log.id,
            pegawai_id=pgw.id,
            tahun=TAHUN,
            bulan=BULAN,
            tm1=row.tm1, tm2=row.tm2, tm3=row.tm3,
            pc1=row.pc1, pc2=row.pc2, pc3=row.pc3,
            tmm=row.tm1 + row.tm2 + row.tm3,
            pcm=row.pc1 + row.pc2 + row.pc3,
            hn=row.hn, dl=row.dl, tk=row.tk, tb=row.tb,
            itm=row.itm, ipc=row.ipc, idli=row.idli, idlo=row.idlo,
            itmpc=row.itmpc, idl=row.idl,
            ct=row.ct, cs=row.cs, cb=row.cb, cm=row.cm, ckap=row.ckap,
            lj=row.lj, ln=row.ln,
        )
        session.add(raw)
        inserted += 1

    session.commit()
    print(f"  Presensi raw: {inserted} rows")
    print(f"  Upload log id: {upload_log.id}")


def seed_agregat():
    existing = session.query(PresensiAgregatOPD).filter_by(
        tahun=TAHUN, bulan=BULAN
    ).first()
    if existing:
        print("  AGREGAT: already exists, skip")
        return

    from sqlalchemy import select
    from app.models.master import OPD as OPDModel, Pegawai as PgwModel
    from app.models.presensi import PresensiRaw as PRModel

    opds = session.query(OPDModel).filter_by(is_active=True).all()
    hari_kerja = 22
    upload_id = UUID("a0000000-0000-0000-0000-000000000001")
    count = 0

    for opd in opds:
        rows = (
            session.query(
                PRModel.pegawai_id,
                PgwModel.opd_id,
                PgwModel.jenis_asn,
                PRModel.hn,
                PRModel.dl,
                PRModel.tk,
                PRModel.tb,
                PRModel.tm1,
                PRModel.tm2,
                PRModel.tm3,
                PRModel.pc1,
                PRModel.pc2,
                PRModel.pc3,
            )
            .join(PgwModel, PRModel.pegawai_id == PgwModel.id)
            .filter(
                PgwModel.opd_id == opd.id,
                PRModel.tahun == TAHUN,
                PRModel.bulan == BULAN,
            )
            .all()
        )

        if not rows:
            continue

        aggr_rows = [
            PresensiRowAggr(
                pegawai_id=r.pegawai_id,
                opd_id=r.opd_id,
                jenis_asn=r.jenis_asn,
                hn=r.hn or 0,
                dl=r.dl or 0,
                tk=r.tk or 0,
                tb=r.tb or 0,
                tm1=r.tm1 or 0,
                tm2=r.tm2 or 0,
                tm3=r.tm3 or 0,
                pc1=r.pc1 or 0,
                pc2=r.pc2 or 0,
                pc3=r.pc3 or 0,
            )
            for r in rows
        ]

        counter = hitung_counter_agregat(aggr_rows, hari_kerja)
        if counter.total_kewajiban_hadir == 0:
            continue

        persen = hitung_persentase(counter)
        skor = hitung_skor(persen)
        kategori = tentukan_kategori(skor.total_skor)

        agregat = PresensiAgregatOPD(
            upload_id=upload_id,
            opd_id=opd.id,
            tahun=TAHUN,
            bulan=BULAN,
            pns=counter.pns,
            pppk=counter.pppk,
            pppk_pw=counter.pppk_pw,
            jumlah_asn=counter.jumlah_asn,
            hari_kerja=counter.hari_kerja,
            total_kewajiban_hadir=counter.total_kewajiban_hadir,
            jumlah_hadir=counter.jumlah_hadir,
            jumlah_terlambat=counter.jumlah_terlambat,
            jumlah_pulang_cepat=counter.jumlah_pulang_cepat,
            jumlah_tidak_hadir=counter.jumlah_tidak_hadir,
            jumlah_hadir_normal=counter.jumlah_hadir_normal,
            persentase_kehadiran=persen.persentase_kehadiran,
            persentase_pelanggaran=persen.persentase_pelanggaran,
            persentase_hadir_efektif=persen.persentase_hadir_efektif,
            persentase_ketidakhadiran=persen.persentase_ketidakhadiran,
            nilai_kepatuhan_jam_kerja=skor.nilai_kepatuhan_jam_kerja,
            nilai_ketidakhadiran=skor.nilai_ketidakhadiran,
            skor_kehadiran=skor.skor_kehadiran,
            skor_kepatuhan_jam_kerja=skor.skor_kepatuhan_jam_kerja,
            skor_ketidakhadiran=skor.skor_ketidakhadiran,
            skor_hadir_efektif=skor.skor_hadir_efektif,
            total_skor=skor.total_skor,
            kategori=kategori,
        )
        session.add(agregat)
        count += 1

    session.commit()
    print(f"  Presensi agregat: {count} OPD")

    session.execute(
        text("""
            UPDATE presensi.presensi_agregat_opd t
            SET
                ranking_kehadiran = sub.rk,
                ranking_pelanggaran = sub.rp,
                ranking_total_skor = sub.rt
            FROM (
                SELECT
                    id,
                    RANK() OVER (PARTITION BY tahun, bulan ORDER BY persentase_kehadiran DESC) AS rk,
                    RANK() OVER (PARTITION BY tahun, bulan ORDER BY persentase_pelanggaran ASC) AS rp,
                    RANK() OVER (PARTITION BY tahun, bulan ORDER BY total_skor DESC) AS rt
                FROM presensi.presensi_agregat_opd
                WHERE tahun = :tahun AND bulan = :bulan
            ) sub
            WHERE t.id = sub.id
        """),
        {"tahun": TAHUN, "bulan": BULAN},
    )
    session.commit()
    print(f"  Rankings updated")


def main():
    print("=== SEEDING SUPABASE ===")
    seed_opd()
    seed_pegawai()
    seed_admin()
    seed_hr()
    seed_presensi()
    seed_agregat()

    session.close()
    print()
    print("=== DONE ===")
    print()
    print("Summary:")
    opd_count = session.query(OPD).count()
    pgw_count = session.query(Pegawai).count()
    raw_count = session.query(PresensiRaw).filter_by(tahun=TAHUN, bulan=BULAN).count()
    aggr_count = session.query(PresensiAgregatOPD).filter_by(tahun=TAHUN, bulan=BULAN).count()
    session.close()
    print(f"  OPD:     {opd_count}")
    print(f"  Pegawai: {pgw_count}")
    print(f"  Presensi raw: {raw_count} rows")
    print(f"  Presensi agregat: {aggr_count} OPDs")
    print()
    print("Login: username=admin password=AdminSenter2026!")


if __name__ == "__main__":
    main()
