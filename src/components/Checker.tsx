"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RagChip } from "@/components/RagChip";
import { GoogleButton } from "@/components/GoogleButton";
import { createClient } from "@/lib/supabase/client";
import { REGULATIONS, REG_BADGE, CATEGORIES } from "@/lib/content";
import { AnswerMap, ComplianceModule, ModuleResult, Question } from "@/lib/modules/types";
import { MODULES } from "@/lib/modules";
import { simplerRecycling } from "@/lib/modules/simplerRecycling";
import { BILLING_LABEL, formatGBP, PLACEHOLDER_PRICE_PENCE } from "@/lib/pricing";

const PENDING_KEY = "renewmere_pending_answers";
const CHECKOUT_PENDING_KEY = "renewmere_pending_checkout";
const CART_KEY_PREFIX = "renewmere_cart_";

type CartItem = {
  key: string;
  moduleName: string;
  title: string;
  billing: "one_time" | "annual" | "recurring";
  pricePence: number;
};

function SingleSelect({
  question,
  value,
  onChange,
}: {
  question: Extract<Question, { type: "single" }>;
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">
        {question.qid}
      </p>
      <h2 className="mb-1 text-xl font-semibold text-pine">{question.prompt}</h2>
      {question.help && <p className="mb-4 text-[13px] text-muted">{question.help}</p>}
      <div className={`grid gap-2 ${question.help ? "" : "mt-5"}`}>
        {question.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-md border px-4 py-3 text-left text-[15px] transition-colors ${
              value === opt.value
                ? "border-accent bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-ink"
                : "border-border bg-surface text-ink hover:bg-surface-2"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberInput({
  question,
  value,
  onChange,
}: {
  question: Extract<Question, { type: "number" }>;
  value: number | null;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">
        {question.qid}
      </p>
      <h2 className="mb-1 text-xl font-semibold text-pine">{question.prompt}</h2>
      {question.help && <p className="mb-4 text-[13px] text-muted">{question.help}</p>}
      <input
        type="number"
        min={question.min ?? 0}
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-md border border-border bg-surface px-4 py-3 text-[15px] text-ink"
        placeholder="Enter a number"
      />
    </div>
  );
}

/** Compact single-question block used on the one-page checklist screen. */
function ChecklistRow({
  moduleName,
  question,
  value,
  onChange,
}: {
  moduleName: string;
  question: Extract<Question, { type: "single" }>;
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="rounded-md border border-border p-4">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wide text-accent">{moduleName}</p>
      <p className="mb-3 text-[14.5px] font-medium text-ink">{question.prompt}</p>
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-md border px-3 py-1.5 text-[13px] transition-colors ${
              value === opt.value
                ? "border-accent bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))] text-ink"
                : "border-border bg-surface text-ink hover:bg-surface-2"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ModuleCard({
  module,
  result,
  cart,
  onToggleCart,
}: {
  module: ComplianceModule;
  result: ModuleResult;
  cart: Record<string, CartItem>;
  onToggleCart: (item: CartItem) => void;
}) {
  const reg = REGULATIONS.find((r) => r.name === module.regulationName);
  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-0.5 font-mono text-[11px] uppercase tracking-wide text-accent">
            {reg?.year ? `${module.regulationName} (${reg.year})` : module.regulationName}
          </p>
          <h2 className="text-xl font-semibold text-pine">
            {result.notApplicable ? "Not applicable to you" : "Your compliance snapshot"}
          </h2>
        </div>
        {!result.notApplicable && <RagChip rag={result.overall} />}
      </div>

      {result.notApplicable ? (
        <p className="text-sm text-muted">{result.notApplicableReason}</p>
      ) : (
        <>
          {result.notes?.map((note) => (
            <p key={note} className="mb-4 text-sm text-muted">
              {note}
            </p>
          ))}
          <div className="grid gap-3">
            {result.obligations.map((o) => {
              const key = `${module.regulationName}::${o.id}`;
              const price = PLACEHOLDER_PRICE_PENCE[o.billing];
              const inCart = key in cart;
              return (
                <div key={key} className="rounded-md border border-border p-4">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-ink">
                      {o.id} · {o.title}
                    </h3>
                    <RagChip rag={o.rag} />
                  </div>
                  <p className="mb-1 font-mono text-[11px] text-muted">{o.citation}</p>
                  <p className="text-sm text-muted">{o.reason}</p>
                  {o.rag !== "green" && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                      <p className="text-[13px] text-muted">
                        {formatGBP(price)} <span className="text-muted">{BILLING_LABEL[o.billing]}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          onToggleCart({
                            key,
                            moduleName: module.regulationName,
                            title: o.title,
                            billing: o.billing,
                            pricePence: price,
                          })
                        }
                        className={`rounded-md border px-4 py-2 text-[13px] font-semibold transition-colors ${
                          inCart
                            ? "border-[var(--living)] bg-[color-mix(in_srgb,var(--living)_12%,var(--surface))] text-[var(--living)]"
                            : "border-accent text-accent hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))]"
                        }`}
                      >
                        {inCart ? "Added ✓ — remove" : "Add to my plan →"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function cartTotals(items: CartItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.billing] += item.pricePence;
      return acc;
    },
    { one_time: 0, annual: 0, recurring: 0 } as Record<CartItem["billing"], number>,
  );
}

function CartBar({
  items,
  onReview,
}: {
  items: CartItem[];
  onReview: () => void;
}) {
  if (items.length === 0) return null;
  const totals = cartTotals(items);
  const parts = [
    totals.one_time > 0 ? `${formatGBP(totals.one_time)} one-off` : null,
    totals.annual > 0 ? `${formatGBP(totals.annual)}/yr` : null,
    totals.recurring > 0 ? `${formatGBP(totals.recurring)}/mo` : null,
  ].filter(Boolean);

  return (
    <div className="sticky bottom-4 z-10 mx-auto flex max-w-xl flex-wrap items-center justify-between gap-3 rounded-lg border border-accent bg-surface p-4 shadow-lg">
      <p className="text-[14px] text-ink">
        <span className="font-semibold">
          {items.length} item{items.length === 1 ? "" : "s"} in your plan
        </span>{" "}
        <span className="text-muted">· {parts.join(" + ")}</span>
      </p>
      <button
        type="button"
        onClick={onReview}
        className="rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
      >
        Review my plan →
      </button>
    </div>
  );
}

type AuthState = "loading" | "authed" | "anon";
type Phase = "checklist" | "recycling" | "interstitial" | "gate" | "results" | "deepdive" | "cart" | "confirmed";

export function Checker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sector, setSector] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [phase, setPhase] = useState<Phase>("checklist");
  const [recyclingIndex, setRecyclingIndex] = useState(0);
  const [deepIndex, setDeepIndex] = useState(0);
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [checkId, setCheckId] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [confirming, setConfirming] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const savedQuickRef = useRef(false);
  const savedDeepRef = useRef(false);
  const handledCheckoutReturnRef = useRef(false);

  const applicableModules = useMemo(
    () => (sector ? MODULES.filter((m) => m.sectors.includes(sector)) : []),
    [sector],
  );
  const otherModules = useMemo(
    () => applicableModules.filter((m) => m !== simplerRecycling),
    [applicableModules],
  );

  // Checklist = every "gate" question (no visibleIf) across the non-recycling modules.
  const checklistQuestions = useMemo(
    () => otherModules.flatMap((m) => m.questions.filter((q) => !q.visibleIf).map((q) => ({ m, q }))),
    [otherModules],
  );

  const recyclingSteps = useMemo(() => simplerRecycling.visibleQuestions(answers), [answers]);
  const recyclingStep = recyclingSteps[recyclingIndex];

  // Deep dive = every conditional (branch) question that's now visible, across the non-recycling
  // modules — the gate questions above are already answered, so this never re-asks them.
  const deepSteps = useMemo(
    () => otherModules.flatMap((m) => m.visibleQuestions(answers).filter((q) => q.visibleIf)),
    [otherModules, answers],
  );
  const deepStep = deepSteps[deepIndex];

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      const authed = !!data.user;
      setAuthState(authed ? "authed" : "anon");

      if (authed) {
        const pending = sessionStorage.getItem(PENDING_KEY);
        if (pending) {
          try {
            const parsed = JSON.parse(pending);
            setAnswers(parsed.answers);
            setSector(parsed.sector ?? null);
            setPhase("results");
          } catch {
            // Ignore malformed pending answers rather than block the user.
          }
          sessionStorage.removeItem(PENDING_KEY);
        } else if (!searchParams.get("checkout")) {
          // No pending answers from the signup gate and no checkout redirect in
          // progress — resume the most recent check instead of starting over,
          // so leaving mid-build (e.g. to look at another regulation) and
          // coming back doesn't re-ask the whole questionnaire.
          supabase
            .from("checks")
            .select("id, answers, result")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()
            .then(({ data: latestCheck }) => {
              if (!latestCheck) return;
              const result = latestCheck.result as { sector?: string } | null;
              setAnswers(latestCheck.answers as AnswerMap);
              setSector(result?.sector ?? null);
              setCheckId(latestCheck.id);
              setPhase("results");
              try {
                const savedCart = localStorage.getItem(CART_KEY_PREFIX + latestCheck.id);
                if (savedCart) setCart(JSON.parse(savedCart));
              } catch {
                // Ignore malformed cached cart rather than block the user.
              }
            });
        }
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session ? "authed" : "anon");
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (phase !== "results" || authState !== "authed") return;
    if (deepSteps.length === 0 ? savedDeepRef.current : savedQuickRef.current) return;
    if (deepSteps.length === 0) savedDeepRef.current = true;
    savedQuickRef.current = true;

    const combined = applicableModules.map((m) => ({
      regulationName: m.regulationName,
      ...m.evaluate(answers),
    }));
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from("checks")
        .insert({
          user_id: data.user.id,
          module: sector ?? "unknown",
          answers,
          result: { sector, modules: combined },
        })
        .select("id")
        .single()
        .then(({ data: inserted }) => {
          if (inserted) setCheckId(inserted.id);
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, authState, answers]);

  // Keep the in-progress cart around locally so navigating away and back
  // (e.g. to look at another regulation) doesn't lose what's been added.
  useEffect(() => {
    if (!checkId) return;
    try {
      localStorage.setItem(CART_KEY_PREFIX + checkId, JSON.stringify(cart));
    } catch {
      // Storage can be unavailable (private browsing, quota) — safe to skip.
    }
  }, [cart, checkId]);

  function toggleCart(item: CartItem) {
    setCart((prev) => {
      const next = { ...prev };
      if (item.key in next) {
        delete next[item.key];
      } else {
        next[item.key] = item;
      }
      return next;
    });
  }

  async function startCheckout(items: CartItem[], parentOrderId?: string) {
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, checkId, parentOrderId }),
    });
    if (!res.ok) {
      throw new Error("checkout_session_failed");
    }
    const { url } = await res.json();
    window.location.href = url;
  }

  async function confirmPlan() {
    setConfirming(true);
    setCheckoutError(null);
    const items = Object.values(cart);
    try {
      sessionStorage.setItem(
        CHECKOUT_PENDING_KEY,
        JSON.stringify({ sector, answers, cart, checkId }),
      );
      await startCheckout(items);
    } catch {
      sessionStorage.removeItem(CHECKOUT_PENDING_KEY);
      setConfirming(false);
      setCheckoutError("Something went wrong starting checkout — please try again.");
    }
  }

  // Handle the return trip from Stripe Checkout: on success, kick off the
  // second billing leg if the cart mixed annual + monthly items, otherwise
  // show the confirmation screen; on cancel, restore the cart the user built.
  useEffect(() => {
    if (authState !== "authed" || handledCheckoutReturnRef.current) return;
    const outcome = searchParams.get("checkout");
    if (!outcome) return;
    handledCheckoutReturnRef.current = true;

    if (outcome === "cancelled") {
      const pending = sessionStorage.getItem(CHECKOUT_PENDING_KEY);
      if (pending) {
        try {
          const parsed = JSON.parse(pending);
          setSector(parsed.sector ?? null);
          setAnswers(parsed.answers ?? {});
          setCart(parsed.cart ?? {});
          setCheckId(parsed.checkId ?? null);
        } catch {
          // Ignore malformed pending checkout state.
        }
        sessionStorage.removeItem(CHECKOUT_PENDING_KEY);
      }
      setPhase("cart");
      router.replace("/check");
      return;
    }

    if (outcome === "success") {
      const orderId = searchParams.get("order_id");
      sessionStorage.removeItem(CHECKOUT_PENDING_KEY);
      if (!orderId) {
        setPhase("confirmed");
        router.replace("/check");
        return;
      }
      const supabase = createClient();
      supabase
        .from("orders")
        .select("pending_leg_items")
        .eq("id", orderId)
        .single()
        .then(({ data: order }) => {
          const pendingLegItems = order?.pending_leg_items as CartItem[] | null;
          if (pendingLegItems && pendingLegItems.length > 0) {
            startCheckout(pendingLegItems, orderId).catch(() => {
              setPhase("confirmed");
            });
          } else {
            setCart({});
            setPhase("confirmed");
          }
        });
      router.replace("/check");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState, searchParams]);

  function set(key: string, value: string | number) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function recyclingNext() {
    if (recyclingIndex + 1 >= recyclingSteps.length) {
      setPhase("interstitial");
    } else {
      setRecyclingIndex(recyclingIndex + 1);
    }
  }
  function recyclingBack() {
    if (recyclingIndex === 0) {
      if (checklistQuestions.length > 0) setPhase("checklist");
      return;
    }
    setRecyclingIndex(recyclingIndex - 1);
  }

  function deepNext() {
    if (deepIndex + 1 >= deepSteps.length) {
      setPhase("results");
      setDeepIndex(0);
    } else {
      setDeepIndex(deepIndex + 1);
    }
  }
  function deepBack() {
    if (deepIndex === 0) {
      setPhase("results");
      return;
    }
    setDeepIndex(deepIndex - 1);
  }

  function revealResults() {
    if (authState === "authed") {
      setPhase("results");
    } else {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ answers, sector }));
      setPhase("gate");
    }
  }

  function startOver() {
    if (checkId) {
      try {
        localStorage.removeItem(CART_KEY_PREFIX + checkId);
      } catch {
        // Storage can be unavailable (private browsing, quota) — safe to skip.
      }
    }
    setSector(null);
    setAnswers({});
    setPhase("checklist");
    setRecyclingIndex(0);
    setDeepIndex(0);
    setCheckId(null);
    setCart({});
    savedQuickRef.current = false;
    savedDeepRef.current = false;
  }

  if (phase === "confirmed") {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-accent">
          Plan confirmed
        </p>
        <h2 className="mb-3 text-2xl font-bold text-ink">You&apos;re all set</h2>
        <p className="mx-auto mb-6 max-w-sm text-[14px] text-muted">
          Your 7-day free trial has started on anything ongoing — cancel any time before it ends
          and you won&apos;t be charged. One-off items are confirmed and paid.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Go to your dashboard →
          </Link>
          <button
            type="button"
            onClick={() => {
              setPhase("checklist");
              setSector(null);
            }}
            className="rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-muted hover:bg-surface-2"
          >
            Start a new check
          </button>
        </div>
      </div>
    );
  }

  if (!sector) {
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">Q0</p>
        <h2 className="mb-2 text-xl font-semibold text-pine">What sector is your business in?</h2>
        <p className="mb-5 text-[14px] text-muted">
          We&apos;ll use this to ask you about every regulation that&apos;s actually relevant to
          your business, and skip the ones that aren&apos;t.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setSector(cat);
                const merged = MODULES.filter((m) => m.sectors.includes(cat)).reduce(
                  (acc, m) => ({ ...acc, ...m.initialAnswers }),
                  {} as AnswerMap,
                );
                setAnswers(merged);
                const hasChecklist = MODULES.filter(
                  (m) => m.sectors.includes(cat) && m !== simplerRecycling,
                ).some((m) => m.questions.some((q) => !q.visibleIf));
                setPhase(hasChecklist ? "checklist" : "recycling");
              }}
              className="rounded-md border border-border bg-surface px-4 py-3 text-left text-[15px] text-ink transition-colors hover:bg-surface-2"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (phase === "checklist") {
    const answeredCount = checklistQuestions.filter(({ q }) => answers[q.id] != null).length;
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">
          Quick check · {answeredCount} of {checklistQuestions.length} answered
        </p>
        <h2 className="mb-2 text-xl font-semibold text-pine">
          A few quick questions about your business
        </h2>
        <p className="mb-5 text-[14px] text-muted">
          This scans across every law that could apply to {sector.toLowerCase()} businesses —
          answer what you can, and we&apos;ll only dig deeper into the areas that need it.
        </p>
        <div className="grid gap-3">
          {checklistQuestions.map(({ m, q }) => (
            <ChecklistRow
              key={q.id}
              moduleName={m.regulationName}
              question={q as Extract<Question, { type: "single" }>}
              value={(answers[q.id] as string | null) ?? null}
              onChange={(v) => set(q.id, v)}
            />
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setPhase("recycling")}
            className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  if (phase === "interstitial") {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-accent">All done</p>
        <h2 className="mb-3 text-2xl font-bold text-ink">Ready to see where you stand?</h2>
        <p className="mx-auto mb-6 max-w-sm text-[14px] text-muted">
          We&apos;ve scored your recycling setup and scanned everything else relevant to{" "}
          {sector.toLowerCase()} businesses. Want to see your compliance snapshot?
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPhase("recycling")}
            className="rounded-md border border-border bg-surface px-5 py-2.5 text-sm font-medium text-muted hover:bg-surface-2"
          >
            Not yet
          </button>
          <button
            type="button"
            onClick={revealResults}
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Yes, show my results →
          </button>
        </div>
      </div>
    );
  }

  if (phase === "gate") {
    return (
      <div className="rounded-lg border border-border bg-surface p-8 text-center">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-accent">
          Almost there
        </p>
        <h2 className="mb-3 text-2xl font-bold text-ink">
          Create a free account to see your results
        </h2>
        <p className="mx-auto mb-6 max-w-sm text-[14px] text-muted">
          Your answers are saved. Sign up in seconds and we&apos;ll show your compliance
          snapshot, obligation by obligation.
        </p>
        <div className="mx-auto max-w-xs">
          <GoogleButton next="/check" />
        </div>
        <p className="mt-4 text-[13px] text-muted">
          or{" "}
          <Link href="/signup?next=/check" className="font-semibold text-accent">
            sign up with email
          </Link>{" "}
          ·{" "}
          <Link href="/login?next=/check" className="font-semibold text-accent">
            log in
          </Link>
        </p>
      </div>
    );
  }

  if (phase === "cart") {
    const items = Object.values(cart);
    const totals = cartTotals(items);
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">
          Your plan
        </p>
        <h2 className="mb-2 text-xl font-semibold text-pine">Review before you start</h2>
        <p className="mb-5 text-[14px] text-muted">
          One-off items are paid up front before work starts. Anything ongoing (annual or
          monthly) starts with a 7-day free trial — cancel any time before then and you
          won&apos;t be charged.
        </p>

        {items.length === 0 ? (
          <p className="text-sm text-muted">Your plan is empty — go back and add something first.</p>
        ) : (
          <div className="grid gap-2">
            {items.map((item) => (
              <div
                key={item.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-3"
              >
                <div>
                  <p className="text-[14px] font-medium text-ink">{item.title}</p>
                  <p className="text-[12px] text-muted">{item.moduleName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-[13px] text-ink">
                    {formatGBP(item.pricePence)} <span className="text-muted">{BILLING_LABEL[item.billing]}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => toggleCart(item)}
                    className="text-[12px] font-medium text-danger hover:opacity-80"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-5 grid gap-1 border-t border-border pt-4 text-[14px] text-ink">
            {totals.one_time > 0 && <p>{formatGBP(totals.one_time)} one-off, paid up front</p>}
            {totals.annual > 0 && <p>{formatGBP(totals.annual)}/year, first payment after your 7-day trial</p>}
            {totals.recurring > 0 && <p>{formatGBP(totals.recurring)}/month, first charge after your 7-day trial</p>}
          </div>
        )}

        {checkoutError && <p className="mt-4 text-[13px] text-danger">{checkoutError}</p>}

        <div className="mt-6 flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={() => setPhase("results")}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-muted hover:bg-surface-2"
          >
            Back to results
          </button>
          {items.length > 0 && (
            <button
              type="button"
              onClick={confirmPlan}
              disabled={confirming}
              className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {confirming ? "Redirecting to checkout…" : "Continue to checkout →"}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (phase === "results") {
    const recyclingResult = simplerRecycling.evaluate(answers);
    const otherResults = otherModules.map((m) => ({ module: m, result: m.evaluate(answers) }));
    const flagged = otherResults.filter(({ result }) => !result.notApplicable && result.overall !== "green");
    const clear = otherResults.filter(({ result }) => result.notApplicable || result.overall === "green");
    const otherRelevant = REGULATIONS.filter(
      (r) => r.status !== "live" && sector && r.sectors.includes(sector),
    );

    return (
      <div className="grid gap-4 pb-20">
        <ModuleCard module={simplerRecycling} result={recyclingResult} cart={cart} onToggleCart={toggleCart} />

        {flagged.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-1 text-lg font-semibold text-pine">
              {flagged.length} other area{flagged.length === 1 ? "" : "s"} worth a closer look
            </h2>
            <p className="text-[13px] text-muted">
              Based on your quick answers — the details below are provisional until you dig
              deeper.
            </p>
          </div>
        )}

        {flagged.map(({ module, result }) => (
          <ModuleCard key={module.regulationName} module={module} result={result} cart={cart} onToggleCart={toggleCart} />
        ))}

        {clear.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-3 text-[15px] font-semibold text-pine">
              Nothing to flag yet on {clear.length} other law{clear.length === 1 ? "" : "s"}
            </h2>
            <div className="flex flex-wrap gap-2">
              {clear.map(({ module }) => (
                <span
                  key={module.regulationName}
                  className="rounded-full bg-surface-2 px-3 py-1 text-[12px] text-muted"
                >
                  {module.regulationName}
                </span>
              ))}
            </div>
          </div>
        )}

        {deepSteps.length > 0 && (
          <div className="rounded-lg border border-accent bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface))] p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-pine">Want the full picture?</h2>
            <p className="mx-auto mb-4 max-w-md text-[14px] text-muted">
              A few more questions on the flagged areas above will give you a precise
              obligation-by-obligation score, instead of a provisional one.
            </p>
            <button
              type="button"
              onClick={() => {
                setDeepIndex(0);
                setPhase("deepdive");
              }}
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Continue to the full in-depth check →
            </button>
          </div>
        )}

        {otherRelevant.length > 0 && (
          <div className="rounded-lg border border-border bg-surface p-6">
            <h2 className="mb-1 text-lg font-semibold text-pine">
              Other regulations that apply to {sector}
            </h2>
            <p className="mb-4 text-[13px] text-muted">
              These also apply to your sector — we&apos;re researching and building checkers for
              them next.
            </p>
            <div className="grid gap-2">
              {otherRelevant.map((r) => (
                <div
                  key={r.name}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-4 py-3"
                >
                  <div>
                    <p className="text-[14px] font-medium text-ink">{r.name}</p>
                    <p className="text-[12.5px] text-muted">{r.note}</p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide ${REG_BADGE[r.status].className}`}
                  >
                    {REG_BADGE[r.status].label}
                  </span>
                </div>
              ))}
            </div>
            <Link
              href="/regulations"
              className="mt-4 inline-block text-[13px] font-semibold text-accent hover:opacity-80"
            >
              See all regulations tracked →
            </Link>
          </div>
        )}

        <button
          type="button"
          onClick={startOver}
          className="self-start rounded-md border border-border bg-surface px-4 py-2 text-sm text-muted hover:bg-surface-2"
        >
          Start over
        </button>

        <CartBar items={Object.values(cart)} onReview={() => setPhase("cart")} />
      </div>
    );
  }

  if (phase === "deepdive") {
    if (!deepStep) return null;
    return (
      <div className="rounded-lg border border-border bg-surface p-6">
        <p className="mb-6 font-mono text-[11px] uppercase tracking-wide text-muted">
          In-depth check · question {deepIndex + 1} of {deepSteps.length}
        </p>

        {deepStep.type === "single" ? (
          <SingleSelect
            question={deepStep}
            value={(answers[deepStep.id] as string | null) ?? null}
            onChange={(v) => set(deepStep.id, v)}
          />
        ) : (
          <NumberInput
            question={deepStep}
            value={(answers[deepStep.id] as number | null) ?? null}
            onChange={(v) => set(deepStep.id, v)}
          />
        )}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={deepBack}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-muted hover:bg-surface-2"
          >
            Back
          </button>
          <button
            type="button"
            onClick={deepNext}
            className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {deepIndex + 1 >= deepSteps.length ? "See full results" : "Next"}
          </button>
        </div>
      </div>
    );
  }

  // phase === "recycling"
  if (!recyclingStep) return null;

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <p className="mb-6 font-mono text-[11px] uppercase tracking-wide text-muted">
        Simpler Recycling · question {recyclingIndex + 1} of {recyclingSteps.length}
      </p>

      {recyclingStep.type === "single" ? (
        <SingleSelect
          question={recyclingStep}
          value={(answers[recyclingStep.id] as string | null) ?? null}
          onChange={(v) => set(recyclingStep.id, v)}
        />
      ) : (
        <NumberInput
          question={recyclingStep}
          value={(answers[recyclingStep.id] as number | null) ?? null}
          onChange={(v) => set(recyclingStep.id, v)}
        />
      )}

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={recyclingBack}
          disabled={recyclingIndex === 0 && checklistQuestions.length === 0}
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm text-muted disabled:opacity-40 hover:enabled:bg-surface-2"
        >
          Back
        </button>
        <button
          type="button"
          onClick={recyclingNext}
          className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {recyclingIndex + 1 >= recyclingSteps.length ? "See results" : "Next"}
        </button>
      </div>
    </div>
  );
}
