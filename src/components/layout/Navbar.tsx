"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Droplet } from "lucide-react";
import { navLinks } from "@/lib/constants";
import { cn } from "@/lib/utils";
import AnimatedButton from "@/components/ui/AnimatedButton";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-oxy-border bg-oxy-bg/80 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="section-container flex h-18 items-center justify-between py-4">
        <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-bold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cta-gradient shadow-glow">
            <Droplet className="h-5 w-5 text-white" aria-hidden="true" />
          </span>
          <span>
            Oxy<span className="gradient-text">Loan</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "relative text-sm font-medium text-slate-300 transition-colors hover:text-white",
                    isActive && "text-white"
                  )}
                >
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute -bottom-1.5 left-0 h-0.5 w-full rounded-full bg-cta-gradient"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden lg:block">
          <AnimatedButton href="/whitepaper" variant="primary" className="!px-6 !py-2.5 !text-xs">
            Launch App
          </AnimatedButton>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-slate-200 lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-oxy-border bg-oxy-bg/95 backdrop-blur-xl lg:hidden"
          >
            <ul className="section-container flex flex-col gap-1 py-4">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white",
                      pathname === link.href && "bg-white/5 text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2">
                <AnimatedButton href="/whitepaper" variant="primary" className="w-full">
                  Launch App
                </AnimatedButton>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
