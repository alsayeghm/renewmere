import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { AccountSettings } from "@/components/AccountSettings";
import { createClient as createServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Account — Renewmere",
};

export default async function AccountPage() {
  const supabase = await createServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/login?next=/account");
  }

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <section className="mx-auto max-w-xl px-6 py-14">
        <AccountSettings email={userData.user.email ?? ""} />
      </section>
    </div>
  );
}
