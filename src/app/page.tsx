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


async function RecentReports() {
  const recentReports = await getReports(3);

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
  const totalReports = reports.length;
  const resolvedReports = reports.filter(r => r.status === 'RESOLVED').length;
  const inProgressReports = reports.filter(r => r.status === 'IN_PROGRESS').length;

  return (
    <div className="bg-transparent py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-headline font-bold text-foreground">
              Sobre o Infra Mais
            </h2>
            <Separator className="my-4" />
            <p className="text-muted-foreground text-base">
              O Infra Mais é uma plataforma criada para facilitar a comunicação entre os cidadãos e a prefeitura, permitindo o registro rápido e organizado de problemas relacionados à infraestrutura da cidade. O objetivo do site é tornar o processo de identificação, envio e acompanhamento de solicitações mais simples, transparente e eficiente.
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
  const reports: Report[] = await getReports();

  return (
    <>
      <main>
        {/* Card "Reportar um Problema" */}
        <div className="py-12 md:py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center md:text-left md:max-w-xl">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-bold text-foreground mb-2">
                Reportar um Problema
              </h2>
              <p className="mt-4 text-muted-foreground text-base">
                Informe rapidamente um problema encontrado na sua cidade. Descreva o que aconteceu, envie uma foto (opcional) e marque no mapa o local exato.
Seu relato ajuda a prefeitura a agir com mais rapidez e precisão.
              </p>
              <Button asChild size="lg" className="mt-6 w-full sm:w-auto bg-amber-400 text-black hover:bg-amber-400/90 focus-visible:ring-amber-500">
                <Link href="/report/auth">
                  Relatar um Problema <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        <div>
            {/* Mapa */}
            <div className="relative z-20 bg-transparent py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-card p-4 sm:p-8 rounded-lg shadow-lg border">
                <h2 className="text-3xl font-headline font-bold text-foreground mb-4 text-center md:text-left">
                    Mapa em Tempo Real
                </h2>
                <Separator className="mb-6" />
                <HomeMapClient reports={reports} />
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
                    <p className="text-muted-foreground mt-2">Veja os últimos problemas relatados pela comunidade.</p>
                    <Separator className="mt-4" />
                </div>
                <RecentReports />
            </div>
            </div>
            
            <AboutSection reports={reports} />
        </div>

      </main>
    </>
  );
}
