import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { StepFlowCard } from "@/components/StepFlowCard";
import { STEPS, STATS } from "@/lib/content";

export const metadata = {
  title: "How it works — Renewmere",
  description:
    "How the Renewmere compliance checker turns a short question set into an explainable Red/Amber/Green reading.",
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_440px] lg:items-stretch">
          <div>
            <p className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-accent">
              <span className="inline-block h-px w-5 bg-accent" />
              How it works
            </p>
            <h1 className="mb-5 max-w-xl text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Three steps, one honest answer.
            </h1>
            <p className="mb-8 max-w-xl text-lg text-muted">
              No account, no jargon, no blended pass/fail score standing in
              for the real detail. Here&apos;s exactly what happens when you
              run the checker.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/check"
                className="inline-block rounded-md bg-accent px-6 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Start the free check →
              </Link>
              <Link
                href="/regulations"
                className="inline-block rounded-md border border-ink px-6 py-3 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                See what&apos;s tracked
              </Link>
            </div>

            <div className="mt-10 max-w-xl rounded-xl border border-border bg-surface p-5">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">
                What you&apos;ll need
              </p>
              <ul className="flex flex-col gap-2.5 text-[13.5px] leading-snug text-ink">
                <li className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  Roughly how many staff you employ, full &amp; part-time
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  Whether waste collection is arranged, and by whom
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  How you currently separate recyclables, if at all
                </li>
              </ul>
            </div>
          </div>

          <StepFlowCard stats={STATS.slice(0, 3)} />
        </div>
      </section>

      <section className="border-y border-border bg-surface-2">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-10 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n}>
                <p className="mb-3 font-mono text-[13px] text-accent">
                  /{step.n}
                </p>
                <h2 className="mb-2 text-2xl font-bold text-ink">
                  {step.title}
                </h2>
                <p className="text-[15px] leading-relaxed text-muted">
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.n} className="bg-surface-2 px-6 py-6">
              <p className="mb-2 font-mono text-[11px] text-muted">/{s.n}</p>
              <p className="text-2xl font-bold tracking-tight text-ink">
                {s.value}
              </p>
              <p className="mt-1 text-[12.5px] font-semibold text-ink">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold text-ink">
          Ready to see where you stand?
        </h2>
        <Link
          href="/check"
          className="inline-block rounded-md bg-accent px-6 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Start the free check →
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
