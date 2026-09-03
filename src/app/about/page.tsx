import type { Metadata } from "next";
import SectionHeading from "@/components/ui/SectionHeading";
import GlassCard from "@/components/ui/GlassCard";
import { Target, Compass, Heart, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about OxyLoan's mission to build transparent, non-custodial decentralized lending infrastructure for everyone.",
};

const values = [
  {
    title: "Mission",
    description:
      "To make credit and yield accessible to anyone with an internet connection, without relying on centralized gatekeepers.",
    icon: Target,
  },
  {
    title: "Vision",
    description:
      "A world where lending markets are open, permissionless, and governed transparently by the people who use them.",
    icon: Compass,
  },
  {
    title: "Values",
    description:
      "Transparency, security, and community ownership guide every protocol decision we make.",
    icon: Heart,
  },
  {
    title: "Reach",
    description:
      "Built chain-agnostic from day one, with a roadmap toward multi-chain deployment and global accessibility.",
    icon: Globe,
  },
];

const team = [
  { role: "Protocol Lead", bio: "Smart contract architecture and tokenomics design." },
  { role: "Head of Security", bio: "Audit coordination, threat modeling, and incident response." },
  { role: "Head of Growth", bio: "Community, partnerships, and ecosystem expansion." },
  { role: "Lead Engineer", bio: "Full-stack and on-chain infrastructure." },
];

export default function AboutPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="section-container">
        <SectionHeading
          eyebrow="About Us"
          title="Building the future of decentralized credit"
          description="OxyLoan started with a simple idea: lending should be transparent, accessible, and owned by its community — not a handful of intermediaries."
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {values.map((item, i) => {
            const Icon = item.icon;
            return (
              <GlassCard key={item.title} delay={i * 0.08} className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cta-gradient/20 ring-1 ring-inset ring-oxy-blue-500/30">
                  <Icon className="h-6 w-6 text-oxy-blue-300" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {item.description}
                  </p>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      <div className="section-container mt-24">
        <SectionHeading
          eyebrow="The Team"
          title="A small team, an open protocol"
          description="Placeholder role descriptions below — swap in real bios, names, and photos as the team page is finalized."
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, i) => (
            <GlassCard key={member.role} delay={i * 0.08} className="text-center">
              <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gradient-to-br from-oxy-blue-500/30 to-oxy-cyan-400/20 ring-1 ring-white/10" />
              <h3 className="font-display font-semibold text-white">{member.role}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">{member.bio}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
