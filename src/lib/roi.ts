export type RoiTier = {
  minAmount: number;
  monthlyRatePercent: number;
  label: string;
};

export const ROI_TIERS: readonly RoiTier[] = [
  { minAmount: 10, monthlyRatePercent: 5, label: "10–35.99 USDT" },
  { minAmount: 36, monthlyRatePercent: 8, label: "36–999.99 USDT" },
  { minAmount: 1000, monthlyRatePercent: 10, label: "1,000–1,999.99 USDT" },
  { minAmount: 2000, monthlyRatePercent: 11, label: "2,000–2,999.99 USDT" },
  { minAmount: 3000, monthlyRatePercent: 12, label: "3,000–4,999.99 USDT" },
  { minAmount: 5000, monthlyRatePercent: 14, label: "5,000+ USDT" },
] as const;

export type RoiPreview = {
  investmentAmountUsdt: number;
  tier: string;
  monthlyRatePercent: number;
  estimatedMonthlyAmountUsdt: number;
  disclaimer: string;
};

const DISCLAIMER =
  "Illustrative estimate only, not a guarantee or promise of returns. This preview does not create an investment, record an accrual, or initiate a payout.";

export function calculateRoiPreview(amount: number): RoiPreview {
  if (!Number.isFinite(amount) || amount < 10) {
    throw new RangeError("Investment amount must be at least 10 USDT.");
  }

  // Choose the highest tier threshold the amount meets, avoiding decimal gaps.
  const tier = [...ROI_TIERS].reverse().find((candidate) => amount >= candidate.minAmount);

  if (!tier) {
    throw new RangeError("No ROI tier is configured for this amount.");
  }

  return {
    investmentAmountUsdt: amount,
    tier: tier.label,
    monthlyRatePercent: tier.monthlyRatePercent,
    estimatedMonthlyAmountUsdt:
      Math.round((amount * tier.monthlyRatePercent / 100 + Number.EPSILON) * 100) / 100,
    disclaimer: DISCLAIMER,
  };
}
