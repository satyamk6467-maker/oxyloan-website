"use client";

import { useAccount } from "wagmi";
import { Wallet, TrendingUp, Users, ArrowDownToLine } from "lucide-react";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  if (!isConnected || !address) {
    return (
      <main className="section-container flex min-h-[70vh] items-center justify-center">
        <div className="glass-card w-full max-w-lg p-8 text-center">
          <Wallet className="mx-auto mb-4 h-10 w-10" />
          <h1 className="font-display text-3xl font-bold">
            Connect Your Wallet
          </h1>
          <p className="mt-3 text-slate-400">
            Connect your wallet from the navigation bar to access your OxyLoan dashboard.
          </p>
        </div>
      </main>
    );
  }

  const cards = [
    { title: "Invested", value: "—", icon: TrendingUp },
    { title: "Earnings", value: "—", icon: TrendingUp },
    { title: "Referral", value: "—", icon: Users },
    { title: "Withdrawable", value: "—", icon: ArrowDownToLine },
  ];

  return (
    <main className="section-container py-16">
      <div className="mb-10">
        <p className="text-sm text-slate-400">Connected wallet</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          {shortenAddress(address)}
        </h1>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ title, value, icon: Icon }) => (
          <div key={title} className="glass-card p-6">
            <Icon className="mb-5 h-6 w-6" />
            <p className="text-sm text-slate-400">{title}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-6">
          <h2 className="font-display text-xl font-bold">Investment</h2>
          <p className="mt-2 text-sm text-slate-400">
            Your blockchain investment information will appear here.
          </p>
        </div>

        <div className="glass-card p-6">
          <h2 className="font-display text-xl font-bold">Referral</h2>
          <p className="mt-2 text-sm text-slate-400">
            Your referral information will appear here.
          </p>
        </div>
      </div>
    </main>
  );
}
