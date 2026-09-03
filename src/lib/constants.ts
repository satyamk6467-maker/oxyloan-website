import {
  ShieldCheck,
  Zap,
  Users,
  PieChart,
  Lock,
  Wallet,
  FileCheck2,
  KeyRound,
  Eye,
  ShieldAlert,
  Twitter,
  Send,
  Github,
  MessageCircle,
  BookText,
} from "lucide-react";
import type {
  NavLink,
  FeatureItem,
  TokenAllocation,
  RoadmapMilestone,
  SecurityItem,
  FaqItem,
  SocialLink,
} from "./types";

/**
 * Site-wide configuration. Values are pulled from environment variables
 * where they might change per-deployment, with safe fallbacks for local dev.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME ?? "OxyLoan",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oxyloan.io",
  description:
    "OxyLoan is a decentralized, non-custodial lending protocol connecting borrowers and lenders through transparent, audited smart contracts.",
  tokenSymbol: "OXY",
  chainName: process.env.NEXT_PUBLIC_CHAIN_NAME ?? "BNB Smart Chain",
  tokenContract:
    process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS ??
    "0xcfea5ed79693fdce70189768d378eab12a639768",
};

export const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Tokenomics", href: "/tokenomics" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Whitepaper", href: "/whitepaper" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export const features: FeatureItem[] = [
  {
    title: "Smart Contract Powered",
    description:
      "Every loan, deposit, and repayment is enforced entirely on-chain — no intermediaries, no manual overrides.",
    icon: FileCheck2,
  },
  {
    title: "Fast Transactions",
    description:
      "Optimized contract logic and Layer-2 support mean confirmations in seconds, not minutes.",
    icon: Zap,
  },
  {
    title: "Community Governance",
    description:
      "OXY holders vote on protocol parameters, treasury spending, and future upgrades through on-chain proposals.",
    icon: Users,
  },
  {
    title: "Transparent Tokenomics",
    description:
      "Fixed supply, public vesting schedules, and on-chain treasury tracking — no hidden allocations.",
    icon: PieChart,
  },
  {
    title: "Security First",
    description:
      "Audited contracts, multi-signature administration, and role-based access controls protect every deposit.",
    icon: ShieldCheck,
  },
  {
    title: "Cross-Platform Wallet Support",
    description:
      "Connect seamlessly with MetaMask, WalletConnect, Coinbase Wallet, and other leading providers.",
    icon: Wallet,
  },
];

/**
 * Percentages should sum to 100.
 */
export const tokenAllocations: TokenAllocation[] = [
  {
    label: "Liquidity",
    percentage: 70,
    color: "#1e8bff",
    description: "DEX liquidity provisioning to support healthy OXY markets.",
  },
  {
    label: "Project Reserve",
    percentage: 10,
    color: "#14cabf",
    description: "Reserved funds for long-term project operations and sustainability.",
  },
  {
    label: "Community Rewards",
    percentage: 10,
    color: "#4aa8ff",
    description: "Rewards, staking incentives, and community programs.",
  },
  {
    label: "Ecosystem & Marketing",
    percentage: 5,
    color: "#7ff3ec",
    description: "Ecosystem growth, partnerships, marketing, and community campaigns.",
  },
  {
    label: "Technical Team",
    percentage: 5,
    color: "#0c58b3",
    description: "Protocol development, infrastructure, security, and technical operations.",
  },
];

/**
 * PLACEHOLDER MILESTONES — update quarters/items as the real roadmap solidifies.
 */
export const roadmapMilestones: RoadmapMilestone[] = [
  {
    quarter: "Q1",
    title: "Foundation",
    items: [
      "Whitepaper v1 published",
      "Core smart contracts drafted",
      "Website and brand identity launched",
      "Community channels established",
    ],
    status: "complete",
  },
  {
    quarter: "Q2",
    title: "Testnet Launch",
    items: [
      "Public testnet deployment",
      "Bug bounty program opens",
      "First smart contract audit",
      "Wallet integrations (MetaMask, WalletConnect)",
    ],
    status: "complete",
  },
  {
    quarter: "Q3",
    title: "Mainnet & Token Generation",
    items: [
      "OXY token generation event",
      "Mainnet lending pools live",
      "Liquidity provisioning on major DEXs",
      "Second independent audit",
    ],
    status: "in-progress",
  },
  {
    quarter: "Q4",
    title: "Governance & Expansion",
    items: [
      "DAO governance module activated",
      "Cross-chain lending pools",
      "Mobile-optimized dApp",
      "Strategic ecosystem partnerships",
    ],
    status: "upcoming",
  },
  {
    quarter: "Q1+1",
    title: "Scale",
    items: [
      "Institutional lending vaults",
      "Additional chain deployments",
      "Advanced risk & credit scoring engine",
      "Global compliance expansion",
    ],
    status: "upcoming",
  },
];

export const securityItems: SecurityItem[] = [
  {
    title: "Audited Smart Contracts",
    description:
      "All core contracts undergo independent third-party audits before and after mainnet deployment.",
    icon: ShieldCheck,
  },
  {
    title: "OpenZeppelin Libraries",
    description:
      "Built on battle-tested, widely reviewed OpenZeppelin standards for tokens, access control, and upgrades.",
    icon: Lock,
  },
  {
    title: "Multi-Signature Administration",
    description:
      "Protocol-critical actions require multiple signers via a Gnosis Safe multi-sig, eliminating single points of failure.",
    icon: KeyRound,
  },
  {
    title: "Role-Based Access Control",
    description:
      "Granular on-chain permissions ensure only authorized roles can execute sensitive administrative functions.",
    icon: ShieldAlert,
  },
  {
    title: "Regular Audits",
    description:
      "Ongoing scheduled reviews and re-audits accompany every major protocol upgrade.",
    icon: FileCheck2,
  },
  {
    title: "Full Transparency",
    description:
      "Treasury flows, contract addresses, and audit reports are published on-chain and publicly accessible.",
    icon: Eye,
  },
];

export const faqItems: FaqItem[] = [
  {
    question: "What is OxyLoan?",
    answer:
      "OxyLoan is a decentralized, non-custodial lending protocol that lets users lend and borrow crypto assets directly through audited smart contracts, without relying on a central intermediary.",
  },
  {
    question: "What is the OXY token used for?",
    answer:
      "OXY is the protocol's native governance and utility token. Holders can vote on proposals, stake for rewards, and receive fee discounts across the platform.",
  },
  {
    question: "Is OxyLoan audited?",
    answer:
      "Yes. Core smart contracts undergo independent third-party security audits before mainnet deployment, with regular re-audits accompanying major upgrades. Reports are published publicly once complete.",
  },
  {
    question: "Which wallets are supported?",
    answer:
      "OxyLoan supports MetaMask, WalletConnect, Coinbase Wallet, and other major Web3 wallets across desktop and mobile.",
  },
  {
    question: "How is the treasury managed?",
    answer:
      "Treasury funds are held in a multi-signature wallet and governed by OXY token holders through on-chain proposals, with all flows publicly viewable.",
  },
  {
    question: "When does the token generation event happen?",
    answer:
      "Token generation timing is outlined on the Roadmap page and will be announced through official OxyLoan channels as the date approaches.",
  },
];

export const socialLinks: SocialLink[] = [
  {
    label: "Twitter",
    href: process.env.NEXT_PUBLIC_TWITTER_URL ?? "https://twitter.com/oxyloan",
    icon: Twitter,
  },
  {
    label: "Telegram",
    href: process.env.NEXT_PUBLIC_TELEGRAM_URL ?? "https://t.me/oxyloan",
    icon: Send,
  },
  {
    label: "Discord",
    href: process.env.NEXT_PUBLIC_DISCORD_URL ?? "https://discord.gg/oxyloan",
    icon: MessageCircle,
  },
  {
    label: "GitHub",
    href: process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/oxyloan",
    icon: Github,
  },
  {
    label: "Whitepaper",
    href: "/whitepaper",
    icon: BookText,
  },
];
