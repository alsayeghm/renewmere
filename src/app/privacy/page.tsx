import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Privacy Policy — Renewmere",
  description:
    "How Renewmere collects, uses, and protects your data when you use the free compliance checker.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wide text-accent">
          <span className="inline-block h-px w-5 bg-accent" />
          Privacy Policy
        </p>
        <h1 className="mb-3 text-3xl font-bold text-ink">
          How we handle your data
        </h1>
        <p className="mb-10 text-[14px] text-muted">Last updated 24 August 2026</p>

        <div className="flex flex-col gap-8 text-[15px] leading-relaxed text-ink">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">Who we are</h2>
            <p className="text-muted">
              Renewmere is operated by GoldenPass Ltd, a company registered
              in England and Wales (company no. 15877279). We are the data
              controller for the personal data described in this policy.
              Contact us at{" "}
              <a
                href="mailto:hello@renewmere.com"
                className="font-semibold text-accent"
              >
                hello@renewmere.com
              </a>
              .
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">
              What we collect
            </h2>
            <ul className="flex flex-col gap-2 text-muted">
              <li>
                <strong className="text-ink">Account details</strong> — your
                email address, and if you sign in with Google, the name and
                email address Google shares with us.
              </li>
              <li>
                <strong className="text-ink">Checker answers</strong> — the
                responses you give in the compliance checker (e.g. staff
                numbers, waste arrangements) and the Red/Amber/Green result
                we calculate from them.
              </li>
              <li>
                <strong className="text-ink">Basic technical data</strong> —
                standard server logs (IP address, browser type, pages
                visited) used only for security and reliability.
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">
              Why we collect it
            </h2>
            <p className="text-muted">
              To create your account, save your checker results so you can
              come back to them, and keep the service secure. We do not sell
              your data, and we do not use it for advertising.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">
              Where it&apos;s stored
            </h2>
            <p className="text-muted">
              Account data and checker results are stored with Supabase, our
              database and authentication provider, hosted in the EU
              (Ireland). If you sign in with Google, authentication is
              handled directly by Google&apos;s OAuth service — we never see
              or store your Google password.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">
              Your rights
            </h2>
            <p className="text-muted">
              Under UK GDPR, you can ask us to access, correct, or delete
              your personal data at any time. Email{" "}
              <a
                href="mailto:hello@renewmere.com"
                className="font-semibold text-accent"
              >
                hello@renewmere.com
              </a>{" "}
              and we&apos;ll act on it within 30 days.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">Cookies</h2>
            <p className="text-muted">
              We use only the essential cookies needed to keep you signed in.
              We don&apos;t run advertising or third-party tracking cookies.
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-ink">Changes</h2>
            <p className="text-muted">
              If this policy changes materially, we&apos;ll update the date
              above and, where appropriate, let signed-up users know by
              email.
            </p>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
