import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard-client";
import { getReports } from "@/lib/data";
import { Loader2 } from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-4 text-muted-foreground font-medium">Carregando relatos da comunidade...</p>
    </div>
  );
}

export default async function DashboardPage() {
  const reports = await getReports();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-6 md:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Painel de Problemas
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mt-2">
              Visualize e acompanhe em tempo real as ocorrências registradas na sua região.
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