import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, MapPin, BarChart3, Clock, Camera, Info, Loader2 } from "lucide-react";
import { getReports } from "@/lib/data";
import { type Report } from "@/lib/types";
import { HomeMapClient } from "@/components/home-map-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportsChart } from "@/components/reports-chart";
import { HomeCtaClient } from "@/components/home-cta-client";
import { RecentReportCard } from "@/components/recent-report-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import Image from "next/image";

async function RecentReports({ reports }: { reports: Report[] }) {
  const publicReports = reports.filter(report => report.status !== 'UNDER_REVIEW' && report.status !== 'EXCLUDED');
  const recentReports = publicReports.slice(0, 3);

  if (recentReports.length === 0) {
    return (
      <div className="bg-card p-12 rounded-2xl border border-dashed text-center text-muted-foreground shadow-sm">
        Nenhum problema relatado publicamente recentemente.
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {recentReports.map((report, index) => (
          <RecentReportCard key={report.id} report={report} priority={index === 0} />
        ))}
      </div>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-md hover:border-primary/30 hover:shadow-lg transition-all duration-300 group flex flex-col h-full overflow-hidden">
      <div className="flex flex-col items-center md:items-start text-center md:text-left gap-y-3">
        <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-1 w-full">
          <h4 className="font-bold text-foreground text-base leading-tight break-words">{title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed break-words">{description}</p>
        </div>
      </div>
    </div>
  );
}

function IndicatorItem({ label, value, colorClass }: { label: string, value: number, colorClass: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50 hover:bg-muted/40 transition-colors">
      <div className="flex items-center gap-3">
        <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", colorClass)} />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-sm font-black text-foreground">{value}</span>
    </div>
  );
}

function AboutSection({ reports }: { reports: Report[] }) {
  const stats = {
    underReview: reports.filter(r => r.status === 'UNDER_REVIEW').length,
    pending: reports.filter(r => r.status === 'PENDING').length,
    inProgress: reports.filter(r => r.status === 'IN_PROGRESS').length,
    resolved: reports.filter(r => r.status === 'RESOLVED').length,
  };

  const total = stats.underReview + stats.pending + stats.inProgress + stats.resolved;

  return (
    <section className="py-20 md:py-32 bg-background border-t border-border animate-in fade-in duration-700">
      <div className="max-w-[1750px] mx-auto px-8 sm:px-12 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-16 items-end">
          <div className="flex flex-col space-y-12">
            <div className="space-y-6">
              <h2 className="text-4xl md:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tight text-center md:text-left">
                Infra Mais: <br />
                <span className="text-primary">tecnologia para uma cidade melhor</span>
              </h2>
              <div className="space-y-10 text-base md:text-lg text-muted-foreground leading-relaxed text-center md:text-left max-w-xl">
                <p>
                  O Infra Mais permite registrar, acompanhar e visualizar problemas de infraestrutura urbana de forma simples, transparente e acessível. 
                  Por meio de relatos geolocalizados, evidências visuais e acompanhamento em tempo real, a plataforma aproxima a população da identificação e da solução dos problemas da cidade. 
                </p>
                <p className="font-bold text-primary pt-2">
                  Sua participação faz a diferença na melhoria da cidade.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <BenefitCard 
                icon={MapPin} 
                title="Geolocalização" 
                description="Localização precisa dos relatos." 
              />
              <BenefitCard 
                icon={BarChart3} 
                title="Transparência" 
                description="Atualizações em tempo real." 
              />
              <BenefitCard 
                icon={Camera} 
                title="Evidência" 
                description="Envio de imagens para análise." 
              />
            </div>
          </div>

          <Card className="rounded-3xl border-border shadow-2xl p-6 md:p-10 bg-card overflow-hidden relative w-full lg:max-w-[600px] ml-auto">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
            <CardHeader className="text-center pb-16 md:pb-20 p-0">
                <CardTitle className="text-xl md:text-2xl font-bold flex items-center justify-center gap-3 text-foreground">
                  <BarChart3 className="h-6 w-6 text-primary" /> Panorama dos Relatos
                </CardTitle>
            </CardHeader>
            <CardContent className="px-2 space-y-10">
                <div className="grid md:grid-cols-2 gap-10 items-center">
                    <div className="space-y-2">
                        <ReportsChart 
                          total={total} 
                          underReview={stats.underReview}
                          pending={stats.pending} 
                          inProgress={stats.inProgress} 
                          resolved={stats.resolved} 
                        />
                    </div>
                    
                    <div className="space-y-3">
                        <IndicatorItem label="Em Análise" value={stats.underReview} colorClass="bg-slate-400" />
                        <IndicatorItem label="Pendentes" value={stats.pending} colorClass="bg-amber-500" />
                        <IndicatorItem label="Em Andamento" value={stats.inProgress} colorClass="bg-primary" />
                        <IndicatorItem label="Resolvidos" value={stats.resolved} colorClass="bg-emerald-500" />
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

export default async function Home(props: { searchParams: Promise<{ lat?: string; lng?: string }> }) {
  const reports = await getReports();
  const searchParams = await props.searchParams;
  
  const latParam = searchParams.lat;
  const lngParam = searchParams.lng;
  const lat = latParam ? parseFloat(latParam) : null;
  const lng = lngParam ? parseFloat(lngParam) : null;
  const selectedLocation = (lat && lng) ? { lat, lng } : null;

  const publicReports = reports.filter(report => report.status !== 'UNDER_REVIEW' && report.status !== 'EXCLUDED');

  return (
    <div className="flex flex-col w-full bg-background">
      <main>
        <section className="relative pt-12 pb-24 md:pt-32 md:pb-48 bg-gradient-to-b from-primary/10 to-transparent overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10" />
          <div className="max-w-[1750px] mx-auto px-8 sm:px-12 lg:px-20 relative z-10 text-center">
            <h1 className="text-4xl md:text-7xl font-bold text-foreground tracking-tight leading-[1.1] animate-in slide-in-from-top-4 duration-700">
              Relate um Problema na <br className="hidden sm:block"/><span className="text-primary italic">Sua Cidade</span>
            </h1>
            <p className="mt-12 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-in fade-in duration-1000">
              Informe problemas de infraestrutura de forma rápida e precisa.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-in slide-in-from-bottom-4 duration-700">
              <HomeCtaClient />
              <Button asChild variant="ghost" size="lg" className="rounded-xl px-10 h-14 font-semibold text-foreground hover:bg-primary/5 transition-all">
                <Link href="/dashboard">Ver Relatos <MapPin className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </div>
        </section>
        
        <section id="map-section" className="py-12 md:py-24 -mt-12 md:-mt-24 scroll-mt-20">
          <div className="max-w-[1750px] mx-auto px-8 sm:px-12 lg:px-20">
            <div className="bg-card p-4 md:p-8 rounded-2xl md:rounded-[40px] shadow-2xl border border-border">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">Mapa dos Relatos</h2>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-bold uppercase text-muted-foreground">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Pendente</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> Em Andamento</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Resolvido</div>
                  </div>
                </div>
                <div className="rounded-2xl overflow-hidden shadow-inner border border-border h-[350px] md:h-[550px] min-h-[350px] md:min-h-[550px] relative">
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center bg-muted animate-pulse">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                  }>
                    <HomeMapClient reports={publicReports} selectedLocation={selectedLocation} />
                  </Suspense>
                </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-32 bg-secondary/20">
          <div className="max-w-[1750px] mx-auto px-8 sm:px-12 lg:px-20">
            <div className="flex items-end justify-between mb-8">
                <div className="space-y-2">
                    <h2 className="text-3xl md:text-4xl font-bold text-foreground">Relatos Recentes</h2>
                </div>
                <Button asChild variant="link" className="font-bold text-primary p-0 group hidden sm:flex">
                  <Link href="/dashboard" className="flex items-center gap-2">
                    Ver todos <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
            </div>
            <Separator className="mb-12 bg-border/50" />
            
            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl" />
              </div>
            }>
              <RecentReports reports={reports} />
            </Suspense>

            <div className="mt-8 flex justify-center sm:hidden">
              <Button asChild variant="outline" className="w-full h-12 rounded-xl font-bold">
                <Link href="/dashboard">Ver todos os relatos</Link>
              </Button>
            </div>
          </div>
        </section>
        
        <AboutSection reports={reports} />
      </main>
    </div>
  );
}
