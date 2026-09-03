import type { LucideIcon } from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
}

export interface FeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface TokenAllocation {
  label: string;
  percentage: number;
  color: string;
  description: string;
}

export interface RoadmapMilestone {
  quarter: string;
  title: string;
  items: string[];
  status: "complete" | "in-progress" | "upcoming";
}

export interface SecurityItem {
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface SocialLink {
  label: string;
  href: string;
  icon: LucideIcon;
}
