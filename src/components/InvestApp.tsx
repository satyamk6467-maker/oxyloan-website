"use client";
import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useReadContract, useSwitchChain, useWriteContract, useDisconnect, useSignMessage, useWatchAsset } from "wagmi";
import { useOpen } from "@/lib/useOpen";
import { useQuery } from "@tanstack/react-query";
import { formatUnits, isAddress, parseUnits, zeroAddress, type Address } from "viem";
import dynamic from "next/dynamic";
const WorldBackground = dynamic(() => import("./WorldBackground"), { ssr: false });
import { claimMessage } from "@/lib/claim";
import {
  FEE_PCT, INVEST_CONTRACT, IS_LIVE, MIN_INVEST_USDT, OXYLOAN, PANCAKE_ROUTER, REFERRAL_PCT, USDT,
  erc20Abi, investAbi, routerAbi, short,
} from "@/lib/config";

const BSC = 56;
const REF_KEY = "oxy_ref";
const hasWallet = true; // our own wallet picker always works; a Reown ID only adds WalletConnect QR

const fmt = (v: bigint | undefined, dp = 2) => {
  if (v === undefined) return "–";
  const n = Number(formatUnits(v, 18));
  return n.toLocaleString("en-US", { maximumFractionDigits: dp });
};
const niceError = (e: unknown) => {
  const m = String((e as { shortMessage?: string; message?: string })?.shortMessage ?? (e as Error)?.message ?? e);
  if (/reject|denied|cancel/i.test(m)) return "You cancelled the request in your wallet.";
  if (/insufficient funds/i.test(m)) return "Not enough BNB for network fees.";
  return m.length > 160 ? m.slice(0, 160) + "…" : m;
};

function ConnectButton() {
  const open = useOpen();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  if (!isConnected) return <button className="btn btn-primary btn-green" onClick={() => open()}>Connect Wallet</button>;
  return (
    <div className="walletchip">
      <button className="chip" onClick={() => open({ view: "Account" })}><span className="dot" />{short(address)}</button>
      <button className="chip ghost" onClick={() => disconnect()} aria-label="Disconnect">✕</button>
    </div>
  );
}

export default function InvestApp() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();
  const open = useOpen();
  const publicClient = usePublicClient({ chainId: BSC });
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();
  const { watchAsset } = useWatchAsset();

  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState<"" | "approve" | "invest">("");
  const [msg, setMsg] = useState<{ type: "ok" | "err" | "info"; text: string; tx?: string } | null>(null);
  const [storedRef, setStoredRef] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(null);

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("ref");
      if (q && isAddress(q)) localStorage.setItem(REF_KEY, q.toLowerCase());
      setStoredRef(localStorage.getItem(REF_KEY) ?? "");
    } catch { /* storage blocked */ }
  }, []);

  const amt = useMemo(() => { try { return amount ? parseUnits(amount, 18) : 0n; } catch { return 0n; } }, [amount]);
  const min = parseUnits(String(MIN_INVEST_USDT), 18);
  const wrongNet = isConnected && chainId !== BSC;
  const enabled = !!address && IS_LIVE && !wrongNet;

  const bal = useReadContract({ address: USDT, abi: erc20Abi, functionName: "balanceOf", args: [address ?? zeroAddress], chainId: BSC, query: { enabled: !!address, refetchInterval: 45_000 } });
  const allowance = useReadContract({ address: USDT, abi: erc20Abi, functionName: "allowance", args: [address ?? zeroAddress, (INVEST_CONTRACT || zeroAddress) as Address], chainId: BSC, query: { enabled } });
  const onchainRef = useReadContract({ address: (INVEST_CONTRACT || zeroAddress) as Address, abi: investAbi, functionName: "referrerOf", args: [address ?? zeroAddress], chainId: BSC, query: { enabled } });
  const paused = useReadContract({ address: (INVEST_CONTRACT || zeroAddress) as Address, abi: investAbi, functionName: "paused", chainId: BSC, query: { enabled: IS_LIVE } });

  const referrer: Address | "" = useMemo(() => {
    const oc = onchainRef.data as string | undefined;
    if (oc && oc !== zeroAddress) return oc as Address;
    if (storedRef && isAddress(storedRef) && storedRef.toLowerCase() !== address?.toLowerCase()) return storedRef as Address;
    return "";
  }, [onchainRef.data, storedRef, address]);
  const refLocked = !!onchainRef.data && onchainRef.data !== zeroAddress;

  const fee = (amt * BigInt(FEE_PCT)) / 100n;
  const refBonus = referrer ? (amt * BigInt(REFERRAL_PCT)) / 100n : 0n;
  const swapAmt = amt - fee;
  const quote = useReadContract({ address: PANCAKE_ROUTER, abi: routerAbi, functionName: "getAmountsOut", args: [swapAmt, [USDT, OXYLOAN]], chainId: BSC, query: { enabled: swapAmt > 0n, retry: false } });
  const estOut = (quote.data as bigint[] | undefined)?.[1];

  const stats = useQuery({ queryKey: ["stats"], queryFn: () => fetch("/api/stats").then((r) => r.json()), refetchInterval: 60_000 });
  const me = useQuery({ queryKey: ["me", address], enabled: !!address, queryFn: () => fetch(`/api/me?address=${address}`, { cache: "no-store" }).then((r) => r.json()), refetchInterval: 45_000 });

  const needsApprove = ((allowance.data as bigint | undefined) ?? 0n) < amt;
  const balance = bal.data as bigint | undefined;
  const tooLow = amt > 0n && amt < min;
  const noFunds = amt > 0n && balance !== undefined && amt > balance;
  const canAct = isConnected && !wrongNet && IS_LIVE && !paused.data && amt >= min && !noFunds && !busy;

  async function approve() {
    if (!publicClient) return;
    setMsg(null); setBusy("approve");
    try {
      setMsg({ type: "info", text: "Confirm the USDT approval in your wallet…" });
      const hash = await writeContractAsync({ address: USDT, abi: erc20Abi, functionName: "approve", args: [INVEST_CONTRACT as Address, amt], chainId: BSC });
      setMsg({ type: "info", text: "Approval sent, waiting for confirmation…", tx: hash });
      await publicClient.waitForTransactionReceipt({ hash });
      await allowance.refetch();
      setMsg({ type: "ok", text: "USDT approved. Now press Invest." });
    } catch (e) { setMsg({ type: "err", text: niceError(e) }); } finally { setBusy(""); }
  }

  async function invest() {
    if (!publicClient) return;
    setMsg(null); setBusy("invest");
    try {
      setMsg({ type: "info", text: "Confirm the investment in your wallet…" });
      const hash = await writeContractAsync({ address: INVEST_CONTRACT as Address, abi: investAbi, functionName: "invest", args: [amt, (referrer || zeroAddress) as Address], chainId: BSC });
      setMsg({ type: "info", text: "Transaction sent, waiting for confirmation…", tx: hash });
      const rc = await publicClient.waitForTransactionReceipt({ hash });
      if (rc.status !== "success") throw new Error("Transaction failed on-chain.");
      setAmount("");
      setMsg({ type: "ok", text: `Investment confirmed: ${fmt(amt)} USDT. Saving it to your account…`, tx: hash });
      bal.refetch(); allowance.refetch(); onchainRef.refetch();
      // record it right away (retry a few times in case the data node is a block behind)
      let saved = false;
      for (let i = 0; i < 4 && !saved; i++) {
        try {
          const r = await fetch("/api/invest/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ txHash: hash }) });
          saved = r.ok;
        } catch { /* try again */ }
        if (!saved) await new Promise((res) => setTimeout(res, 1500));
      }
      await Promise.all([me.refetch(), stats.refetch()]);
      setMsg({ type: "ok", text: saved ? `Investment saved: ${fmt(amt)} USDT. Your OXYLOAN is credited as soon as the swap runs (every minute or so), then you can withdraw it to your wallet.` : `Investment confirmed on-chain: ${fmt(amt)} USDT. It will show in your account within a few minutes.`, tx: hash });
    } catch (e) { setMsg({ type: "err", text: niceError(e) }); } finally { setBusy(""); }
  }

  const link = address && typeof window !== "undefined" ? `${window.location.origin}/?ref=${address}` : "";
  const copy = async () => { try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ } };
  const m = me.data as undefined | {
    invested: string; oxyloan_credited: string; referral_earned: string; referral_count: number; referred_volume: string;
    claimable?: string; claim_pending?: string; claimed?: string; claim_opens_at?: string | null;
    investments: { tx_hash: string; amount: string; oxyloan: string; created_at: string }[];
    claims?: { id: number; amount: string; status: string; tx_hash: string | null }[];
  };
  const big = (s?: string) => (s ? fmt(BigInt(s)) : "–");
  const big4 = (s?: string) => (s ? fmt(BigInt(s), 4) : "–");
  const claimable = BigInt(m?.claimable ?? "0");
  const credited = BigInt(m?.oxyloan_credited ?? "0");
  const opensAt = m?.claim_opens_at ? new Date(m.claim_opens_at) : null;
  const notOpen = !!opensAt && opensAt.getTime() > Date.now();

  async function claim() {
    if (!address) return;
    setClaimMsg(null); setClaiming(true);
    try {
      const issued = new Date().toISOString();
      setClaimMsg({ type: "info", text: "Confirm the free signature in your wallet (it does not cost gas)…" });
      const signature = await signMessageAsync({ message: claimMessage(address, issued) });
      const r = await fetch("/api/claim", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address, issued, signature }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Claim failed");
      setClaimMsg({ type: "ok", text: `Withdrawal requested: ${fmt(BigInt(j.amount), 4)} OXYLOAN will arrive in your wallet within a few minutes.` });
      me.refetch();
    } catch (e) { setClaimMsg({ type: "err", text: niceError(e) }); } finally { setClaiming(false); }
  }
  const addToWallet = () => { try { watchAsset({ type: "ERC20", options: { address: OXYLOAN, symbol: "OXYLOAN", decimals: 18 } }); } catch { /* wallet does not support it */ } };

  let cta: React.ReactNode;
  if (!hasWallet) cta = <button className="btn btn-primary wide" disabled>Wallet connect not configured</button>;
  else if (!isConnected) cta = <button className="btn btn-primary btn-green wide" onClick={() => open()}>Connect Wallet</button>;
  else if (wrongNet) cta = <button className="btn btn-primary wide" disabled={switching} onClick={() => switchChain({ chainId: BSC })}>Switch to BNB Smart Chain</button>;
  else if (!IS_LIVE) cta = <button className="btn wide" disabled>Investing opens soon</button>;
  else if (paused.data) cta = <button className="btn wide" disabled>Temporarily paused</button>;
  else if (!amt) cta = <button className="btn wide" disabled>Enter an amount</button>;
  else if (tooLow) cta = <button className="btn wide" disabled>Minimum is {MIN_INVEST_USDT} USDT</button>;
  else if (noFunds) cta = <button className="btn wide" disabled>Insufficient USDT balance</button>;
  else if (needsApprove) cta = <button className="btn btn-primary wide" disabled={!canAct} onClick={approve}>{busy === "approve" ? "Approving…" : `1 · Approve ${fmt(amt)} USDT`}</button>;
  else cta = <button className="btn btn-primary wide" disabled={!canAct} onClick={invest}>{busy === "invest" ? "Investing…" : `2 · Invest ${fmt(amt)} USDT`}</button>;

  return (
    <>
      <WorldBackground />
      <div className="shell">
        <header className="top">
          <a className="brand" href="#"><img src="/logo.png" alt="" width={36} height={36} />OXYLOAN</a>
          <ConnectButton />
        </header>

        <section className="hero">
          <span className="pill"><span className="dot" />Live on BNB Smart Chain</span>
          <h1>Invest USDT.<br /><span className="grad">Grow with OXYLOAN.</span></h1>
          <p className="lead">Connect your wallet, approve USDT (BEP-20) and invest. Half of your investment is converted to OXYLOAN on PancakeSwap and credited to your account, and you can withdraw it to your wallet from the Your account card. Referral bonuses are paid instantly on-chain.</p>
          <div className="stats">
            <div><b>{stats.data ? big(stats.data.total_raised) : "–"}</b><span>USDT invested</span></div>
            <div><b>{stats.data?.investors ?? "–"}</b><span>Investors</span></div>
            <div><b>{MIN_INVEST_USDT}</b><span>Min. USDT</span></div>
          </div>
        </section>

        <main className="grid">
          <section className="card glass">
            <div className="rowhead"><h2>Invest</h2><span className="muted">USDT · BEP-20</span></div>
            <label className="field">
              <div className="fieldtop"><span>You invest</span><button className="link" onClick={() => balance !== undefined && setAmount(formatUnits(balance, 18))}>Balance: {fmt(balance)} · MAX</button></div>
              <div className="inputrow">
                <input inputMode="decimal" placeholder="0.0" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1"))} aria-label="USDT amount" />
                <span className="token">USDT</span>
              </div>
            </label>
            <div className="quick">{[10, 50, 100, 500, 1000].map((v) => <button key={v} className="chip" onClick={() => setAmount(String(v))}>{v}</button>)}</div>

            <div className="break">
              <div className="brow"><span>Platform fee ({FEE_PCT}%)</span><b>{amt ? fmt(fee) : "–"} USDT</b></div>
              {referrer ? <div className="brow sub"><span>↳ of which referral bonus to {short(referrer)} ({REFERRAL_PCT}%)</span><b>{fmt(refBonus)} USDT</b></div> : null}
              <div className="brow"><span>Swapped to OXYLOAN ({100 - FEE_PCT}%)</span><b>{amt ? fmt(swapAmt) : "–"} USDT</b></div>
              <div className="brow total"><span>OXYLOAN credited to your account (estimate)</span><b>{estOut ? fmt(estOut, 4) : "–"} OXYLOAN</b></div>
            </div>
            <p className="fine">The platform fee covers operations, technical support, compliance and green initiatives. It is sent straight to the management wallet by the smart contract. OXYLOAN is credited to your account after the swap completes, then you withdraw it to your wallet.</p>

            {cta}
            {!isConnected && hasWallet && <p className="fine hint">On a phone? Tap Connect Wallet and pick your wallet app (Trust Wallet, MetaMask, SafePal, TokenPocket, Binance, OKX, Bitget, Coinbase). You can also open this page inside your wallet app&apos;s browser.</p>}
            {msg && (
              <div className={`msg ${msg.type}`} role="status">
                {msg.text}{" "}
                {msg.tx && <a href={`https://bscscan.com/tx/${msg.tx}`} target="_blank" rel="noreferrer">View on BscScan ↗</a>}
              </div>
            )}
            {referrer && <p className="fine">Referred by <b>{short(referrer)}</b>{refLocked ? " (locked)" : ""}.</p>}
          </section>

          <section className="side">
            <div className="card glass">
              <div className="rowhead"><h2>Your account</h2></div>
              {isConnected ? (
                <>
                <div className="kv">
                  <div><span>Invested</span><b>{big(m?.invested)} USDT</b></div>
                  <div><span>OXYLOAN credited</span><b>{big4(m?.oxyloan_credited)}</b></div>
                  <div className="hi"><span>Ready to withdraw</span><b>{big4(m?.claimable)}</b></div>
                  <div><span>Payout in progress</span><b>{big4(m?.claim_pending)}</b></div>
                  <div><span>Already withdrawn</span><b>{big4(m?.claimed)}</b></div>
                  <div><span>Referral earned</span><b>{big(m?.referral_earned)} USDT</b></div>
                </div>
                <button className="btn btn-primary wide" style={{ marginTop: 14 }} disabled={claiming || notOpen || claimable === 0n} onClick={claim}>
                  {claiming ? "Working…" : notOpen ? `Withdrawals open ${opensAt!.toLocaleDateString()}` : claimable > 0n ? `Withdraw ${fmt(claimable, 4)} OXYLOAN to my wallet` : credited > 0n ? "Nothing left to withdraw" : "OXYLOAN shows here after your swap"}
                </button>
                {claimMsg && <div className={`msg ${claimMsg.type}`} role="status">{claimMsg.text}</div>}
                <p className="fine">Withdrawing sends OXYLOAN to this wallet. It costs you no gas; payouts run every minute or so.</p>
                <button className="btn wide ghostbtn" onClick={addToWallet}>Add OXYLOAN to my wallet</button>
                {!!m?.claims?.length && (
                  <ul className="tx" style={{ marginTop: 12 }}>
                    {m.claims.map((c) => (
                      <li key={c.id}><span>{big4(c.amount)} OXYLOAN <em className={`badge ${c.status}`}>{c.status === "sent" ? "paid" : c.status === "failed" ? "retry" : "processing"}</em></span>
                        {c.tx_hash ? <a href={`https://bscscan.com/tx/${c.tx_hash}`} target="_blank" rel="noreferrer">tx ↗</a> : <span />}</li>
                    ))}
                  </ul>
                )}
                </>
              ) : <p className="muted">Connect your wallet to see your investments and referral earnings.</p>}
            </div>

            <div className="card glass">
              <div className="rowhead"><h2>Refer &amp; earn {REFERRAL_PCT}%</h2></div>
              <p className="muted">Share your link. When a friend invests, you receive {REFERRAL_PCT}% of their investment in USDT directly to your wallet, in the same transaction, on every investment they make.{isConnected && m ? <> Friends referred so far: <b>{m.referral_count}</b>.</> : null}</p>
              {isConnected ? (
                <>
                  <div className="linkbox"><code>{link}</code></div>
                  <div className="share">
                    <button className="btn" onClick={copy}>{copied ? "Copied ✓" : "Copy link"}</button>
                    <a className="btn" target="_blank" rel="noreferrer" href={`https://wa.me/?text=${encodeURIComponent("Join OXYLOAN: " + link)}`}>WhatsApp</a>
                    <a className="btn" target="_blank" rel="noreferrer" href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join OXYLOAN")}`}>Telegram</a>
                  </div>
                </>
              ) : <button className="btn btn-primary btn-green wide" onClick={() => open()}>Connect Wallet to get your link</button>}
            </div>

            {isConnected && !!m?.investments?.length && (
              <div className="card glass">
                <div className="rowhead"><h2>Your investments</h2></div>
                <ul className="tx">
                  {m.investments.map((t) => (
                    <li key={t.tx_hash}><a href={`https://bscscan.com/tx/${t.tx_hash}`} target="_blank" rel="noreferrer">{short(t.tx_hash)} ↗</a><b>{big(t.amount)} USDT</b></li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </main>

        <section className="steps">
          {["Connect your wallet", "Approve USDT (BEP-20)", "Invest in one transaction", "Withdraw OXYLOAN to your wallet"].map((s, i) => (
            <div key={s} className="step glass"><span>{i + 1}</span>{s}</div>
          ))}
        </section>

        <footer className="foot">
          <div>Token <a href={`https://bscscan.com/token/${OXYLOAN}`} target="_blank" rel="noreferrer">{short(OXYLOAN)} ↗</a>
            {IS_LIVE && <> · Investment contract <a href={`https://bscscan.com/address/${INVEST_CONTRACT}`} target="_blank" rel="noreferrer">{short(INVEST_CONTRACT)} ↗</a></>}</div>
          <p>Always check the contract addresses before you invest. Crypto assets are volatile and you can lose some or all of your money. Returns are not guaranteed. Nothing on this site is financial advice. Check the laws and tax rules that apply to you.</p>
        </footer>
      </div>
    </>
  );
}
