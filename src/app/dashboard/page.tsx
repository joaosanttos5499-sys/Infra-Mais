import { Suspense } from "react";
import { Header } from "@/components/header";
import { DashboardClient } from "@/components/dashboard-client";
import { getReports } from "@/lib/data";
import { Loader2 } from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-4 text-muted-foreground">Loading reports...</p>
    </div>
  );
}

export default async function DashboardPage() {
  const reports = await getReports();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-headline">
              Issue Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              View and manage all reported infrastructure issues.
            </p>
          </div>
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardClient reports={reports} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
