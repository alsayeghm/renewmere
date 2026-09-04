import Link from "next/link";
import { Logo } from "@/components/Logo";

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-border bg-surface-2">
      <div
        className="h-[3px] w-full"
        style={{
          backgroundImage: "linear-gradient(90deg, var(--accent), var(--danger))",
        }}
      />
      <svg
        className="pointer-events-none absolute -right-16 top-4 opacity-[0.06]"
        width="380"
        height="280"
        viewBox="0 0 380 280"
        aria-hidden="true"
      >
        <path
          d="M40,20 C10,80 90,110 60,170 C30,230 110,240 90,280"
          fill="none"
          stroke="currentColor"
          className="text-ink"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M180,0 C150,60 230,90 200,150 C170,210 250,230 220,280"
          fill="none"
          stroke="currentColor"
          className="text-ink"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-10 h-32 w-full opacity-[0.07]"
        viewBox="0 0 1200 130"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0,70 C100,20 180,120 280,65 C380,10 460,110 560,60 C660,10 740,110 840,60 C930,15 1000,105 1100,55 C1140,35 1170,65 1200,50"
          fill="none"
          stroke="currentColor"
          className="text-ink"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>
      <div className="relative mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo size={20} />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-muted">
              A free, explainable compliance checker for England-based
              small businesses — starting with recycling.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full motion-safe:animate-ping rounded-full bg-[var(--live)] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--live)]" />
              </span>
              <span className="text-[12px] font-medium text-ink">
                Simpler Recycling · live now
              </span>
            </div>
          </div>

          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-wide text-accent">
              Product
            </p>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/how-it-works"
                  className="text-[13.5px] text-muted transition-colors hover:text-ink"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link
                  href="/regulations"
                  className="text-[13.5px] text-muted transition-colors hover:text-ink"
                >
                  Regulations tracked
                </Link>
              </li>
              <li>
                <Link
                  href="/coming-soon"
                  className="text-[13.5px] text-muted transition-colors hover:text-ink"
                >
                  Coming into force
                </Link>
              </li>
            </ul>
            <Link
              href="/check"
              className="mt-5 inline-block rounded-md bg-accent px-4 py-2 text-[12.5px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Start the free check →
            </Link>
          </div>

          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-wide text-accent">
              Account
            </p>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  href="/login"
                  className="text-[13.5px] text-muted transition-colors hover:text-ink"
                >
                  Log in
                </Link>
              </li>
              <li>
                <Link
                  href="/signup"
                  className="text-[13.5px] text-muted transition-colors hover:text-ink"
                >
                  Sign up
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-4 font-mono text-[11px] uppercase tracking-wide text-accent">
              Contact
            </p>
            <ul className="flex flex-col gap-3">
              <li>
                <a
                  href="mailto:hello@renewmere.com"
                  className="text-[13.5px] text-muted transition-colors hover:text-ink"
                >
                  hello@renewmere.com
                </a>
              </li>
              <li className="text-[13.5px] text-muted">England, UK</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-border pt-6 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            GoldenPass Ltd, trading as Renewmere · Registered in England and
            Wales, company no. 15877279
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="transition-colors hover:text-ink"
            >
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <p>© {new Date().getFullYear()} Renewmere</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
