import { db } from "@/lib/server/supabase";
import { isAdmin } from "@/lib/server/session";

export const runtime = "nodejs";
const f = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const usdt = (raw: string) => (Number(BigInt(raw || "0") / 10n ** 12n) / 1e6).toFixed(6);

export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Access denied", { status: 403 });
  const kind = new URL(req.url).searchParams.get("kind") === "bonuses" ? "bonuses" : "investments";
  const sb = db();
  let csv = "";
  if (kind === "investments") {
    const { data } = await sb.from("investments").select("*").order("block_number", { ascending: true }).limit(100000);
    csv = "id,tx_hash,block,investor,referrer,amount_usdt,management_usdt,referral_usdt,swap_usdt,oxyloan_credited\n" +
      (data ?? []).map((r) => [r.investment_id, r.tx_hash, r.block_number, r.investor, r.referrer ?? "", usdt(r.amount), usdt(r.management_amount), usdt(r.referral_amount), usdt(r.swap_amount), r.oxyloan_allocated ?? "0"].map(f).join(",")).join("\n");
  } else {
    const { data } = await sb.from("referral_bonuses").select("*").order("block_number", { ascending: true }).limit(100000);
    csv = "tx_hash,block,referrer,investor,bonus_usdt\n" + (data ?? []).map((r) => [r.tx_hash, r.block_number, r.referrer, r.investor, usdt(r.amount)].map(f).join(",")).join("\n");
  }
  return new Response(csv, { headers: { "content-type": "text/csv", "content-disposition": `attachment; filename="oxyloan-${kind}.csv"`, "cache-control": "no-store" } });
}
