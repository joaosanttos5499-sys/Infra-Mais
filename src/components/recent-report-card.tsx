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
import { memo } from "react";

interface RecentReportCardProps {
  report: Report;
  priority?: boolean;
}

/**
 * Componente cliente para renderizar um cartão de relato individual na Home.
 * Memoizado para evitar re-renderizações desnecessárias em listas.
 */
function RecentReportCardComponent({ report, priority = false }: RecentReportCardProps) {
  const router = useRouter();
  const category = getCategory(report.category);
  const problem = category?.problems.find(p => p.value === report.problem);
  const displayCity = report.city === 'Picui' ? 'Picuí' : report.city;
  
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
        <div className="relative h-48 w-full bg-muted">
            <Image
              src={report.photoUrl}
              alt="Foto do problema"
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading={priority ? "eager" : "lazy"}
              priority={priority}
            />
            <div className="absolute top-3 left-3 z-10">
                <StatusBadge status={report.status} />
            </div>

            <div className="absolute top-3 right-3 z-10">
                <Link 
                  href={`/?lat=${report.latitude}&lng=${report.longitude}#map-section`} 
                  className="bg-background/80 backdrop-blur-sm text-primary p-2 rounded-full shadow-lg hover:bg-background transition-all hover:scale-110 flex items-center justify-center border border-border/50"
                  onClick={handleMapClick}
                  title="Ver no Mapa"
                >
                    <MapPin className="h-4 w-4" />
                </Link>
            </div>
        </div>

        <div className="p-5 flex flex-col flex-grow space-y-4">
            <div className="space-y-3">
                <h3 className="text-lg font-bold text-foreground line-clamp-2 leading-tight">
                    {problem?.label || report.problem}
                </h3>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                        {category?.icon && <category.icon className="h-4 w-4 shrink-0" style={{ color: category.color }} />}
                        <span className="truncate">{category?.label || report.category}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                        <MapPin className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate">{displayCity} - {report.bairro}</span>
                    </div>
                </div>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between border-t border-border">
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

export const RecentReportCard = memo(RecentReportCardComponent);
