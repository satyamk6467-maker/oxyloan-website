import type { Metadata } from "next";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { Download, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Whitepaper",
  description:
    "Read the OxyLoan whitepaper covering protocol architecture, tokenomics, governance, and security model.",
};

const sections = [
  {
    title: "1. Introduction",
    description: "The problem with centralized lending and how OxyLoan addresses it.",
  },
  {
    title: "2. Protocol Architecture",
    description: "Smart contract design, lending pools, interest rate models, and liquidation logic.",
  },
  {
    title: "3. Tokenomics",
    description: "OXY supply, allocation, vesting, and utility across the protocol.",
  },
  {
    title: "4. Governance",
    description: "How DAO proposals, voting, and treasury management work on-chain.",
  },
  {
    title: "5. Security Model",
    description: "Audits, multi-signature administration, and role-based access control.",
  },
  {
    title: "6. Roadmap & Future Work",
    description: "Planned upgrades, chain expansion, and long-term protocol vision.",
  },
];

export default function WhitepaperPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="section-container">
        <SectionHeading
          eyebrow="Whitepaper"
          title="The OxyLoan technical whitepaper"
          description="A complete breakdown of the protocol's architecture, tokenomics, governance, and security model."
        />

        <div className="mx-auto mb-16 flex max-w-md flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <AnimatedButton
            href="/OxyLoan-Whitepaper.pdf"
            variant="primary"
            icon={<Download className="h-4 w-4" />}
            external
          >
            Download PDF
          </AnimatedButton>
          <AnimatedButton href="/contact" variant="secondary" icon={<FileText className="h-4 w-4" />}>
            Request Full Draft
          </AnimatedButton>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {sections.map((section, i) => (
            <GlassCard key={section.title} delay={i * 0.08}>
              <h3 className="font-display text-lg font-semibold text-white">
                {section.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {section.description}
              </p>
            </GlassCard>
          ))}
        </div>

        <GlassCard className="mt-12" hover={false}>
          <p className="text-sm leading-relaxed text-slate-400">
            <strong className="text-slate-200">Note:</strong> The downloadable PDF is a
            placeholder link. Replace{" "}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">
              /public/OxyLoan-Whitepaper.pdf
            </code>{" "}
            with the finalized whitepaper document before launch.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
