import Link from "next/link";
import AnimatedButton from "@/components/ui/AnimatedButton";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-sm font-semibold uppercase tracking-widest text-oxy-blue-400">
        404
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
        Page <span className="gradient-text">not found</span>
      </h1>
      <p className="mt-4 max-w-md text-slate-400">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <div className="mt-8">
        <AnimatedButton href="/" variant="primary" icon={<Home className="h-4 w-4" />}>
          Back to Home
        </AnimatedButton>
      </div>
      <Link href="/contact" className="mt-6 text-sm text-slate-500 hover:text-slate-300">
        Or let us know something's broken →
      </Link>
    </div>
  );
}
