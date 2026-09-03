import Link from "next/link";
import { Droplet } from "lucide-react";
import { navLinks, socialLinks, siteConfig } from "@/lib/constants";

const legalLinks = [
  { label: "Privacy Policy", href: "/legal/privacy-policy" },
  { label: "Terms of Service", href: "/legal/terms-of-service" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-oxy-border bg-oxy-surface/60">
      <div className="section-container grid grid-cols-1 gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cta-gradient">
              <Droplet className="h-4 w-4 text-white" aria-hidden="true" />
            </span>
            Oxy<span className="gradient-text">Loan</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
            {siteConfig.description}
          </p>
          <div className="mt-6 flex gap-3">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300 transition-colors hover:border-oxy-blue-500/50 hover:text-oxy-blue-300"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-200">
            Navigate
          </h3>
          <ul className="mt-4 space-y-3">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-200">
            Resources
          </h3>
          <ul className="mt-4 space-y-3">
            <li>
              <Link href="/whitepaper" className="text-sm text-slate-400 transition-colors hover:text-white">
                Whitepaper
              </Link>
            </li>
            <li>
              <a
                href={socialLinks.find((s) => s.label === "GitHub")?.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-slate-400 transition-colors hover:text-white"
              >
                GitHub
              </a>
            </li>
            <li>
              <Link href="/contact" className="text-sm text-slate-400 transition-colors hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-slate-200">
            Legal
          </h3>
          <ul className="mt-4 space-y-3">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-slate-400 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-oxy-border">
        <div className="section-container flex flex-col items-center justify-between gap-3 py-6 text-xs text-slate-500 sm:flex-row">
          <p>© {year} {siteConfig.name}. All rights reserved.</p>
          <p>
            {siteConfig.tokenSymbol} is a utility and governance token. Nothing on this
            site is financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
