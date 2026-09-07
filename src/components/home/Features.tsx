import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import { features } from "@/lib/constants";

export default function Features() {
  return (
    <section id="features" className="relative py-24 sm:py-32">
      <div className="section-container">
        <SectionHeading
          eyebrow="Why OxyLoan"
          title="Built on transparency and speed"
          description="Every feature is designed around one principle: users should always be able to verify what's happening with their assets."
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <GlassCard key={feature.title} delay={i * 0.08} className="group">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-cta-gradient/20 ring-1 ring-inset ring-oxy-blue-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Icon className="h-6 w-6 text-oxy-blue-300" aria-hidden="true" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
