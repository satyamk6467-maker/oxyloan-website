"use client";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useOpen } from "@/lib/useOpen";
import { formatUnits } from "viem";
import { short } from "@/lib/config";

const u = (s?: string) => (s ? Number(formatUnits(BigInt(s), 18)).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0");
type Data = { summary: Record<string, string | number>; investments: any[]; bonuses: any[]; topReferrers: any[]; claims?: any[] };

export default function Admin() {
  const { address, isConnected } = useAccount();
  const open = useOpen();
  const { signMessageAsync } = useSignMessage();
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const r = await fetch("/api/admin/data");
    if (r.ok) { setData(await r.json()); setErr(""); return true; }
    return false;
  }, []);
  useEffect(() => { load(); }, [load]);

  async function login() {
    setErr("");
    try {
      const { message } = await (await fetch("/api/admin/nonce")).json();
      const signature = await signMessageAsync({ message });
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ address, signature }) });
      if (!r.ok) throw new Error("Access denied");
      await load();
    } catch (e) { setErr((e as Error).message || "Access denied"); }
  }
  async function logout() { await fetch("/api/admin/logout", { method: "POST" }); setData(null); }

  return (
    <div className="shell">
      <header className="top"><b className="brand">OXYLOAN · Admin</b>{data && <button className="btn" onClick={logout}>Sign out</button>}</header>
      {!data ? (
        <div className="card glass" style={{ maxWidth: 460 }}>
          <h2>Owner sign-in</h2>
          <p className="muted">Sign a free message with the admin wallet. No other wallet can open this page.</p>
          {!isConnected ? <button className="btn btn-primary btn-green wide" onClick={() => open()}>Connect admin wallet</button>
            : <button className="btn btn-primary wide" onClick={login}>Sign in as {short(address)}</button>}
          {err && <div className="msg err">{err}</div>}
        </div>
      ) : (
        <>
          <div className="cards">
            <div><span>Total invested (USDT)</span><b>{u(data.summary.total_raised as string)}</b></div>
            <div><span>Management wallet (USDT)</span><b>{u(data.summary.management_total as string)}</b></div>
            <div><span>Referral bonuses paid (USDT)</span><b>{u(data.summary.referral_total as string)}</b></div>
            <div><span>Sent to swap wallet (USDT)</span><b>{u(data.summary.swap_total as string)}</b></div>
            <div><span>Waiting to be swapped (USDT)</span><b>{u(data.summary.pending_swap_usdt as string)}</b></div>
            <div><span>OXYLOAN allocated</span><b>{u(data.summary.oxyloan_allocated as string)}</b></div>
            <div><span>Investors</span><b>{String(data.summary.investors)}</b></div>
            <div><span>Investments</span><b>{String(data.summary.investments)}</b></div>
            <div><span>Claims waiting to be paid</span><b>{String(data.summary.claims_pending ?? 0)}</b></div>
            <div><span>Claims needing a human check</span><b style={Number(data.summary.claims_stuck) > 0 ? { color: "var(--bad)" } : undefined}>{String(data.summary.claims_stuck ?? 0)}</b></div>
            <div><span>OXYLOAN claimed and paid</span><b>{u(data.summary.claims_sent_total as string)}</b></div>
            <div><span>OXYLOAN owed to open claims</span><b>{u(data.summary.claims_open_oxyloan as string)}</b></div>
          </div>
          <div className="share" style={{ marginBottom: 16 }}>
            <a className="btn" href="/api/admin/export?kind=investments">Download investments CSV</a>
            <a className="btn" href="/api/admin/export?kind=bonuses">Download referral bonuses CSV</a>
          </div>
          <div className="card glass" style={{ marginBottom: 16 }}><h2>Latest investments</h2><div className="scroll"><table className="table">
            <thead><tr><th>#</th><th>Investor</th><th>Referrer</th><th>USDT</th><th>Referral</th><th>Tx</th></tr></thead>
            <tbody>{data.investments.map((r) => <tr key={r.tx_hash + r.log_index}><td>{r.investment_id}</td><td>{short(r.investor)}</td><td>{short(r.referrer) || "–"}</td><td>{u(r.amount)}</td><td>{u(r.referral_amount)}</td><td><a href={`https://bscscan.com/tx/${r.tx_hash}`} target="_blank" rel="noreferrer">{short(r.tx_hash)}</a></td></tr>)}</tbody>
          </table></div></div>
          <div className="card glass" style={{ marginBottom: 16 }}><h2>Referral bonuses paid</h2><div className="scroll"><table className="table">
            <thead><tr><th>Referrer (paid)</th><th>Investor</th><th>USDT</th><th>Tx</th></tr></thead>
            <tbody>{data.bonuses.map((r) => <tr key={r.tx_hash + r.log_index}><td>{short(r.referrer)}</td><td>{short(r.investor)}</td><td>{u(r.amount)}</td><td><a href={`https://bscscan.com/tx/${r.tx_hash}`} target="_blank" rel="noreferrer">{short(r.tx_hash)}</a></td></tr>)}</tbody>
          </table></div></div>
          <div className="card glass" style={{ marginBottom: 16 }}><h2>Recent OXYLOAN claims</h2><div className="scroll"><table className="table">
            <thead><tr><th>#</th><th>Investor</th><th>OXYLOAN</th><th>Status</th><th>Tx</th></tr></thead>
            <tbody>{(data.claims ?? []).map((r: { id: number; investor: string; amount: string; status: string; tx_hash: string | null }) => <tr key={r.id}><td>{r.id}</td><td>{short(r.investor)}</td><td>{u(r.amount)}</td><td>{r.status}</td><td>{r.tx_hash ? <a href={`https://bscscan.com/tx/${r.tx_hash}`} target="_blank" rel="noreferrer">{short(r.tx_hash)}</a> : "–"}</td></tr>)}</tbody>
          </table></div></div>
          <div className="card glass"><h2>Top referrers</h2><div className="scroll"><table className="table">
            <thead><tr><th>Referrer</th><th>People referred</th><th>Bonus earned (USDT)</th></tr></thead>
            <tbody>{data.topReferrers.map((r) => <tr key={r.referrer}><td>{short(r.referrer)}</td><td>{r.referred}</td><td>{u(r.bonus_total)}</td></tr>)}</tbody>
          </table></div></div>
        </>
      )}
    </div>
  );
}
