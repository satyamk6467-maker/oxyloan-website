"use client";
import { useAppKit } from "@reown/appkit/react";

// AppKit (WalletConnect QR, 600+ wallets) exists only when a Reown Project ID is set. This is a build-time constant, so hook order never changes.
export const APPKIT = !!process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
export const OPEN_EVENT = "oxy:wallet-modal";
const noop = { open: (_o?: unknown) => {} };

/** Opens the wallet picker (our own, always available). With { view: "Account" } and AppKit, opens the account view. */
export function useOpen(): (o?: { view: "Account" }) => void {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const kit = APPKIT ? useAppKit() : noop;
  return (o) => {
    if (o?.view === "Account") { if (APPKIT) kit.open(o); return; }
    window.dispatchEvent(new Event(OPEN_EVENT));
  };
}
/** Opens AppKit's own pop-up (QR code + all wallets); no-op without a Project ID. */
export function useOpenAppKit(): () => void {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const kit = APPKIT ? useAppKit() : noop;
  return () => { kit.open(); };
}
