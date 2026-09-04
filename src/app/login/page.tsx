import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Log in — Renewmere",
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-14">
      <Link href="/" className="mb-10 inline-block self-center">
        <Logo size={26} />
      </Link>
      <h1 className="mb-2 text-center text-2xl font-bold text-ink">
        Welcome back
      </h1>
      <p className="mb-8 text-center text-[14px] text-muted">
        Log in to see your saved compliance results.
      </p>
      <Suspense>
        <AuthForm mode="login" />
      </Suspense>
      <p className="mt-6 text-center text-[13px] text-muted">
        No account yet?{" "}
        <Link href="/signup" className="font-semibold text-accent">
          Sign up free
        </Link>
      </p>
    </div>
  );
}
