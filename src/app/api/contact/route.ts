import { NextRequest, NextResponse } from "next/server";

/**
 * Contact form submission handler.
 *
 * This is a stub: it validates input and returns success so the frontend
 * flow works end-to-end. Wire it up to a real provider (Resend, Postmark,
 * a CRM webhook, etc.) using a *server-only* environment variable such as
 * `CONTACT_API_KEY` — never expose that key via NEXT_PUBLIC_*.
 */

interface ContactPayload {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: ContactPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { name, email, subject, message } = body;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  }

  // TODO: integrate with an email/CRM provider here, e.g.:
  //
  // await fetch("https://api.resend.com/emails", {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${process.env.CONTACT_API_KEY}`, // server-only
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({ to: "team@oxyloan.io", subject, text: message }),
  // });

  return NextResponse.json({ success: true });
}
