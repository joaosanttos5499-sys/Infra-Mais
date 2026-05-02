
"use client";

import { useOptimistic, useState, useRef, useActionState, useEffect, useTransition, startTransition } from "react";
import Image from "next/image";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { updateReportStatus, upvoteReportAction, downvoteReportAction, deleteReportAction } from "@/lib/actions";
import { type Report, type ReportStatus } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { ThumbsUp, Camera, Upload, Loader2, Filter, Expand, Trash2, MapPin, Settings2 } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { statusConfig, StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useUser } from "@/firebase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useRouter } from "next/navigation";

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
    onStatusUpdate,
    isUpvoted,
    showUpvote,
}: { 
    report: Report,
    onUpvote: (id: string) => void,
    onStatusUpdate?: (id: string, newStatus: ReportStatus) => void,
    isUpvoted: boolean,
    showUpvote: boolean
}) {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const category = getCategory(report.category);
  const problem = category?.problems.find(p => p.value === report.problem);
  
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [statusCountdown, setStatusCountdown] = useState(3);
  const [isStatusConfirmEnabled, setIsStatusConfirmEnabled] = useState(false);

  const [formState, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
    const status = formData.get("status") as ReportStatus;
    if (onStatusUpdate) onStatusUpdate(report.id, status);
    return updateReportStatus(prev, { reportId: report.id, formData });
  }, undefined);

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
        if (formRef.current) formRef.current.reset();
        setPhotoAfterPreview(null);
        setIsStatusConfirmOpen(false);
    }
  }, [formState, toast]);

  useEffect(() => {
    if (isStatusConfirmOpen) {
      setIsStatusConfirmEnabled(false);
      setStatusCountdown(3);
      
      const countdownInterval = setInterval(() => {
        setStatusCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const enableTimeout = setTimeout(() => {
        setIsStatusConfirmEnabled(true);
      }, 3000);

      return () => {
        clearInterval(countdownInterval);
        clearTimeout(enableTimeout);
      };
    }
  }, [isStatusConfirmOpen]);

  const handleDelete = async () => {
    startDeleteTransition(async () => {
        const result = await deleteReportAction(report.id);
        if (result.success) {
            toast({ title: "Relatório excluído", description: "O problema foi removido com sucesso." });
            router.refresh();
        } else {
            toast({ variant: "destructive", title: "Erro ao excluir", description: result.message });
        }
    });
  };

  const isOwner = user?.uid === report.userId;
  const canDelete = isOwner && report.status === 'UNDER_REVIEW';
  const displayCity = report.city === 'Picui' ? 'Picuí' : report.city;

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
                                <ReportCreationTime date={new Date(report.createdAt)} />
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
                            <div className="flex items-center gap-1 text-sm text-foreground/80">
                                <MapPin className="h-3 w-3" />
                                <span>{displayCity} - {report.bairro}</span>
                            </div>
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
                           {report.status === 'RESOLVED' && report.photoAfterUrl && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center p-1">Antes</div>
                          )}
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
                <div className="flex justify-between items-center mt-4 px-4 pb-2">
                    <div>
                        {canDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                        Excluir
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Relatório?</AlertDialogTitle>
                                        <AlertDialogDescription asChild>
                                            <div className="pt-2">Você tem certeza que deseja excluir este relatório? Esta ação não pode ser desfeita.</div>
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                            Sim, excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {showUpvote ? (
                            <Button variant={isUpvoted ? "default" : "ghost"} size="sm" onClick={() => onUpvote(report.id)}>
                                <ThumbsUp className={cn("h-4 w-4 mr-2", isUpvoted && "fill-current")} />
                                Apoiar ({report.upvotes})
                            </Button>
                        ) : (
                         <AccordionTrigger className="py-2 px-4 text-sm -mr-4 hover:no-underline">
                           <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-md font-semibold transition-colors hover:bg-primary/20">
                                <Settings2 className="h-4 w-4" />
                                Atualizar Status
                           </div>
                        </AccordionTrigger>
                        )}
                    </div>
                </div>
            </div>
            
            {!showUpvote && (
            <AccordionContent className="bg-muted/50 border-t">
              <form action={formAction} ref={formRef}>
                <div className="p-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-1">Última Atualização</h4>
                                <p className="text-sm text-foreground/80" title={format(new Date(report.createdAt), "PPPppp", { locale: ptBR })}>
                                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: ptBR })}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor={`status-${report.id}`}>Novo Status</Label>
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
                        </div>

                        <div className="flex-1 space-y-2">
                            <Label htmlFor={`photoAfter-${report.id}`}>Foto da Solução (Opcional)</Label>
                            <div className="aspect-video rounded-md border border-dashed flex items-center justify-center relative overflow-hidden bg-muted/80">
                                {(photoAfterPreview || report.photoAfterUrl) ? (
                                    <Image src={photoAfterPreview || report.photoAfterUrl!} alt="Pré-visualização da foto da solução" fill className="object-cover" />
                                ) : (
                                    <div className="text-center text-muted-foreground p-4">
                                        <Camera className="mx-auto h-8 w-8" />
                                        <p className="mt-2 text-xs">Carregar evidência da resolução</p>
                                    </div>
                                )}
                            </div>
                            <Input id={`photoAfter-${report.id}`} name="photoAfter" type="file" accept="image/*" className="file:text-primary file:font-semibold text-xs" onChange={handlePhotoChange} />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
                        <AlertDialogTrigger asChild>
                          <Button type="button" disabled={isPending} className="bg-amber-400 text-black hover:bg-amber-400/90 focus-visible:ring-amber-500 w-full sm:w-auto">
                            {isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Salvar Alterações
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Atualização de Status</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem certeza que deseja atualizar o status deste relatório? Esta ação enviará uma notificação automática ao cidadão.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => formRef.current?.requestSubmit()}
                              disabled={!isStatusConfirmEnabled || isPending}
                            >
                              {isStatusConfirmEnabled ? "Sim, tenho certeza" : `Sim, tenho certeza (${statusCountdown})`}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

function ReportList({ 
    reports, 
    onUpvote, 
    onStatusUpdate,
    upvotedReports, 
    showUpvote 
}: { 
    reports: Report[], 
    onUpvote: (id: string) => void, 
    onStatusUpdate?: (id: string, newStatus: ReportStatus) => void,
    upvotedReports: Set<string>, 
    showUpvote: boolean 
}) {
    if (reports.length === 0) {
      return (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-semibold">Nenhum Relato Encontrado</h3>
              <p className="text-muted-foreground mt-2">Nenhum relatório corresponde a este status no momento.</p>
          </div>
      )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <ReportCard 
            key={report.id} 
            report={report} 
            onUpvote={onUpvote} 
            onStatusUpdate={onStatusUpdate}
            isUpvoted={upvotedReports.has(report.id)} 
            showUpvote={showUpvote} 
        />
      ))}
    </div>
  );
}

type OptimisticUpdate = { type: 'upvote', id: string, amount: 1 | -1 } | { type: 'status', reportId: string, newStatus: ReportStatus };

export function DashboardClient({ reports, showUpvote = true }: { reports: Report[], showUpvote?: boolean }) {
  const { toast } = useToast();
  // Se for funcionário (showUpvote=false), começa pela aba de moderação (Em Análise)
  const [activeTab, setActiveTab] = useState<ReportStatus>(showUpvote ? "PENDING" : "UNDER_REVIEW");
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
        setUpvotedReports(upvotedReports);
        setOptimisticReports({ type: 'upvote', id: reportId, amount: isAlreadyUpvoted ? 1 : -1 });
      }
    });
  }

  const handleStatusUpdate = (reportId: string, newStatus: ReportStatus) => {
      startTransition(() => {
          setOptimisticReports({ type: 'status', reportId, newStatus });
      });
  };
  
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
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'upvotes':
        return b.upvotes - a.upvotes;
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const filteredReports = (status: ReportStatus) => sortedReports.filter(r => r.status === status);

  return (
    <>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportStatus)} className="w-full">
          <div className="flex flex-row justify-between items-center mb-4 gap-2">
            <TabsList className={cn("grid flex-1 w-full bg-card p-1 rounded-lg", showUpvote ? "grid-cols-3" : "grid-cols-4")}>
                {!showUpvote && (
                    <TabsTrigger value="UNDER_REVIEW" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800 data-[state=active]:shadow-md">Em Análise</TabsTrigger>
                )}
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
          {!showUpvote && (
              <TabsContent value="UNDER_REVIEW">
                  <ReportList reports={filteredReports("UNDER_REVIEW")} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} upvotedReports={upvotedReports} showUpvote={showUpvote} />
              </TabsContent>
          )}
          <TabsContent value="PENDING">
              <ReportList reports={filteredReports("PENDING")} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} upvotedReports={upvotedReports} showUpvote={showUpvote} />
          </TabsContent>
          <TabsContent value="IN_PROGRESS">
              <ReportList reports={filteredReports("IN_PROGRESS")} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} upvotedReports={upvotedReports} showUpvote={showUpvote} />
          </TabsContent>
          <TabsContent value="RESOLVED">
              <ReportList reports={filteredReports("RESOLVED")} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} upvotedReports={upvotedReports} showUpvote={showUpvote} />
          </TabsContent>
      </Tabs>
    </>
  );
}
