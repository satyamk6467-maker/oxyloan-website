/** The wallets investors can pick. Detection by connector name; deep links open the site inside the wallet's own browser on phones. */
export type WalletInfo = {
  id: string; name: string; match: RegExp; color: string; install: string;
  deeplink: ((url: string) => string) | null; hint?: string;
};
const e = encodeURIComponent;
export const WALLETS: WalletInfo[] = [
  { id: "metamask", name: "MetaMask", match: /metamask/i, color: "#f6851b", install: "https://metamask.io/download/",
    deeplink: (u) => `https://metamask.app.link/dapp/${u.replace(/^https?:\/\//, "")}` },
  { id: "binance", name: "Binance Wallet", match: /binance/i, color: "#f3ba2f", install: "https://www.binance.com/en/web3wallet",
    deeplink: null, hint: "Open the Binance app, go to Wallet, Web3, then the DApp browser, and paste this site's link." },
  { id: "trust", name: "Trust Wallet", match: /trust/i, color: "#3375bb", install: "https://trustwallet.com/download",
    deeplink: (u) => `https://link.trustwallet.com/open_url?coin_id=20000714&url=${e(u)}` },
  { id: "safepal", name: "SafePal", match: /safepal/i, color: "#4a67ff", install: "https://www.safepal.com/download",
    deeplink: null, hint: "Open the SafePal app, go to Browser (DApp), and paste this site's link." },
  { id: "tokenpocket", name: "TokenPocket", match: /token\s?pocket/i, color: "#2980fe", install: "https://www.tokenpocket.pro/en/download/app",
    deeplink: (u) => `tpdapp://open?params=${e(JSON.stringify({ url: u, chain: "BSC", source: "OXYLOAN" }))}` },
  { id: "bitget", name: "Bitget Wallet", match: /bitget|bitkeep/i, color: "#00c3d1", install: "https://web3.bitget.com/en/wallet-download",
    deeplink: (u) => `https://bkcode.vip?action=dapp&url=${e(u)}` },
  { id: "okx", name: "OKX Wallet", match: /okx|okex/i, color: "#e8e8e8", install: "https://www.okx.com/web3",
    deeplink: (u) => `okx://wallet/dapp/url?dappUrl=${e(u)}` },
  { id: "coinbase", name: "Coinbase Wallet", match: /coinbase/i, color: "#1652f0", install: "https://www.coinbase.com/wallet/downloads",
    deeplink: (u) => `https://go.cb-w.com/dapp?cb_url=${e(u)}` },
];
