import { NextResponse } from "next/server";
import { db } from "@/lib/server/supabase";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { data, error } = await db().rpc("public_stats");
    if (error) throw error;
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
  } catch {
    return NextResponse.json({ total_raised: "0", investors: 0, investments: 0 }, { headers: { "Cache-Control": "public, s-maxage=10" } });
  }
}
