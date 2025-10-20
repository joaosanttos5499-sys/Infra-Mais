"use client";

import { useOptimistic } from "react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import { updateReportStatus } from "@/lib/actions";
import { type Report, type ReportStatus } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<ReportStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-orange-100 text-orange-800 border-orange-200" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-100 text-blue-800 border-blue-200" },
  RESOLVED: { label: "Resolved", className: "bg-green-100 text-green-800 border-green-200" },
};

function StatusBadge({ status }: { status: ReportStatus }) {
  const { label, className } = statusConfig[status];
  return <Badge variant="outline" className={cn("font-semibold", className)}>{label}</Badge>;
}

function ReportCard({ report, onStatusChange }: { report: Report, onStatusChange: (id: string, status: ReportStatus) => void }) {
  const category = getCategory(report.category);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Accordion type="single" collapsible>
          <AccordionItem value={report.id} className="border-b-0">
            <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                {category?.icon && <category.icon className="h-6 w-6 text-primary hidden sm:block" />}
                <div className="flex-1">
                  <p className="font-semibold">{category?.label || report.category}</p>
                  <p className="text-sm text-muted-foreground">{report.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <StatusBadge status={report.status} />
                <AccordionTrigger className="p-2 hover:bg-accent rounded-md [&[data-state=open]>svg]:text-accent" />
              </div>
            </div>
            <AccordionContent className="bg-muted/50">
              <div className="grid md:grid-cols-2 gap-6 p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-1">AI Summary</h4>
                    <p className="text-sm text-foreground/80">{report.summary}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Full Description</h4>
                    <p className="text-sm text-foreground/80">{report.description}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Reported</h4>
                     <p className="text-sm text-foreground/80" title={format(report.createdAt, "PPPppp")}>
                        {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Update Status</h4>
                    <Select
                        defaultValue={report.status}
                        onValueChange={(value: ReportStatus) => onStatusChange(report.id, value)}
                    >
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(statusConfig).map(([key, { label }]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="aspect-video rounded-lg overflow-hidden relative border shadow-sm">
                   <Image
                      src={report.photoUrl}
                      alt={`Issue at ${report.location}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

export function DashboardClient({ reports }: { reports: Report[] }) {
  const { toast } = useToast();
  const [optimisticReports, setOptimisticReports] = useOptimistic(
    reports,
    (state, { id, status }: { id: string; status: ReportStatus }) => {
      return state.map((r) => (r.id === id ? { ...r, status } : r));
    }
  );

  const handleStatusChange = async (reportId: string, status: ReportStatus) => {
    setOptimisticReports({ id: reportId, status });
    const result = await updateReportStatus(reportId, status);
    if (!result?.success) {
      toast({
        title: "Update Failed",
        description: result.message || "Could not update the report status.",
        variant: "destructive",
      });
      // Revert optimistic update is handled automatically on re-render from server
    } else {
        toast({
            title: "Status Updated",
            description: `Report status changed to "${statusConfig[status].label}".`,
        });
    }
  };
  
  if (optimisticReports.length === 0) {
      return (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-semibold">No Reports Found</h3>
              <p className="text-muted-foreground mt-2">When a new issue is reported, it will appear here.</p>
          </div>
      )
  }

  return (
    <div className="space-y-4">
      {optimisticReports.map((report) => (
        <ReportCard key={report.id} report={report} onStatusChange={handleStatusChange} />
      ))}
    </div>
  );
}
