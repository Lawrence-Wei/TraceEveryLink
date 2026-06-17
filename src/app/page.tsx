import { Suspense } from "react";
import { requirePageSession } from "@/server/auth";
import { getInventorySnapshot } from "@/server/inventory";
import DashboardClient from "@/app/DashboardClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await requirePageSession();
  const snapshot = await getInventorySnapshot();
  const initialData = JSON.parse(JSON.stringify(snapshot));

  return (
    <Suspense fallback={<main className="app-shell" />}>
      <DashboardClient
        initialData={initialData}
        currentUser={session.user}
        csrfToken={session.csrfToken}
      />
    </Suspense>
  );
}
