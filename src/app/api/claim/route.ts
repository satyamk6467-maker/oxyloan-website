import { NextResponse } from "next/server";
import { z } from "zod";
import { isAddress, verifyMessage } from "viem";
import { publicClient } from "@/lib/server/chain";
import { db } from "@/lib/server/supabase";
import { claimMessage, CLAIM_MAX_AGE_MS } from "@/lib/claim";

export const runtime = "nodejs";
const Body = z.object({ address: z.string(), issued: z.string(), signature: z.string().regex(/^0x[0-9a-fA-F]+$/) });

/**
 * An investor asks to move their credited OXYLOAN to their own wallet.
 * - They must sign a message with that wallet, so nobody else can trigger it.
 * - Tokens are only ever sent to the signing address, never to an address chosen in the request.
 * - The database function locks per investor, so the same tokens can never be claimed twice.
 * - CLAIM_OPENS_AT (optional ISO date, e.g. 2026-11-01T00:00:00Z) keeps claims closed until then.
 */
export async function POST(req: Request) {
  const bad = (error: string, status: number, extra: object = {}) => NextResponse.json({ error, ...extra }, { status });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success || !isAddress(body.data.address)) return bad("Invalid request", 400);
  const { address, issued, signature } = body.data;

  const t = Date.parse(issued);
  if (!Number.isFinite(t) || Date.now() - t > CLAIM_MAX_AGE_MS || t - Date.now() > 60_000) return bad("Request expired, please try again", 400);

  const opens = process.env.CLAIM_OPENS_AT ? Date.parse(process.env.CLAIM_OPENS_AT) : NaN;
  if (Number.isFinite(opens) && Date.now() < opens) return bad("Claims are not open yet", 403, { opensAt: new Date(opens).toISOString() });

  const args = { address: address as `0x${string}`, message: claimMessage(address, issued), signature: signature as `0x${string}` };
  // normal wallets: checked locally. smart-contract wallets (e.g. Safe): checked on-chain (ERC-1271)
  let ok = await verifyMessage(args).catch(() => false);
  if (!ok) ok = await publicClient.verifyMessage(args).catch(() => false);
  if (!ok) return bad("Signature check failed", 403);

  const { data, error } = await db().rpc("request_claim", { p_investor: address.toLowerCase(), p_min: 0 });
  if (error) {
    if (/nothing to claim/i.test(error.message)) return bad("Nothing to claim yet. Your OXYLOAN is credited after the swap completes.", 409);
    console.error("claim failed", error.message);
    return bad("Could not create the claim, please try again", 500);
  }
  return NextResponse.json({ ok: true, ...(data as { id: number; amount: string }) });
}
