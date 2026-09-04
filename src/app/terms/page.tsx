import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Terms of Service — Renewmere",
  description: "The terms for using Renewmere's free compliance checker.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-accent">
          <span className="inline-block h-px w-5 bg-accent" />
          Terms of Service
        </p>
        <h1 className="mb-3 text-3xl font-bold text-ink">Terms of use</h1>
        <p className="mb-10 text-[14px] text-muted">Last updated 24 August 2026</p>

        <div className="flex flex-col gap-8 text-[15px] leading-relaxed text-ink">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">
              What Renewmere is
            </h2>
            <p className="text-muted">
              Renewmere, operated by GoldenPass Ltd (company no. 15877279),
              is a free tool that helps UK businesses understand where they
              stand against specific environmental regulations, starting
              with the Separation of Waste (England) Regulations 2025.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">
              Not legal advice
            </h2>
            <p className="text-muted">
              Renewmere gives an informational, self-assessed reading based
              on the answers you provide. It is not legal advice, and a
              Green result is not a guarantee of compliance. If you&apos;re
              unsure about your obligations, consult a qualified adviser or
              the Environment Agency directly.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">
              Your account
            </h2>
            <p className="text-muted">
              You&apos;re responsible for keeping your login credentials
              secure and for the accuracy of the answers you submit — the
              result we show is only as good as the information you give us.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">
              Service availability
            </h2>
            <p className="text-muted">
              Renewmere is under active development. We&apos;ll do our best
              to keep it running and your data intact, but the service is
              provided &quot;as is&quot; without warranty, and features may
              change as we add new compliance modules.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">Contact</h2>
            <p className="text-muted">
              Questions about these terms:{" "}
              <a
                href="mailto:hello@renewmere.com"
                className="font-semibold text-accent"
              >
                hello@renewmere.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
