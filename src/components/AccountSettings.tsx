"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AccountSettings({ email }: { email: string }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage(null);
    setPasswordError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordSaving(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setNewPassword("");
    setPasswordMessage("Password updated.");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setDeleteError("Couldn't delete your account — please try again or contact us.");
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-10">
      <div>
        <p className="mb-1 font-mono text-[11px] uppercase tracking-wide text-accent">Account</p>
        <h1 className="text-2xl font-bold text-ink">Account settings</h1>
        <p className="text-[13.5px] text-muted">{email}</p>
      </div>

      <div className="rounded-lg border border-border bg-surface p-6">
        <h2 className="mb-3 text-[15px] font-semibold text-ink">Change password</h2>
        <form onSubmit={handleChangePassword} className="grid gap-3">
          <input
            type="password"
            required
            minLength={6}
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-paper px-4 py-2.5 text-[14px] text-ink placeholder:text-muted"
          />
          {passwordError && <p className="text-[13px] text-danger">{passwordError}</p>}
          {passwordMessage && <p className="text-[13px] text-living-ink">{passwordMessage}</p>}
          <button
            type="submit"
            disabled={passwordSaving}
            className="justify-self-start rounded-md bg-accent px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {passwordSaving ? "Saving…" : "Update password"}
          </button>
        </form>
      </div>

      <div className="rounded-lg border border-danger bg-danger-surface p-6">
        <h2 className="mb-2 text-[15px] font-semibold text-ink">Delete account</h2>
        <p className="mb-4 text-[13px] text-muted">
          This permanently deletes your account, orders, compliance checks, and any files you&apos;ve uploaded. This
          can&apos;t be undone. It doesn&apos;t cancel active billing — cancel from your dashboard first if you have
          an active plan.
        </p>
        {deleteError && <p className="mb-3 text-[13px] text-danger">{deleteError}</p>}
        {confirming ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="rounded-md bg-danger px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, permanently delete my account"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-[13px] text-muted hover:opacity-80"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-md border border-danger px-4 py-2 text-[13px] font-semibold text-danger hover:bg-danger hover:text-white"
          >
            Delete my account
          </button>
        )}
      </div>
    </div>
  );
}
