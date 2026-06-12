
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
import { RecentReportCard } from "@/components/recent-report-card";
import Image from "next/image";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

async function RecentReports() {
  const allReports = await getReports();
  // Exibimos apenas relatórios públicos (ignorando os 'Em Análise') na Home
  const publicReports = allReports.filter(report => report.status !== 'UNDER_REVIEW');
  const recentReports = publicReports.slice(0, 3);

  if (recentReports.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-dashed text-center text-muted-foreground shadow-sm">
        Nenhum problema relatado publicamente recentemente.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {recentReports.map((report) => (
          <RecentReportCard key={report.id} report={report} />
        ))}
      </div>
    </div>
  );
}

function AboutSection({ reports }: { reports: Report[] }) {
  // Visão geral considera apenas relatos públicos
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
                <BarChart3 className="h-6 w-6 text-primary scholar-shrink-0" />
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

export default async function Home(props: { searchParams: Promise<{ lat?: string, lng?: string }> }) {
  const allReports: Report[] = await getReports();
  // Filtramos os relatórios para o mapa não mostrar os "Em Análise"
  const publicReports = allReports.filter(report => report.status !== 'UNDER_REVIEW');
  
  const searchParams = await props.searchParams;
  const lat = searchParams.lat ? parseFloat(searchParams.lat) : null;
  const lng = searchParams.lng ? parseFloat(searchParams.lng) : null;
  const selectedLocation = (lat && lng) ? { lat, lng } : null;

  return (
    <div className="flex flex-col w-full">
      <main>
        <section className="relative pt-12 pb-24 md:pt-32 md:pb-48 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 relative z-10 text-center">
            <h1 className="text-4xl md:text-7xl font-bold text-gray-900 tracking-tight leading-tight">
              Relate um Problema na <br className="hidden sm:block"/><span className="text-primary italic">Sua Cidade</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Informe problemas de infraestrutura de forma rápida e precisa.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10">
              <HomeCtaClient />
              <Button asChild variant="ghost" size="lg" className="rounded-xl px-10 h-14 font-semibold">
                <Link href="/dashboard">Ver Relatos <MapPin className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </section>
        
        <section id="map-section" className="py-12 md:py-24 -mt-12 md:-mt-24 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
            <div className="bg-white p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-2xl border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Mapa dos Relatos</h2>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold uppercase">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pendente</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Em Andamento</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resolvido</div>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden shadow-inner border border-gray-100 h-[350px] md:h-[550px]">
                  <HomeMapClient reports={publicReports} selectedLocation={selectedLocation} />
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
