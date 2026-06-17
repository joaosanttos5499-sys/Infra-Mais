"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardClient } from "@/components/dashboard-client";
import { getAllReportsAction } from "@/lib/actions";
import { Loader2, ShieldAlert } from "lucide-react";
import { useUser } from "@/firebase";
import { isEmailEmployee } from "@/lib/config";
import { type Report } from "@/lib/types";
import { Separator } from "@/components/ui/separator";

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center p-12 min-h-[60vh] bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="ml-4 text-muted-foreground">Verificando credenciais...</p>
    </div>
  );
}

function AccessDenied() {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center min-h-[60vh] bg-background">
            <ShieldAlert className="h-16 w-16 text-destructive mb-4" />
            <h1 className="text-2xl font-bold text-foreground">Acesso Negado</h1>
            <p className="text-muted-foreground mt-3 max-w-md">
                Esta área é restrita a funcionários credenciados do Infra Mais.
                Se você acredita que deveria ter acesso, entre em contato com o administrador.
            </p>
            <button 
                onClick={() => window.location.href = '/'}
                className="mt-6 px-6 py-2 bg-primary text-white rounded-md hover:opacity-90 transition-opacity"
            >
                Voltar para o Início
            </button>
        </div>
    );
}

export default function FuncionariosPage() {
  const { user, isUserLoading } = useUser();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  const fetchReports = useCallback(async () => {
    if (user && isEmailEmployee(user.email)) {
      const data = await getAllReportsAction();
      setReports(data);
      setIsLoadingReports(false);
    } else if (!isUserLoading && (!user || !isEmailEmployee(user.email))) {
      setIsLoadingReports(false);
    }
  }, [user, isUserLoading]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  if (isUserLoading) return <LoadingScreen />;

  if (!user || !isEmailEmployee(user.email)) {
    return <AccessDenied />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 p-8 md:p-16">
        <div className="max-w-[1750px] mx-auto">
          <div className="mb-8 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Painel do Funcionário
            </h1>
            <Separator className="my-4 bg-border" />
            <p className="text-muted-foreground mt-3">
              Visualize, gerencie e atualize os problemas de infraestrutura relatados pelos cidadãos.
            </p>
          </div>
          
          {isLoadingReports ? (
              <div className="flex items-center justify-center p-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-4 text-muted-foreground">Carregando relatórios...</p>
              </div>
          ) : (
            <DashboardClient 
                reports={reports} 
                showUpvote={false} 
                onSuccess={fetchReports}
            />
          )}
        </div>
      </main>
    </div>
  );
}
