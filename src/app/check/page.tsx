import { Suspense } from "react";
import Link from "next/link";
import { Checker } from "@/components/Checker";
import { Logo } from "@/components/Logo";

export default function CheckPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <Link href="/" className="mb-8 inline-block">
        <Logo size={22} />
      </Link>
      <p className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-accent">
        <span className="inline-block h-px w-5 bg-accent" />
        Free compliance checker · Module 01
      </p>
      <h1 className="mb-3 text-3xl font-bold text-pine">Simpler Recycling</h1>
      <p className="mb-3 max-w-prose text-muted">
        Answer a few questions about your waste setup. We&apos;ll tell you
        exactly where you stand against the Separation of Waste (England)
        Regulations — with the deadline that actually applies to your
        business size.
      </p>
      <p className="mb-10 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-ink">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
        For businesses in England. Wales, Scotland &amp; Northern Ireland
        aren&apos;t covered yet.
      </p>
      <Suspense fallback={null}>
        <Checker />
      </Suspense>
    </div>
  );
}
