"use client";
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, type Config } from "wagmi";
import { createAppKit } from "@reown/appkit/react";
import { bsc } from "@reown/appkit/networks";
import { wagmiAdapter, wagmiConfig, projectId, FEATURED_WALLETS } from "@/lib/wagmi";
import WalletModal from "./WalletModal";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://oxylon.vercel.app";

if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: [bsc],
    defaultNetwork: bsc,
    metadata: { name: "OXYLOAN", description: "Invest USDT (BEP-20) and earn with OXYLOAN", url: siteUrl, icons: [`${siteUrl}/logo.png`] },
    featuredWalletIds: FEATURED_WALLETS,
    allWallets: "HIDE", // only the featured wallets: the popup opens instantly instead of loading 600+ wallets
    features: { analytics: false, email: false, socials: false, onramp: false, swaps: false },
    themeMode: "dark",
    themeVariables: { "--w3m-accent": "#f6c453", "--w3m-border-radius-master": "2px" },
  });
}

export default function Providers({ children }: { children: ReactNode }) {
  const [qc] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 10_000, refetchOnWindowFocus: false } } }));
  return (
    <WagmiProvider config={wagmiConfig as Config}>
      <QueryClientProvider client={qc}>{children}<WalletModal /></QueryClientProvider>
    </WagmiProvider>
  );
}
