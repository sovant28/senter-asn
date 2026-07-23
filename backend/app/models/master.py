from datetime import datetime, timezone
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

if TYPE_CHECKING:
    pass


class OPD(Base):
    __tablename__ = "opd"
    __table_args__ = {"schema": "master"}

    id: Mapped[int] = mapped_column(primary_key=True)
    kode_opd: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    nama_opd: Mapped[str] = mapped_column(String(200), nullable=False)
    tipe_opd: Mapped[str] = mapped_column(String(20), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    catatan_khusus: Mapped[str | None] = mapped_column(String(500))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    pegawais: Mapped[list["Pegawai"]] = relationship(back_populates="opd")
    users: Mapped[list["User"]] = relationship(back_populates="opd")


class Pegawai(Base):
    __tablename__ = "pegawai"
    __table_args__ = {"schema": "master"}

    id: Mapped[int] = mapped_column(primary_key=True)
    nip: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    nama: Mapped[str] = mapped_column(String(200), nullable=False)
    opd_id: Mapped[int] = mapped_column(
        ForeignKey("master.opd.id"), nullable=False
    )
    jenis_asn: Mapped[str] = mapped_column(String(10), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    opd: Mapped["OPD"] = relationship(back_populates="pegawais")


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "master"}

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nama_lengkap: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(30), nullable=False)
    opd_id: Mapped[int | None] = mapped_column(ForeignKey("master.opd.id"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    mfa_secret: Mapped[str | None] = mapped_column(String(100))
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    opd: Mapped["OPD | None"] = relationship(back_populates="users")
