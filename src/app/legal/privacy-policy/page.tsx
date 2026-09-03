import type { Metadata } from "next";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How OxyLoan collects, uses, and protects your information.",
};

const sections = [
  {
    title: "Information We Collect",
    body: "Placeholder: describe what information is collected (e.g. wallet addresses, on-chain transaction data, optional contact form submissions) and how it is gathered.",
  },
  {
    title: "How We Use Information",
    body: "Placeholder: explain the purposes for processing data, such as improving the protocol, responding to inquiries, and security monitoring.",
  },
  {
    title: "Cookies & Analytics",
    body: "Placeholder: disclose any cookies or analytics tools used on the site and how users can manage preferences.",
  },
  {
    title: "Third-Party Services",
    body: "Placeholder: list third-party services (wallet providers, analytics, hosting) and link to their respective privacy policies.",
  },
  {
    title: "Data Retention & Security",
    body: "Placeholder: describe retention periods and security measures used to protect any collected data.",
  },
  {
    title: "Your Rights",
    body: "Placeholder: outline user rights (access, deletion, correction) and how to exercise them, consistent with applicable law (e.g. GDPR, CCPA).",
  },
  {
    title: "Contact",
    body: "Questions about this policy can be sent via the Contact page.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="section-container max-w-3xl">
        <SectionHeading
          eyebrow="Legal"
          title="Privacy Policy"
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
