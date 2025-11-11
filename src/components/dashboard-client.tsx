"use client";

import { useOptimistic, useState } from "react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import { updateReportStatus, upvoteReportAction } from "@/lib/actions";
import { type Report, type ReportStatus } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { ThumbsUp } from "lucide-react";

const statusConfig: Record<ReportStatus, { label: string; className: string }> = {
  PENDING: { label: "Pendente", className: "bg-orange-100 text-orange-800 border-orange-200" },
  IN_PROGRESS: { label: "Em Andamento", className: "bg-blue-100 text-blue-800 border-blue-200" },
  RESOLVED: { label: "Resolvido", className: "bg-green-100 text-green-800 border-green-200" },
};

function StatusBadge({ status }: { status: ReportStatus }) {
  const { label, className } = statusConfig[status];
  return <Badge variant="outline" className={cn("font-semibold", className)}>{label}</Badge>;
}

function ReportCard({ 
    report, 
    onStatusChange,
    onUpvote 
}: { 
    report: Report, 
    onStatusChange: (id: string, status: ReportStatus) => void,
    onUpvote: (id: string) => void
}) {
  const category = getCategory(report.category);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <Accordion type="single" collapsible>
          <AccordionItem value={report.id} className="border-b-0">
            <div className="p-4">
                <div className="grid md:grid-cols-[2fr_1fr] gap-4">
                <div className="flex flex-col justify-between">
                    <div>
                    <div className="flex items-center gap-3 mb-2">
                        {category?.icon && <category.icon className="h-6 w-6 text-primary hidden sm:block" />}
                        <div className="flex-1">
                        <p className="font-semibold">{category?.label || report.category}</p>
                        <p className="text-sm text-muted-foreground">{report.bairro} - {report.location}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <StatusBadge status={report.status} />
                    </div>
                    </div>
                    <div className="mt-4">
                        <p className="text-sm text-foreground/80">{report.summary}</p>
                    </div>
                </div>
                <div className="aspect-video rounded-lg overflow-hidden relative border shadow-sm self-start">
                    <Image
                        src={report.photoUrl}
                        alt={`Problema em ${report.location}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        />
                    </div>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <Button variant="ghost" size="sm" onClick={() => onUpvote(report.id)}>
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Apoiar ({report.upvotes})
                    </Button>
                    <AccordionTrigger className="p-2 w-auto hover:bg-accent rounded-md [&[data-state=open]>svg]:text-accent">
                        <span className="text-sm mr-1">Detalhes</span>
                    </AccordionTrigger>
                </div>
            </div>

            <AccordionContent className="bg-muted/50">
              <div className="p-6 space-y-4">
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ReportList({ reports, onStatusChange, onUpvote }: { reports: Report[], onStatusChange: (id: string, status: ReportStatus) => void, onUpvote: (id: string) => void }) {
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
        <ReportCard key={report.id} report={report} onStatusChange={onStatusChange} onUpvote={onUpvote} />
      ))}
    </div>
  );
}

type OptimisticUpdate = 
    | { type: 'status', id: string; status: ReportStatus }
    | { type: 'upvote', id: string }

export function DashboardClient({ reports }: { reports: Report[] }) {
  const { toast } = useToast();
  
  const [optimisticReports, setOptimisticReports] = useOptimistic(
    reports,
    (state, update: OptimisticUpdate) => {
      if (update.type === 'status') {
          const newState = state.map((r) => (r.id === update.id ? { ...r, status: update.status } : r));
          return newState.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      if (update.type === 'upvote') {
          const newState = state.map((r) => (r.id === update.id ? { ...r, upvotes: r.upvotes + 1 } : r));
          return newState;
      }
      return state;
    }
  );

  const handleStatusChange = async (reportId: string, status: ReportStatus) => {
    setOptimisticReports({ type: 'status', id: reportId, status });
    const result = await updateReportStatus(reportId, status);
    if (!result?.success) {
      toast({
        title: "Falha na Atualização",
        description: result.message || "Não foi possível atualizar o status do relatório.",
        variant: "destructive",
      });
    } else {
        toast({
            title: "Status Atualizado",
            description: `Status do relatório alterado para "${statusConfig[status].label}".`,
        });
    }
  };

  const handleUpvote = async (reportId: string) => {
      setOptimisticReports({ type: 'upvote', id: reportId });
      const result = await upvoteReportAction(reportId);
      if (!result?.success) {
          toast({
              title: "Falha ao Apoiar",
              description: result.message || "Não foi possível registrar seu apoio.",
              variant: "destructive",
          });
      }
  }
  
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
            <ReportList reports={filteredReports("PENDING")} onStatusChange={handleStatusChange} onUpvote={handleUpvote} />
        </TabsContent>
        <TabsContent value="IN_PROGRESS">
            <ReportList reports={filteredReports("IN_PROGRESS")} onStatusChange={handleStatusChange} onUpvote={handleUpvote}/>
        </TabsContent>
        <TabsContent value="RESOLVED">
            <ReportList reports={filteredReports("RESOLVED")} onStatusChange={handleStatusChange} onUpvote={handleUpvote}/>
        </TabsContent>
    </Tabs>
  );
}