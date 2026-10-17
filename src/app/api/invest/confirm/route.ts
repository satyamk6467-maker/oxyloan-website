import { NextResponse } from "next/server";
import { z } from "zod";
import { logsForTx } from "@/lib/server/chain";
import { saveEvents } from "@/lib/server/indexer";
import { IS_LIVE } from "@/lib/config";

export const runtime = "nodejs";
const Body = z.object({ txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/) });

/**
 * The browser only tells us "look at this transaction". Everything we store is read from the blockchain
 * receipt and the contract's own events, so nobody can fake an investment or a referral bonus.
 */
export async function POST(req: Request) {
  if (!IS_LIVE) return NextResponse.json({ error: "Not live" }, { status: 503 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid transaction hash" }, { status: 400 });
  try {
    const res = await logsForTx(parsed.data.txHash as `0x${string}`);
    if (!res || (!res.investments.length && !res.referrals.length)) return NextResponse.json({ error: "No OXYLOAN investment found in this transaction" }, { status: 404 });
    await saveEvents(res.investments, res.referrals);
    return NextResponse.json({ ok: true, recorded: res.investments.length });
  } catch (e) {
    console.error("confirm failed", e);
    return NextResponse.json({ error: "Could not verify yet, it will be picked up automatically" }, { status: 202 });
  }
}
