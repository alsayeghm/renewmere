import { NextResponse } from "next/server";
import { renderWelcomeEmail } from "@/lib/email";

export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.FIX_REQUEST_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ skipped: "no RESEND_API_KEY" });
  }

  const body = await request.json();
  const email: string | undefined = body.email;
  if (!email) {
    return NextResponse.json({ error: "no email" }, { status: 400 });
  }

  const html = renderWelcomeEmail();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Renewmere <hello@renewmere.com>",
      to: [email],
      subject: "Welcome to Renewmere",
      html,
      text: [
        "Welcome to Renewmere",
        "",
        "Your account is ready. You can now save your compliance checks and come back to them anytime.",
        "",
        "Start with the free Simpler Recycling check — a short question set that tells you exactly where you stand, obligation by obligation, with the citation behind every colour.",
        "",
        "Start the free check: https://renewmere.com/check",
      ].join("\n"),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json(
      { error: "resend_failed", detail },
      { status: 502 },
    );
  }

  return NextResponse.json({ sent: true });
}
