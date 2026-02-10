import { fetchBrainItems } from "@/app/actions";
import { Dashboard } from "@/components/dashboard";

export default async function Home() {
  const items = await fetchBrainItems();

  return <Dashboard initialItems={items} />;
}
