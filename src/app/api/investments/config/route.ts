import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const backendUrl = process.env.BACKEND_API_URL?.trim().replace(/\/$/, "");
  if (!backendUrl) {
    return NextResponse.json(
      { success: false, acceptingInvestments: false, error: "Investment service is not configured." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${backendUrl}/api/investments/config`, {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    const body = await response.json();
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, acceptingInvestments: false, error: "Investment service is temporarily unavailable." },
      { status: 503 },
    );
  }
}
