import { NextResponse } from "next/server";

const NOTIFY_TO = "hello@renewmere.com";

export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  if (secret !== process.env.FIX_REQUEST_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    // Not configured yet — don't fail the DB trigger over it.
    return NextResponse.json({ skipped: "no RESEND_API_KEY" });
  }

  const body = await request.json();
  const {
    obligation_id: obligationId,
    obligation_title: obligationTitle,
    requester_email: requesterEmail,
    check_id: checkId,
    created_at: createdAt,
  } = body;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Renewmere <notifications@renewmere.com>",
      to: [NOTIFY_TO],
      subject: `New fix request: ${obligationTitle}`,
      text: [
        `A customer asked Renewmere to fix a compliance gap.`,
        ``,
        `Obligation: ${obligationId} — ${obligationTitle}`,
        `Requester: ${requesterEmail ?? "unknown"}`,
        `Check ID: ${checkId ?? "n/a"}`,
        `Requested at: ${createdAt}`,
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
