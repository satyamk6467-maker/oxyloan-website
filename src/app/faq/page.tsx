import type { Metadata } from "next";
import SectionHeading from "@/components/ui/SectionHeading";
import FAQAccordion from "@/components/home/FAQAccordion";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about OxyLoan, the OXY token, wallet support, audits, and treasury management.",
};

export default function FaqPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="section-container">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently asked questions"
          description="Everything you need to know about the protocol, the token, and how to get involved."
        />
        <FAQAccordion />
        <div className="mt-12 flex justify-center">
          <AnimatedButton href="/contact" variant="secondary" icon={<ArrowRight className="h-4 w-4" />}>
            Still have questions? Contact us
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
}
