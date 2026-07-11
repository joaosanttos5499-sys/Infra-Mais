import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard-client";
import { getReports } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-4 text-muted-foreground font-medium">Carregando relatos da comunidade...</p>
    </div>
  );
}

async function DashboardContent() {
  const reports = await getReports();

  return (
    <main className="flex-1 p-8 md:p-16">
      <div className="max-w-[1750px] mx-auto">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Painel de Problemas
          </h1>
          <Separator className="my-4 bg-border" />
          <p className="text-base md:text-lg text-muted-foreground mt-2">
            Visualize e acompanhe em tempo real as ocorrências registradas na sua região.
          </p>
        </div>
        
        <DashboardClient reports={reports} />
      </div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
