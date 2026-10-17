import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { isAddress, verifyMessage } from "viem";
import { publicClient } from "@/lib/server/chain";
import { env } from "@/lib/server/env";
import { ADMIN_COOKIE, NONCE_COOKIE, cookieOpts, loginMessage, readToken, signToken } from "@/lib/server/session";

export const runtime = "nodejs";
const Body = z.object({ address: z.string(), signature: z.string().regex(/^0x[0-9a-fA-F]+$/) });

/** Admin signs a one-time message with the admin wallet. Wrong wallet = same generic error. */
export async function POST(req: Request) {
  const fail = () => NextResponse.json({ error: "Access denied" }, { status: 403 });
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success || !isAddress(body.data.address)) return fail();
  const admin = env("ADMIN_ADDRESS").toLowerCase();
  if (body.data.address.toLowerCase() !== admin) return fail();

  const jar = await cookies();
  const n = await readToken(jar.get(NONCE_COOKIE)?.value);
  if (!n?.nonce || !n.issued) return fail();

  const args = { address: body.data.address as `0x${string}`, message: loginMessage(String(n.nonce), String(n.issued)), signature: body.data.signature as `0x${string}` };
  // 1) normal wallets: verified locally with no network call. 2) smart-contract wallets (e.g. Safe): verified on-chain (ERC-1271).
  let ok = await verifyMessage(args).catch(() => false);
  if (!ok) ok = await publicClient.verifyMessage(args).catch(() => false);
  if (!ok) return fail();

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, await signToken({ role: "admin", sub: admin }, "2h"), cookieOpts(7200));
  res.cookies.set(NONCE_COOKIE, "", cookieOpts(0)); // single use
  return res;
}
