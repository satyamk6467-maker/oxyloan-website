"use client";

import { motion } from "framer-motion";
import { Check, Loader2, Circle } from "lucide-react";
import { roadmapMilestones } from "@/lib/constants";
import { cn } from "@/lib/utils";

const statusConfig = {
  complete: {
    icon: Check,
    dot: "bg-oxy-cyan-400 border-oxy-cyan-400",
    badge: "bg-oxy-cyan-400/10 text-oxy-cyan-300 border-oxy-cyan-400/30",
    label: "Complete",
  },
  "in-progress": {
    icon: Loader2,
    dot: "bg-oxy-blue-500 border-oxy-blue-400 animate-pulse-slow",
    badge: "bg-oxy-blue-500/10 text-oxy-blue-300 border-oxy-blue-500/30",
    label: "In Progress",
  },
  upcoming: {
    icon: Circle,
    dot: "bg-transparent border-slate-600",
    badge: "bg-white/5 text-slate-400 border-white/10",
    label: "Upcoming",
  },
} as const;

export default function RoadmapTimeline() {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-oxy-blue-500 via-oxy-cyan-400/60 to-transparent sm:left-1/2 sm:-translate-x-1/2"
      />

      <ol className="space-y-10">
        {roadmapMilestones.map((milestone, i) => {
          const config = statusConfig[milestone.status];
          const StatusIcon = config.icon;
          const isEven = i % 2 === 0;

          return (
            <li key={`${milestone.quarter}-${milestone.title}`} className="relative">
              <div className="sm:grid sm:grid-cols-2 sm:gap-10">
                <motion.div
                  initial={{ opacity: 0, x: isEven ? -24 : 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={cn(
                    "relative pl-12 sm:pl-0",
                    isEven ? "sm:order-1 sm:pr-12 sm:text-right" : "sm:order-2 sm:col-start-2 sm:pl-12"
                  )}
                >
                  <span
                    className={cn(
                      "absolute left-0 top-0 z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 shadow-glow sm:left-1/2 sm:-translate-x-1/2",
                      config.dot,
                      isEven ? "sm:left-auto sm:right-0 sm:translate-x-1/2" : "sm:left-0 sm:-translate-x-1/2"
                    )}
                  >
                    <StatusIcon
                      className={cn(
                        "h-4 w-4",
                        milestone.status === "upcoming" ? "text-slate-500" : "text-white",
                        milestone.status === "in-progress" && "animate-spin-slow"
                      )}
                    />
                  </span>

                  <div className="glass glass-hover p-6">
                    <div
                      className={cn(
                        "mb-3 flex items-center gap-3",
                        isEven ? "sm:justify-end" : "sm:justify-start"
                      )}
                    >
                      <span className="font-display text-xl font-bold text-white">
                        {milestone.quarter}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                          config.badge
                        )}
                      >
                        {config.label}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-semibold text-white">
                      {milestone.title}
                    </h3>
                    <ul
                      className={cn(
                        "mt-3 space-y-2 text-sm text-slate-400",
                        isEven ? "sm:text-right" : "sm:text-left"
                      )}
                    >
                      {milestone.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
