import { NextResponse } from "next/server";
import { Client } from "pg";

export const revalidate = 3600; // Cache at Next.js server for 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const opdId = parseInt(searchParams.get("opd_id") || "", 10);
  const tahun = parseInt(searchParams.get("tahun") || "", 10);
  const bulan = parseInt(searchParams.get("bulan") || "", 10);

  if (isNaN(opdId) || isNaN(tahun) || isNaN(bulan)) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // Retrieve connection string from env
  let connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is not configured on Vercel" },
      { status: 500 }
    );
  }

  // Clean connection string
  connectionString = connectionString.replace("postgresql+asyncpg://", "postgresql://");

  const client = new Client({
    connectionString: connectionString,
    ssl: connectionString.includes("supabase.co") || connectionString.includes("pooler.supabase.com")
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    await client.connect();

    const query = `
      SELECT 
        a.tahun,
        a.bulan,
        a.pns,
        a.pppk,
        a.pppk_pw,
        a.jumlah_asn,
        a.total_kewajiban_hadir,
        a.jumlah_hadir,
        a.jumlah_terlambat,
        a.jumlah_pulang_cepat,
        a.jumlah_tidak_hadir,
        a.jumlah_hadir_normal,
        a.hari_kerja,
        a.persentase_kehadiran::float AS persentase_kehadiran,
        a.persentase_pelanggaran::float AS persentase_pelanggaran,
        a.persentase_hadir_efektif::float AS persentase_hadir_efektif,
        a.persentase_ketidakhadiran::float AS persentase_ketidakhadiran,
        a.skor_kehadiran::float AS skor_kehadiran,
        a.skor_kepatuhan_jam_kerja::float AS skor_kepatuhan_jam_kerja,
        a.skor_ketidakhadiran::float AS skor_ketidakhadiran,
        a.skor_hadir_efektif::float AS skor_hadir_efektif,
        a.total_skor::float AS total_skor,
        a.kategori,
        a.ranking_total_skor,
        a.ranking_kehadiran,
        a.ranking_pelanggaran,
        o.nama_opd,
        o.kode_opd
      FROM 
        presensi.presensi_agregat_opd a
      JOIN 
        master.opd o ON a.opd_id = o.id
      WHERE 
        a.opd_id = $1
        AND a.tahun = $2
        AND a.bulan = $3;
    `;

    const result = await client.query(query, [opdId, tahun, bulan]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "OPD detail not found" }, { status: 404 });
    }

    const a = result.rows[0];

    return NextResponse.json({
      nama_opd: a.nama_opd,
      kode_opd: a.kode_opd,
      periode: { tahun: a.tahun, bulan: a.bulan },
      komposisi: { pns: a.pns, pppk: a.pppk, pppk_pw: a.pppk_pw, jumlah: a.jumlah_asn },
      counter: {
        total_kewajiban_hadir: a.total_kewajiban_hadir,
        jumlah_hadir: a.jumlah_hadir,
        jumlah_terlambat: a.jumlah_terlambat,
        jumlah_pulang_cepat: a.jumlah_pulang_cepat,
        jumlah_tidak_hadir: a.jumlah_tidak_hadir,
        jumlah_hadir_normal: a.jumlah_hadir_normal,
        hari_kerja: a.hari_kerja,
      },
      persentase: {
        kehadiran: a.persentase_kehadiran,
        pelanggaran: a.persentase_pelanggaran,
        hadir_efektif: a.persentase_hadir_efektif,
        ketidakhadiran: a.persentase_ketidakhadiran,
      },
      skor: {
        kehadiran: a.skor_kehadiran,
        kepatuhan_jam_kerja: a.skor_kepatuhan_jam_kerja,
        ketidakhadiran: a.skor_ketidakhadiran,
        hadir_efektif: a.skor_hadir_efektif,
        total: a.total_skor,
      },
      kategori: a.kategori,
      ranking: {
        total_skor: a.ranking_total_skor,
        kehadiran: a.ranking_kehadiran,
        pelanggaran: a.ranking_pelanggaran,
      },
    });
  } catch (error) {
    console.error("Database query error in OPD detail route handler:", error);
    return NextResponse.json(
      { error: "Internal server error connecting to database" },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
