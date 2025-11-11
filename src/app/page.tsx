import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/header";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <div className="bg-background pt-24 pb-12 md:pt-32 md:pb-20 text-center">
          <div className="relative z-10 px-4">
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight text-primary">
              Infra Mais
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-foreground/80">
              Um portal de relatos de problemas na infraestrutura.
            </p>
          </div>
        </div>
        <div className="bg-background">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <div className="flex justify-center">
              <div className="bg-card p-8 rounded-lg shadow-lg border max-w-lg w-full">
                <h2 className="text-3xl font-headline font-bold text-foreground">
                  Para Cidadãos
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Viu um problema? Um buraco, um poste de luz quebrado ou lixo não recolhido? Denuncie em segundos.
                </p>
                <Button asChild size="lg" className="mt-6 w-full sm:w-auto">
                  <Link href="/report/new">
                    Relatar um Problema <ArrowRight className="ml-2 h-5 w-5" />
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
