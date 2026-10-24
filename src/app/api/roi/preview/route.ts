import { NextRequest, NextResponse } from "next/server";
import { calculateRoiPreview } from "@/lib/roi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stateless ROI preview endpoint.
 * It does not read/write a database, create an accrual, or send a payout.
 */
export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("amount" in body) ||
    typeof body.amount !== "number" ||
    !Number.isFinite(body.amount)
  ) {
    return NextResponse.json(
      { error: "Provide amount as a finite number in USDT." },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json(calculateRoiPreview(body.amount), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid investment amount.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
