import type { Metadata } from "next";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms governing use of the OxyLoan website and protocol.",
};

const sections = [
  {
    title: "Acceptance of Terms",
    body: "Placeholder: state that by accessing the site or interacting with the protocol, users agree to these terms.",
  },
  {
    title: "Eligibility",
    body: "Placeholder: describe eligibility requirements, including jurisdictional restrictions where applicable.",
  },
  {
    title: "No Financial Advice",
    body: "Nothing on this website constitutes financial, investment, legal, or tax advice. Users are solely responsible for evaluating risks before interacting with any smart contract.",
  },
  {
    title: "Protocol Risk",
    body: "Placeholder: disclose smart contract risk, market volatility, and the non-custodial, experimental nature of DeFi protocols.",
  },
  {
    title: "Intellectual Property",
    body: "Placeholder: state ownership of the OxyLoan name, logo, and site content, and any open-source licensing terms for the codebase.",
  },
  {
    title: "Limitation of Liability",
    body: "Placeholder: standard limitation-of-liability language, to be finalized with legal counsel.",
  },
  {
    title: "Changes to These Terms",
    body: "Placeholder: describe how and when these terms may be updated, and how users will be notified.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="section-container max-w-3xl">
        <SectionHeading
          eyebrow="Legal"
          title="Terms of Service"
          description="Last updated: placeholder date. This is placeholder legal content — have qualified counsel review before publishing."
          align="left"
        />
        <div className="space-y-6">
          {sections.map((section) => (
            <GlassCard key={section.title} hover={false}>
              <h2 className="font-display text-lg font-semibold text-white">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{section.body}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
