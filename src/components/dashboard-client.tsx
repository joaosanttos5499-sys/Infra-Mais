
"use client";

import { useOptimistic, useState, useRef, useActionState, useEffect, useTransition } from "react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { updateReportStatus, upvoteReportAction, downvoteReportAction } from "@/lib/actions";
import { type Report, type ReportStatus } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { ThumbsUp, Camera, Upload, Loader2 } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { statusConfig, StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";


function ReportCard({ 
    report,
    onUpvote,
    isUpvoted
}: { 
    report: Report,
    onUpvote: (id: string) => void,
    isUpvoted: boolean
}) {
  const category = getCategory(report.category);
  const { toast } = useToast();
  const [formState, formAction, isPending] = useActionState(updateReportStatus, undefined, report.id);
  const formRef = useRef<HTMLFormElement>(null);
  const [photoAfterPreview, setPhotoAfterPreview] = useState<string | null>(null);

   const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoAfterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoAfterPreview(null);
    }
  };


  return (
    <Card className="overflow-hidden" id={`report-${report.id}`}>
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

                {report.status === 'RESOLVED' ? (
                     <div className="grid grid-cols-2 gap-2 self-start">
                        <div className="aspect-video rounded-lg overflow-hidden relative border shadow-sm">
                            <Image src={report.photoUrl} alt="Antes" fill className="object-cover" sizes="(max-width: 768px) 50vw, 17vw"/>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center p-1">Antes</div>
                        </div>
                        <div className="aspect-video rounded-lg overflow-hidden relative border shadow-sm">
                            <Image src={report.photoAfterUrl || 'https://picsum.photos/seed/resolved-placeholder/400/300'} alt="Depois" fill className="object-cover" sizes="(max-width: 768px) 50vw, 17vw"/>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center p-1">Depois</div>
                        </div>
                    </div>
                ) : (
                    <div className="aspect-video rounded-lg overflow-hidden relative border shadow-sm self-start">
                        <Image
                            src={report.photoUrl}
                            alt={`Problema em ${report.location}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 33vw"
                            />
                    </div>
                )}
                </div>
                <div className="flex justify-between items-center mt-4">
                    <Button variant={isUpvoted ? "default" : "ghost"} size="sm" onClick={() => onUpvote(report.id)}>
                        <ThumbsUp className={cn("h-4 w-4 mr-2", isUpvoted && "fill-current")} />
                        Apoiar ({report.upvotes})
                    </Button>
                </div>
            </div>

            <AccordionContent className="bg-muted/50">
              <form action={formAction} ref={formRef}>
                <div className="p-6 space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Descrição Completa</h4>
                        <p className="text-sm text-foreground/80">{report.description}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Relatado</h4>
                        <p className="text-sm text-foreground/80" title={format(report.createdAt, "PPPppp", { locale: ptBR })}>
                            {formatDistanceToNow(report.createdAt, { addSuffix: true, locale: ptBR })}
                        </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`photoAfter-${report.id}`}>Foto da Solução (Opcional)</Label>
                      <div className="aspect-video rounded-md border border-dashed flex items-center justify-center relative overflow-hidden bg-muted/80">
                          {(photoAfterPreview || report.photoAfterUrl) ? (
                              <Image src={photoAfterPreview || report.photoAfterUrl!} alt="Pré-visualização da foto da solução" fill className="object-cover" />
                          ) : (
                              <div className="text-center text-muted-foreground p-4">
                                  <Camera className="mx-auto h-10 w-10" />
                                  <p className="mt-2 text-xs">Carregar foto do "depois"</p>
                              </div>
                          )}
                      </div>
                      <Input id={`photoAfter-${report.id}`} name="photoAfter" type="file" accept="image/*" className="file:text-primary file:font-semibold text-xs" onChange={handlePhotoChange} />
                    </div>

                    <div className="flex items-end gap-4">
                      <div className="space-y-2 flex-1">
                          <Label htmlFor={`status-${report.id}`}>Atualizar Status</Label>
                          <Select name="status" defaultValue={report.status}>
                              <SelectTrigger id={`status-${report.id}`} className="bg-background">
                                  <SelectValue placeholder="Mudar status" />
                              </SelectTrigger>
                              <SelectContent>
                                  {Object.entries(statusConfig).map(([key, { label }]) => (
                                      <SelectItem key={key} value={key}>{label}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                      <Button type="submit" disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : <Upload />}
                        <span className="ml-2">Atualizar</span>
                      </Button>
                    </div>
                </div>
              </form>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ReportList({ reports, onUpvote, upvotedReports }: { reports: Report[], onUpvote: (id: string) => void, upvotedReports: Set<string> }) {
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
        <ReportCard key={report.id} report={report} onUpvote={onUpvote} isUpvoted={upvotedReports.has(report.id)} />
      ))}
    </div>
  );
}

type OptimisticUpdate = 
    | { type: 'status', id: string; status: ReportStatus, photoAfterUrl?: string }
    | { type: 'upvote', id: string, amount: 1 | -1 }

export function DashboardClient({ reports }: { reports: Report[] }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ReportStatus>("PENDING");
  const [upvotedReports, setUpvotedReports] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  
  const [optimisticReports, setOptimisticReports] = useOptimistic(
    reports,
    (state, update: OptimisticUpdate) => {
      if (update.type === 'status') {
          const newState = state.map((r) => 
            (r.id === update.id 
                ? { ...r, status: update.status, photoAfterUrl: update.photoAfterUrl || r.photoAfterUrl } 
                : r
            ));
          return newState.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
      if (update.type === 'upvote') {
          const newState = state.map((r) => (r.id === update.id ? { ...r, upvotes: r.upvotes + update.amount } : r));
          return newState;
      }
      return state;
    }
  );

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const reportId = hash.replace("#report-", "");
      const report = reports.find(r => r.id === reportId);
      if (report) {
        setActiveTab(report.status);
        setTimeout(() => {
          const element = document.getElementById(hash.substring(1));
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
            setTimeout(() => {
                 element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
            }, 3000);
          }
        }, 100);
      }
    }
  }, [reports]);

  const handleUpvote = async (reportId: string) => {
    startTransition(async () => {
      const isAlreadyUpvoted = upvotedReports.has(reportId);
      const newUpvotedReports = new Set(upvotedReports);
      let result;

      if (isAlreadyUpvoted) {
        newUpvotedReports.delete(reportId);
        setOptimisticReports({ type: 'upvote', id: reportId, amount: -1 });
        result = await downvoteReportAction(reportId);
      } else {
        newUpvotedReports.add(reportId);
        setOptimisticReports({ type: 'upvote', id: reportId, amount: 1 });
        result = await upvoteReportAction(reportId);
      }
      
      setUpvotedReports(newUpvotedReports);
      
      if (!result?.success) {
        toast({
          title: "Falha ao Apoiar",
          description: result.message || "Não foi possível registrar seu apoio.",
          variant: "destructive",
        });
        // Revert local state if server fails
        setUpvotedReports(upvotedReports);
      }
    });
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
    <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportStatus)} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-card p-1 rounded-lg">
            <TabsTrigger value="PENDING" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800 data-[state=active]:shadow-md">Pendentes</TabsTrigger>
            <TabsTrigger value="IN_PROGRESS" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:shadow-md">Em Andamento</TabsTrigger>
            <TabsTrigger value="RESOLVED" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:shadow-md">Resolvidos</TabsTrigger>
        </TabsList>
        <TabsContent value="PENDING">
            <ReportList reports={filteredReports("PENDING")} onUpvote={handleUpvote} upvotedReports={upvotedReports} />
        </TabsContent>
        <TabsContent value="IN_PROGRESS">
            <ReportList reports={filteredReports("IN_PROGRESS")} onUpvote={handleUpvote} upvotedReports={upvotedReports} />
        </TabsContent>
        <TabsContent value="RESOLVED">
            <ReportList reports={filteredReports("RESOLVED")} onUpvote={handleUpvote} upvotedReports={upvotedReports} />
        </TabsContent>
    </Tabs>
  );
}
