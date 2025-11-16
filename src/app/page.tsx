"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/header";

// IMPORTAÇÃO DINÂMICA DO MAPA (CORRIGE O ERRO)
import dynamic from "next/dynamic";
const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
});

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <div className="relative z-20 bg-background py-8 pt-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-card p-8 rounded-lg shadow-lg border">
              <LeafletMap />
            </div>
          </div>
        </div>

        <div className="bg-background pt-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-card p-8 rounded-lg shadow-lg border flex flex-col">
                <h2 className="text-3xl font-headline font-bold text-foreground">
                  Para Cidadãos
                </h2>
                <p className="mt-2 text-muted-foreground flex-grow">
                  Viu um problema? Um buraco, um poste de luz quebrado ou lixo não recolhido? 
                  Denuncie em segundos.
                </p>
                <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
                  <Link href="/report/new">
                    Relatar um Problema <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              <div className="bg-card p-8 rounded-lg shadow-lg border flex flex-col">
                <h2 className="text-3xl font-headline font-bold text-foreground">
                  Problemas Relatados
                </h2>
                <p className="mt-2 text-muted-foreground flex-grow">
                  Veja os problemas pendentes e resolvidos relatados pela população.
                </p>
                <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
                  <Link href="/dashboard">
                    Ver Relatos <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
