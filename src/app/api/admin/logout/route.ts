import { NextResponse } from "next/server";
import { ADMIN_COOKIE, cookieOpts } from "@/lib/server/session";
export const runtime = "nodejs";
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", cookieOpts(0));
  return res;
}
