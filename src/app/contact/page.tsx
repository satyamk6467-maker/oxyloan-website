import type { Metadata } from "next";
import SectionHeading from "@/components/ui/SectionHeading";
import ContactForm from "@/components/home/ContactForm";
import GlassCard from "@/components/ui/GlassCard";
import { Mail, MessageCircle, Github } from "lucide-react";
import { socialLinks } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the OxyLoan team for partnerships, support, or general inquiries.",
};

const channels = [
  {
    label: "Email",
    value: "team@oxyloan.io",
    href: "mailto:team@oxyloan.io",
    icon: Mail,
  },
  {
    label: "Discord",
    value: "Join the community",
    href: socialLinks.find((s) => s.label === "Discord")?.href ?? "#",
    icon: MessageCircle,
  },
  {
    label: "GitHub",
    value: "View source & audits",
    href: socialLinks.find((s) => s.label === "GitHub")?.href ?? "#",
    icon: Github,
  },
];

export default function ContactPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="section-container">
        <SectionHeading
          eyebrow="Contact"
          title="Let's talk"
          description="Whether it's a partnership, a security disclosure, or a general question — we'd love to hear from you."
        />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ContactForm />
          </div>

          <div className="space-y-4 lg:col-span-2">
            {channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <GlassCard key={channel.label} className="flex items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cta-gradient/20 ring-1 ring-inset ring-oxy-blue-500/30">
                    <Icon className="h-5 w-5 text-oxy-blue-300" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {channel.label}
                    </p>
                    <a
                      href={channel.href}
                      target={channel.href.startsWith("http") ? "_blank" : undefined}
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-white hover:text-oxy-blue-300"
                    >
                      {channel.value}
                    </a>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
