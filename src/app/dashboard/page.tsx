
'use client';

import { useEffect, useState, Suspense } from "react";
import { DashboardClient } from "@/components/dashboard-client";
import { getReports } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { type Report } from "@/lib/types";

function DashboardSkeleton() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-4 text-muted-foreground font-medium">Carregando relatos da comunidade...</p>
    </div>
  );
}

function DashboardContent() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const data = await getReports();
        setReports(data);
      } catch (error) {
        console.error("Erro ao carregar relatos no dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadReports();
  }, []);

  return (
    <main className="flex-1 p-8 md:p-16">
      <div className="max-w-[1750px] mx-auto">
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            Painel de Problemas
          </h1>
          <p className="text-base md:text-lg text-muted-foreground mt-2">
            Visualize e acompanhe em tempo real as ocorrências registradas na sua região.
          </p>
        </div>
        
        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <DashboardClient reports={reports} />
        )}
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
