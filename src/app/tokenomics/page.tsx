import type { Metadata } from "next";
import SectionHeading from "@/components/ui/SectionHeading";
import TokenomicsChart from "@/components/home/TokenomicsChart";
import GlassCard from "@/components/ui/GlassCard";
import { tokenAllocations, siteConfig } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tokenomics",
  description:
    "Explore OXY's token allocation, supply, and vesting structure. Figures are based on the finalized OXY token allocation.",
};

const supplyFacts = [
  { label: "Token Symbol", value: siteConfig.tokenSymbol },
  { label: "Total Supply", value: "10,000,000 OXY" },
  { label: "Network", value: siteConfig.chainName },
  { label: "Token Standard", value: "BEP-20" },
];

export default function TokenomicsPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="section-container">
        <SectionHeading
          eyebrow="Tokenomics"
          title="OXY token allocation"
          description="A fixed supply of 10,000,000 OXY distributed across liquidity, reserves, rewards, ecosystem growth, and the technical team."
        />

        <div className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {supplyFacts.map((fact) => (
            <div key={fact.label} className="glass p-5 text-center">
              <p className="font-display text-lg font-bold text-white sm:text-xl">
                {fact.value}
              </p>
              <p className="mt-1 text-xs text-slate-500">{fact.label}</p>
            </div>
          ))}
        </div>

        <TokenomicsChart />

        <div className="mt-20">
          <SectionHeading
            eyebrow="Vesting"
            title="Vesting & release schedule"
            description="Illustrative lock-up and linear-vesting periods per category — finalize before public disclosure."
            align="left"
          />
          <div className="overflow-hidden rounded-2xl border border-oxy-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.03] text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-medium">Category</th>
                  <th className="px-6 py-4 font-medium">Allocation</th>
                  <th className="px-6 py-4 font-medium">Cliff</th>
                  <th className="px-6 py-4 font-medium">Vesting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-oxy-border">
                {tokenAllocations.map((row) => (
                  <tr key={row.label} className="bg-white/[0.01]">
                    <td className="flex items-center gap-2 px-6 py-4 font-medium text-white">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: row.color }}
                        aria-hidden="true"
                      />
                      {row.label}
                    </td>
                    <td className="px-6 py-4 text-slate-300">{row.percentage}%</td>
                    <td className="px-6 py-4 text-slate-400">Placeholder</td>
                    <td className="px-6 py-4 text-slate-400">Placeholder</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <GlassCard className="mt-12" hover={false}>
          <p className="text-sm leading-relaxed text-slate-400">
            <strong className="text-slate-200">Disclaimer:</strong> Tokenomics figures on
            this page reflect the current OXY token allocation and are subject to
            change only if officially updated by the OxyLoan project. Always refer to the official
            whitepaper and audited contract source for finalized, binding details.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
