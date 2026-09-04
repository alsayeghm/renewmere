import { NextResponse } from "next/server";

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

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #FAF7F0; color: #1C1A16;">
    <p style="font-weight: 800; font-size: 20px; letter-spacing: -0.02em; margin: 0 0 28px;">
      renewmere
    </p>
    <h1 style="font-size: 22px; font-weight: 800; line-height: 1.3; margin: 0 0 16px;">
      Welcome to Renewmere
    </h1>
    <p style="font-size: 15px; line-height: 1.6; color: #57534A; margin: 0 0 16px;">
      Your account is ready. You can now save your compliance checks and come back to them anytime.
    </p>
    <p style="font-size: 15px; line-height: 1.6; color: #57534A; margin: 0 0 24px;">
      Start with the free Simpler Recycling check — a short question set that
      tells you exactly where you stand, obligation by obligation, with the
      citation behind every colour.
    </p>
    <a href="https://renewmere.com/check" style="display: inline-block; background: #A9720F; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 22px; border-radius: 6px;">
      Start the free check →
    </a>
    <p style="font-size: 13px; line-height: 1.6; color: #8A8477; margin: 32px 0 0; border-top: 1px solid #E5DFD2; padding-top: 16px;">
      GoldenPass Ltd, trading as Renewmere · Registered in England and Wales, company no. 15877279
    </p>
  </div>`;

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
