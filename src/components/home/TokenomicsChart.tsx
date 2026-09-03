"use client";

import { motion } from "framer-motion";
import { tokenAllocations, siteConfig } from "@/lib/constants";

const SIZE = 280;
const STROKE = 32;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Renders an animated donut chart from `tokenAllocations`. Purely
 * presentational — edit the source data in src/lib/constants.ts.
 */
export default function TokenomicsChart() {
  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">
      <div className="relative shrink-0">
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          role="img"
          aria-label="Token allocation breakdown chart"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={STROKE}
          />
          {tokenAllocations.map((slice, i) => {
            const dash = (slice.percentage / 100) * CIRCUMFERENCE;
            const offset = CIRCUMFERENCE - (cumulative / 100) * CIRCUMFERENCE;
            cumulative += slice.percentage;
            return (
              <motion.circle
                key={slice.label}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={slice.color}
                strokeWidth={STROKE}
                strokeLinecap="butt"
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                initial={{ strokeDashoffset: CIRCUMFERENCE, opacity: 0 }}
                whileInView={{ strokeDashoffset: offset, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: i * 0.12, ease: "easeOut" }}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-white">
            {siteConfig.tokenSymbol}
          </span>
          <span className="text-xs text-slate-500">Total Supply</span>
        </div>
      </div>

      <ul className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {tokenAllocations.map((slice, i) => (
          <motion.li
            key={slice.label}
            initial={{ opacity: 0, x: 12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="glass flex items-start gap-3 p-4"
          >
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
              aria-hidden="true"
            />
            <div>
              <div className="flex items-baseline gap-2">
                <p className="font-display font-semibold text-white">{slice.label}</p>
                <p className="text-sm font-bold text-oxy-blue-300">
                  {slice.percentage}%
                </p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {slice.description}
              </p>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
