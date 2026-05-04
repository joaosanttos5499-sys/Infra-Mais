import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin, CheckCircle2, Users, BarChart3, Clock, ChevronRight } from "lucide-react";
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
                <Card className="overflow-hidden flex flex-col h-full border-gray-200 shadow-sm transition-all duration-500 hover:shadow-lg hover:-translate-y-1 rounded-xl bg-white relative animate-in fade-in slide-in-from-bottom-4">
                  {/* Top Image Section */}
                  <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        src={report.photoUrl}
                        alt={report.description}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      {/* Badge Over Image */}
                      <div className="absolute top-3 left-3 z-10">
                          <StatusBadge status={report.status} />
                      </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5 flex flex-col flex-grow space-y-4">
                      <div className="space-y-1">
                          {/* Title - Main Highlight */}
                          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight">
                              {problem?.label || report.problem}
                          </h3>
                          
                          {/* Category with Icon */}
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                              {category?.icon && <category.icon className="h-4 w-4" style={{ color: category.color }} />}
                              <span>{category?.label || report.category}</span>
                          </div>
                      </div>

                      {/* Location Blocks */}
                      <div className="space-y-2 py-2 border-y border-gray-50">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                              <MapPin className="h-4 w-4 text-primary" />
                              <span>{displayCity} - {report.bairro}</span>
                          </div>
                          <div className="pl-6">
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {report.location}
                              </p>
                          </div>
                      </div>

                      {/* Footer Info & Action */}
                      <div className="mt-auto pt-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Clock className="h-3.5 w-3.5" />
                              <ReportTime date={new Date(report.createdAt)} />
                          </div>
                          
                          <div className="flex items-center gap-1 text-sm font-bold text-primary group-hover:gap-2 transition-all">
                              Ver detalhes
                              <ChevronRight className="h-4 w-4" />
                          </div>
                      </div>
                  </div>
                </Card>
            </Link>
          );
        })}
      </div>
       <div className="flex justify-center mt-4">
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto rounded-xl px-8 hover:bg-primary hover:text-white transition-all duration-300">
            <Link href="/dashboard">
              Ver todos os relatos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4 text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
                Zeladoria Urbana <br className="hidden md:block"/><span className="text-primary">Inteligente e Transparente</span>
              </h2>
              <div className="w-20 h-1.5 bg-primary rounded-full mx-auto md:mx-0" />
            </div>
            
            <div className="space-y-6 text-base md:text-lg text-muted-foreground leading-relaxed text-center md:text-left">
              <p>
                O Infra Mais é uma plataforma criada para aproximar cidadãos e órgãos responsáveis, facilitando o registro de problemas urbanos de forma rápida e organizada.
              </p>
              <p>
                Com o uso de mapas interativos e envio de informações detalhadas, o sistema permite identificar e acompanhar ocorrências com mais precisão.
              </p>
              <p className="font-semibold text-gray-900">
                Sua participação faz a diferença na melhoria da cidade.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-4 md:block">
                <CheckCircle2 className="h-6 w-6 text-primary mb-2 shrink-0" />
                <div>
                    <h4 className="font-bold text-gray-900">Eficiência</h4>
                    <p className="text-sm text-muted-foreground">Relatos diretos para a gestão.</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-4 md:block">
                <BarChart3 className="h-6 w-6 text-primary mb-2 shrink-0" />
                <div>
                    <h4 className="font-bold text-gray-900">Transparência</h4>
                    <p className="text-sm text-muted-foreground">Acompanhamento em tempo real.</p>
                </div>
              </div>
            </div>
          </div>

          <Card className="rounded-2xl border-gray-200 shadow-2xl p-4 md:p-6 bg-gray-50/50">
            <CardHeader className="text-center pb-2 px-2">
                <CardTitle className="text-xl md:text-2xl font-bold flex items-center justify-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  Visão Geral da Cidade
                </CardTitle>
                <p className="text-sm text-muted-foreground">Dados acumulados da plataforma Infra Mais.</p>
            </CardHeader>
            <CardContent className="pt-6 px-2">
                <ReportsChart total={totalReports} resolved={resolvedReports} inProgress={inProgressReports} />
                <div className="mt-8 grid grid-cols-3 gap-2 md:gap-4 text-center">
                  <div className="space-y-1">
                    <p className="text-xl md:text-2xl font-bold text-primary">{totalReports}</p>
                    <p className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl md:text-2xl font-bold text-amber-500">{totalReports - resolvedReports - inProgressReports}</p>
                    <p className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Aberto</p>
                  </div>
                   <div className="space-y-1">
                    <p className="text-xl md:text-2xl font-bold text-emerald-500">{resolvedReports}</p>
                    <p className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Resolvido</p>
                  </div>
                </div>
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
        {/* Hero Section */}
        <section className="relative pt-12 pb-24 md:pt-32 md:pb-48 overflow-hidden bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto space-y-6 md:space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-bold animate-fade-in">
                <Users className="h-4 w-4" />
                Plataforma de Cidadania Ativa
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-gray-900 tracking-tight leading-[1.15] sm:leading-[1.1]">
                Relate um Problema na <br className="hidden sm:block"/><span className="text-primary italic">Sua Cidade</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2">
                Informe um problema de infraestrutura de forma rápida e precisa. Descreva o ocorrido, anexe uma imagem e marque o local no mapa para facilitar a resolução.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 px-4">
                <HomeCtaClient />
                <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto rounded-xl px-8 h-12 md:h-14 text-base md:text-lg font-semibold hover:bg-primary/5">
                  <Link href="/dashboard">Ver Mapa <MapPin className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-20 left-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl opacity-50 md:opacity-100" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50 md:opacity-100" />
          </div>
        </section>
        
        {/* Map Section */}
        <section className="py-12 md:py-24 -mt-12 md:-mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-4 md:p-10 rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 md:mb-8">
                  <div className="space-y-1 text-center md:text-left">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                        Veja os problemas na sua região
                    </h2>
                    <p className="text-muted-foreground text-sm md:text-lg">Mapa de Problemas Reportados pela comunidade.</p>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500" />
                      <span className="text-xs font-medium">Aberto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium">Resolvido</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden shadow-inner border border-gray-100 relative h-[300px] md:h-[500px]">
                  <HomeMapClient reports={publicReports} />
                </div>
            </div>
          </div>
        </section>

        {/* Recent Reports Section */}
        <section className="py-16 md:py-24 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 md:mb-16">
                <div className="space-y-3 text-center md:text-left">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                        Relatos Recentes da Comunidade
                    </h2>
                    <p className="text-muted-foreground text-base md:text-xl max-w-2xl mx-auto md:mx-0">Veja os últimos problemas reportados na sua cidade.</p>
                </div>
                <Button asChild variant="link" className="text-base md:text-lg font-bold text-primary p-0 h-auto group self-center md:self-end">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    Ver todos <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
            </div>
            <RecentReports />
          </div>
        </section>
        
        <AboutSection reports={allReports} />
      </main>
    </div>
  );
}