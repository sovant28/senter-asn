"""Initial schema

Revision ID: 001
Revises:
Create Date: 2026-07-14
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.execute("CREATE SCHEMA IF NOT EXISTS master")
    op.execute("CREATE SCHEMA IF NOT EXISTS presensi")
    op.execute("CREATE SCHEMA IF NOT EXISTS audit")

    op.create_table(
        "opd",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("kode_opd", sa.String(20), unique=True, nullable=False),
        sa.Column("nama_opd", sa.String(200), nullable=False),
        sa.Column("tipe_opd", sa.String(20), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", default=True),
        sa.Column("catatan_khusus", sa.String(500)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        schema="master",
    )
    op.create_index("idx_opd_kode", "opd", ["kode_opd"], schema="master")

    op.create_table(
        "pegawai",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("nip", sa.String(20), unique=True, nullable=False),
        sa.Column("nama", sa.String(200), nullable=False),
        sa.Column("opd_id", sa.Integer(), sa.ForeignKey("master.opd.id"), nullable=False),
        sa.Column("jenis_asn", sa.String(10), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", default=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        schema="master",
    )
    op.create_index("idx_pegawai_nip", "pegawai", ["nip"], schema="master")
    op.create_index("idx_pegawai_opd", "pegawai", ["opd_id"], schema="master")

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(50), unique=True, nullable=False),
        sa.Column("email", sa.String(200), unique=True, nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("nama_lengkap", sa.String(200), nullable=False),
        sa.Column("role", sa.String(30), nullable=False),
        sa.Column("opd_id", sa.Integer(), sa.ForeignKey("master.opd.id")),
        sa.Column("is_active", sa.Boolean(), server_default="true", default=True),
        sa.Column("mfa_secret", sa.String(100)),
        sa.Column("last_login", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        schema="master",
    )

    op.create_table(
        "upload_log",
        sa.Column(
            "id",
            postgresql.UUID(),
            primary_key=True,
            server_default=sa.func.gen_random_uuid(),
        ),
        sa.Column(
            "uploaded_by", sa.Integer(), sa.ForeignKey("master.users.id"), nullable=False
        ),
        sa.Column("file_hash_sha256", sa.String(64), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("file_name_original", sa.String(255), nullable=False),
        sa.Column("file_path_encrypted", sa.String(500)),
        sa.Column("rows_imported", sa.Integer(), nullable=False),
        sa.Column(
            "rows_rejected", sa.Integer(), server_default="0", default=0
        ),
        sa.Column("rejection_reasons", postgresql.JSONB()),
        sa.Column("status", sa.String(20), nullable=False),
        sa.Column("tahun", sa.SmallInteger()),
        sa.Column("bulan", sa.SmallInteger()),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("finished_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        schema="presensi",
    )

    op.create_table(
        "presensi_raw",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("upload_id", postgresql.UUID(), nullable=False),
        sa.Column(
            "pegawai_id",
            sa.Integer(),
            sa.ForeignKey("master.pegawai.id"),
            nullable=False,
        ),
        sa.Column("tahun", sa.SmallInteger(), nullable=False),
        sa.Column("bulan", sa.SmallInteger(), nullable=False),
        sa.Column("tm1", sa.Integer(), server_default="0", default=0),
        sa.Column("tm2", sa.Integer(), server_default="0", default=0),
        sa.Column("tm3", sa.Integer(), server_default="0", default=0),
        sa.Column("pc1", sa.Integer(), server_default="0", default=0),
        sa.Column("pc2", sa.Integer(), server_default="0", default=0),
        sa.Column("pc3", sa.Integer(), server_default="0", default=0),
        sa.Column("tmm", sa.Integer(), server_default="0", default=0),
        sa.Column("pcm", sa.Integer(), server_default="0", default=0),
        sa.Column("itm", sa.Integer(), server_default="0", default=0),
        sa.Column("ipc", sa.Integer(), server_default="0", default=0),
        sa.Column("idli", sa.Integer(), server_default="0", default=0),
        sa.Column("idlo", sa.Integer(), server_default="0", default=0),
        sa.Column("tk", sa.Integer(), server_default="0", default=0),
        sa.Column("tb", sa.Integer(), server_default="0", default=0),
        sa.Column("hn", sa.Integer(), server_default="0", default=0),
        sa.Column("itmpc", sa.Integer(), server_default="0", default=0),
        sa.Column("idl", sa.Integer(), server_default="0", default=0),
        sa.Column("dl", sa.Integer(), server_default="0", default=0),
        sa.Column("ct", sa.Integer(), server_default="0", default=0),
        sa.Column("cs", sa.Integer(), server_default="0", default=0),
        sa.Column("cb", sa.Integer(), server_default="0", default=0),
        sa.Column("cm", sa.Integer(), server_default="0", default=0),
        sa.Column("ckap", sa.Integer(), server_default="0", default=0),
        sa.Column("lj", sa.Integer(), server_default="0", default=0),
        sa.Column("ln", sa.Integer(), server_default="0", default=0),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint(
            "pegawai_id", "tahun", "bulan", "upload_id"
        ),
        schema="presensi",
    )
    op.create_index("idx_presensi_pegawai", "presensi_raw", ["pegawai_id"], schema="presensi")
    op.create_index("idx_presensi_periode", "presensi_raw", ["tahun", "bulan"], schema="presensi")

    op.create_table(
        "presensi_agregat_opd",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("upload_id", postgresql.UUID(), nullable=False),
        sa.Column(
            "opd_id", sa.Integer(), sa.ForeignKey("master.opd.id"), nullable=False
        ),
        sa.Column("tahun", sa.SmallInteger(), nullable=False),
        sa.Column("bulan", sa.SmallInteger(), nullable=False),
        sa.Column("pns", sa.Integer(), nullable=False),
        sa.Column("pppk", sa.Integer(), nullable=False),
        sa.Column("pppk_pw", sa.Integer(), nullable=False),
        sa.Column("jumlah_asn", sa.Integer(), nullable=False),
        sa.Column("hari_kerja", sa.Integer(), nullable=False),
        sa.Column("total_kewajiban_hadir", sa.Integer(), nullable=False),
        sa.Column("jumlah_hadir", sa.Integer(), nullable=False),
        sa.Column("jumlah_terlambat", sa.Integer(), nullable=False),
        sa.Column("jumlah_pulang_cepat", sa.Integer(), nullable=False),
        sa.Column("jumlah_tidak_hadir", sa.Integer(), nullable=False),
        sa.Column("jumlah_hadir_normal", sa.Integer(), nullable=False),
        sa.Column("persentase_kehadiran", sa.Numeric(5, 2), nullable=False),
        sa.Column("persentase_pelanggaran", sa.Numeric(5, 2), nullable=False),
        sa.Column("persentase_hadir_efektif", sa.Numeric(5, 2), nullable=False),
        sa.Column("persentase_ketidakhadiran", sa.Numeric(5, 2), nullable=False),
        sa.Column("nilai_kepatuhan_jam_kerja", sa.Numeric(5, 2), nullable=False),
        sa.Column("nilai_ketidakhadiran", sa.Numeric(5, 2), nullable=False),
        sa.Column("skor_kehadiran", sa.Numeric(5, 2), nullable=False),
        sa.Column("skor_kepatuhan_jam_kerja", sa.Numeric(5, 2), nullable=False),
        sa.Column("skor_ketidakhadiran", sa.Numeric(5, 2), nullable=False),
        sa.Column("skor_hadir_efektif", sa.Numeric(5, 2), nullable=False),
        sa.Column("total_skor", sa.Numeric(5, 2), nullable=False),
        sa.Column("kategori", sa.String(20), nullable=False),
        sa.Column("ranking_kehadiran", sa.Integer()),
        sa.Column("ranking_pelanggaran", sa.Integer()),
        sa.Column("ranking_total_skor", sa.Integer()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.UniqueConstraint("opd_id", "tahun", "bulan", "upload_id"),
        schema="presensi",
    )
    op.create_index("idx_agregat_periode", "presensi_agregat_opd", ["tahun", "bulan"], schema="presensi")
    op.create_index("idx_agregat_opd", "presensi_agregat_opd", ["opd_id"], schema="presensi")

    op.create_table(
        "access_log",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("master.users.id")),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("resource_type", sa.String(50)),
        sa.Column("resource_id", sa.String(100)),
        sa.Column("ip_address", postgresql.INET()),
        sa.Column("user_agent", sa.Text()),
        sa.Column("request_payload", postgresql.JSONB()),
        sa.Column("response_status", sa.Integer()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        schema="audit",
    )
    op.create_index("idx_audit_user", "access_log", ["user_id"], schema="audit")
    op.create_index("idx_audit_created", "access_log", ["created_at"], schema="audit")


def downgrade() -> None:
    op.drop_table("access_log", schema="audit")
    op.drop_table("presensi_agregat_opd", schema="presensi")
    op.drop_table("presensi_raw", schema="presensi")
    op.drop_table("upload_log", schema="presensi")
    op.drop_table("users", schema="master")
    op.drop_table("pegawai", schema="master")
    op.drop_table("opd", schema="master")
    op.execute("DROP SCHEMA IF EXISTS audit")
    op.execute("DROP SCHEMA IF EXISTS presensi")
    op.execute("DROP SCHEMA IF EXISTS master")
