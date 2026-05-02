import { Badge } from "@/components/ui/badge";
import { type ReportStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export const statusConfig: Record<
  ReportStatus,
  { label: string; className: string }
> = {
  UNDER_REVIEW: {
    label: "Em Análise",
    className: "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-100",
  },
  PENDING: {
    label: "Em aberto",
    className: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100",
  },
  IN_PROGRESS: {
    label: "Em Andamento",
    className: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
  },
  RESOLVED: {
    label: "Resolvido",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
  },
};

export function StatusBadge({ status }: { status: ReportStatus }) {
  const { label, className } = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider", className)}>
      {label}
    </Badge>
  );
}