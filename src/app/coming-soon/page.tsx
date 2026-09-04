import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { UPCOMING } from "@/lib/content";

export const metadata = {
  title: "Coming into force — Renewmere",
  description:
    "UK environmental laws not yet in force, with confirmed or expected commencement dates — from Simpler Recycling's micro-firm deadline to the UK Carbon Border Adjustment Mechanism.",
};

const PALETTE = [
  "#8B5CF6",
  "#3B82F6",
  "#14B8A6",
  "#F97350",
  "#F0B429",
  "#EC4899",
  "#22C55E",
];

export default function ComingSoonPage() {
  const next = UPCOMING[0];
  const rest = UPCOMING.slice(1, 4);

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:items-stretch">
          <div>
            <p className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-accent">
              <span className="inline-block h-px w-5 bg-accent" />
              Coming into force
            </p>
            <h1 className="mb-5 max-w-xl text-balance text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl">
              Not law yet — but on the calendar.
            </h1>
            <p className="mb-8 max-w-xl text-lg text-muted">
              Each one below has a confirmed or expected commencement date.
              Worth planning for now, not scrambling for later.
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
                See what&apos;s already law
              </Link>
            </div>

            <div className="mt-10 max-w-xl rounded-xl border border-border bg-surface p-5">
              <p className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted">
                How we track these
              </p>
              <ul className="flex flex-col gap-2.5 text-[13.5px] leading-snug text-ink">
                <li className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  Confirmed dates come from published SIs and government
                  guidance
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  Estimated dates are flagged as such until commencement is
                  confirmed
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  This page updates the moment a date changes
                </li>
              </ul>
            </div>
          </div>

          <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(28,26,22,0.04),0_12px_32px_-12px_rgba(28,26,22,0.14)]">
            <p className="mb-4 font-mono text-[12px] uppercase tracking-wide text-muted">
              Next up
            </p>
            <span
              className="mb-3 inline-block rounded-full px-3 py-1 font-mono text-[12px] font-bold text-white"
              style={{ backgroundColor: PALETTE[0] }}
            >
              {next.date}
            </span>
            <h2 className="mb-2 text-xl font-bold leading-snug text-ink">
              {next.name}
            </h2>
            <p className="mb-5 text-[13.5px] leading-relaxed text-muted">
              {next.note}
            </p>
            <div className="flex flex-col gap-2 border-t border-border pt-4">
              {rest.map((u, i) => (
                <div
                  key={u.name}
                  className="flex items-center gap-3 rounded-lg py-2 pl-3 text-[12.5px]"
                  style={{
                    borderLeft: `3px solid ${PALETTE[(i + 1) % PALETTE.length]}`,
                  }}
                >
                  <span className="flex-1 text-ink">{u.name}</span>
                  <span
                    className="shrink-0 font-mono font-semibold"
                    style={{ color: PALETTE[(i + 1) % PALETTE.length] }}
                  >
                    {u.date}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-auto grid grid-cols-3 gap-4 border-t border-border pt-5">
              <div>
                <p className="text-xl font-bold tracking-tight text-ink">
                  {UPCOMING.length}
                </p>
                <p className="mt-1 text-[11.5px] leading-snug text-muted">
                  not yet in force
                </p>
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-ink">
                  {next.date.split(" ").slice(-1)[0]}
                </p>
                <p className="mt-1 text-[11.5px] leading-snug text-muted">
                  next commencement
                </p>
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-ink">
                  {UPCOMING[UPCOMING.length - 1].date.split(" ").slice(-1)[0]}
                </p>
                <p className="mt-1 text-[11.5px] leading-snug text-muted">
                  furthest out
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface-2">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col gap-3">
            {UPCOMING.map((u, i) => (
              <div
                key={u.name}
                className="flex flex-col gap-1 rounded-xl bg-surface px-5 py-5 shadow-[0_1px_2px_rgba(28,26,22,0.04),0_8px_20px_-10px_rgba(28,26,22,0.12)] sm:flex-row sm:items-baseline sm:gap-6"
                style={{ borderLeft: `4px solid ${PALETTE[i % PALETTE.length]}` }}
              >
                <p
                  className="w-32 shrink-0 font-mono text-[12px] font-bold"
                  style={{ color: PALETTE[i % PALETTE.length] }}
                >
                  {u.date}
                </p>
                <div className="max-w-2xl">
                  <h3 className="mb-1 text-[15px] font-semibold leading-snug text-ink">
                    {u.name}
                  </h3>
                  <p className="text-[13.5px] leading-relaxed text-muted">
                    {u.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold text-ink">
          Check where you stand on what&apos;s already law
        </h2>
        <div className="flex items-center justify-center gap-3">
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
            See all regulations tracked
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
