import { NextResponse } from "next/server";
import { db } from "@/lib/server/supabase";
import { isAdmin } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Access denied" }, { status: 403 });
  const sb = db();
  const [summary, inv, bon, top, clm] = await Promise.all([
    sb.rpc("admin_summary"),
    sb.from("investments").select("*").order("block_number", { ascending: false }).limit(100),
    sb.from("referral_bonuses").select("*").order("block_number", { ascending: false }).limit(100),
    sb.rpc("admin_top_referrers"),
    sb.from("claims").select("*").order("id", { ascending: false }).limit(100),
  ]);
  return NextResponse.json({ summary: summary.data, investments: inv.data ?? [], bonuses: bon.data ?? [], topReferrers: top.data ?? [], claims: clm.data ?? [] });
}
