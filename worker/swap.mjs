// OXYLOAN swap worker. Converts the USDT that the contract sent to the swap wallet into OXYLOAN on PancakeSwap,
// then credits each investment with its share of the OXYLOAN in the database.
//
// RUN THIS ON YOUR OWN PRIVATE SERVER (not on Vercel). It needs the swap wallet's private key.
//   node worker/swap.mjs            -> dry run (prints what it would do)
//   DRY_RUN=0 node worker/swap.mjs  -> really swaps
// Schedule it with cron / systemd timer, e.g. every 15 minutes.
//
// Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SWAP_WALLET_PRIVATE_KEY, (optional) BSC_RPC_URL
// Optional env: MIN_BATCH_USDT (default 10), MAX_SLIPPAGE_BPS (default 300 = 3%), DRY_RUN (default 1)
import { createClient } from "@supabase/supabase-js";
import { createPublicClient, createWalletClient, http, parseAbi, formatUnits, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bsc } from "viem/chains";

const USDT = "0x55d398326f99059fF775485246999027B3197955";
const OXYLOAN = "0x899dCFfAF285D087D700744DD6Bd9EBfb29BF299";
const ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const SWAP_WALLET = "0xE23C4c49DD09861E86a640293a674D43204987a7";

const need = (k) => { const v = process.env[k]; if (!v) { console.error(`Missing ${k}`); process.exit(1); } return v; };
const dry = process.env.DRY_RUN !== "0";
const minBatch = parseUnits(process.env.MIN_BATCH_USDT ?? "10", 18);
const slipBps = BigInt(process.env.MAX_SLIPPAGE_BPS ?? "300");

const erc20 = parseAbi(["function balanceOf(address) view returns (uint256)", "function allowance(address,address) view returns (uint256)", "function approve(address,uint256) returns (bool)"]);
const router = parseAbi([
  "function getAmountsOut(uint256,address[]) view returns (uint256[])",
  "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] path,address to,uint256 deadline)",
]);

const sb = createClient(need("SUPABASE_URL"), need("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const account = privateKeyToAccount(need("SWAP_WALLET_PRIVATE_KEY"));
if (account.address.toLowerCase() !== SWAP_WALLET.toLowerCase()) { console.error(`Private key belongs to ${account.address}, expected the swap wallet ${SWAP_WALLET}. Stopping.`); process.exit(1); }
const transport = http(process.env.BSC_RPC_URL ?? "https://bsc-dataseed.bnbchain.org");
const pub = createPublicClient({ chain: bsc, transport });
const wal = createWalletClient({ account, chain: bsc, transport });

const { data: pending, error } = await sb.from("investments").select("id,swap_amount").is("swap_batch_id", null).order("id").limit(500);
if (error) throw error;
const owed = pending.reduce((s, r) => s + BigInt(r.swap_amount.toString().split(".")[0]), 0n);
console.log(`Pending: ${pending.length} investments, ${formatUnits(owed, 18)} USDT`);
if (owed < minBatch) { console.log("Below minimum batch size, nothing to do."); process.exit(0); }

const walletUsdt = await pub.readContract({ address: USDT, abi: erc20, functionName: "balanceOf", args: [SWAP_WALLET] });
if (walletUsdt < owed) { console.error(`Swap wallet holds ${formatUnits(walletUsdt, 18)} USDT, less than the ${formatUnits(owed, 18)} owed. Waiting for on-chain funds. Stopping.`); process.exit(1); }

const path = [USDT, OXYLOAN];
const [, quoted] = await pub.readContract({ address: ROUTER, abi: router, functionName: "getAmountsOut", args: [owed, path] });
const minOut = (quoted * (10_000n - slipBps)) / 10_000n;
console.log(`Quote: ${formatUnits(quoted, 18)} OXYLOAN, minimum accepted ${formatUnits(minOut, 18)}`);
if (dry) { console.log("DRY RUN: nothing sent. Run with DRY_RUN=0 to execute."); process.exit(0); }

const allowance = await pub.readContract({ address: USDT, abi: erc20, functionName: "allowance", args: [SWAP_WALLET, ROUTER] });
if (allowance < owed) {
  const h = await wal.writeContract({ address: USDT, abi: erc20, functionName: "approve", args: [ROUTER, owed] });
  await pub.waitForTransactionReceipt({ hash: h });
}
const before = await pub.readContract({ address: OXYLOAN, abi: erc20, functionName: "balanceOf", args: [SWAP_WALLET] });
const hash = await wal.writeContract({ address: ROUTER, abi: router, functionName: "swapExactTokensForTokensSupportingFeeOnTransferTokens", args: [owed, minOut, path, SWAP_WALLET, BigInt(Math.floor(Date.now() / 1000) + 300)] });
const rc = await pub.waitForTransactionReceipt({ hash });
if (rc.status !== "success") { console.error("Swap failed on-chain:", hash); process.exit(1); }
const after = await pub.readContract({ address: OXYLOAN, abi: erc20, functionName: "balanceOf", args: [SWAP_WALLET] });
const received = after - before;

const { data: batch, error: e2 } = await sb.rpc("allocate_swap", { p_tx_hash: hash, p_usdt_in: owed.toString(), p_oxyloan_out: received.toString(), p_ids: pending.map((r) => r.id) });
if (e2) { console.error("SWAP DONE BUT DATABASE UPDATE FAILED. Record manually:", { hash, received: received.toString() }, e2); process.exit(1); }
console.log(`Swapped ${formatUnits(owed, 18)} USDT -> ${formatUnits(received, 18)} OXYLOAN (batch ${batch}, tx ${hash})`);
