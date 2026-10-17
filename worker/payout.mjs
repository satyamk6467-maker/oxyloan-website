// OXYLOAN payout worker. Sends OXYLOAN from the swap wallet to investors who pressed "Claim" on the website.
//
// RUN THIS ON YOUR OWN PRIVATE SERVER (never on Vercel). It needs the swap wallet's private key.
//   node worker/payout.mjs            -> dry run (shows what it would pay)
//   DRY_RUN=0 node worker/payout.mjs  -> really pays
// Schedule it every 5 minutes, AFTER the swap worker and never at the same time (they share one wallet), for example:
//   */5 * * * * cd /path/to/web && flock -n /tmp/oxy.lock sh -c 'DRY_RUN=0 node worker/swap.mjs; DRY_RUN=0 node worker/payout.mjs'
//
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SWAP_WALLET_PRIVATE_KEY, (optional) BSC_RPC_URL
//
// Safety rules built in:
//  - tokens go ONLY to the address stored with the claim (the wallet that signed it)
//  - a claim is marked 'sending' BEFORE the transfer, so a crash can never cause a second payment
//  - if anything is unclear after sending (timeout, crash) the claim stays 'sending' and the worker STOPS for a human check
import { createClient } from "@supabase/supabase-js";
import { createPublicClient, createWalletClient, http, parseAbi, formatUnits, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

const OXYLOAN = "0x899dCFfAF285D087D700744DD6Bd9EBfb29BF299";
const SWAP_WALLET = "0xE23C4c49DD09861E86a640293a674D43204987a7";
const MAX_PER_RUN = 50;

const need = (k) => { const v = process.env[k]; if (!v) { console.error(`Missing ${k}`); process.exit(1); } return v; };
const dry = process.env.DRY_RUN !== "0";
const erc20 = parseAbi(["function balanceOf(address) view returns (uint256)", "function transfer(address,uint256) returns (bool)"]);

const sb = createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const account = privateKeyToAccount(need("SWAP_WALLET_PRIVATE_KEY"));
if (account.address.toLowerCase() !== SWAP_WALLET.toLowerCase()) { console.error(`Private key belongs to ${account.address}, expected the swap wallet ${SWAP_WALLET}. Stopping.`); process.exit(1); }
const transport = http(process.env.BSC_RPC_URL ?? "https://bsc-dataseed.bnbchain.org");
const pub = createPublicClient({ chain: bsc, transport });
const wal = createWalletClient({ account, chain: bsc, transport });

// never continue while an earlier payment is in an unclear state
const { data: stuck, error: e0 } = await sb.from("claims").select("id,investor,amount,error").eq("status", "sending");
if (e0) throw e0;
if (stuck.length) {
  console.error(`STOP: ${stuck.length} claim(s) are stuck in 'sending' (claim ids: ${stuck.map((c) => c.id).join(", ")}).`);
  console.error("Check the swap wallet's OXYLOAN transfers on BscScan. If the investor WAS paid: set status='sent' and tx_hash in the claims table. If NOT paid: set status='pending'. Then run again.");
  process.exit(2);
}

const { data: pending, error } = await sb.from("claims").select("id,investor,amount").eq("status", "pending").order("id").limit(MAX_PER_RUN);
if (error) throw error;
console.log(`Pending claims: ${pending.length}`);
if (!pending.length) process.exit(0);

let balance = await pub.readContract({ address: OXYLOAN, abi: erc20, functionName: "balanceOf", args: [SWAP_WALLET] });
const bnb = await pub.getBalance({ address: SWAP_WALLET });
console.log(`Swap wallet: ${formatUnits(balance, 18)} OXYLOAN, ${formatUnits(bnb, 18)} BNB for gas`);
if (bnb < 2_000_000_000_000_000n && !dry) { console.error("Not enough BNB for gas in the swap wallet (need at least 0.002 BNB). Stopping."); process.exit(1); }

for (const c of pending) {
  const amount = BigInt(String(c.amount).split(".")[0]);
  const to = c.investor;
  if (!isAddress(to)) { console.error(`Claim ${c.id}: invalid address, skipping`); continue; }
  console.log(`Claim ${c.id}: ${formatUnits(amount, 18)} OXYLOAN -> ${to}`);
  if (amount > balance) { console.error(`  not enough OXYLOAN in the swap wallet for this claim, skipping (fund the wallet or run the swap worker first)`); continue; }
  if (dry) continue;

  // lock the claim so it can never be paid twice
  const { data: locked, error: e1 } = await sb.from("claims").update({ status: "sending", updated_at: new Date().toISOString() }).eq("id", c.id).eq("status", "pending").select("id");
  if (e1) throw e1;
  if (!locked?.length) { console.log("  already taken by another run, skipping"); continue; }

  let hash;
  try {
    hash = await wal.writeContract({ address: OXYLOAN, abi: erc20, functionName: "transfer", args: [to, amount] });
    const rc = await pub.waitForTransactionReceipt({ hash, timeout: 120_000 });
    if (rc.status !== "success") {
      await sb.from("claims").update({ status: "failed", tx_hash: hash, error: "transfer reverted", updated_at: new Date().toISOString() }).eq("id", c.id);
      console.error(`  transfer reverted (${hash}); claim released so the investor can try again`);
      continue;
    }
    await sb.from("claims").update({ status: "sent", tx_hash: hash, updated_at: new Date().toISOString() }).eq("id", c.id);
    balance -= amount;
    console.log(`  paid, tx ${hash}`);
  } catch (e) {
    await sb.from("claims").update({ error: String(e.shortMessage || e.message).slice(0, 300), tx_hash: hash ?? null, updated_at: new Date().toISOString() }).eq("id", c.id);
    console.error(`  UNCLEAR RESULT for claim ${c.id} (${hash ?? "no tx hash"}): ${e.shortMessage || e.message}. Left as 'sending'. Stopping so you can check BscScan.`);
    process.exit(2);
  }
}
if (dry) console.log("DRY RUN: nothing sent. Run with DRY_RUN=0 to pay.");
