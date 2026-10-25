import { createPublicClient, fallback, http, parseEventLogs, type Hex, type Log } from "viem";
import { bsc } from "viem/chains";
import { INVEST_CONTRACT, investAbi } from "../config";

const urls = [process.env.BSC_RPC_URL, "https://bsc-dataseed.bnbchain.org", "https://bsc-dataseed1.defibit.io"].filter(Boolean) as string[];

export const publicClient = createPublicClient({
  chain: bsc,
  transport: fallback(urls.map((u) => http(u, { timeout: 15_000, retryCount: 2 }))),
});

export type ParsedInvest = {
  tx_hash: string; log_index: number; block_number: number; investment_id: number;
  investor: string; referrer: string | null; amount: string; management_amount: string; referral_amount: string; swap_amount: string;
  oxyloan_locked: string; // OXYLOAN locked in the v2 contract for this investment (swap already done on-chain)
};
export type ParsedRef = { investor: string; referrer: string; tx_hash: string; block_number: number };

const lower = (a: string) => a.toLowerCase();
const ZERO = "0x0000000000000000000000000000000000000000";

export function parseLogs(logs: Log[]): { investments: ParsedInvest[]; referrals: ParsedRef[] } {
  const only = logs.filter((l) => l.address.toLowerCase() === INVEST_CONTRACT.toLowerCase());
  const events = parseEventLogs({ abi: investAbi, logs: only as never, strict: false });
  const investments: ParsedInvest[] = [];
  const referrals: ParsedRef[] = [];
  for (const e of events as any[]) {
    if (e.eventName === "Invested") {
      const a = e.args;
      investments.push({
        tx_hash: e.transactionHash, log_index: Number(e.logIndex), block_number: Number(e.blockNumber),
        investment_id: Number(a.id), investor: lower(a.investor), referrer: a.referrer === ZERO ? null : lower(a.referrer),
        amount: a.amount.toString(), management_amount: a.managementAmount.toString(),
        referral_amount: a.referralAmount.toString(), swap_amount: a.swapAmount.toString(),
        oxyloan_locked: a.oxyloanReceived.toString(),
      });
    } else if (e.eventName === "ReferrerSet") {
      referrals.push({ investor: lower(e.args.investor), referrer: lower(e.args.referrer), tx_hash: e.transactionHash, block_number: Number(e.blockNumber) });
    }
  }
  return { investments, referrals };
}

export async function logsForTx(hash: Hex) {
  const receipt = await publicClient.getTransactionReceipt({ hash });
  if (receipt.status !== "success") return null;
  return parseLogs(receipt.logs as Log[]);
}
