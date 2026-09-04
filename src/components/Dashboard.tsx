"use client";

import { useState } from "react";
import Link from "next/link";
import { RagChip } from "@/components/RagChip";
import { BILLING_LABEL, formatGBP } from "@/lib/pricing";
import type { BillingType, ModuleResult, RAG } from "@/lib/modules/types";
import { createClient } from "@/lib/supabase/client";

type CartItem = {
  key: string;
  moduleName: string;
  title: string;
  billing: BillingType;
  pricePence: number;
};

export type StepFileRow = { name: string; url: string };

export type StepRow = {
  id: string;
  title: string;
  description: string | null;
  status: string; // not_started | in_progress | waiting_on_customer | done
  customer_prompt: string | null;
  customer_response_text: string | null;
  customer_response_submitted_at: string | null;
  files: StepFileRow[];
};

export type OrderItemRow = {
  id: string;
  title: string;
  module_name: string;
  billing: BillingType;
  price_pence: number;
  fulfillment_status: string;
  order_item_steps: StepRow[];
};

export type OrderRow = {
  id: string;
  items: CartItem[];
  order_items: OrderItemRow[];
  status: string;
  total_one_time_pence: number;
  total_annual_pence: number;
  total_recurring_pence: number;
  trial_end_at: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
};

export type CustomerProfile = {
  business_name: string | null;
  company_number: string | null;
  site_address: string | null;
  contact_phone: string | null;
} | null;

const FULFILLMENT_META: Record<string, { label: string; className: string }> = {
  not_started: { label: "Not started", className: "bg-surface-2 text-muted" },
  in_progress: {
    label: "In progress",
    className: "bg-[color-mix(in_srgb,var(--accent)_15%,var(--surface))] text-accent",
  },
  waiting_on_customer: { label: "Waiting on you", className: "bg-amber-surface text-amber" },
  completed: {
    label: "Completed",
    className: "bg-[color-mix(in_srgb,var(--living)_15%,var(--surface))] text-living-ink",
  },
};

const STEP_ICON: Record<string, string> = {
  done: "✓",
  in_progress: "⋯",
  waiting_on_customer: "!",
  not_started: "·",
};

export type LatestCheck = {
  id: string;
  result: { sector: string; modules: (ModuleResult & { regulationName: string })[] };
  created_at: string;
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending_payment: { label: "Payment pending", className: "bg-surface-2 text-muted" },
  trialing: {
    label: "Free trial",
    className: "bg-[color-mix(in_srgb,var(--accent)_15%,var(--surface))] text-accent",
  },
  active: {
    label: "Active",
    className: "bg-[color-mix(in_srgb,var(--living)_15%,var(--surface))] text-living-ink",
  },
  paid: {
    label: "Paid",
    className: "bg-[color-mix(in_srgb,var(--living)_15%,var(--surface))] text-living-ink",
  },
  past_due: { label: "Payment failed", className: "bg-danger-surface text-danger" },
  unpaid: { label: "Payment failed", className: "bg-danger-surface text-danger" },
  canceled: { label: "Canceled", className: "bg-surface-2 text-muted" },
  incomplete: { label: "Payment pending", className: "bg-surface-2 text-muted" },
  incomplete_expired: { label: "Expired", className: "bg-surface-2 text-muted" },
};

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function BusinessProfileCard({ initial }: { initial: CustomerProfile }) {
  const [editing, setEditing] = useState(!initial?.business_name);
  const [businessName, setBusinessName] = useState(initial?.business_name ?? "");
  const [companyNumber, setCompanyNumber] = useState(initial?.company_number ?? "");
  const [siteAddress, setSiteAddress] = useState(initial?.site_address ?? "");
  const [contactPhone, setContactPhone] = useState(initial?.contact_phone ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await supabase.from("customer_profiles").upsert({
        user_id: data.user.id,
        business_name: businessName || null,
        company_number: companyNumber || null,
        site_address: siteAddress || null,
        contact_phone: contactPhone || null,
        updated_at: new Date().toISOString(),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13.5px] font-medium text-ink">{businessName || "Your business"}</p>
            <p className="text-[12.5px] text-muted">
              {[companyNumber && `Co. no. ${companyNumber}`, siteAddress, contactPhone].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[12.5px] font-medium text-accent hover:opacity-80"
          >
            Edit →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="mb-3 text-[13.5px] font-semibold text-ink">Your business details</p>
      <p className="mb-3 text-[12.5px] text-muted">
        Saved once and reused everywhere — so we don&apos;t ask for it again per item.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Business name"
          className="rounded-md border border-border bg-paper px-3 py-2 text-[13px] text-ink"
        />
        <input
          value={companyNumber}
          onChange={(e) => setCompanyNumber(e.target.value)}
          placeholder="Company number"
          className="rounded-md border border-border bg-paper px-3 py-2 text-[13px] text-ink"
        />
        <input
          value={siteAddress}
          onChange={(e) => setSiteAddress(e.target.value)}
          placeholder="Site address"
          className="rounded-md border border-border bg-paper px-3 py-2 text-[13px] text-ink sm:col-span-2"
        />
        <input
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          placeholder="Contact phone"
          className="rounded-md border border-border bg-paper px-3 py-2 text-[13px] text-ink"
        />
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-3 rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}

function StepResponseForm({ step, onSubmitted }: { step: StepRow; onSubmitted: (patch: Partial<StepRow>) => void }) {
  const [text, setText] = useState(step.customer_response_text ?? "");
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("step_id", step.id);
      formData.set("text", text);
      if (files) Array.from(files).forEach((f) => formData.append("files", f));
      const res = await fetch("/api/order-item-steps/respond", { method: "POST", body: formData });
      if (!res.ok) throw new Error("failed");
      onSubmitted({ customer_response_text: text, customer_response_submitted_at: new Date().toISOString() });
      setFiles(null);
    } catch {
      setError("Couldn't submit — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2 grid gap-2 rounded-md bg-amber-surface p-3">
      <p className="text-[13px] font-semibold text-amber">{step.customer_prompt ?? "We need something from you here."}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="rounded-md border border-border bg-surface px-3 py-2 text-[13px] text-ink"
      />
      <input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="text-[12.5px] text-ink" />
      {error && <p className="text-[12.5px] text-danger">{error}</p>}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="justify-self-start rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : step.customer_response_submitted_at ? "Update reply" : "Reply"}
      </button>
    </div>
  );
}

function StepChecklist({ steps, onUpdate }: { steps: StepRow[]; onUpdate: (id: string, patch: Partial<StepRow>) => void }) {
  if (steps.length === 0) {
    return <p className="mt-2 text-[12.5px] text-muted">We&apos;ve received this and will start shortly.</p>;
  }
  return (
    <div className="mt-2 grid gap-2">
      {steps.map((step) => (
        <div key={step.id} className="rounded-md border border-border px-3 py-2">
          <div className="flex items-start gap-2">
            <span
              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                step.status === "done"
                  ? "bg-living text-white"
                  : step.status === "waiting_on_customer"
                    ? "bg-amber text-white"
                    : "bg-surface-2 text-muted"
              }`}
            >
              {STEP_ICON[step.status] ?? "·"}
            </span>
            <div>
              <p className="text-[13px] font-medium text-ink">{step.title}</p>
              {step.description && <p className="text-[12px] text-muted">{step.description}</p>}
            </div>
          </div>
          {step.status === "waiting_on_customer" && !step.customer_response_submitted_at && (
            <StepResponseForm step={step} onSubmitted={(patch) => onUpdate(step.id, patch)} />
          )}
          {step.customer_response_submitted_at && (
            <p className="ml-6 mt-1 text-[11.5px] text-muted">
              You replied {formatDate(step.customer_response_submitted_at)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function OrderCard({ order }: { order: OrderRow }) {
  const [items, setItems] = useState(order.order_items);
  const meta = STATUS_META[order.status] ?? { label: order.status, className: "bg-surface-2 text-muted" };
  const cadenceParts = [
    order.total_one_time_pence > 0 ? `${formatGBP(order.total_one_time_pence)} one-off` : null,
    order.total_annual_pence > 0 ? `${formatGBP(order.total_annual_pence)}/yr` : null,
    order.total_recurring_pence > 0 ? `${formatGBP(order.total_recurring_pence)}/mo` : null,
  ].filter(Boolean);

  function updateStep(itemId: string, stepId: string, patch: Partial<StepRow>) {
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? { ...i, order_item_steps: i.order_item_steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) }
          : i,
      ),
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] font-medium text-ink">{cadenceParts.join(" + ")}</p>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${meta.className}`}
        >
          {meta.label}
        </span>
      </div>

      <div className="grid gap-3">
        {items.map((item) => {
          const meta = FULFILLMENT_META[item.fulfillment_status] ?? {
            label: item.fulfillment_status,
            className: "bg-surface-2 text-muted",
          };
          return (
            <div key={item.id} className="rounded-md border border-border px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[13.5px] font-medium text-ink">{item.title}</p>
                  <p className="text-[12px] text-muted">{item.module_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-[12.5px] text-muted">
                    {formatGBP(item.price_pence)} {BILLING_LABEL[item.billing]}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </div>
              </div>
              <StepChecklist
                steps={item.order_item_steps}
                onUpdate={(stepId, patch) => updateStep(item.id, stepId, patch)}
              />
            </div>
          );
        })}
      </div>

      {order.status === "trialing" && order.trial_end_at && (
        <p className="mt-4 text-[13px] text-accent">
          {daysUntil(order.trial_end_at)} day{daysUntil(order.trial_end_at) === 1 ? "" : "s"} left in your
          free trial — first charge on {formatDate(order.trial_end_at)}.
        </p>
      )}
      {order.status === "active" && order.current_period_end && (
        <p className="mt-4 text-[13px] text-muted">
          {order.cancel_at_period_end
            ? `Ends on ${formatDate(order.current_period_end)} — won't renew.`
            : `Renews on ${formatDate(order.current_period_end)}.`}
        </p>
      )}
      {(order.status === "past_due" || order.status === "unpaid") && (
        <p className="mt-4 text-[13px] text-danger">
          Your last payment failed — update your card to keep this active.
        </p>
      )}
    </div>
  );
}

function complianceCounts(modules: (ModuleResult & { regulationName: string })[]) {
  const counts: Record<RAG, number> = { green: 0, amber: 0, red: 0 };
  const flagged: { regulationName: string; title: string; rag: RAG }[] = [];
  for (const m of modules) {
    if (m.notApplicable) continue;
    for (const o of m.obligations) {
      counts[o.rag]++;
      if (o.rag !== "green") flagged.push({ regulationName: m.regulationName, title: o.title, rag: o.rag });
    }
  }
  return { counts, flagged };
}

export function Dashboard({
  orders,
  latestCheck,
  profile,
  email,
}: {
  orders: OrderRow[];
  latestCheck: LatestCheck | null;
  profile: CustomerProfile;
  email: string;
}) {
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // "pending_payment" means checkout was started but never completed — it's
  // not a real commitment yet, so it doesn't belong in "your plan" (Stripe's
  // own session-expiry webhook cancels these automatically after 24h).
  const activeOrders = orders.filter((o) => o.status !== "canceled" && o.status !== "pending_payment").reverse();
  const hasBilling = activeOrders.length > 0;

  async function manageBilling() {
    setPortalLoading(true);
    setPortalError(null);
    try {
      const res = await fetch("/api/create-portal-session", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setPortalLoading(false);
      setPortalError("Couldn't open billing management — please try again shortly.");
    }
  }

  const { counts, flagged } = latestCheck
    ? complianceCounts(latestCheck.result.modules)
    : { counts: { green: 0, amber: 0, red: 0 }, flagged: [] };

  return (
    <div className="grid gap-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">Dashboard</p>
          <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
          <p className="text-[13.5px] text-muted">{email}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/check"
            className="rounded-md border border-border bg-surface px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface-2"
          >
            Add another service →
          </Link>
          {hasBilling && (
            <button
              type="button"
              onClick={manageBilling}
              disabled={portalLoading}
              className="rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {portalLoading ? "Opening…" : "Manage billing"}
            </button>
          )}
        </div>
      </div>
      {portalError && <p className="text-[13px] text-danger">{portalError}</p>}

      {hasBilling && <BusinessProfileCard initial={profile} />}

      <div>
        <h2 className="mb-4 text-lg font-semibold text-pine">Your plan</h2>
        {activeOrders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center">
            <p className="mb-3 text-[14px] text-muted">
              You haven&apos;t added any services yet — run the checker to see what needs fixing.
            </p>
            <Link
              href="/check"
              className="inline-block rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
            >
              Start the free check →
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-pine">Compliance snapshot</h2>
        {latestCheck ? (
          <div className="rounded-lg border border-border bg-surface p-6">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <p className="text-[13.5px] text-muted">
                Based on your {latestCheck.result.sector.toLowerCase()} check from{" "}
                {formatDate(latestCheck.created_at)}
              </p>
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              <RagChip rag="green" />
              <span className="text-[13px] text-muted">{counts.green} clear</span>
              <span className="mx-1 text-border">·</span>
              <RagChip rag="amber" />
              <span className="text-[13px] text-muted">{counts.amber} to review</span>
              <span className="mx-1 text-border">·</span>
              <RagChip rag="red" />
              <span className="text-[13px] text-muted">{counts.red} at risk</span>
            </div>
            {flagged.length > 0 && (
              <div className="grid gap-2">
                {flagged.slice(0, 5).map((f, i) => (
                  <div
                    key={`${f.regulationName}-${i}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-4 py-2.5"
                  >
                    <div>
                      <p className="text-[13.5px] font-medium text-ink">{f.title}</p>
                      <p className="text-[12px] text-muted">{f.regulationName}</p>
                    </div>
                    <RagChip rag={f.rag} />
                  </div>
                ))}
                {flagged.length > 5 && (
                  <p className="text-[12.5px] text-muted">+ {flagged.length - 5} more</p>
                )}
              </div>
            )}
            <Link
              href="/check"
              className="mt-5 inline-block text-[13px] font-semibold text-accent hover:opacity-80"
            >
              Continue building your plan →
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-surface p-6 text-center">
            <p className="text-[14px] text-muted">No compliance check on file yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
