"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, LogOut } from "lucide-react";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/15"
      >
        <Wallet className="h-4 w-4" />
        <span>{shortenAddress(address)}</span>
        <LogOut className="h-4 w-4 opacity-70" />
      </button>
    );
  }

  const injectedConnector = connectors[0];

  return (
    <button
      type="button"
      disabled={!injectedConnector || isPending}
      onClick={() => {
        if (injectedConnector) {
          connect({ connector: injectedConnector });
        }
      }}
      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Wallet className="h-4 w-4" />
      {isPending ? "Connecting..." : "Connect Wallet"}
    </button>
  );
}
