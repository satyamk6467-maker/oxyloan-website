"use client";

import { motion } from "framer-motion";
import { FileText, Map, ArrowRight } from "lucide-react";
import ParticleBackground from "@/components/ui/ParticleBackground";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { siteConfig } from "@/lib/constants";

const stats = [
  { label: "Total Value Locked", value: "$0" },
  { label: "Active Lenders", value: "0" },
  { label: "Chains Supported", value: "1" },
  { label: "Audits Completed", value: "0" },
];

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-grid-pattern bg-[size:44px_44px] pb-24 pt-20 sm:pb-32 sm:pt-28">
      <div className="absolute inset-0 -z-10 bg-radial-fade" />
      <div className="absolute inset-0 -z-10">
        <ParticleBackground />
      </div>

      {/* Floating blockchain-themed shapes */}
      <div
        aria-hidden="true"
        className="absolute -left-16 top-24 h-64 w-64 rounded-full bg-oxy-blue-500/20 blur-3xl animate-pulse-slow"
      />
      <div
        aria-hidden="true"
        className="absolute -right-10 top-1/3 h-72 w-72 rounded-full bg-oxy-cyan-400/15 blur-3xl animate-pulse-slow"
      />
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-10 h-24 w-24 -translate-x-1/2 rotate-45 rounded-2xl border border-oxy-blue-400/20 animate-float-slow"
      />
      <div
        aria-hidden="true"
        className="absolute right-16 bottom-10 h-16 w-16 rotate-12 rounded-xl border border-oxy-cyan-400/20 animate-float"
      />

      <div className="section-container relative flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 flex items-center gap-2 rounded-full border border-oxy-blue-500/30 bg-oxy-blue-500/10 px-4 py-1.5 text-xs font-medium text-oxy-blue-300"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-oxy-cyan-400" />
          Non-custodial lending, live on {siteConfig.chainName}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Decentralized lending,
          <br />
          <span className="gradient-text">built for everyone.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 max-w-2xl text-base text-slate-400 sm:text-lg"
        >
          {siteConfig.name} connects borrowers and lenders directly through audited,
          transparent smart contracts — no banks, no gatekeepers, no compromises.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 flex flex-col gap-4 sm:flex-row"
        >
          <AnimatedButton
            href="/whitepaper"
            variant="primary"
            icon={<FileText className="h-4 w-4" />}
          >
            Read Whitepaper
          </AnimatedButton>
          <AnimatedButton
            href="/roadmap"
            variant="secondary"
            icon={<Map className="h-4 w-4" />}
          >
            View Roadmap
          </AnimatedButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-20 grid w-full max-w-3xl grid-cols-2 gap-6 border-t border-white/5 pt-10 sm:grid-cols-4"
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-display text-2xl font-bold text-white sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.a
          href="#features"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-16 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-300"
        >
          Explore the protocol
          <ArrowRight className="h-3.5 w-3.5 rotate-90" />
        </motion.a>
      </div>
    </section>
  );
}
