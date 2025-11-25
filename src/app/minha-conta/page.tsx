
import { getReports } from "@/lib/data";
import { MinhaContaClient } from "./client";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

function PageSkeleton() {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Carregando seus dados...</p>
      </div>
    );
  }

export default async function MinhaContaPage() {
    const reports = await getReports();

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <main className="flex-1 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8 text-center md:text-left">
                        <h1 className="text-3xl md:text-4xl font-bold font-headline">
                            Minha Conta
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Veja seus relatórios e gerencie seus dados.
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
