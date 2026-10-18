"use client";
import { useEffect, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { OPEN_EVENT, APPKIT, useOpenAppKit } from "@/lib/useOpen";
import { WALLETS, type WalletInfo } from "@/lib/wallets";

const isMobile = () => typeof navigator !== "undefined" && /android|iphone|ipad|ipod/i.test(navigator.userAgent);

export default function WalletModal() {
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState<{ id: string; text: string } | null>(null);
  const { isConnected } = useAccount();
  const { connectors, connectAsync } = useConnect();
  const openKit = useOpenAppKit();

  useEffect(() => {
    const on = () => { setErr(""); setNote(null); setShow(true); };
    const key = (ev: KeyboardEvent) => { if (ev.key === "Escape") setShow(false); };
    window.addEventListener(OPEN_EVENT, on); window.addEventListener("keydown", key);
    return () => { window.removeEventListener(OPEN_EVENT, on); window.removeEventListener("keydown", key); };
  }, []);
  useEffect(() => { if (isConnected) setShow(false); }, [isConnected]);
  useEffect(() => { document.body.style.overflow = show ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [show]);
  if (!show) return null;

  const specific = (w: WalletInfo) => connectors.find((c) => w.match.test(c.name));
  const generic = connectors.find((c) => c.id === "injected" || /injected|browser/i.test(c.name));
  const hasProvider = typeof window !== "undefined" && !!(window as unknown as { ethereum?: unknown }).ethereum;

  async function connect(w: WalletInfo) {
    setErr(""); setNote(null);
    const url = window.location.href.split("#")[0];
    // 1) the wallet announced itself in this browser
    let c = specific(w);
    // 2) we are inside a wallet's own browser on a phone: its provider is the generic one
    if (!c && isMobile() && hasProvider && generic) c = generic;
    if (c) {
      try { setBusy(w.id); await connectAsync({ connector: c }); setShow(false); }
      catch (e) { const m = e instanceof Error ? e.message : String(e); setErr(/reject|denied|cancel/i.test(m) ? "You cancelled the request in your wallet." : "Could not connect. Open your wallet and try again."); }
      finally { setBusy(""); }
      return;
    }
    // 3) not available here: phone -> open the site inside the wallet app, computer -> install page
    if (isMobile()) {
      if (w.deeplink) { window.location.href = w.deeplink(url); return; }
      try { await navigator.clipboard.writeText(url); } catch { /* ignore */ }
      setNote({ id: w.id, text: (w.hint ?? "Open the wallet's DApp browser and paste this site's link.") + " The link was copied." });
      return;
    }
    window.open(w.install, "_blank", "noopener,noreferrer");
    setNote({ id: w.id, text: `${w.name} was not detected in this browser. Install it, then reload this page.` });
  }

  return (
    <div className="wm-back" onClick={() => setShow(false)} role="dialog" aria-modal="true" aria-label="Connect wallet">
      <div className="wm glass" onClick={(e) => e.stopPropagation()}>
        <div className="wm-head"><h2>Connect your wallet</h2><button className="chip ghost" onClick={() => setShow(false)} aria-label="Close">✕</button></div>
        <p className="muted wm-sub">Choose a wallet. We only ask to see your address; we never ask for your seed phrase or private key.</p>
        <div className="wm-list">
          {WALLETS.map((w) => {
            const found = !!specific(w);
            return (
              <div key={w.id}>
                <button className="wm-row" onClick={() => connect(w)} disabled={!!busy}>
                  <span className="wm-ic" style={{ background: w.color }}>{w.name[0]}</span>
                  <span className="wm-name">{w.name}</span>
                  <span className={`wm-tag ${found ? "ok" : ""}`}>{busy === w.id ? "Connecting…" : found ? "Detected" : isMobile() ? "Open app" : "Install"}</span>
                </button>
                {note?.id === w.id && <p className="fine wm-note">{note.text}</p>}
              </div>
            );
          })}
          {APPKIT && <button className="wm-row" onClick={() => { setShow(false); openKit(); }}><span className="wm-ic" style={{ background: "#3b99fc" }}>W</span><span className="wm-name">More wallets / scan QR code</span><span className="wm-tag">WalletConnect</span></button>}
        </div>
        {err && <div className="msg err">{err}</div>}
        {isMobile() && !hasProvider && <p className="fine">Tip: tapping a wallet opens this site inside that wallet&apos;s app, where you can connect in one tap.</p>}
      </div>
    </div>
  );
}
