import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { getReports } from "@/lib/data";
import { type Report } from "@/lib/types";
import { HomeMapClient } from "@/components/home-map-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategory } from "@/lib/categories";
import { StatusBadge } from "@/components/status-badge";
import { ReportsChart } from "@/components/reports-chart";
import { ReportTime } from "@/components/report-time";
import { HomeCtaClient } from "@/components/home-cta-client";


async function RecentReports() {
  const allReports = await getReports();
  // Mostra apenas relatórios que passaram pela moderação
  const recentReports = allReports.filter(r => r.status !== 'UNDER_REVIEW').slice(0, 3);

  if (recentReports.length === 0) {
    return (
      <div className="bg-card p-8 rounded-lg shadow-sm text-center text-muted-foreground">
        Nenhum problema relatado recentemente.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {recentReports.map((report) => {
          const category = getCategory(report.category);
          const problem = category?.problems.find(p => p.value === report.problem);
          const displayCity = report.city === 'Picui' ? 'Picuí' : report.city;
          
          return (
            <Link href={`/dashboard#report-${report.id}`} key={report.id} className="block group">
                <Card className="overflow-hidden flex flex-col h-full transition-all group-hover:shadow-lg group-hover:-translate-y-1">
                <div className="relative aspect-video">
                    <Image
                    src={report.photoUrl}
                    alt={report.description}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-2 right-2">
                        <StatusBadge status={report.status} />
                    </div>
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                    {category?.icon && <category.icon className="h-5 w-5" style={{ color: category.color }} />} 
                    <span>{category?.label || report.category}</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                    <div className="flex-grow">
                        <p className="font-semibold text-sm line-clamp-1">{problem?.label || report.problem}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3" />
                            <span>{displayCity} - {report.bairro}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {report.location}
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        <ReportTime date={new Date(report.createdAt)} />
                    </p>
                </CardContent>
                </Card>
            </Link>
          );
        })}
      </div>
       <div className="text-center">
          <Button asChild className="w-full sm:w-auto bg-amber-400 text-black hover:bg-amber-400/90 focus-visible:ring-amber-500">
            <Link href="/dashboard">
              Ver todos os problemas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
    </div>
  );
}

function AboutSection({ reports }: { reports: Report[] }) {
  // Filtra apenas relatórios públicos para o gráfico da Home
  const publicReports = reports.filter(r => r.status !== 'UNDER_REVIEW');
  const totalReports = publicReports.length;
  const resolvedReports = publicReports.filter(r => r.status === 'RESOLVED').length;
  const inProgressReports = publicReports.filter(r => r.status === 'IN_PROGRESS').length;

  return (
    <div className="bg-transparent py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-headline font-bold text-foreground">
              Sobre o Infra Mais
            </h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground text-base mt-3">
              O Infra Mais é uma plataforma independente criada para facilitar a comunicação entre os cidadãos e os órgãos responsáveis, permitindo o registro rápido e organizado de problemas de infraestrutura. Nosso objetivo é tornar a zeladoria urbana mais simples, transparente e eficiente para todos.
            </p>
          </div>
          <div>
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Visão Geral dos Relatórios</CardTitle>
                </CardHeader>
                <CardContent>
                    <ReportsChart total={totalReports} resolved={resolvedReports} inProgress={inProgressReports} />
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}


export default async function Home() {
  const allReports: Report[] = await getReports();
  // No mapa da home, mostramos apenas o que já foi moderado
  const publicReports = allReports.filter(r => r.status !== 'UNDER_REVIEW');

  return (
    <>
      <main>
        {/* Card "Relate um Problema na Sua Cidade" */}
        <div className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center md:text-left md:max-w-xl">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-foreground">
                Relate um Problema na Sua Cidade
              </h2>
              <Separator className="my-4" />
              <p className="mt-3 text-muted-foreground text-base">
                Informe um problema de infraestrutura de forma rápida e precisa. Descreva o ocorrido, anexe uma imagem e marque o local no mapa para facilitar a resolução.
              </p>
              <HomeCtaClient />
            </div>
          </div>
        </div>
        
        <div>
            {/* Mapa */}
            <div className="relative z-20 bg-transparent py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-card p-4 sm:p-8 rounded-lg shadow-lg border">
                <h2 className="text-3xl font-headline font-bold text-foreground text-center md:text-left">
                    Mapa de Problemas Reportados
                </h2>
                <Separator className="my-4" />
                <HomeMapClient reports={publicReports} />
                </div>
            </div>
            </div>

            {/* Problemas Recentes */}
            <div className="bg-transparent py-8 pb-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8 text-center md:text-left">
                    <h2 className="text-3xl font-headline font-bold text-foreground">
                        Problemas Recentes
                    </h2>
                    <Separator className="my-4" />
                    <p className="text-muted-foreground mt-3">Confira as demandas mais recentes enviadas pela comunidade e acompanhe seu progresso.</p>
                </div>
                <RecentReports />
            </div>
            </div>
            
            <AboutSection reports={allReports} />
        </div>

      </main>
    </>
  );
}
