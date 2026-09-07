import type { Metadata } from "next";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import SectionHeading from "@/components/ui/SectionHeading";
import TokenomicsChart from "@/components/home/TokenomicsChart";
import RoadmapTimeline from "@/components/home/RoadmapTimeline";
import SecuritySection from "@/components/home/SecuritySection";
import FAQAccordion from "@/components/home/FAQAccordion";
import CtaSection from "@/components/home/CtaSection";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "OxyLoan — Decentralized Lending Protocol",
  description:
    "OxyLoan connects borrowers and lenders through transparent, audited smart contracts. Explore our tokenomics, roadmap, and security model.",
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />

      <section className="py-24 sm:py-32" id="tokenomics">
        <div className="section-container">
          <SectionHeading
            eyebrow="Tokenomics"
            title="A fixed, transparent supply"
            description="Every OXY token allocation is tracked on-chain. Figures below are illustrative and finalized closer to the token generation event."
          />
          <TokenomicsChart />
          <div className="mt-10 flex justify-center">
            <AnimatedButton href="/tokenomics" variant="secondary" icon={<ArrowRight className="h-4 w-4" />}>
              Full Tokenomics Breakdown
            </AnimatedButton>
          </div>
        </div>
      </section>

      <section className="py-24 sm:py-32" id="roadmap">
        <div className="section-container">
          <SectionHeading
            eyebrow="Roadmap"
            title="Where we're headed"
            description="A milestone-driven path from foundation to full ecosystem scale."
          />
          <RoadmapTimeline />
        </div>
      </section>

      <SecuritySection />

      <section className="py-24 sm:py-32" id="faq">
        <div className="section-container">
          <SectionHeading
            eyebrow="FAQ"
            title="Frequently asked questions"
            description="Can't find what you're looking for? Reach out on our Contact page."
          />
          <FAQAccordion />
        </div>
      </section>

      <CtaSection />
    </>
  );
}
