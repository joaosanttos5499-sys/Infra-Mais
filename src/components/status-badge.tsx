
import { Badge } from "@/components/ui/badge";
import { type ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, TrafficCone, Wrench, Trash2, ShieldAlert } from "lucide-react";

export const statusConfig: Record<
  ReportStatus,
  { label: string; className: string; icon: any }
> = {
  UNDER_REVIEW: {
    label: "Em Análise",
    className: "bg-slate-500 text-white border-transparent hover:bg-slate-600",
    icon: Clock
  },
  PENDING: {
    label: "Pendente",
    className: "bg-amber-500 text-white border-transparent hover:bg-amber-600",
    icon: TrafficCone
  },
  IN_PROGRESS: {
    label: "Em Andamento",
    className: "bg-primary text-white border-transparent hover:brightness-110",
    icon: Wrench
  },
  RESOLVED: {
    label: "Resolvido",
    className: "bg-emerald-600 text-white border-transparent hover:bg-emerald-700",
    icon: CheckCircle2
  },
  EXCLUDED: {
    label: "Excluído",
    className: "bg-red-500 text-white border-transparent hover:bg-red-600",
    icon: Trash2
  },
};

export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider shadow-sm gap-1 flex items-center shrink-0", config.className, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
