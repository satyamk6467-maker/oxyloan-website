import { NextRequest, NextResponse } from "next/server";

/**
 * Basic abuse protection for /api/*. Uses Upstash Redis (shared across all servers) when configured,
 * otherwise a per-instance counter. For heavy attacks also enable Vercel Firewall / Attack Challenge Mode.
 */
const LIMITS: [RegExp, number][] = [
  [/^\/api\/admin\/(login|nonce)/, 10],
  [/^\/api\/claim/, 10],
  [/^\/api\/invest\/confirm/, 40],
  [/^\/api\/me/, 60],
  [/^\/api\//, 120],
];
const mem = new Map<string, { n: number; t: number }>();

async function hit(key: string, windowSec: number): Promise<number> {
  const url = process.env.UPSTASH_REDIS_REST_URL, token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      const r = await fetch(`${url}/pipeline`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify([["INCR", key], ["EXPIRE", key, windowSec, "NX"]]),
      });
      const j = await r.json();
      return Number(j?.[0]?.result ?? 0);
    } catch { /* fall through to memory */ }
  }
  const now = Date.now();
  const e = mem.get(key);
  if (!e || now - e.t > windowSec * 1000) { mem.set(key, { n: 1, t: now }); if (mem.size > 5000) mem.clear(); return 1; }
  return ++e.n;
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const limit = LIMITS.find(([re]) => re.test(path))?.[1] ?? 120;
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const bucket = path.startsWith("/api/admin") ? "admin" : path.startsWith("/api/claim") ? "clm" : path.startsWith("/api/invest") ? "inv" : path.startsWith("/api/me") ? "me" : "api";
  const count = await hit(`rl:${bucket}:${ip}`, 60);
  if (count > limit) {
    return new NextResponse(JSON.stringify({ error: "Too many requests" }), { status: 429, headers: { "content-type": "application/json", "retry-after": "60" } });
  }
  // Only same-site browsers may POST to our API (blocks cross-site form/CSRF abuse)
  if (req.method === "POST") {
    const origin = req.headers.get("origin");
    if (origin && origin !== req.nextUrl.origin) return new NextResponse(JSON.stringify({ error: "Bad origin" }), { status: 403 });
  }
  return NextResponse.next();
}
export const config = { matcher: ["/api/:path*"] };
