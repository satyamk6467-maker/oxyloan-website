import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(request: Request) {
  const backendUrl = process.env.BACKEND_API_URL?.trim().replace(/\/$/, "");
  if (!backendUrl) {
    return NextResponse.json(
      { success: false, error: "Investment service is not configured." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${backendUrl}/api/investments/verify-payment`, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(await request.json()),
      signal: AbortSignal.timeout(240_000),
    });
    const body = await response.json();
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, error: "Investment service could not verify this payment. Keep the transaction hash and contact support." },
      { status: 503 },
    );
  }
}
