import { NextResponse } from "next/server";
import { INVEST_CONTRACT, IS_LIVE } from "@/lib/config";
import { publicClient, parseLogs } from "@/lib/server/chain";
import { saveEvents } from "@/lib/server/indexer";
import { db } from "@/lib/server/supabase";
import { env } from "@/lib/server/env";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

function authorized(req: Request) {
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${env("CRON_SECRET")}`);
  return given.length === want.length && timingSafeEqual(given, want);
}

/** Backstop indexer: replays contract events from the last processed block, so nothing is ever missed. */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!IS_LIVE) return NextResponse.json({ skipped: "contract not configured" });
  const sb = db();
  const { data: st } = await sb.from("sync_state").select("last_block").eq("id", 1).maybeSingle();
  const latest = Number(await publicClient.getBlockNumber()) - 3;
  let from = st?.last_block != null ? Number(st.last_block) + 1 : Number(env("INVEST_CONTRACT_DEPLOY_BLOCK", false) || latest - 2000);
  let saved = 0;
  const STEP = 2000, MAX_STEPS = 25;
  for (let i = 0; i < MAX_STEPS && from <= latest; i++) {
    const to = Math.min(from + STEP - 1, latest);
    const logs = await publicClient.getLogs({ address: INVEST_CONTRACT as `0x${string}`, fromBlock: BigInt(from), toBlock: BigInt(to) });
    const { investments, referrals } = parseLogs(logs as never);
    await saveEvents(investments, referrals);
    saved += investments.length;
    await sb.from("sync_state").upsert({ id: 1, last_block: to, updated_at: new Date().toISOString() });
    from = to + 1;
  }
  return NextResponse.json({ ok: true, saved, upTo: from - 1, latest });
}
