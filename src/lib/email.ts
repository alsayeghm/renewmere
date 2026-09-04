export type EmailOrderItem = {
  title: string;
  moduleName: string;
  billing: "one_time" | "annual" | "recurring";
  pricePence: number;
};

const COLORS = {
  paper: "#faf8f3",
  surface: "#ffffff",
  border: "#e5dfce",
  ink: "#1c1a16",
  muted: "#8a8270",
  accent: "#a9720f",
  accentSurface: "#f6ecd8",
  living: "#2c7a4b",
  livingSurface: "#e6f2ea",
  danger: "#a23a2e",
};

const BILLING_LABEL: Record<EmailOrderItem["billing"], string> = {
  one_time: "One-off",
  annual: "Annual",
  recurring: "Monthly",
};

function formatGBP(pence: number): string {
  return `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Shared table-based layout for admin/customer notification emails — plain
 * tables and inline styles throughout since most email clients strip <style>
 * blocks and ignore flexbox/grid. */
export function renderEmailShell(opts: {
  badgeLabel: string;
  badgeColor: string;
  badgeSurface: string;
  heading: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:${COLORS.paper};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.paper};padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${COLORS.surface};border:1px solid ${COLORS.border};border-radius:10px;overflow:hidden;">
        <tr><td style="padding:28px 32px 20px;border-bottom:1px solid ${COLORS.border};">
          <span style="font-size:20px;font-weight:800;color:${COLORS.ink};">renewmere</span>
        </td></tr>
        <tr><td style="padding:28px 32px 8px;">
          <span style="display:inline-block;font-family:monospace;font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:${opts.badgeColor};background:${opts.badgeSurface};padding:4px 10px;border-radius:999px;">${opts.badgeLabel}</span>
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h1 style="margin:0 0 20px;font-size:22px;color:${COLORS.ink};">${opts.heading}</h1>
        </td></tr>
        <tr><td style="padding:0 32px 32px;">
          ${opts.bodyHtml}
        </td></tr>
      </table>
      <p style="margin:20px 0 0;font-size:12px;color:${COLORS.muted};">Renewmere · GoldenPass Ltd</p>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemsTableHtml(items: EmailOrderItem[]): string {
  const rows = items
    .map(
      (item) => `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid ${COLORS.border};font-size:13.5px;color:${COLORS.ink};">
          <div style="font-weight:600;">${escapeHtml(item.title)}</div>
          <div style="font-size:12px;color:${COLORS.muted};">${escapeHtml(item.moduleName)}</div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid ${COLORS.border};font-size:12.5px;color:${COLORS.muted};white-space:nowrap;">${BILLING_LABEL[item.billing]}</td>
        <td style="padding:10px 12px;border-bottom:1px solid ${COLORS.border};font-size:13.5px;color:${COLORS.ink};text-align:right;white-space:nowrap;">${formatGBP(item.pricePence)}</td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${COLORS.border};border-radius:8px;overflow:hidden;border-collapse:collapse;">
    <tr style="background:${COLORS.paper};">
      <th align="left" style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;color:${COLORS.muted};">Item</th>
      <th align="left" style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;color:${COLORS.muted};">Billing</th>
      <th align="right" style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.03em;color:${COLORS.muted};">Price</th>
    </tr>
    ${rows}
  </table>`;
}

function totalsHtml(totalOneTime: number, totalAnnual: number, totalRecurring: number): string {
  const parts = [
    totalOneTime > 0 ? `${formatGBP(totalOneTime)} one-off` : null,
    totalAnnual > 0 ? `${formatGBP(totalAnnual)}/year` : null,
    totalRecurring > 0 ? `${formatGBP(totalRecurring)}/month` : null,
  ].filter(Boolean);

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;background:${COLORS.accentSurface};border-radius:8px;">
    <tr><td style="padding:14px 16px;font-size:14px;font-weight:700;color:${COLORS.accent};">${parts.join(" &nbsp;+&nbsp; ")}</td></tr>
  </table>`;
}

export function renderPlanStartedEmail(opts: {
  orderId: string;
  requesterEmail: string;
  items: EmailOrderItem[];
  totalOneTimePence: number;
  totalAnnualPence: number;
  totalRecurringPence: number;
}): string {
  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:4px 0;font-size:13px;color:${COLORS.muted};">Customer</td>
        <td style="padding:4px 0;font-size:13px;color:${COLORS.ink};text-align:right;">${escapeHtml(opts.requesterEmail)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:13px;color:${COLORS.muted};">Order ID</td>
        <td style="padding:4px 0;font-size:12px;color:${COLORS.muted};text-align:right;font-family:monospace;">${opts.orderId}</td>
      </tr>
    </table>
    ${itemsTableHtml(opts.items)}
    ${totalsHtml(opts.totalOneTimePence, opts.totalAnnualPence, opts.totalRecurringPence)}
    <p style="margin:20px 0 0;font-size:13px;color:${COLORS.muted};line-height:1.6;">
      The customer has started checkout but hasn't paid yet — no action needed unless they don't complete it.
      You'll get a separate <strong style="color:${COLORS.ink};">payment confirmed</strong> email once Stripe
      confirms the card and the trial (or one-off payment) actually starts.
    </p>`;

  return renderEmailShell({
    badgeLabel: "Checkout started",
    badgeColor: COLORS.muted,
    badgeSurface: COLORS.paper,
    heading: `${opts.items.length} item${opts.items.length === 1 ? "" : "s"} added to plan`,
    bodyHtml,
  });
}

export function renderPlanConfirmedEmail(opts: {
  orderId: string;
  customerEmail: string;
  items: EmailOrderItem[];
  totalOneTimePence: number;
  totalAnnualPence: number;
  totalRecurringPence: number;
  trialEndsAt: string | null;
}): string {
  const bodyHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
      <tr>
        <td style="padding:4px 0;font-size:13px;color:${COLORS.muted};">Customer</td>
        <td style="padding:4px 0;font-size:13px;color:${COLORS.ink};text-align:right;">${escapeHtml(opts.customerEmail)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:13px;color:${COLORS.muted};">Order ID</td>
        <td style="padding:4px 0;font-size:12px;color:${COLORS.muted};text-align:right;font-family:monospace;">${opts.orderId}</td>
      </tr>
      ${
        opts.trialEndsAt
          ? `<tr>
        <td style="padding:4px 0;font-size:13px;color:${COLORS.muted};">Trial ends</td>
        <td style="padding:4px 0;font-size:13px;color:${COLORS.ink};text-align:right;">${new Date(opts.trialEndsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</td>
      </tr>`
          : ""
      }
    </table>
    ${itemsTableHtml(opts.items)}
    ${totalsHtml(opts.totalOneTimePence, opts.totalAnnualPence, opts.totalRecurringPence)}
    <p style="margin:20px 0 0;font-size:13px;color:${COLORS.ink};line-height:1.6;">
      <strong>Payment confirmed${opts.trialEndsAt ? " — card verified, trial started" : ""}.</strong>
      Time to get started: mark each item's progress in the
      <a href="https://renewmere.com/admin/fulfillment" style="color:${COLORS.accent};">fulfillment tracker</a>.
    </p>`;

  return renderEmailShell({
    badgeLabel: "Payment confirmed",
    badgeColor: COLORS.living,
    badgeSurface: COLORS.livingSurface,
    heading: `${opts.items.length} item${opts.items.length === 1 ? "" : "s"} ready to fulfil`,
    bodyHtml,
  });
}
