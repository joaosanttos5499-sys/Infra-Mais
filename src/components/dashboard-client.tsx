"use client";

import { useOptimistic, useState, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusConfig: Record<ReportStatus, { label: string; className: string }> = {
  PENDING: { label: "Pendente", className: "bg-orange-100 text-orange-800 border-orange-200" },
  IN_PROGRESS: { label: "Em Andamento", className: "bg-blue-100 text-blue-800 border-blue-200" },
  RESOLVED: { label: "Resolvido", className: "bg-green-100 text-green-800 border-green-200" },
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
                  <p className="text-sm text-muted-foreground">{report.bairro} - {report.location}</p>
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
                    <h4 className="font-semibold text-sm mb-1">Resumo da IA</h4>
                    <p className="text-sm text-foreground/80">{report.summary}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Descrição Completa</h4>
                    <p className="text-sm text-foreground/80">{report.description}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">Relatado</h4>
                     <p className="text-sm text-foreground/80" title={format(report.createdAt, "PPPppp")}>
                        {formatDistanceToNow(report.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Atualizar Status</h4>
                    <Select
                        defaultValue={report.status}
                        onValueChange={(value: ReportStatus) => onStatusChange(report.id, value)}
                    >
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="Mudar status" />
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
                      alt={`Problema em ${report.location}`}
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

function ReportList({ reports, onStatusChange }: { reports: Report[], onStatusChange: (id: string, status: ReportStatus) => void }) {
    if (reports.length === 0) {
      return (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-semibold">Nenhum Relato Encontrado</h3>
              <p className="text-muted-foreground mt-2">Nenhum relatório corresponde a este status.</p>
          </div>
      )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} onStatusChange={onStatusChange} />
      ))}
    </div>
  );
}

export function DashboardClient({ reports }: { reports: Report[] }) {
  const { toast } = useToast();
  
  const [optimisticReports, setOptimisticReports] = useOptimistic(
    reports,
    (state, { id, status }: { id: string; status: ReportStatus }) => {
      const newState = state.map((r) => (r.id === id ? { ...r, status } : r));
      return newState.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
  );

  const handleStatusChange = async (reportId: string, status: ReportStatus) => {
    setOptimisticReports({ id: reportId, status });
    const result = await updateReportStatus(reportId, status);
    if (!result?.success) {
      toast({
        title: "Falha na Atualização",
        description: result.message || "Não foi possível atualizar o status do relatório.",
        variant: "destructive",
      });
      // Revert optimistic update is handled automatically on re-render from server
    } else {
        toast({
            title: "Status Atualizado",
            description: `Status do relatório alterado para "${statusConfig[status].label}".`,
        });
    }
  };
  
  if (reports.length === 0) {
      return (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-semibold">Nenhum Relato Encontrado</h3>
              <p className="text-muted-foreground mt-2">Quando um novo problema for relatado, ele aparecerá aqui.</p>
          </div>
      )
  }

  const filteredReports = (status: ReportStatus) => optimisticReports.filter(r => r.status === status);

  return (
    <Tabs defaultValue="PENDING" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="PENDING">Pendentes</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS">Em Andamento</TabsTrigger>
            <TabsTrigger value="RESOLVED">Resolvidos</TabsTrigger>
        </TabsList>
        <TabsContent value="PENDING">
            <ReportList reports={filteredReports("PENDING")} onStatusChange={handleStatusChange} />
        </TabsContent>
        <TabsContent value="IN_PROGRESS">
            <ReportList reports={filteredReports("IN_PROGRESS")} onStatusChange={handleStatusChange} />
        </TabsContent>
        <TabsContent value="RESOLVED">
            <ReportList reports={filteredReports("RESOLVED")} onStatusChange={handleStatusChange} />
        </TabsContent>
    </Tabs>
  );
}
