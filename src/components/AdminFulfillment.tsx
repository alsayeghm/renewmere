"use client";

import { useMemo, useState } from "react";
import { formatGBP, BILLING_LABEL } from "@/lib/pricing";
import type { BillingType } from "@/lib/modules/types";

export type StepRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  customer_prompt: string | null;
  customer_response_text: string | null;
  customer_response_submitted_at: string | null;
  files: { name: string; url: string }[];
};

export type FulfillmentRow = {
  id: string;
  title: string;
  module_name: string;
  billing: BillingType;
  price_pence: number;
  fulfillment_status: string;
  admin_notes: string | null;
  customer_note: string | null;
  steps: StepRow[];
  created_at: string;
  order_status: string;
  customer_email: string;
};

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_on_customer", label: "Waiting on customer" },
  { value: "completed", label: "Completed" },
];

const STEP_STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "waiting_on_customer", label: "Waiting on customer" },
  { value: "done", label: "Done" },
];

const STATUS_STYLE: Record<string, string> = {
  not_started: "bg-surface-2 text-muted",
  in_progress: "bg-[color-mix(in_srgb,var(--accent)_15%,var(--surface))] text-accent",
  waiting_on_customer: "bg-amber-surface text-amber",
  completed: "bg-[color-mix(in_srgb,var(--living)_15%,var(--surface))] text-living-ink",
  done: "bg-[color-mix(in_srgb,var(--living)_15%,var(--surface))] text-living-ink",
};

const PAID_ORDER_STATUSES = ["trialing", "active", "paid", "past_due", "unpaid"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StepRowView({ step, onUpdate }: { step: StepRow; onUpdate: (patch: Partial<StepRow>) => void }) {
  const [prompt, setPrompt] = useState(step.customer_prompt ?? "");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);

  async function patch(body: Record<string, unknown>) {
    const res = await fetch("/api/admin/order-item-steps", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: step.id, ...body }),
    });
    return res.ok;
  }

  async function handleStatusChange(status: string) {
    setSavingStatus(true);
    const ok = await patch({ status });
    if (ok) onUpdate({ status });
    setSavingStatus(false);
  }

  async function handleSavePrompt() {
    setSavingPrompt(true);
    const ok = await patch({ customer_prompt: prompt });
    if (ok) onUpdate({ customer_prompt: prompt });
    setSavingPrompt(false);
  }

  return (
    <div className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[13.5px] font-medium text-ink">{step.title}</p>
          {step.description && <p className="text-[12px] text-muted">{step.description}</p>}
        </div>
        <select
          value={step.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={savingStatus}
          className={`rounded-md border border-border px-2 py-1 text-[12px] font-medium ${STATUS_STYLE[step.status] ?? ""}`}
        >
          {STEP_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {step.status === "waiting_on_customer" && (
        <div className="mt-2 grid gap-1">
          <span className="text-[11.5px] font-medium text-muted">What exactly do you need from them?</span>
          <div className="flex gap-2">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. What's your current waste collector's name?"
              className="flex-1 rounded-md border border-border bg-paper px-2.5 py-1.5 text-[12.5px] text-ink"
            />
            <button
              type="button"
              onClick={handleSavePrompt}
              disabled={savingPrompt}
              className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {savingPrompt ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {(step.customer_response_text || step.files.length > 0) && (
        <div className="mt-2 rounded-md bg-[color-mix(in_srgb,var(--living)_8%,var(--surface))] p-2.5">
          <p className="mb-1 text-[11.5px] font-semibold text-living-ink">
            Customer replied{step.customer_response_submitted_at ? ` · ${formatDate(step.customer_response_submitted_at)}` : ""}
          </p>
          {step.customer_response_text && (
            <p className="whitespace-pre-wrap text-[12.5px] text-ink">{step.customer_response_text}</p>
          )}
          {step.files.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2">
              {step.files.map((f) => (
                <a
                  key={f.url}
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border bg-surface px-2 py-1 text-[11.5px] font-medium text-accent hover:opacity-80"
                >
                  {f.name} ↓
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AddStepForm({ orderItemId, onAdded }: { orderItemId: string; onAdded: (step: StepRow) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/order-item-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_item_id: orderItemId, title, description }),
      });
      if (res.ok) {
        const { step } = await res.json();
        onAdded({ ...step, files: [] });
        setTitle("");
        setDescription("");
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[12.5px] font-medium text-accent hover:opacity-80"
      >
        + Add step
      </button>
    );
  }

  return (
    <div className="grid gap-2 rounded-md border border-dashed border-border p-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Step title, e.g. Register with the Environment Agency"
        className="rounded-md border border-border bg-paper px-2.5 py-1.5 text-[13px] text-ink"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="rounded-md border border-border bg-paper px-2.5 py-1.5 text-[13px] text-ink"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-muted hover:opacity-80">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Row({ item, onUpdate }: { item: FulfillmentRow; onUpdate: (id: string, patch: Partial<FulfillmentRow>) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [adminNotes, setAdminNotes] = useState(item.admin_notes ?? "");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  async function handleStatusChange(status: string) {
    setSavingStatus(true);
    const res = await fetch("/api/admin/order-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, fulfillment_status: status }),
    });
    if (res.ok) onUpdate(item.id, { fulfillment_status: status });
    setSavingStatus(false);
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    const res = await fetch("/api/admin/order-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, admin_notes: adminNotes }),
    });
    if (res.ok) onUpdate(item.id, { admin_notes: adminNotes });
    setSavingNotes(false);
  }

  function updateStep(stepId: string, patch: Partial<StepRow>) {
    onUpdate(item.id, { steps: item.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) });
  }

  function addStep(step: StepRow) {
    onUpdate(item.id, { steps: [...item.steps, step] });
  }

  const doneCount = item.steps.filter((s) => s.status === "done").length;
  const waitingCount = item.steps.filter((s) => s.status === "waiting_on_customer").length;

  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[14px] font-medium text-ink">{item.title}</p>
          <p className="text-[12px] text-muted">
            {item.module_name} · {item.customer_email} · ordered {formatDate(item.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] text-muted">
            {formatGBP(item.price_pence)} {BILLING_LABEL[item.billing]}
          </span>
          <span className="rounded-full bg-surface-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted">
            {item.order_status}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          value={item.fulfillment_status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={savingStatus}
          className={`rounded-md border border-border px-2.5 py-1.5 text-[12.5px] font-medium ${STATUS_STYLE[item.fulfillment_status] ?? ""}`}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {item.steps.length > 0 && (
          <span className="text-[12px] text-muted">
            {doneCount}/{item.steps.length} steps done{waitingCount > 0 ? ` · ${waitingCount} waiting on customer` : ""}
          </span>
        )}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[12.5px] font-medium text-accent hover:opacity-80"
        >
          {expanded ? "Hide" : "Manage steps →"}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-3 border-t border-border pt-4">
          <div className="grid gap-2">
            {item.steps.map((step) => (
              <StepRowView key={step.id} step={step} onUpdate={(patch) => updateStep(step.id, patch)} />
            ))}
          </div>
          <AddStepForm orderItemId={item.id} onAdded={addStep} />

          <label className="grid gap-1">
            <span className="text-[12px] font-medium text-muted">Internal notes (not visible to customer)</span>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={2}
              className="rounded-md border border-border bg-paper px-3 py-2 text-[13px] text-ink"
            />
          </label>
          <button
            type="button"
            onClick={handleSaveNotes}
            disabled={savingNotes}
            className="justify-self-start rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {savingNotes ? "Saving…" : "Save notes"}
          </button>
        </div>
      )}
    </div>
  );
}

export function AdminFulfillment({ items: initialItems }: { items: FulfillmentRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [onlyPaid, setOnlyPaid] = useState(true);

  function updateItem(id: string, patch: Partial<FulfillmentRow>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  const visible = useMemo(
    () =>
      items.filter((i) => {
        if (hideCompleted && i.fulfillment_status === "completed") return false;
        if (onlyPaid && !PAID_ORDER_STATUSES.includes(i.order_status)) return false;
        return true;
      }),
    [items, hideCompleted, onlyPaid],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { not_started: 0, in_progress: 0, waiting_on_customer: 0, completed: 0 };
    for (const i of items) c[i.fulfillment_status] = (c[i.fulfillment_status] ?? 0) + 1;
    return c;
  }, [items]);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">Admin</p>
          <h1 className="text-2xl font-bold text-ink">Fulfillment</h1>
          <p className="text-[13px] text-muted">
            {counts.not_started} not started · {counts.in_progress} in progress · {counts.waiting_on_customer} waiting
            on customer · {counts.completed} completed
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[13px] text-ink">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={onlyPaid} onChange={(e) => setOnlyPaid(e.target.checked)} />
            Only paid orders
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hideCompleted} onChange={(e) => setHideCompleted(e.target.checked)} />
            Hide completed
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-[14px] text-muted">Nothing to fulfil right now.</p>
      ) : (
        <div className="grid gap-3">
          {visible.map((item) => (
            <Row key={item.id} item={item} onUpdate={updateItem} />
          ))}
        </div>
      )}
    </div>
  );
}
