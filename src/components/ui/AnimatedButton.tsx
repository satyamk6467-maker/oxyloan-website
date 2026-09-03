"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface AnimatedButtonProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  icon?: ReactNode;
  external?: boolean;
  className?: string;
}

export default function AnimatedButton({
  href,
  children,
  variant = "primary",
  icon,
  external = false,
  className,
}: AnimatedButtonProps) {
  const classes = cn(variant === "primary" ? "btn-primary" : "btn-secondary", className);

  const content = (
    <motion.span
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.97 }}
      className={classes}
    >
      {children}
      {icon}
    </motion.span>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-block">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="inline-block">
      {content}
    </Link>
  );
}
