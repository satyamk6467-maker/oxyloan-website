import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { signToken, cookieOpts, loginMessage, NONCE_COOKIE } from "@/lib/server/session";

export const runtime = "nodejs";

export async function GET() {
  const nonce = randomBytes(16).toString("hex");
  const issued = new Date().toISOString();
  const res = NextResponse.json({ message: loginMessage(nonce, issued) });
  res.cookies.set(NONCE_COOKIE, await signToken({ nonce, issued }, "2m"), cookieOpts(120));
  return res;
}
