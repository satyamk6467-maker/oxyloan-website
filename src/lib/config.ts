import { parseAbi, type Address } from "viem";

export const USDT: Address = "0x55d398326f99059fF775485246999027B3197955"; // USDT BEP-20 (18 decimals)
export const OXYLOAN: Address = "0x899dCFfAF285D087D700744DD6Bd9EBfb29BF299";
export const PANCAKE_ROUTER: Address = "0x10ED43C718714eb63d5aA57B78B54704E256024E"; // PancakeSwap V2
export const MANAGEMENT_WALLET: Address = "0xCBbAcCbFaf4b1B8a968Bb205AC59C5175189874d";
export const SWAP_WALLET: Address = "0xE23C4c49DD09861E86a640293a674D43204987a7";

// The deployed, BscScan-verified investment contract (public address). The env var can override it, e.g. for a new deployment.
export const DEPLOYED_INVEST_CONTRACT = "0x14b26B9576808C3C16A5F52038dda38aEc96d3E1";
export const INVEST_CONTRACT = (process.env.NEXT_PUBLIC_INVEST_CONTRACT || DEPLOYED_INVEST_CONTRACT) as Address | "";
export const IS_LIVE = /^0x[a-fA-F0-9]{40}$/.test(INVEST_CONTRACT);

export const MIN_INVEST_USDT = 10;
export const FEE_PCT = 50;
export const REFERRAL_PCT = 10;

export const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

export const investAbi = parseAbi([
  "function invest(uint256 amount, address referrer)",
  "function referrerOf(address) view returns (address)",
  "function totalInvested(address) view returns (uint256)",
  "function referralEarned(address) view returns (uint256)",
  "function minInvestment() view returns (uint256)",
  "function paused() view returns (bool)",
  "event Invested(uint256 indexed id, address indexed investor, address indexed referrer, uint256 amount, uint256 managementAmount, uint256 referralAmount, uint256 swapAmount)",
  "event ReferrerSet(address indexed investor, address indexed referrer)",
]);

export const routerAbi = parseAbi([
  "function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)",
]);

export const short = (a?: string) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");
