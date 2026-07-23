from datetime import datetime
from uuid import UUID

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PresensiRaw(Base):
    __tablename__ = "presensi_raw"
    __table_args__ = (
        UniqueConstraint("pegawai_id", "tahun", "bulan", "upload_id"),
        {"schema": "presensi"},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    upload_id: Mapped[UUID] = mapped_column(PG_UUID, nullable=False)
    pegawai_id: Mapped[int] = mapped_column(
        ForeignKey("master.pegawai.id"), nullable=False
    )
    tahun: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    bulan: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    tm1: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    tm2: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    tm3: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    pc1: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    pc2: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    pc3: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    tmm: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    pcm: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    itm: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    ipc: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    idli: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    idlo: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    tk: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    tb: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    hn: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    itmpc: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    idl: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    dl: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    ct: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    cs: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    cb: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    cm: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    ckap: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    lj: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    ln: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class PresensiAgregatOPD(Base):
    __tablename__ = "presensi_agregat_opd"
    __table_args__ = (
        UniqueConstraint("opd_id", "tahun", "bulan", "upload_id"),
        {"schema": "presensi"},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    upload_id: Mapped[UUID] = mapped_column(PG_UUID, nullable=False)
    opd_id: Mapped[int] = mapped_column(
        ForeignKey("master.opd.id"), nullable=False
    )
    tahun: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    bulan: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    pns: Mapped[int] = mapped_column(Integer, nullable=False)
    pppk: Mapped[int] = mapped_column(Integer, nullable=False)
    pppk_pw: Mapped[int] = mapped_column(Integer, nullable=False)
    jumlah_asn: Mapped[int] = mapped_column(Integer, nullable=False)
    hari_kerja: Mapped[int] = mapped_column(Integer, nullable=False)

    total_kewajiban_hadir: Mapped[int] = mapped_column(Integer, nullable=False)
    jumlah_hadir: Mapped[int] = mapped_column(Integer, nullable=False)
    jumlah_terlambat: Mapped[int] = mapped_column(Integer, nullable=False)
    jumlah_pulang_cepat: Mapped[int] = mapped_column(Integer, nullable=False)
    jumlah_tidak_hadir: Mapped[int] = mapped_column(Integer, nullable=False)
    jumlah_hadir_normal: Mapped[int] = mapped_column(Integer, nullable=False)

    persentase_kehadiran: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    persentase_pelanggaran: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    persentase_hadir_efektif: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    persentase_ketidakhadiran: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)

    nilai_kepatuhan_jam_kerja: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    nilai_ketidakhadiran: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)

    skor_kehadiran: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    skor_kepatuhan_jam_kerja: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    skor_ketidakhadiran: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    skor_hadir_efektif: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    total_skor: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)

    kategori: Mapped[str] = mapped_column(String(20), nullable=False)

    ranking_kehadiran: Mapped[int | None] = mapped_column(Integer)
    ranking_pelanggaran: Mapped[int | None] = mapped_column(Integer)
    ranking_total_skor: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class UploadLog(Base):
    __tablename__ = "upload_log"
    __table_args__ = {"schema": "presensi"}

    id: Mapped[UUID] = mapped_column(
        PG_UUID, primary_key=True, server_default=func.gen_random_uuid()
    )
    uploaded_by: Mapped[int] = mapped_column(
        ForeignKey("master.users.id"), nullable=False
    )
    file_hash_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False)
    file_name_original: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path_encrypted: Mapped[str | None] = mapped_column(String(500))
    rows_imported: Mapped[int] = mapped_column(Integer, nullable=False)
    rows_rejected: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    rejection_reasons: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    tahun: Mapped[int | None] = mapped_column(SmallInteger)
    bulan: Mapped[int | None] = mapped_column(SmallInteger)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
