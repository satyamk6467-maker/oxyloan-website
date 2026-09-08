"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, LogOut, X } from "lucide-react";
import { setWalletProvider } from "@/lib/web3/config";

type WalletDetail = {
  info?: {
    name?: string;
    rdns?: string;
    icon?: string;
  };
  provider?: any;
};

const walletOptions = [
  {
    id: "metaMask",
    name: "MetaMask",
    icon: "🦊",
  },
  {
    id: "trustWallet",
    name: "Trust Wallet",
    icon: "🛡️",
  },
  {
    id: "tokenPocket",
    name: "TokenPocket",
    icon: "🔷",
  },
];

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function matchesWallet(
  id: string,
  detail: WalletDetail
) {
  const name = detail.info?.name?.toLowerCase() || "";
  const rdns = detail.info?.rdns?.toLowerCase() || "";

  if (id === "metaMask") {
    return (
      rdns === "io.metamask" ||
      name.includes("metamask")
    );
  }

  if (id === "trustWallet") {
    return (
      rdns.includes("trustwallet") ||
      name.includes("trust wallet")
    );
  }

  if (id === "tokenPocket") {
    return (
      name.includes("tokenpocket") ||
      name.includes("token pocket") ||
      rdns.includes("tokenpocket")
    );
  }

  return false;
}

function discoverWallet(
  walletId: string
): Promise<any | undefined> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(undefined);
      return;
    }

    const foundProviders: any[] = [];

    const handleAnnouncement = (
      event: Event
    ) => {
      const customEvent = event as CustomEvent<WalletDetail>;
      const detail = customEvent.detail;

      if (
        detail?.provider &&
        matchesWallet(walletId, detail)
      ) {
        foundProviders.push(detail.provider);
      }
    };

    window.addEventListener(
      "eip6963:announceProvider",
      handleAnnouncement
    );

    window.dispatchEvent(
      new Event("eip6963:requestProvider")
    );

    window.setTimeout(() => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnouncement
      );

      if (foundProviders.length > 0) {
        resolve(foundProviders[0]);
        return;
      }

      const ethereum = (window as any).ethereum;

      if (walletId === "tokenPocket") {
        const tokenPocket =
          (window as any).tokenpocket?.ethereum;

        if (tokenPocket) {
          resolve(tokenPocket);
          return;
        }
      }

      if (ethereum?.providers) {
        const provider = ethereum.providers.find(
          (item: any) => {
            if (walletId === "metaMask") {
              return item?.isMetaMask === true;
            }

            if (walletId === "trustWallet") {
              return item?.isTrust === true;
            }

            if (walletId === "tokenPocket") {
              return item?.isTokenPocket === true;
            }

            return false;
          }
        );

        if (provider) {
          resolve(provider);
          return;
        }
      }

      resolve(undefined);
    }, 250);
  });
}

export default function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const [discovering, setDiscovering] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAnnouncement = (event: Event) => {
      const customEvent = event as CustomEvent<WalletDetail>;
      const detail = customEvent.detail;

      if (!detail?.provider) return;

      for (const wallet of walletOptions) {
        if (matchesWallet(wallet.id, detail)) {
          setWalletProvider(
            wallet.id,
            detail.provider
          );
        }
      }
    };

    window.addEventListener(
      "eip6963:announceProvider",
      handleAnnouncement
    );

    window.dispatchEvent(
      new Event("eip6963:requestProvider")
    );

    return () => {
      window.removeEventListener(
        "eip6963:announceProvider",
        handleAnnouncement
      );
    };
  }, []);

  if (isConnected && address) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/15 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
      >
        <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span>{shortenAddress(address)}</span>
        <LogOut className="h-3.5 w-3.5 opacity-70 sm:h-4 sm:w-4" />
      </button>
    );
  }

  async function handleWalletConnect(
    walletId: string
  ) {
    setError("");
    setDiscovering(true);

    try {
      const provider =
        await discoverWallet(walletId);

      if (!provider) {
        setError(
          "This wallet was not detected. Please open this site in that wallet or install the wallet."
        );
        setDiscovering(false);
        return;
      }

      setWalletProvider(walletId, provider);

      const connector = connectors.find(
        (item) => item.id === walletId
      );

      if (!connector) {
        setError(
          "Wallet connector is unavailable."
        );
        setDiscovering(false);
        return;
      }

      connect(
        { connector },
        {
          onSuccess: () => {
            setIsOpen(false);
            setDiscovering(false);
          },
          onError: (connectionError) => {
            setError(
              connectionError.message ||
                "Unable to connect to this wallet."
            );
            setDiscovering(false);
          },
        }
      );
    } catch (connectionError) {
      setError(
        connectionError instanceof Error
          ? connectionError.message
          : "Unable to connect to this wallet."
      );
      setDiscovering(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError("");
          setIsOpen(true);
        }}
        disabled={isPending || discovering}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
      >
        <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span className="sm:hidden">
          {isPending || discovering ? "..." : "Connect"}
        </span>
        <span className="hidden sm:inline">
          {isPending || discovering
            ? "Connecting..."
            : "Connect Wallet"}
        </span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-6 backdrop-blur-sm sm:items-center sm:py-8"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="my-auto w-full max-w-sm max-h-[calc(100vh-3rem)] overflow-y-auto rounded-2xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-xl sm:max-h-[calc(100vh-4rem)]"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Connect Wallet
                </h2>
                <p className="mt-1 text-sm text-white/60">
                  Choose your wallet
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
                aria-label="Close wallet selection"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {walletOptions.map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  disabled={isPending || discovering}
                  onClick={() =>
                    handleWalletConnect(wallet.id)
                  }
                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl">
                    {wallet.icon}
                  </span>

                  <span className="flex-1">
                    <span className="block text-sm font-medium">
                      {wallet.name}
                    </span>
                    <span className="block text-xs text-white/50">
                      Connect with {wallet.name}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {error && (
              <p className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
