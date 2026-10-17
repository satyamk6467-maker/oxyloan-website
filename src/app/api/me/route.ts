import { NextResponse } from "next/server";
import { isAddress } from "viem";
import { db } from "@/lib/server/supabase";

export const runtime = "nodejs";

/** Everything here is already public on-chain; we only add convenience aggregation for the dashboard. */
export async function GET(req: Request) {
  const a = new URL(req.url).searchParams.get("address")?.toLowerCase() ?? "";
  if (!isAddress(a)) return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  try {
    const { data, error } = await db().rpc("wallet_summary", { p_address: a });
    if (error) throw error;
    return NextResponse.json({ ...(data as object), claim_opens_at: process.env.CLAIM_OPENS_AT || null }, { headers: { "Cache-Control": "private, max-age=10" } });
  } catch {
    return NextResponse.json({ invested: "0", oxyloan_credited: "0", referral_earned: "0", referral_count: 0, claimable: "0", claim_pending: "0", claimed: "0", claim_opens_at: null, investments: [], claims: [] });
  }
}
