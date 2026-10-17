import { db } from "./supabase";
import type { ParsedInvest, ParsedRef } from "./chain";

/** Idempotent: safe to call many times with the same events. All numbers come from on-chain events, never from the browser. */
export async function saveEvents(investments: ParsedInvest[], referrals: ParsedRef[]) {
  const sb = db();
  if (referrals.length) {
    const { error } = await sb.from("referrals").upsert(
      referrals.map((r) => ({ investor: r.investor, referrer: r.referrer, tx_hash: r.tx_hash, block_number: r.block_number })),
      { onConflict: "investor", ignoreDuplicates: true },
    );
    if (error) throw error;
  }
  if (investments.length) {
    const { error } = await sb.from("investments").upsert(investments, { onConflict: "tx_hash,log_index", ignoreDuplicates: true });
    if (error) throw error;
    const bonuses = investments
      .filter((i) => i.referrer && i.referral_amount !== "0")
      .map((i) => ({ tx_hash: i.tx_hash, log_index: i.log_index, referrer: i.referrer, investor: i.investor, amount: i.referral_amount, block_number: i.block_number }));
    if (bonuses.length) {
      const { error: e2 } = await sb.from("referral_bonuses").upsert(bonuses, { onConflict: "tx_hash,log_index", ignoreDuplicates: true });
      if (e2) throw e2;
    }
  }
}
