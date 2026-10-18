import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bsc } from "@reown/appkit/networks";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { bsc as wagmiBsc } from "wagmi/chains";

export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? "";
export const networks = [bsc] as [typeof bsc];

const rpc = process.env.NEXT_PUBLIC_BSC_RPC;

export const wagmiAdapter = new WagmiAdapter({
  ssr: true,
  projectId: projectId || "missing-project-id",
  networks,
  ...(rpc ? { customRpcUrls: { "eip155:56": [{ url: rpc }] } } : {}),
});

// With a Reown Project ID the AppKit adapter config is used (adds WalletConnect). Without one, a plain config
// still discovers every installed wallet (EIP-6963) and works inside wallet browsers, so Connect Wallet always works.
export const wagmiConfig = projectId
  ? wagmiAdapter.wagmiConfig
  : createConfig({ chains: [wagmiBsc], connectors: [injected()], multiInjectedProviderDiscovery: true, ssr: true, transports: { [wagmiBsc.id]: http(rpc || "https://bsc-dataseed.bnbchain.org") } });

// Wallet IDs from the WalletConnect explorer; these appear first in the connect pop-up
export const FEATURED_WALLETS = [
  "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // MetaMask
  "4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0", // Trust Wallet
  "0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150", // SafePal
  "20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66", // TokenPocket
  "8a0ee50d1f22f6651afcae7eb4253e52a3310b90af5daef78a8c4929a9bb99d4", // Binance Web3 Wallet
  "971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709", // OKX Wallet
  "38f5d18bd8522c244bdd70cb4a68e0e718865155811c043f052fb9f1c51de662", // Bitget Wallet
  "fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa", // Coinbase Wallet
];
