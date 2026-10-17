"use client";
import { useAppKit } from "@reown/appkit/react";

// AppKit exists only when a Reown Project ID is set. The check is a build-time constant, so hook order never changes.
const enabled = !!process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;
const noop = () => {};
export function useOpen(): (o?: { view: "Account" }) => void {
  if (!enabled) return noop;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { open } = useAppKit();
  return (o) => { open(o); };
}
