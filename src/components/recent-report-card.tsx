'use client';

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import Image from "next/image";
import { StatusBadge } from "@/components/status-badge";
import { ReportTime } from "@/components/report-time";
import { type Report } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Componente cliente para renderizar um cartão de relato individual na Home.
 * Ajustado para respeitar as cores do tema (claro/escuro) e manter consistência
 * com o estilo do Painel de Problemas.
 */
export function RecentReportCard({ report }: { report: Report }) {
  const router = useRouter();
  const category = getCategory(report.category);
  const problem = category?.problems.find(p => p.value === report.problem);
  
  const handleCardClick = () => {
    router.push(`/dashboard#report-${report.id}`);
  };

  const handleMapClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div 
      className="block group cursor-pointer" 
      onClick={handleCardClick}
    >
      <Card className="overflow-hidden flex flex-col h-full border-border shadow-sm transition-all duration-300 hover:shadow-lg rounded-xl bg-card">
        <div className="relative h-48 w-full">
            <Image
              src={report.photoUrl}
              alt="Foto do problema"
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading="lazy"
            />
            {/* Status no canto superior esquerdo */}
            <div className="absolute top-3 left-3 z-10">
                <StatusBadge status={report.status} />
            </div>

            {/* Ver no mapa no canto superior direito */}
            <div className="absolute top-3 right-3 z-10">
                <Link 
                  href={`/?lat=${report.latitude}&lng=${report.longitude}#map-section`} 
                  className="bg-background/80 backdrop-blur-sm text-primary p-2 rounded-full shadow-lg hover:bg-background transition-all hover:scale-110 flex items-center justify-center border border-border/50"
                  onClick={handleMapClick}
                  title="Ver no mapa"
                >
                    <MapPin className="h-4 w-4" />
                </Link>
            </div>
        </div>

        <div className="p-5 flex flex-col flex-grow space-y-4">
            <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground line-clamp-2">
                    {problem?.label || report.problem}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {category?.icon && <category.icon className="h-4 w-4" style={{ color: category.color }} />}
                    <span>{category?.label || report.category}</span>
                </div>
            </div>

            <div className="mt-auto pt-2 flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <ReportTime date={new Date(report.createdAt)} />
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">
                    Detalhes <ChevronRight className="h-4 w-4" />
                </div>
            </div>
        </div>
      </Card>
    </div>
  );
}
