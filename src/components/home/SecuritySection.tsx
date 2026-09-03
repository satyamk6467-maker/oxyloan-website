import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import { securityItems } from "@/lib/constants";
import { ShieldCheck } from "lucide-react";

export default function SecuritySection() {
  return (
    <section className="relative py-24 sm:py-32">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 mx-auto h-px max-w-4xl bg-gradient-to-r from-transparent via-oxy-blue-500/40 to-transparent"
      />
      <div className="section-container">
        <SectionHeading
          eyebrow="Security"
          title="Security is not a feature. It's the foundation."
          description="OxyLoan is engineered with defense-in-depth: every layer of the protocol is designed to minimize trust and maximize verifiability."
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {securityItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <GlassCard key={item.title} delay={i * 0.08}>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-oxy-cyan-400/10 ring-1 ring-inset ring-oxy-cyan-400/30">
                  <Icon className="h-6 w-6 text-oxy-cyan-300" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {item.description}
                </p>
              </GlassCard>
            );
          })}
        </div>

        <div className="mx-auto mt-12 flex max-w-2xl items-start gap-3 rounded-2xl border border-oxy-blue-500/20 bg-oxy-blue-500/[0.04] p-5 text-left">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-oxy-blue-300" aria-hidden="true" />
          <p className="text-sm text-slate-400">
            Audit reports, once completed, are published in full for public review.
            No security claim on this site should be taken as a guarantee — always
            do your own research (DYOR) before interacting with any DeFi protocol.
          </p>
        </div>
      </div>
    </section>
  );
}
