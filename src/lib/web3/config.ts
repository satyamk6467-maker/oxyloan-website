import { createConfig, http } from "wagmi";
import { bsc, bscTestnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";

type WalletProviderMap = Record<string, any>;

const walletProviders: WalletProviderMap = {};

export function setWalletProvider(
  walletId: string,
  provider: any
) {
  walletProviders[walletId] = provider;
}

export function clearWalletProvider(walletId: string) {
  delete walletProviders[walletId];
}

function getSelectedProvider(
  walletId: string,
  windowObject?: any
) {
  if (walletProviders[walletId]) {
    return walletProviders[walletId];
  }

  return windowObject?.ethereum;
}

export const wagmiConfig = createConfig({
  chains: [bsc, bscTestnet],

  connectors: [
    injected({
      target: {
        id: "metaMask",
        name: "MetaMask",
        provider: (windowObject?: any) =>
          getSelectedProvider("metaMask", windowObject),
      },
    }),

    injected({
      target: {
        id: "trustWallet",
        name: "Trust Wallet",
        provider: (windowObject?: any) =>
          getSelectedProvider("trustWallet", windowObject),
      },
    }),

    injected({
      target: {
        id: "tokenPocket",
        name: "TokenPocket",
        provider: (windowObject?: any) =>
          getSelectedProvider("tokenPocket", windowObject),
      },
    }),
  ],

  transports: {
    [bsc.id]: http(),
    [bscTestnet.id]: http(),
  },

  ssr: true,
});
