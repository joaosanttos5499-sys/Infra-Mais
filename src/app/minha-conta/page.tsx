import { getReports } from "@/lib/data";
import { MinhaContaClient } from "./client";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function PageSkeleton() {
    return (
      <div className="flex items-center justify-center p-12">
        <span className="sr-only">Carregando...</span>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando seus dados...</p>
      </div>
    );
  }

export default async function MinhaContaPage() {
    const reports = await getReports();

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <main className="flex-1 py-10 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8 text-center md:text-left">
                        <h1 className="text-3xl font-semibold text-gray-800 mb-2">
                            Minha Conta
                        </h1>
                        <p className="text-gray-500">
                            Gerencie suas informações pessoais e acompanhe sua atividade na plataforma.
                        </p>
                    </div>
                    <Suspense fallback={<PageSkeleton />}>
                        <MinhaContaClient allReports={reports} />
                    </Suspense>
                </div>
            </main>
        </div>
    )
}
