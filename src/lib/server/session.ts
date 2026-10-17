import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "./env";

const key = () => new TextEncoder().encode(env("SESSION_SECRET"));
export const ADMIN_COOKIE = "oxy_admin";
export const NONCE_COOKIE = "oxy_nonce";

export async function signToken(payload: Record<string, unknown>, ttl: string) {
  return new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(ttl).sign(key());
}
export async function readToken(token?: string) {
  if (!token) return null;
  try { return (await jwtVerify(token, key(), { algorithms: ["HS256"] })).payload; } catch { return null; }
}

/** True only for a valid admin session whose wallet equals ADMIN_ADDRESS. */
export async function isAdmin(): Promise<boolean> {
  const p = await readToken((await cookies()).get(ADMIN_COOKIE)?.value);
  const admin = env("ADMIN_ADDRESS", false).toLowerCase();
  return !!p && !!admin && p.role === "admin" && String(p.sub).toLowerCase() === admin;
}

export const cookieOpts = (maxAge: number) => ({ httpOnly: true, secure: true, sameSite: "strict" as const, path: "/", maxAge });
export const loginMessage = (nonce: string, issued: string) =>
  `OXYLOAN admin sign-in\n\nThis request does not cost gas or move funds.\nNonce: ${nonce}\nIssued: ${issued}`;
