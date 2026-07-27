import { NextResponse } from "next/server";

export const revalidate = 3600; // Cache at Next.js server for 1 hour

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tahun = searchParams.get("tahun") || "2026";
  const bulan = searchParams.get("bulan") || "6";

  try {
    const backendBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const backendUrl = `${backendBaseUrl}/api/public/ranking?tahun=${tahun}&bulan=${bulan}`;
    
    const res = await fetch(backendUrl, {
      next: { revalidate: 3600 },
    });
    
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch ranking from backend" },
        { status: res.status }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Public ranking fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
