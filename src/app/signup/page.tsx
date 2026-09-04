import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthForm } from "@/components/AuthForm";

export const metadata = {
  title: "Sign up — Renewmere",
};

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-14">
      <Link href="/" className="mb-10 inline-block self-center">
        <Logo size={26} />
      </Link>
      <h1 className="mb-2 text-center text-2xl font-bold text-ink">
        Create your free account
      </h1>
      <p className="mb-8 text-center text-[14px] text-muted">
        Free, forever, for the checker. We&apos;ll save your results so you
        can come back to them.
      </p>
      <Suspense>
        <AuthForm mode="signup" />
      </Suspense>
      <p className="mt-6 text-center text-[13px] text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-accent">
          Log in
        </Link>
      </p>
    </div>
  );
}
