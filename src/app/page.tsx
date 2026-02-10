import { fetchBrainItems } from "@/app/actions";
import { createServerSupabase } from "@/app/lib/supabase-server";
import { Dashboard } from "@/components/dashboard";

export default async function Home() {
  const items = await fetchBrainItems();
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <Dashboard initialItems={items} userEmail={user?.email} />;
}
