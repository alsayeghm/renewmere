import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LivePreviewCard } from "@/components/LivePreviewCard";
import { RegulationsTimeline } from "@/components/charts/RegulationsTimeline";
import { RegulationsByDecade } from "@/components/charts/RegulationsByDecade";
import { SectorHeatmap } from "@/components/charts/SectorHeatmap";
import {
  STATS,
  STEPS,
  REGULATIONS,
  REG_BADGE,
  UPCOMING,
} from "@/lib/content";

const REGULATIONS_SAMPLE = REGULATIONS.slice(-6);
const UPCOMING_SAMPLE = UPCOMING.slice(0, 3);

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <svg
          className="pointer-events-none absolute -right-12 -top-6 opacity-[0.06]"
          width="480"
          height="260"
          viewBox="0 0 480 260"
          aria-hidden="true"
        >
          <path
            d="M0,140 C70,60 125,220 195,120 C265,20 320,200 390,110 C425,65 455,145 480,100"
            fill="none"
            stroke="currentColor"
            className="text-ink"
            strokeWidth="10"
            strokeLinecap="round"
          />
        </svg>
        <div className="relative mx-auto max-w-7xl px-6 pb-12 pt-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-[var(--live)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--live)]" />
            </span>
            <span className="text-[13px] font-medium text-ink">
              Simpler Recycling module · live now
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_440px] lg:items-start">
            <div>
              <h1 className="max-w-2xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
                Know exactly where you stand — before the{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, var(--accent), var(--danger))",
                  }}
                >
                  deadline
                </span>{" "}
                does.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted">
                Built to become the UK&apos;s leading sustainability
                compliance platform. Start with a free recycling check —
                more modules follow as the rules do.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/check"
                  className="rounded-md bg-accent px-6 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Start the free check →
                </Link>
                <Link
                  href="/how-it-works"
                  className="rounded-md border border-ink px-6 py-3 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
                >
                  See how it&apos;s scored
                </Link>
              </div>

              <div className="mt-10 flex max-w-xl flex-col gap-2.5">
                {[
                  {
                    color: "#22C55E",
                    label: "Green",
                    text: "fully meets the obligation",
                  },
                  {
                    color: "#F0B429",
                    label: "Amber",
                    text: "partial gap, no immediate risk",
                  },
                  {
                    color: "#EF4444",
                    label: "Red",
                    text: "genuine gap or enforcement risk",
                  },
                ].map((r) => (
                  <div
                    key={r.label}
                    className="flex items-center gap-3 rounded-lg py-2.5 pl-3.5 pr-3"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${r.color} 10%, var(--paper))`,
                      borderLeft: `3px solid ${r.color}`,
                    }}
                  >
                    <span className="text-[13.5px] font-semibold text-ink">
                      {r.label}
                    </span>
                    <span className="text-[13.5px] text-muted">
                      — {r.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <LivePreviewCard />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-2">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px sm:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.n}
              className="bg-surface-2 px-6 py-6 transition-colors hover:bg-surface"
            >
              <p className="mb-3 font-mono text-[11px] text-muted">/{s.n}</p>
              <p className="text-3xl font-bold tracking-tight text-ink">
                {s.value}
              </p>
              <p className="mt-1 text-[13px] font-semibold text-ink">
                {s.label}
              </p>
              <p className="mt-1 text-[13px] leading-snug text-muted">
                {s.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="mb-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-accent">
          <span className="inline-block h-px w-5 bg-accent" />
          How it works
        </p>
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((step) => (
            <div key={step.n}>
              <p className="mb-3 font-mono text-[11px] text-muted">
                /{step.n}
              </p>
              <h3 className="mb-2 text-xl font-bold text-ink">
                {step.title}
              </h3>
              <p className="text-[14px] leading-relaxed text-muted">
                {step.detail}
              </p>
            </div>
          ))}
        </div>
        <Link
          href="/how-it-works"
          className="mt-8 inline-block text-[13.5px] font-semibold text-accent transition-opacity hover:opacity-80"
        >
          See a full walk-through →
        </Link>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="mb-8 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-accent">
            <span className="inline-block h-px w-5 bg-accent" />
            The regulatory picture
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            <RegulationsTimeline />
            <RegulationsByDecade />
            <SectorHeatmap />
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-2">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-accent">
            <span className="inline-block h-px w-5 bg-accent" />
            UK regulations we track
          </p>
          <p className="mb-8 max-w-xl text-[14px] leading-relaxed text-muted">
            The UK runs one of the most extensive environmental regulatory
            frameworks anywhere. Every law below is already in force; the
            badge shows whether Renewmere&apos;s checker scores it today.
          </p>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {REGULATIONS_SAMPLE.map((r) => (
              <div key={r.name} className="bg-surface px-5 py-5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-mono text-[11px] text-muted">{r.year}</p>
                  <span
                    className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${REG_BADGE[r.status].className}`}
                  >
                    {r.status === "live" && (
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--living)]" />
                    )}
                    {REG_BADGE[r.status].label}
                  </span>
                </div>
                <h3 className="mb-1.5 text-[14.5px] font-semibold leading-snug text-ink">
                  {r.name}
                </h3>
                <p className="text-[13px] leading-relaxed text-muted">
                  {r.note}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/regulations"
            className="mt-6 inline-block text-[13.5px] font-semibold text-accent transition-opacity hover:opacity-80"
          >
            View all {REGULATIONS.length} regulations tracked →
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-accent">
          <span className="inline-block h-px w-5 bg-accent" />
          Coming into force
        </p>
        <p className="mb-8 max-w-xl text-[14px] leading-relaxed text-muted">
          These aren&apos;t law yet — each one has a confirmed or expected
          commencement date. Worth planning for now, not scrambling for
          later.
        </p>
        <div className="flex flex-col gap-px overflow-hidden rounded-lg border border-border bg-border">
          {UPCOMING_SAMPLE.map((u) => (
            <div
              key={u.name}
              className="flex flex-col gap-1 bg-surface px-5 py-4 sm:flex-row sm:items-baseline sm:gap-6"
            >
              <p className="w-32 shrink-0 font-mono text-[12px] font-semibold text-accent">
                {u.date}
              </p>
              <div>
                <h3 className="mb-1 text-[14.5px] font-semibold leading-snug text-ink">
                  {u.name}
                </h3>
                <p className="text-[13px] leading-relaxed text-muted">
                  {u.note}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Link
          href="/coming-soon"
          className="mt-6 inline-block text-[13.5px] font-semibold text-accent transition-opacity hover:opacity-80"
        >
          See the full timeline →
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
