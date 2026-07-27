import { NextResponse } from "next/server";
import { Client } from "pg";

export const revalidate = 3600; // Cache at Next.js server for 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tahun = parseInt(searchParams.get("tahun") || "2026", 10);
  const bulan = parseInt(searchParams.get("bulan") || "6", 10);

  if (isNaN(tahun) || isNaN(bulan) || bulan < 1 || bulan > 12) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
  }

  // Retrieve connection string from env
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is not configured on Vercel" },
      { status: 500 }
    );
  }

  // Create PG Client
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
        opd.id AS opd_id,
        opd.nama_opd,
        opd.kode_opd,
        presensi.presensi_agregat_opd.total_skor,
        presensi.presensi_agregat_opd.kategori,
        RANK() OVER (ORDER BY presensi.presensi_agregat_opd.total_skor DESC)::int AS rank
      FROM 
        presensi.presensi_agregat_opd
      JOIN 
        master.opd ON presensi.presensi_agregat_opd.opd_id = opd.id
      WHERE 
        presensi.presensi_agregat_opd.tahun = $1
        AND presensi.presensi_agregat_opd.bulan = $2
        AND opd.is_active = TRUE
      ORDER BY 
        presensi.presensi_agregat_opd.total_skor DESC;
    `;
    
    const result = await client.query(query, [tahun, bulan]);
    
    const rankings = result.rows.map((row) => ({
      ...row,
      total_skor: parseFloat(row.total_skor || "0"),
    }));
    
    return NextResponse.json({
      periode: { tahun, bulan },
      opd_count: rankings.length,
      rankings: rankings,
    });
  } catch (error) {
    console.error("Database query error in route handler:", error);
    return NextResponse.json(
      { error: "Internal server error connecting to database" },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
