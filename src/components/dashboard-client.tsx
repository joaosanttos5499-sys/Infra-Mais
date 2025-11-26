
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
import { ThumbsUp, Camera, Upload, Loader2, Filter, Expand } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { statusConfig, StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";

function ReportCreationTime({ date }: { date: Date }) {
    const [timeString, setTimeString] = useState("");

    useEffect(() => {
        setTimeString(format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
    }, [date]);

    if (!timeString) return null;

    return (
        <span className="text-xs text-muted-foreground">
            {timeString}
        </span>
    );
}

function ReportCard({ 
    report,
    onUpvote,
    isUpvoted,
    showUpvote,
}: { 
    report: Report,
    onUpvote: (id: string) => void,
    isUpvoted: boolean,
    showUpvote: boolean
}) {
  const category = getCategory(report.category);
  const problem = category?.problems.find(p => p.value === report.problem);
  const { toast } = useToast();
  const [formState, formAction, isPending] = useActionState(updateReportStatus, undefined);
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

  useEffect(() => {
    if(formState?.success === false && formState.message) {
        toast({
            title: "Erro ao Atualizar",
            description: formState.message,
            variant: "destructive",
        });
    } else if (formState?.success === true && formState.message) {
        toast({
            title: "Sucesso",
            description: formState.message,
        });
        // Clear accordion content after successful update if needed
    }
  }, [formState, toast]);


  return (
    <Card className="overflow-hidden" id={`report-${report.id}`}>
      <CardContent className="p-0">
        <Accordion type="single" collapsible disabled={showUpvote}>
          <AccordionItem value={report.id} className="border-b-0">
            <div className="p-4">
                <div className="grid md:grid-cols-[2fr_1fr] gap-4 md:gap-6">
                <div className="flex flex-col">
                    <div className="flex items-start gap-3 mb-4">
                        {category?.icon && <category.icon className="h-6 w-6 hidden sm:block mt-1 flex-shrink-0" style={{ color: category?.color }} />}
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-lg">{category?.label || report.category}</p>
                                <StatusBadge status={report.status} />
                                <ReportCreationTime date={report.createdAt} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <p className="text-sm font-semibold">Problema:</p>
                            <p className="text-sm text-foreground/80">{problem?.label || report.problem}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Localização:</p>
                            <p className="text-sm text-foreground/80">{report.location}</p>
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Descrição:</p>
                            <p className="text-sm text-foreground/80 line-clamp-3">{report.description}</p>
                        </div>
                    </div>
                </div>

                 <div className="grid grid-cols-2 gap-2 self-start">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className={cn(
                          "aspect-video rounded-lg overflow-hidden relative border shadow-sm cursor-pointer group",
                          report.status === 'RESOLVED' && report.photoAfterUrl ? "col-span-1" : "col-span-2"
                        )}>
                          <Image
                            src={report.photoUrl}
                            alt={`Problema em ${report.location}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 17vw"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center p-1">Antes</div>
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Expand className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl p-2">
                          <DialogHeader>
                            <DialogTitle className="sr-only">Visualização da imagem do problema</DialogTitle>
                          </DialogHeader>
                          <div className="relative aspect-video">
                            <Image
                              src={report.photoUrl}
                              alt={`Problema em ${report.location}`}
                              fill
                              className="object-contain"
                            />
                          </div>
                      </DialogContent>
                    </Dialog>
                    
                    {report.status === 'RESOLVED' && report.photoAfterUrl && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <div className="col-span-1 aspect-video rounded-lg overflow-hidden relative border shadow-sm cursor-pointer group">
                              <Image src={report.photoAfterUrl} alt="Depois" fill className="object-cover" sizes="(max-width: 768px) 50vw, 17vw"/>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center p-1">Depois</div>
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Expand className="h-8 w-8 text-white" />
                              </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl p-2">
                          <DialogHeader>
                            <DialogTitle className="sr-only">Visualização da imagem da solução</DialogTitle>
                          </DialogHeader>
                          <div className="relative aspect-video">
                            <Image
                              src={report.photoAfterUrl}
                              alt="Foto da solução"
                              fill
                              className="object-contain"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                </div>
                <div className="flex justify-end items-center mt-4 px-4 pb-2">
                    {showUpvote ? (
                        <Button variant={isUpvoted ? "default" : "ghost"} size="sm" onClick={() => onUpvote(report.id)}>
                            <ThumbsUp className={cn("h-4 w-4 mr-2", isUpvoted && "fill-current")} />
                            Apoiar ({report.upvotes})
                        </Button>
                    ) : (
                     <AccordionTrigger className="py-2 px-4 text-sm -mr-4">
                       Ver detalhes e atualizar
                    </AccordionTrigger>
                    )}
                </div>
            </div>
            
            {!showUpvote && (
            <AccordionContent className="bg-muted/50">
              <form action={(formData) => formAction({ reportId: report.id, formData })} ref={formRef}>
                <div className="p-6 space-y-4">
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

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
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
                      <Button type="submit" disabled={isPending} className="bg-amber-400 text-black hover:bg-amber-400/90 focus-visible:ring-amber-500 w-full sm:w-auto">
                        {isPending ? <Loader2 className="animate-spin" /> : <Upload />}
                        <span className="ml-2">Atualizar</span>
                      </Button>
                    </div>
                </div>
              </form>
            </AccordionContent>
            )}
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}

function ReportList({ reports, onUpvote, upvotedReports, showUpvote }: { reports: Report[], onUpvote: (id: string) => void, upvotedReports: Set<string>, showUpvote: boolean }) {
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
        <ReportCard key={report.id} report={report} onUpvote={onUpvote} isUpvoted={upvotedReports.has(report.id)} showUpvote={showUpvote} />
      ))}
    </div>
  );
}

type OptimisticUpdate = { type: 'upvote', id: string, amount: 1 | -1 } | { type: 'status', reportId: string, newStatus: ReportStatus };

export function DashboardClient({ reports, showUpvote = true }: { reports: Report[], showUpvote?: boolean }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ReportStatus>("PENDING");
  const [upvotedReports, setUpvotedReports] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'upvotes'>('newest');
  
  const [optimisticReports, setOptimisticReports] = useOptimistic(
    reports,
    (state, update: OptimisticUpdate) => {
      if (update.type === 'upvote') {
          return state.map((r) => (r.id === update.id ? { ...r, upvotes: r.upvotes + update.amount } : r));
      }
       if (update.type === 'status') {
          return state.map((r) => (r.id === update.reportId ? { ...r, status: update.newStatus } : r));
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

  const handleUpvote = (reportId: string) => {
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
        setOptimisticReports({ type: 'upvote', id: reportId, amount: isAlreadyUpvoted ? 1 : -1 });
      }
    });
  }

  const [isUpvotePending, startTransition] = useTransition();
  
  if (reports.length === 0) {
      return (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-semibold">Nenhum Relato Encontrado</h3>
              <p className="text-muted-foreground mt-2">Quando um novo problema for relatado, ele aparecerá aqui.</p>
          </div>
      )
  }

  const sortedReports = [...optimisticReports].sort((a, b) => {
    switch (sortBy) {
      case 'oldest':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'upvotes':
        return b.upvotes - a.upvotes;
      case 'newest':
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const filteredReports = (status: ReportStatus) => sortedReports.filter(r => r.status === status);

  return (
    <>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportStatus)} className="w-full">
          <div className="flex flex-row justify-between items-center mb-4 gap-2">
            <TabsList className="grid flex-1 w-full grid-cols-3 bg-card p-1 rounded-lg">
                <TabsTrigger value="PENDING" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800 data-[state=active]:shadow-md">Pendentes</TabsTrigger>
                <TabsTrigger value="IN_PROGRESS" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 data-[state=active]:shadow-md">Em Andamento</TabsTrigger>
                <TabsTrigger value="RESOLVED" className="data-[state=active]:bg-green-100 data-[state=active]:text-green-800 data-[state=active]:shadow-md">Resolvidos</TabsTrigger>
            </TabsList>
            <div className="flex-shrink-0">
              <Select onValueChange={(value) => setSortBy(value as typeof sortBy)} defaultValue={sortBy}>
                <SelectTrigger className="w-10 h-10 p-0 bg-card">
                    <span className="sr-only">Ordenar por</span>
                    <Filter className="h-4 w-4 mx-auto"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Mais Recentes</SelectItem>
                  <SelectItem value="oldest">Mais Antigos</SelectItem>
                  <SelectItem value="upvotes">Mais Apoiados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <TabsContent value="PENDING">
              <ReportList reports={filteredReports("PENDING")} onUpvote={handleUpvote} upvotedReports={upvotedReports} showUpvote={showUpvote} />
          </TabsContent>
          <TabsContent value="IN_PROGRESS">
              <ReportList reports={filteredReports("IN_PROGRESS")} onUpvote={handleUpvote} upvotedReports={upvotedReports} showUpvote={showUpvote} />
          </TabsContent>
          <TabsContent value="RESOLVED">
              <ReportList reports={filteredReports("RESOLVED")} onUpvote={handleUpvote} upvotedReports={upvotedReports} showUpvote={showUpvote} />
          </TabsContent>
      </Tabs>
    </>
  );
}
