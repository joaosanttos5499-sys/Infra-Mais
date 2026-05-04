"use client";

import { useOptimistic, useState, useRef, useActionState, useEffect, useTransition, startTransition } from "react";
import Image from "next/image";
import { updateReportStatus, upvoteReportAction, downvoteReportAction, deleteReportAction } from "@/lib/actions";
import { type Report, type ReportStatus } from "@/lib/types";
import { getCategory } from "@/lib/categories";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { ThumbsUp, Camera, Upload, Loader2, Filter, Trash2, MapPin, Settings2, Clock, CheckCircle2 } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { statusConfig, StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { useUser } from "@/firebase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useRouter } from "next/navigation";
import { ReportTime } from "./report-time";

const STATUS_PROGRESSION: Record<ReportStatus, ReportStatus | null> = {
  UNDER_REVIEW: "PENDING",
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: null,
};

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
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>(report.status);

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

  const nextAllowedStatus = STATUS_PROGRESSION[report.status];
  const isFinalStatus = !nextAllowedStatus;
  const isPhotoEnabled = selectedStatus === 'RESOLVED';

  return (
    <Card 
      className="overflow-hidden bg-white border border-gray-200 shadow-sm transition-all duration-500 hover:shadow-md hover:-translate-y-1 rounded-xl cursor-pointer animate-in fade-in slide-in-from-bottom-4" 
      id={`report-${report.id}`}
    >
      <CardContent className="p-0">
        <Accordion type="single" collapsible disabled={showUpvote}>
          <AccordionItem value={report.id} className="border-b-0">
            <div className="flex flex-col md:flex-row h-full">
                {/* Image Section */}
                <div className="relative w-full md:w-56 h-48 md:h-auto overflow-hidden bg-gray-100 shrink-0">
                    <Image
                        src={report.photoUrl}
                        alt={`Relato: ${problem?.label || report.problem}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 224px"
                    />
                    <div className="absolute top-3 left-3 z-10">
                        <StatusBadge status={report.status} />
                    </div>
                </div>

                <div className="p-4 md:p-6 flex flex-col flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-2">
                        <div className="space-y-1 min-w-0">
                            <h3 className="font-bold text-lg md:text-xl text-gray-900 leading-tight truncate">
                                {problem?.label || report.problem}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                {category?.icon && <category.icon className="h-4 w-4" style={{ color: category?.color }} />}
                                <span>{category?.label || report.category}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 py-3 border-t border-gray-50 mt-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{displayCity} - {report.bairro}</span>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6 line-clamp-1 italic">
                            {report.location}
                        </p>
                    </div>

                    <div className="mt-auto pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-gray-50 gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium uppercase tracking-wider">
                                <Clock className="h-3.5 w-3.5" />
                                <ReportTime date={new Date(report.createdAt)} />
                            </div>
                            
                            {report.status === 'RESOLVED' && report.photoAfterUrl && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Solução
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl p-2 rounded-2xl">
                                        <div className="relative aspect-video">
                                            <Image src={report.photoAfterUrl} alt="Trabalho concluído" fill className="object-contain" />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            {canDelete && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-9 px-3">
                                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                                            Remover
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-2xl">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir Relatório?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação é irreversível. O problema deixará de constar no painel da cidade.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white rounded-xl">
                                                Confirmar exclusão
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            
                            {showUpvote ? (
                                <Button 
                                  variant={isUpvoted ? "default" : "outline"} 
                                  size="sm" 
                                  onClick={(e) => {
                                      e.stopPropagation();
                                      onUpvote(report.id);
                                  }}
                                  className={cn(
                                    "rounded-full font-bold transition-all h-9 px-5 text-xs",
                                    isUpvoted ? "bg-primary text-white" : "bg-gray-100 border-transparent text-gray-700 hover:bg-gray-200"
                                  )}
                                >
                                    <ThumbsUp className={cn("h-3.5 w-3.5 mr-2", isUpvoted && "fill-current")} />
                                    Apoiar ({report.upvotes})
                                </Button>
                            ) : (
                                <AccordionTrigger className="py-0 px-4 h-9 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-all hover:no-underline flex items-center gap-2 text-xs">
                                    <Settings2 className="h-3.5 w-3.5" />
                                    {isFinalStatus ? "Detalhes" : "Gerenciar"}
                                </AccordionTrigger>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {!showUpvote && (
            <AccordionContent className="bg-gray-50/50 border-t border-gray-100">
              <form action={formAction} ref={formRef}>
                <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor={`status-${report.id}`} className="text-sm font-bold text-gray-700 uppercase tracking-widest">Novo Status</Label>
                                <Select 
                                    name="status" 
                                    defaultValue={report.status}
                                    onValueChange={(val) => setSelectedStatus(val as ReportStatus)}
                                >
                                    <SelectTrigger id={`status-${report.id}`} className="h-12 rounded-xl bg-white border-gray-200 text-base font-semibold" disabled={isFinalStatus}>
                                        <SelectValue placeholder="Mudar status" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl">
                                        {Object.entries(statusConfig).map(([key, { label }]) => {
                                            const isNext = key === nextAllowedStatus;
                                            const isCurrent = key === report.status;
                                            return (
                                                <SelectItem 
                                                    key={key} 
                                                    value={key} 
                                                    disabled={!isNext && !isCurrent}
                                                    className={cn("p-3 font-medium", !isNext && !isCurrent && "opacity-40 cursor-not-allowed")}
                                                >
                                                    {label} {isNext && " (Próximo Passo)"}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className={cn("space-y-4 transition-all duration-300", !isPhotoEnabled && "opacity-40 pointer-events-none")}>
                            <Label htmlFor={`photoAfter-${report.id}`} className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center justify-between">
                                Carregar foto
                                {isPhotoEnabled && <span className="text-[10px] font-bold uppercase tracking-wider bg-destructive/10 text-destructive px-2 py-0.5 rounded">Obrigatório</span>}
                            </Label>
                            <div className="aspect-video rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden bg-white hover:border-primary transition-colors group">
                                {(photoAfterPreview || report.photoAfterUrl) ? (
                                    <Image src={photoAfterPreview || report.photoAfterUrl!} alt="Preview" fill className="object-cover" />
                                ) : (
                                    <div className="text-center text-muted-foreground p-4">
                                        <Camera className="mx-auto h-8 w-8 text-gray-400 group-hover:text-primary transition-colors" />
                                        <p className="mt-2 text-xs font-bold">Anexar evidência do reparo</p>
                                    </div>
                                )}
                                <Input 
                                    id={`photoAfter-${report.id}`} 
                                    name="photoAfter" 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    onChange={handlePhotoChange}
                                    disabled={!isPhotoEnabled || isFinalStatus}
                                />
                            </div>
                        </div>
                    </div>

                    {!isFinalStatus && (
                        <div className="flex justify-end">
                            <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" disabled={isPending || selectedStatus === report.status} className="h-12 w-full sm:w-auto rounded-xl px-8 font-bold shadow-md">
                                        {isPending ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <Upload className="h-5 w-5 mr-3" />}
                                        Salvar Alterações
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-2xl font-bold">Confirmar Atualização</AlertDialogTitle>
                                        <AlertDialogDescription className="text-base">
                                            Você está prestes a atualizar o estágio deste problema. Esta ação notificará o cidadão sobre o progresso da demanda.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-6">
                                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction 
                                            onClick={() => formRef.current?.requestSubmit()}
                                            disabled={!isStatusConfirmEnabled || isPending}
                                            className="bg-primary text-white rounded-xl font-bold px-8"
                                        >
                                            {isStatusConfirmEnabled ? "Sim, tenho certeza" : `Aguarde (${statusCountdown}s)`}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
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

type OptimisticUpdate = { type: 'upvote', id: string, amount: 1 | -1 } | { type: 'status', reportId: string, newStatus: ReportStatus };

export function DashboardClient({ reports, showUpvote = true }: { reports: Report[], showUpvote?: boolean }) {
  const { toast } = useToast();
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
            element.classList.add('ring-4', 'ring-primary/20', 'ring-offset-2');
            setTimeout(() => {
                 element.classList.remove('ring-4', 'ring-primary/20', 'ring-offset-2');
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
          <div className="text-center py-20 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <h3 className="text-xl font-bold text-gray-900">Nenhum Relato Encontrado</h3>
              <p className="text-muted-foreground mt-2">A comunidade ainda não registrou ocorrências para esta categoria.</p>
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
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportStatus)} className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
            <TabsList className="bg-gray-100 p-1 rounded-full inline-flex w-full lg:w-auto h-auto overflow-x-auto no-scrollbar">
                {!showUpvote && (
                    <TabsTrigger value="UNDER_REVIEW" className="rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500 transition-all whitespace-nowrap">Em Análise</TabsTrigger>
                )}
                <TabsTrigger value="PENDING" className="rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500 transition-all whitespace-nowrap">Pendente</TabsTrigger>
                <TabsTrigger value="IN_PROGRESS" className="rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500 transition-all whitespace-nowrap">Em Andamento</TabsTrigger>
                <TabsTrigger value="RESOLVED" className="rounded-full px-4 sm:px-5 py-2.5 text-xs sm:text-sm font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-900 text-gray-500 transition-all whitespace-nowrap">Resolvido</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <Filter className="h-4 w-4" />
                Ordenar
              </div>
              <Select onValueChange={(value) => setSortBy(value as typeof sortBy)} defaultValue={sortBy}>
                <SelectTrigger className="h-10 w-[160px] sm:w-[180px] bg-white border-gray-200 rounded-lg text-sm font-semibold">
                    <SelectValue placeholder="Escolher" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="newest" className="font-medium">Mais Recentes</SelectItem>
                  <SelectItem value="oldest" className="font-medium">Mais Antigos</SelectItem>
                  <SelectItem value="upvotes" className="font-medium">Mais Apoiados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            {!showUpvote && (
                <TabsContent value="UNDER_REVIEW" className="mt-0 outline-none">
                    <div className="space-y-5">
                      {filteredReports("UNDER_REVIEW").length > 0 ? (
                        filteredReports("UNDER_REVIEW").map(r => (
                          <ReportCard key={r.id} report={r} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} isUpvoted={upvotedReports.has(r.id)} showUpvote={showUpvote} />
                        ))
                      ) : (
                        <div className="text-center py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed">
                          <p className="text-muted-foreground font-medium">Nenhum relato aguardando triagem.</p>
                        </div>
                      )}
                    </div>
                </TabsContent>
            )}
            <TabsContent value="PENDING" className="mt-0 outline-none">
                <div className="space-y-5">
                  {filteredReports("PENDING").length > 0 ? (
                    filteredReports("PENDING").map(r => (
                      <ReportCard key={r.id} report={r} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} isUpvoted={upvotedReports.has(r.id)} showUpvote={showUpvote} />
                    ))
                  ) : (
                    <div className="text-center py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed">
                      <p className="text-muted-foreground font-medium">Todos os relatos estão em atendimento ou resolvidos.</p>
                    </div>
                  )}
                </div>
            </TabsContent>
            <TabsContent value="IN_PROGRESS" className="mt-0 outline-none">
                <div className="space-y-5">
                  {filteredReports("IN_PROGRESS").length > 0 ? (
                    filteredReports("IN_PROGRESS").map(r => (
                      <ReportCard key={r.id} report={r} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} isUpvoted={upvotedReports.has(r.id)} showUpvote={showUpvote} />
                    ))
                  ) : (
                    <div className="text-center py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed">
                      <p className="text-muted-foreground font-medium">Nenhuma equipe em campo no momento.</p>
                    </div>
                  )}
                </div>
            </TabsContent>
            <TabsContent value="RESOLVED" className="mt-0 outline-none">
                <div className="space-y-5">
                  {filteredReports("RESOLVED").length > 0 ? (
                    filteredReports("RESOLVED").map(r => (
                      <ReportCard key={r.id} report={r} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} isUpvoted={upvotedReports.has(r.id)} showUpvote={showUpvote} />
                    ))
                  ) : (
                    <div className="text-center py-20 bg-gray-50/50 rounded-2xl border-2 border-dashed">
                      <p className="text-muted-foreground font-medium">Aguardando as primeiras soluções da cidade.</p>
                    </div>
                  )}
                </div>
            </TabsContent>
          </div>
      </Tabs>
    </div>
  );
}