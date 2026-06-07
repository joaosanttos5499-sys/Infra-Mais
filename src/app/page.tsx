
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, MapPin, CheckCircle2, BarChart3, Clock, ChevronRight, Plus, ShieldCheck } from "lucide-react";
import { getReports } from "@/lib/data";
import { type Report } from "@/lib/types";
import { HomeMapClient } from "@/components/home-map-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategory } from "@/lib/categories";
import { StatusBadge } from "@/components/status-badge";
import { ReportsChart } from "@/components/reports-chart";
import { ReportTime } from "@/components/report-time";
import { HomeCtaClient } from "@/components/home-cta-client";
import Image from "next/image";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

async function RecentReports() {
  const allReports = await getReports();
  const recentReports = allReports.filter(r => r.status !== 'UNDER_REVIEW').slice(0, 3);

  if (recentReports.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-dashed text-center text-muted-foreground shadow-sm">
        Nenhum problema relatado recentemente.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {recentReports.map((report) => {
          const category = getCategory(report.category);
          const problem = category?.problems.find(p => p.value === report.problem);
          const displayCity = report.city === 'Picui' ? 'Picuí' : report.city;
          
          return (
            <Link href={`/dashboard#report-${report.id}`} key={report.id} className="block group">
                <Card className="overflow-hidden flex flex-col h-full border-gray-200 shadow-sm transition-all duration-300 hover:shadow-lg rounded-xl bg-white">
                  <div className="relative h-48 w-full">
                      <Image
                        src={report.photoUrl}
                        alt="Foto do problema"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        loading="lazy"
                      />
                      <div className="absolute top-3 left-3 z-10">
                          <StatusBadge status={report.status} />
                      </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow space-y-4">
                      <div className="space-y-1">
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                              {problem?.label || report.problem}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                              {category?.icon && <category.icon className="h-4 w-4" style={{ color: category.color }} />}
                              <span>{category?.label || report.category}</span>
                          </div>
                      </div>

                      <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-50 pt-4">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Clock className="h-3.5 w-3.5" />
                              <ReportTime date={new Date(report.createdAt)} />
                          </div>
                          <div className="flex items-center gap-1 text-sm font-bold text-primary">
                              Detalhes <ChevronRight className="h-4 w-4" />
                          </div>
                      </div>
                  </div>
                </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function AboutSection({ reports }: { reports: Report[] }) {
  const publicReports = reports.filter(r => r.status !== 'UNDER_REVIEW');
  const totalReports = publicReports.length;
  const resolvedReports = publicReports.filter(r => r.status === 'RESOLVED').length;
  const inProgressReports = publicReports.filter(r => r.status === 'IN_PROGRESS').length;

  return (
    <section className="py-16 md:py-24 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight text-center md:text-left">
              Zeladoria Urbana <br className="hidden md:block"/><span className="text-primary">Inteligente e Transparente</span>
            </h2>
            <div className="space-y-6 text-base md:text-lg text-muted-foreground leading-relaxed text-center md:text-left">
              <p>O Infra Mais aproxima cidadãos e gestão pública, facilitando o registro geolocalizado de problemas urbanos.</p>
              <p className="font-semibold text-gray-900">Sua participação faz a diferença na melhoria da cidade.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                <div><h4 className="font-bold">Eficiência</h4><p className="text-sm text-muted-foreground">Relatos diretos.</p></div>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                <BarChart3 className="h-6 w-6 text-primary shrink-0" />
                <div><h4 className="font-bold">Transparência</h4><p className="text-sm text-muted-foreground">Acompanhamento real.</p></div>
              </div>
            </div>
          </div>

          <Card className="rounded-2xl border-gray-200 shadow-xl p-4 md:p-6 bg-gray-50/50">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl md:text-2xl font-bold flex items-center justify-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" /> Visão Geral
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <ReportsChart total={totalReports} resolved={resolvedReports} inProgress={inProgressReports} />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const allReports: Report[] = await getReports();
  const publicReports = allReports.filter(r => r.status !== 'UNDER_REVIEW');

  return (
    <div className="flex flex-col w-full">
      <main>
        <section className="relative pt-12 pb-24 md:pt-32 md:pb-48 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 relative z-10 text-center">
            <h1 className="text-4xl md:text-7xl font-bold text-gray-900 tracking-tight leading-tight">
              Relate um Problema na <br className="hidden sm:block"/><span className="text-primary italic">Sua Cidade</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Informe problemas de infraestrutura de forma rápida e precisa. Marque no mapa e anexe uma foto.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
              <HomeCtaClient />
              <Button asChild variant="ghost" size="lg" className="rounded-xl px-10 h-14 font-semibold">
                <Link href="/dashboard">Ver Mapa <MapPin className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </section>
        
        <section className="py-12 md:py-24 -mt-12 md:-mt-24">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Mapa da Comunidade</h2>
                    <p className="text-muted-foreground">Ocorrências registradas em tempo real.</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold uppercase">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pendente</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resolvido</div>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden shadow-inner border border-gray-100 h-[350px] md:h-[550px]">
                  <HomeMapClient reports={publicReports} />
                </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="flex items-end justify-between mb-12">
                <h2 className="text-3xl font-bold">Relatos Recentes</h2>
                <Button asChild variant="link" className="font-bold text-primary p-0 group">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    Ver todos <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
            </div>
            <Suspense fallback={<div className="grid grid-cols-1 md:grid-cols-3 gap-6"><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>}>
                <RecentReports />
            </Suspense>
          </div>
        </section>
        
        <AboutSection reports={allReports} />
      </main>
    </div>
  );
}
