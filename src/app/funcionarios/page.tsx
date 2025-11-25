
import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard-client";
import { getReports } from "@/lib/data";
import { Loader2 } from "lucide-react";

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-4 text-muted-foreground">Carregando relatórios...</p>
    </div>
  );
}

export default async function FuncionariosPage() {
  const reports = await getReports();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-headline">
              Painel do Funcionário
            </h1>
            <p className="text-muted-foreground mt-1">
              Visualize, gerencie e atualize os problemas de infraestrutura relatados pelos cidadãos.
            </p>
          </div>
          <Suspense fallback={<DashboardSkeleton />}>
            <DashboardClient reports={reports} showUpvote={false} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
