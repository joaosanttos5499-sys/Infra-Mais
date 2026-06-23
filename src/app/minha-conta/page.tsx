import { getReports } from "@/lib/data";
import { MinhaContaClient } from "./client";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

function PageSkeleton() {
    return (
      <div className="flex items-center justify-center p-12 bg-background min-h-[60vh]">
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
            <main className="flex-1 pt-10 pb-24 px-8 md:px-16">
                <div className="max-w-[1750px] mx-auto">
                    <div className="mb-8 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Minha Conta
                        </h1>
                        <Separator className="my-4 bg-border" />
                        <p className="text-muted-foreground">
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
