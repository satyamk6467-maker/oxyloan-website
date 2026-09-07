import AnimatedButton from "@/components/ui/AnimatedButton";
import { ArrowRight, FileText } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="section-container">
        <div className="glass relative overflow-hidden p-10 text-center sm:p-16">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-radial-fade opacity-80"
          />
          <h2 className="font-display text-3xl font-bold sm:text-4xl md:text-5xl">
            Ready to explore <span className="gradient-text">OxyLoan</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-slate-400 sm:text-lg">
            Dive into the whitepaper for the full technical breakdown, or reach out
            directly with questions about the protocol.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <AnimatedButton href="/whitepaper" variant="primary" icon={<FileText className="h-4 w-4" />}>
              Read Whitepaper
            </AnimatedButton>
            <AnimatedButton href="/contact" variant="secondary" icon={<ArrowRight className="h-4 w-4" />}>
              Contact Us
            </AnimatedButton>
          </div>
        </div>
      </div>
    </section>
  );
}
