import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SectorHeatmap } from "@/components/charts/SectorHeatmap";
import { REGULATIONS, REG_BADGE, CATEGORIES } from "@/lib/content";

export const metadata = {
  title: "UK regulations tracked — Renewmere",
  description:
    "Every major UK environmental regulation Renewmere tracks — which ones the checker scores today, and which sectors they apply to.",
};

const STATUS_ORDER = ["live", "roadmap", "tracked"] as const;
const STATUS_COLOR: Record<(typeof STATUS_ORDER)[number], string> = {
  live: "#22C55E",
  roadmap: "#F0B429",
  tracked: "#3B82F6",
};

export default function RegulationsPage() {
  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: REGULATIONS.filter((r) => r.status === status).length,
  }));

  const earliestYear = REGULATIONS[0]?.year;
  const latestYear = REGULATIONS[REGULATIONS.length - 1]?.year;

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-stretch">
          <div>
            <p className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-accent">
              <span className="inline-block h-px w-5 bg-accent" />
              UK regulations we track
            </p>
            <h1 className="mb-5 max-w-xl text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              The UK runs one of the most extensive environmental regulatory
              frameworks anywhere.
            </h1>
            <p className="mb-8 max-w-xl text-lg text-muted">
              This is the landscape we&apos;re mapping against. Every law
              below is already in force; the badge shows whether
              Renewmere&apos;s checker scores it today, not whether the law
              itself is active.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/check"
                className="inline-block rounded-md bg-accent px-6 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Start the free check →
              </Link>
              <Link
                href="/coming-soon"
                className="inline-block rounded-md border border-ink px-6 py-3 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                See what&apos;s coming next
              </Link>
            </div>
          </div>

          <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(28,26,22,0.04),0_12px_32px_-12px_rgba(28,26,22,0.14)]">
            <p className="mb-4 font-mono text-[12px] uppercase tracking-wide text-muted">
              Coverage snapshot
            </p>
            <div className="mb-4 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-ink">
                {REGULATIONS.length}
              </span>
              <span className="text-[13.5px] text-muted">
                laws tracked, {earliestYear}–{latestYear}
              </span>
            </div>

            <div className="mb-5 flex h-3 overflow-hidden rounded-full">
              {counts.map(({ status, count }) => (
                <div
                  key={status}
                  style={{
                    width: `${(count / REGULATIONS.length) * 100}%`,
                    backgroundColor: STATUS_COLOR[status],
                  }}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2">
              {counts.map(({ status, count }) => (
                <div
                  key={status}
                  className="flex items-center justify-between gap-4 rounded-lg py-2.5 pl-3.5 pr-3"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${STATUS_COLOR[status]} 12%, var(--surface))`,
                    borderLeft: `3px solid ${STATUS_COLOR[status]}`,
                  }}
                >
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-wide text-ink">
                    {REG_BADGE[status].label}
                  </span>
                  <span
                    className="text-[15px] font-extrabold"
                    style={{ color: STATUS_COLOR[status] }}
                  >
                    {count}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto grid grid-cols-3 gap-4 border-t border-border pt-5">
              <div>
                <p className="text-xl font-bold tracking-tight text-ink">
                  {latestYear}
                </p>
                <p className="mt-1 text-[11.5px] leading-snug text-muted">
                  most recent
                </p>
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-ink">
                  {CATEGORIES.length}
                </p>
                <p className="mt-1 text-[11.5px] leading-snug text-muted">
                  sectors mapped
                </p>
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-ink">
                  {counts[0].count}
                </p>
                <p className="mt-1 text-[11.5px] leading-snug text-muted">
                  scored today
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-2">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {REGULATIONS.map((r) => (
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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-accent">
              <span className="inline-block h-px w-5 bg-accent" />
              Who needs to comply
            </p>
            <p className="max-w-md text-[15px] leading-relaxed text-muted">
              Every UK business produces waste, so every sector is in scope.
              The question tree branches to match what&apos;s actually
              relevant to you.
            </p>
          </div>
          <SectorHeatmap />
        </div>
      </section>

      <section className="border-t border-border bg-surface-2 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold text-ink">
          See where your business actually stands
        </h2>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/check"
            className="inline-block rounded-md bg-accent px-6 py-3 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Start the free check →
          </Link>
          <Link
            href="/coming-soon"
            className="inline-block rounded-md border border-ink px-6 py-3 text-[13px] font-semibold text-ink transition-colors hover:bg-ink hover:text-paper"
          >
            See what&apos;s coming into force
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
