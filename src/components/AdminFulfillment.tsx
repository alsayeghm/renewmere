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
  updated_at: string | null;
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

function needsAttention(step: StepRow): boolean {
  if (!step.customer_response_submitted_at) return false;
  if (!step.updated_at) return true;
  return new Date(step.customer_response_submitted_at) > new Date(step.updated_at);
}

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

function StepRowView({
  step,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  step: StepRow;
  onUpdate: (patch: Partial<StepRow>) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [prompt, setPrompt] = useState(step.customer_prompt ?? "");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const attention = needsAttention(step);

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
    if (ok) onUpdate({ status, updated_at: new Date().toISOString() });
    setSavingStatus(false);
  }

  async function handleMarkSeen() {
    setSavingStatus(true);
    const ok = await patch({ status: step.status });
    if (ok) onUpdate({ updated_at: new Date().toISOString() });
    setSavingStatus(false);
  }

  async function handleSavePrompt() {
    setSavingPrompt(true);
    const ok = await patch({ customer_prompt: prompt });
    if (ok) onUpdate({ customer_prompt: prompt });
    setSavingPrompt(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/admin/order-item-steps?id=${step.id}`, { method: "DELETE" });
    if (res.ok) onDelete();
    else setDeleting(false);
  }

  return (
    <div className={`rounded-md border p-3 ${attention ? "border-amber bg-amber-surface" : "border-border"}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[13.5px] font-medium text-ink">{step.title}</p>
            {attention && (
              <span className="rounded-full bg-amber px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white">
                New reply
              </span>
            )}
          </div>
          {step.description && <p className="text-[12px] text-muted">{step.description}</p>}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            title="Move up"
            className="rounded-md border border-border px-1.5 py-1 text-[11px] text-muted hover:bg-surface-2 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            title="Move down"
            className="rounded-md border border-border px-1.5 py-1 text-[11px] text-muted hover:bg-surface-2 disabled:opacity-30"
          >
            ↓
          </button>
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
          {confirmingDelete ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-danger px-2 py-1 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Confirm"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="rounded-md border border-border px-1.5 py-1 text-[11px] text-muted hover:bg-surface-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              title="Delete step"
              className="rounded-md border border-border px-1.5 py-1 text-[11px] text-danger hover:bg-danger-surface"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {attention && (
        <button
          type="button"
          onClick={handleMarkSeen}
          disabled={savingStatus}
          className="mt-2 text-[11.5px] font-medium text-accent hover:opacity-80"
        >
          Mark as seen
        </button>
      )}

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
  const [customerNote, setCustomerNote] = useState(item.customer_note ?? "");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingCustomerNote, setSavingCustomerNote] = useState(false);

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

  async function handleSaveCustomerNote() {
    setSavingCustomerNote(true);
    const res = await fetch("/api/admin/order-items", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, customer_note: customerNote || null }),
    });
    if (res.ok) onUpdate(item.id, { customer_note: customerNote || null });
    setSavingCustomerNote(false);
  }

  function updateStep(stepId: string, patch: Partial<StepRow>) {
    onUpdate(item.id, { steps: item.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)) });
  }

  function addStep(step: StepRow) {
    onUpdate(item.id, { steps: [...item.steps, step] });
  }

  function deleteStep(stepId: string) {
    onUpdate(item.id, { steps: item.steps.filter((s) => s.id !== stepId) });
  }

  async function moveStep(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= item.steps.length) return;
    const reordered = [...item.steps];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    onUpdate(item.id, { steps: reordered });
    await Promise.all([
      fetch("/api/admin/order-item-steps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reordered[index].id, position: index }),
      }),
      fetch("/api/admin/order-item-steps", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reordered[target].id, position: target }),
      }),
    ]);
  }

  const doneCount = item.steps.filter((s) => s.status === "done").length;
  const waitingCount = item.steps.filter((s) => s.status === "waiting_on_customer").length;
  const attentionCount = item.steps.filter(needsAttention).length;

  return (
    <div className={`rounded-lg border bg-surface p-5 ${attentionCount > 0 ? "border-amber" : "border-border"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-medium text-ink">{item.title}</p>
            {attentionCount > 0 && (
              <span className="rounded-full bg-amber px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white">
                {attentionCount} new repl{attentionCount === 1 ? "y" : "ies"}
              </span>
            )}
          </div>
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
            {item.steps.map((step, index) => (
              <StepRowView
                key={step.id}
                step={step}
                onUpdate={(patch) => updateStep(step.id, patch)}
                onDelete={() => deleteStep(step.id)}
                onMoveUp={() => moveStep(index, -1)}
                onMoveDown={() => moveStep(index, 1)}
                canMoveUp={index > 0}
                canMoveDown={index < item.steps.length - 1}
              />
            ))}
          </div>
          <AddStepForm orderItemId={item.id} onAdded={addStep} />

          <label className="grid gap-1">
            <span className="text-[12px] font-medium text-muted">Note to customer (shown on their dashboard)</span>
            <textarea
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              rows={2}
              placeholder="e.g. Your EA registration is submitted — we'll update this once approved."
              className="rounded-md border border-border bg-paper px-3 py-2 text-[13px] text-ink"
            />
          </label>
          <button
            type="button"
            onClick={handleSaveCustomerNote}
            disabled={savingCustomerNote}
            className="justify-self-start rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {savingCustomerNote ? "Saving…" : "Save note to customer"}
          </button>

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
  const [onlyNeedsAttention, setOnlyNeedsAttention] = useState(false);

  function updateItem(id: string, patch: Partial<FulfillmentRow>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  const visible = useMemo(
    () =>
      items.filter((i) => {
        if (hideCompleted && i.fulfillment_status === "completed") return false;
        if (onlyPaid && !PAID_ORDER_STATUSES.includes(i.order_status)) return false;
        if (onlyNeedsAttention && !i.steps.some(needsAttention)) return false;
        return true;
      }),
    [items, hideCompleted, onlyPaid, onlyNeedsAttention],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { not_started: 0, in_progress: 0, waiting_on_customer: 0, completed: 0 };
    for (const i of items) c[i.fulfillment_status] = (c[i.fulfillment_status] ?? 0) + 1;
    return c;
  }, [items]);

  const attentionTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.steps.filter(needsAttention).length, 0),
    [items],
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <p className="font-mono text-[11px] uppercase tracking-wide text-accent">Admin</p>
            {attentionTotal > 0 && (
              <span className="rounded-full bg-amber px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white">
                {attentionTotal} new repl{attentionTotal === 1 ? "y" : "ies"} to review
              </span>
            )}
          </div>
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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={onlyNeedsAttention}
              onChange={(e) => setOnlyNeedsAttention(e.target.checked)}
            />
            Only needs attention
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
