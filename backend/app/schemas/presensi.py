from dataclasses import dataclass, field
from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

PRESENSI_COUNTER_COLS = [
    "TM1", "TM2", "TM3", "PC1", "PC2", "PC3", "TMM", "PCM",
    "ITM", "IPC", "IDLI", "IDLO", "TK", "TB", "HN", "ITMPC",
    "IDL", "DL", "CT", "CS", "CB", "CM", "CKAP", "LJ", "LN",
]

EXCEL_HEADER_COLS = [
    "NO URUT", "NIP", "NAMA", "TAHUN", "UNIT KERJA", "BULAN",
] + PRESENSI_COUNTER_COLS


class PresensiRowData(BaseModel):
    model_config = {"populate_by_name": True}

    no_urut: int = Field(alias="NO URUT", gt=0)
    nip: Optional[str] = Field(alias="NIP", default=None)
    nama: str = Field(alias="NAMA", min_length=1, max_length=200)
    tahun: int = Field(alias="TAHUN", ge=2020, le=2030)
    unit_kerja: str = Field(alias="UNIT KERJA", min_length=1)
    bulan: int = Field(alias="BULAN", ge=1, le=12)

    tm1: int = Field(default=0, ge=0)
    tm2: int = Field(default=0, ge=0)
    tm3: int = Field(default=0, ge=0)
    pc1: int = Field(default=0, ge=0)
    pc2: int = Field(default=0, ge=0)
    pc3: int = Field(default=0, ge=0)
    tmm: int = Field(default=0, ge=0)
    pcm: int = Field(default=0, ge=0)
    itm: int = Field(default=0, ge=0)
    ipc: int = Field(default=0, ge=0)
    idli: int = Field(default=0, ge=0)
    idlo: int = Field(default=0, ge=0)
    tk: int = Field(default=0, ge=0)
    tb: int = Field(default=0, ge=0)
    hn: int = Field(default=0, ge=0)
    itmpc: int = Field(default=0, ge=0)
    idl: int = Field(default=0, ge=0)
    dl: int = Field(default=0, ge=0)
    ct: int = Field(default=0, ge=0)
    cs: int = Field(default=0, ge=0)
    cb: int = Field(default=0, ge=0)
    cm: int = Field(default=0, ge=0)
    ckap: int = Field(default=0, ge=0)
    lj: int = Field(default=0, ge=0)
    ln: int = Field(default=0, ge=0)

    @field_validator("nip", mode="before")
    @classmethod
    def coerce_none_nip(cls, v: Any) -> Optional[str]:
        if v is None or v == "" or (isinstance(v, float) and v != v):
            return None
        return str(v).strip()

    @field_validator("nip")
    @classmethod
    def validate_nip(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not (v.isdigit() and len(v) == 18):
            raise ValueError("NIP must be 18 digits or None")
        return v

    @field_validator("unit_kerja", mode="before")
    @classmethod
    def coerce_unit_kerja(cls, v: Any) -> str:
        if v is None:
            raise ValueError("UNIT KERJA cannot be empty")
        return str(v).strip()

    @field_validator(
        "tm1", "tm2", "tm3", "pc1", "pc2", "pc3", "tmm", "pcm",
        "itm", "ipc", "idli", "idlo", "tk", "tb", "hn", "itmpc",
        "idl", "dl", "ct", "cs", "cb", "cm", "ckap", "lj", "ln",
        mode="before",
    )
    @classmethod
    def coerce_counter(cls, v: Any) -> int:
        if v is None or v == "":
            return 0
        if isinstance(v, float) and v != v:
            return 0
        try:
            val = int(float(str(v)))
        except (ValueError, TypeError):
            raise ValueError(f"Counter must be integer, got: {v}")
        if val < 0:
            raise ValueError(f"Counter must be >= 0, got: {val}")
        return val


@dataclass
class ParseError:
    row_number: int
    column: str | None
    value: Any
    reason: str
    severity: str = "error"


@dataclass
class ParseWarning:
    row_number: int
    column: str | None
    value: Any
    reason: str


@dataclass
class ParseMetadata:
    file_hash: str
    file_size_bytes: int
    file_name: str
    total_rows: int
    success_rows: int
    error_rows: int
    warning_count: int


@dataclass
class ParseResult:
    rows: list[PresensiRowData] = field(default_factory=list)
    errors: list[ParseError] = field(default_factory=list)
    warnings: list[ParseWarning] = field(default_factory=list)
    metadata: Optional[ParseMetadata] = None

    @property
    def success(self) -> bool:
        return len(self.errors) == 0

    @property
    def is_partial(self) -> bool:
        return len(self.rows) > 0 and len(self.errors) > 0


class UploadErrorSummary(BaseModel):
    total_rows: int
    success: int
    errors: int
    warnings: int


class UploadErrorDetail(BaseModel):
    row: int
    column: Optional[str] = None
    value: Optional[str] = None
    reason: str


class UploadResponse(BaseModel):
    status: str
    upload_id: Optional[str] = None
    summary: UploadErrorSummary
    errors: list[UploadErrorDetail] = []
    warnings: list[UploadErrorDetail] = []
