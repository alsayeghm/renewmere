"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/client";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/regulations", label: "Regulations" },
  { href: "/coming-soon", label: "Coming soon" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-border px-6 py-5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
        <Link href="/">
          <Logo size={22} />
        </Link>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`relative pb-1 text-[13.5px] font-medium transition-colors hover:text-ink ${
                  active ? "text-ink" : "text-muted"
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-[21px] h-[2px] bg-accent" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-4">
          {authed ? (
            <>
              <Link
                href="/dashboard"
                className="text-[13.5px] font-medium text-ink transition-colors hover:text-accent"
              >
                Dashboard
              </Link>
              <Link
                href="/account"
                className="text-[13.5px] font-medium text-ink transition-colors hover:text-accent"
              >
                Account
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="text-[13.5px] font-medium text-ink transition-colors hover:text-accent"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[13.5px] font-medium text-ink transition-colors hover:text-accent"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
