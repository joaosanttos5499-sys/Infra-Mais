import { Badge } from "@/components/ui/badge";
import { type ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const statusConfig: Record<
  ReportStatus,
  { label: string; className: string }
> = {
  UNDER_REVIEW: {
    label: "Em Análise",
    className: "bg-slate-500 text-white border-transparent hover:bg-slate-600",
  },
  PENDING: {
    label: "Pendente",
    className: "bg-amber-500 text-white border-transparent hover:bg-amber-600",
  },
  IN_PROGRESS: {
    label: "Em Andamento",
    className: "bg-primary text-white border-transparent hover:brightness-110",
  },
  RESOLVED: {
    label: "Resolvido",
    className: "bg-emerald-600 text-white border-transparent hover:bg-emerald-700",
  },
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { label, className } = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider shadow-sm", className)}>
      {label}
    </Badge>
  );
}
