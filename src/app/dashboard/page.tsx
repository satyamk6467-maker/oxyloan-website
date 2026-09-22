"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Coins,
  Loader2,
  Lock,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";

const BSC_CHAIN_ID = 56;

const OXYLOAN_ADDRESS =
  "0x7f9f2d7db9f9ec7313783a1cfa6bf4e80b03d07a" as `0x${string}`;

const USDT_ADDRESS =
  "0x55d398326f99059fF775485246999027B3197955" as `0x${string}`;

const OXY_ADDRESS =
  "0xCFeA5ED79693fdCe70189768D378Eab12a639768" as `0x${string}`;

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ type: "bool" }],
  },
] as const;

const oxyLoanAbi = [
  {
    type: "function",
    name: "invest",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "positionsLength",
    stateMutability: "view",
    inputs: [{ name: "investor", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "getPosition",
    stateMutability: "view",
    inputs: [
      { name: "investor", type: "address" },
      { name: "positionId", type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "principal", type: "uint256" },
          { name: "startedAt", type: "uint256" },
          { name: "lastRoiAccrual", type: "uint256" },
          { name: "roiRemainder", type: "uint256" },
          { name: "tierBps", type: "uint256" },
          { name: "principalCollected", type: "bool" },
          { name: "principalPaid", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "pendingOxyAmount",
    stateMutability: "view",
    inputs: [{ name: "investor", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "pendingOxyRoiValue",
    stateMutability: "view",
    inputs: [{ name: "investor", type: "address" }],
    outputs: [{ name: "totalUsdtValue", type: "uint256" }],
  },
  {
    type: "function",
    name: "pendingOxyValue",
    stateMutability: "view",
    inputs: [{ name: "investor", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "pendingUsdtRewards",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "claimableOxyValueUsdt",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "claimableUsdtRewards",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "claimOxyRewards",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "claimUsdtRewards",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "principalUnlockAt",
    stateMutability: "view",
    inputs: [
      { name: "investor", type: "address" },
      { name: "positionId", type: "uint256" },
    ],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "principalStatus",
    stateMutability: "view",
    inputs: [
      { name: "investor", type: "address" },
      { name: "positionId", type: "uint256" },
    ],
    outputs: [
      { name: "unlocked", type: "bool" },
      { name: "collected", type: "bool" },
      { name: "paid", type: "bool" },
    ],
  },
  {
    type: "function",
    name: "minInvestment",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "maxInvestment",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
] as const;

function usdt(value?: bigint) {
  if (value === undefined) return "0.00";
  return Number(formatUnits(value, 18)).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function oxy(value?: bigint) {
  if (value === undefined) return "0.0000";
  return Number(formatUnits(value, 18)).toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

function dateValue(value?: bigint) {
  if (!value || value === 0n) return "—";
  return new Date(Number(value) * 1000).toLocaleString();
}

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: switching } = useSwitchChain();

  const {
    writeContract,
    data: txHash,
    isPending: writing,
    error: writeError,
  } = useWriteContract();

  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash: txHash });

  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const amountWei = useMemo(() => {
    try {
      return amount ? parseUnits(amount, 18) : 0n;
    } catch {
      return 0n;
    }
  }, [amount]);

  const { data: usdtBalance, refetch: refetchBalance } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20Abi,
    functionName: "allowance",
    args: address ? [address, OXYLOAN_ADDRESS] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: positionsLength, refetch: refetchLength } = useReadContract({
    address: OXYLOAN_ADDRESS,
    abi: oxyLoanAbi,
    functionName: "positionsLength",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const firstPositionEnabled =
    Boolean(address) && positionsLength !== undefined && positionsLength > 0n;

  const { data: position, refetch: refetchPosition } = useReadContract({
    address: OXYLOAN_ADDRESS,
    abi: oxyLoanAbi,
    functionName: "getPosition",
    args:
      address && firstPositionEnabled
        ? [address, 0n]
        : undefined,
    query: { enabled: firstPositionEnabled },
  });

  const { data: pendingOxy, refetch: refetchPendingOxy } = useReadContract({
    address: OXYLOAN_ADDRESS,
    abi: oxyLoanAbi,
    functionName: "pendingOxyAmount",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  });

  const { data: pendingOxyRoi, refetch: refetchPendingOxyRoi } =
    useReadContract({
      address: OXYLOAN_ADDRESS,
      abi: oxyLoanAbi,
      functionName: "pendingOxyRoiValue",
      args: address ? [address] : undefined,
      query: { enabled: Boolean(address) },
    });

  const { data: pendingUsdt, refetch: refetchPendingUsdt } =
    useReadContract({
      address: OXYLOAN_ADDRESS,
      abi: oxyLoanAbi,
      functionName: "pendingUsdtRewards",
      args: address ? [address] : undefined,
      query: { enabled: Boolean(address) },
    });

  const { data: claimableOxyValue, refetch: refetchClaimableOxy } =
    useReadContract({
      address: OXYLOAN_ADDRESS,
      abi: oxyLoanAbi,
      functionName: "claimableOxyValueUsdt",
      args: address ? [address] : undefined,
      query: { enabled: Boolean(address) },
    });

  const { data: claimableUsdt, refetch: refetchClaimableUsdt } =
    useReadContract({
      address: OXYLOAN_ADDRESS,
      abi: oxyLoanAbi,
      functionName: "claimableUsdtRewards",
      args: address ? [address] : undefined,
      query: { enabled: Boolean(address) },
    });

  const { data: unlockAt } = useReadContract({
    address: OXYLOAN_ADDRESS,
    abi: oxyLoanAbi,
    functionName: "principalUnlockAt",
    args:
      address && firstPositionEnabled ? [address, 0n] : undefined,
    query: { enabled: firstPositionEnabled },
  });

  const { data: principalStatus } = useReadContract({
    address: OXYLOAN_ADDRESS,
    abi: oxyLoanAbi,
    functionName: "principalStatus",
    args:
      address && firstPositionEnabled ? [address, 0n] : undefined,
    query: { enabled: firstPositionEnabled },
  });

  const { data: minInvestment } = useReadContract({
    address: OXYLOAN_ADDRESS,
    abi: oxyLoanAbi,
    functionName: "minInvestment",
  });

  const { data: maxInvestment } = useReadContract({
    address: OXYLOAN_ADDRESS,
    abi: oxyLoanAbi,
    functionName: "maxInvestment",
  });

  const validNetwork = chainId === BSC_CHAIN_ID;
  const hasAllowance = (allowance ?? 0n) >= amountWei;

  const canInvest =
    validNetwork &&
    amountWei >= (minInvestment ?? parseUnits("36", 18)) &&
    amountWei <= (maxInvestment ?? parseUnits("40000", 18)) &&
    amountWei <= (usdtBalance ?? 0n);

  function approve() {
    setMessage("");

    if (amountWei === 0n) {
      setMessage("Enter the investment amount first.");
      return;
    }

    writeContract(
      {
        address: USDT_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [OXYLOAN_ADDRESS, amountWei],
      },
      {
        onSuccess: () =>
          setMessage("USDT approval submitted. Wait for confirmation."),
        onError: (error) => setMessage(error.message),
      }
    );
  }

  function invest() {
    setMessage("");

    if (!canInvest) {
      setMessage(
        `Investment must be between ${usdt(minInvestment)} and ${usdt(
          maxInvestment
        )} USDT and cannot exceed your USDT balance.`
      );
      return;
    }

    writeContract(
      {
        address: OXYLOAN_ADDRESS,
        abi: oxyLoanAbi,
        functionName: "invest",
        args: [amountWei],
      },
      {
        onSuccess: () =>
          setMessage("Investment submitted. Waiting for confirmation..."),
        onError: (error) => setMessage(error.message),
      }
    );
  }

  function claimOxy() {
    setMessage("");

    writeContract(
      {
        address: OXYLOAN_ADDRESS,
        abi: oxyLoanAbi,
        functionName: "claimOxyRewards",
      },
      {
        onSuccess: () => setMessage("OXY reward claim submitted."),
        onError: (error) => setMessage(error.message),
      }
    );
  }

  function claimUsdt() {
    setMessage("");

    writeContract(
      {
        address: OXYLOAN_ADDRESS,
        abi: oxyLoanAbi,
        functionName: "claimUsdtRewards",
      },
      {
        onSuccess: () => setMessage("USDT reward claim submitted."),
        onError: (error) => setMessage(error.message),
      }
    );
  }

  async function refresh() {
    await Promise.all([
      refetchBalance(),
      refetchAllowance(),
      refetchLength(),
      refetchPosition(),
      refetchPendingOxy(),
      refetchPendingOxyRoi(),
      refetchPendingUsdt(),
      refetchClaimableOxy(),
      refetchClaimableUsdt(),
    ]);
  }

  if (!isConnected || !address) {
    return (
      <main className="section-container flex min-h-[70vh] items-center justify-center">
        <div className="glass-card w-full max-w-lg p-8 text-center">
          <Wallet className="mx-auto mb-4 h-10 w-10" />
          <h1 className="font-display text-3xl font-bold">
            Connect Your Wallet
          </h1>
          <p className="mt-3 text-slate-400">
            Connect your wallet to access your OxyLoan investor dashboard.
          </p>
        </div>
      </main>
    );
  }

  const positionPrincipal = position?.principal ?? 0n;
  const tierBps = position?.tierBps ?? 0n;
  const monthlyRoi =
    positionPrincipal > 0n
      ? (positionPrincipal * tierBps) / 10000n
      : 0n;

  const dailyRoi = monthlyRoi / 30n;

  return (
    <main className="section-container py-8 sm:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Investor Dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            {shortAddress(address)}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            OxyLoan V2 • BNB Smart Chain
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {!validNetwork && (
        <div className="mb-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
          <p className="font-semibold text-amber-200">
            Please switch to BNB Smart Chain.
          </p>
          <button
            type="button"
            disabled={switching}
            onClick={() => switchChain({ chainId: BSC_CHAIN_ID })}
            className="mt-3 rounded-xl bg-amber-300 px-4 py-2 text-sm font-semibold text-black"
          >
            {switching ? "Switching..." : "Switch Network"}
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-5">
          <Wallet className="mb-3 h-6 w-6" />
          <p className="text-sm text-slate-400">USDT Balance</p>
          <p className="mt-1 text-2xl font-bold">{usdt(usdtBalance)}</p>
        </div>

        <div className="glass-card p-5">
          <TrendingUp className="mb-3 h-6 w-6" />
          <p className="text-sm text-slate-400">Investment</p>
          <p className="mt-1 text-2xl font-bold">
            {usdt(positionPrincipal)} USDT
          </p>
        </div>

        <div className="glass-card p-5">
          <Coins className="mb-3 h-6 w-6" />
          <p className="text-sm text-slate-400">Pending OXY</p>
          <p className="mt-1 text-2xl font-bold">{oxy(pendingOxy)} OXY</p>
        </div>

        <div className="glass-card p-5">
          <Lock className="mb-3 h-6 w-6" />
          <p className="text-sm text-slate-400">Lock Until</p>
          <p className="mt-1 text-sm font-semibold">
            {dateValue(unlockAt)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="glass-card p-6">
          <h2 className="text-xl font-bold">Invest USDT</h2>

          <p className="mt-2 text-sm text-slate-400">
            Minimum: {usdt(minInvestment)} USDT • Maximum:{" "}
            {usdt(maxInvestment)} USDT
          </p>

          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="Enter USDT amount"
            className="mt-5 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-white/30"
          />

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={
                writing ||
                confirming ||
                amountWei === 0n ||
                hasAllowance ||
                !validNetwork
              }
              onClick={approve}
              className="flex-1 rounded-xl border border-white/15 px-4 py-3 font-semibold disabled:opacity-40"
            >
              {writing ? "Processing..." : "Approve USDT"}
            </button>

            <button
              type="button"
              disabled={
                writing ||
                confirming ||
                !canInvest ||
                !hasAllowance
              }
              onClick={invest}
              className="flex-1 rounded-xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-40"
            >
              {writing ? "Processing..." : "Invest Now"}
            </button>
          </div>

          {hasAllowance && amountWei > 0n && (
            <p className="mt-3 text-sm text-emerald-300">
              <CheckCircle2 className="mr-1 inline h-4 w-4" />
              USDT approved for this amount.
            </p>
          )}

          {message && (
            <p className="mt-4 break-words text-sm text-slate-300">
              {message}
            </p>
          )}

          {writeError && (
            <p className="mt-3 break-words text-sm text-red-300">
              {writeError.message}
            </p>
          )}

          {confirming && (
            <p className="mt-3 text-sm text-amber-300">
              <Loader2 className="mr-1 inline h-4 w-4 animate-spin" />
              Waiting for blockchain confirmation...
            </p>
          )}

          {confirmed && (
            <p className="mt-3 text-sm text-emerald-300">
              Transaction confirmed.
            </p>
          )}
        </section>

        <section className="glass-card p-6">
          <h2 className="text-xl font-bold">ROI</h2>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs text-slate-400">ROI Tier</p>
              <p className="mt-1 text-xl font-bold">
                {Number(tierBps) / 100}%
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs text-slate-400">Monthly ROI</p>
              <p className="mt-1 text-xl font-bold">
                {usdt(monthlyRoi)} USDT
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs text-slate-400">Daily ROI</p>
              <p className="mt-1 text-xl font-bold">
                {usdt(dailyRoi)} USDT
              </p>
            </div>

            <div className="rounded-xl bg-white/5 p-4">
              <p className="text-xs text-slate-400">Positions</p>
              <p className="mt-1 text-xl font-bold">
                {positionsLength?.toString() ?? "0"}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="glass-card mt-6 p-6">
        <h2 className="text-xl font-bold">Rewards</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs text-slate-400">OXY Pending</p>
            <p className="mt-1 font-bold">{oxy(pendingOxy)} OXY</p>
          </div>

          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs text-slate-400">OXY Value</p>
            <p className="mt-1 font-bold">
              {usdt(pendingOxyRoi)} USDT
            </p>
          </div>

          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs text-slate-400">USDT Rewards</p>
            <p className="mt-1 font-bold">{usdt(pendingUsdt)} USDT</p>
          </div>

          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-xs text-slate-400">Claimable USDT</p>
            <p className="mt-1 font-bold">{usdt(claimableUsdt)} USDT</p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={writing || confirming}
            onClick={claimOxy}
            className="rounded-xl border border-white/15 px-5 py-3 font-semibold disabled:opacity-40"
          >
            Claim OXY
          </button>

          <button
            type="button"
            disabled={writing || confirming}
            onClick={claimUsdt}
            className="rounded-xl border border-white/15 px-5 py-3 font-semibold disabled:opacity-40"
          >
            Claim USDT
          </button>
        </div>
      </section>

      <section className="glass-card mt-6 p-6">
        <h2 className="text-xl font-bold">Principal Lock</h2>

        {firstPositionEnabled ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-400">Started</p>
              <p className="mt-1 text-sm">{dateValue(position?.startedAt)}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Unlock</p>
              <p className="mt-1 text-sm">{dateValue(unlockAt)}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400">Status</p>
              <p className="mt-1 text-sm">
                {principalStatus?.[0] ? "Unlocked" : "Locked"}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            No investment position found for this wallet.
          </p>
        )}
      </section>

      <p className="mt-8 text-center text-xs text-slate-500">
        OXY: {OXY_ADDRESS}
        <br />
        OxyLoan V2: {OXYLOAN_ADDRESS}
      </p>
    </main>
  );
}
