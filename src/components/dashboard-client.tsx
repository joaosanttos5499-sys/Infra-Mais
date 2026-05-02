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
import { ThumbsUp, Camera, Upload, Loader2, Filter, Expand, Trash2, MapPin, Settings2, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { statusConfig, StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useUser } from "@/firebase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useRouter } from "next/navigation";

// Mapa de progressão estrita de status
const STATUS_PROGRESSION: Record<ReportStatus, ReportStatus | null> = {
  UNDER_REVIEW: "PENDING",
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: null,
};

function ReportCreationTime({ date }: { date: Date }) {
    const [timeString, setTimeString] = useState("");

    useEffect(() => {
        setTimeString(format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }));
    }, [date]);

    if (!timeString) return null;

    return (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
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
    <Card className="overflow-hidden bg-white border border-gray-200 shadow-sm transition-all hover:shadow-md rounded-xl" id={`report-${report.id}`}>
      <CardContent className="p-0">
        <Accordion type="single" collapsible disabled={showUpvote}>
          <AccordionItem value={report.id} className="border-b-0">
            <div className="p-0 flex flex-col sm:flex-row">
                {/* Image Section - Following Block pattern */}
                <div className="relative aspect-video sm:w-72 sm:h-auto overflow-hidden">
                    <Image
                        src={report.photoUrl}
                        alt={`Problema em ${report.location}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 300px"
                    />
                    <div className="absolute top-3 left-3 z-10">
                        <StatusBadge status={report.status} />
                    </div>
                </div>

                <div className="p-6 flex flex-col flex-grow space-y-4">
                    <div className="space-y-1">
                        {/* Title Highlight */}
                        <h3 className="font-bold text-xl text-gray-900 leading-tight">
                            {problem?.label || report.problem}
                        </h3>
                        
                        {/* Category Row */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            {category?.icon && <category.icon className="h-4 w-4" style={{ color: category?.color }} />}
                            <span>{category?.label || report.category}</span>
                        </div>
                    </div>

                    {/* Location Info */}
                    <div className="space-y-2 py-2 border-y border-gray-50">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{displayCity} - {report.bairro}</span>
                        </div>
                        <div className="pl-6">
                            <p className="text-xs text-muted-foreground line-clamp-2 italic">
                              {report.location}
                            </p>
                        </div>
                    </div>

                    {/* Description Quote */}
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        &quot;{report.description}&quot;
                    </p>

                    <div className="mt-auto pt-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Clock className="h-3.5 w-3.5" />
                                <ReportTime date={new Date(report.createdAt)} />
                            </div>
                            
                            {report.status === 'RESOLVED' && report.photoAfterUrl && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700">
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                            Ver Solução
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl p-2 rounded-3xl overflow-hidden">
                                        <div className="relative aspect-video">
                                            <Image src={report.photoAfterUrl} alt="Solução" fill className="object-contain" />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <div className="flex gap-2">
                            {canDelete && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-9 px-3">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Excluir
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir Relatório?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação removerá os dados permanentemente de nossos servidores.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
                                                Sim, excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            
                            {showUpvote ? (
                                <Button 
                                  variant={isUpvoted ? "default" : "outline"} 
                                  size="sm" 
                                  onClick={() => onUpvote(report.id)}
                                  className={cn(
                                    "rounded-lg font-bold transition-all h-9 px-4",
                                    isUpvoted ? "bg-primary text-white" : "border-gray-200 text-gray-700"
                                  )}
                                >
                                    <ThumbsUp className={cn("h-4 w-4 mr-2", isUpvoted && "fill-current")} />
                                    Apoiar ({report.upvotes})
                                </Button>
                            ) : (
                                <AccordionTrigger className="py-0 px-4 h-9 rounded-lg bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-all hover:no-underline flex items-center gap-2">
                                    <Settings2 className="h-4 w-4" />
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
                <div className="p-8 space-y-8 max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="p-4 rounded-xl bg-white border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-widest mb-3">Estágio Atual</h4>
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={report.status} />
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Desde {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: ptBR })}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor={`status-${report.id}`} className="text-base font-bold text-gray-900">Novo Status</Label>
                                <Select 
                                    name="status" 
                                    defaultValue={report.status}
                                    onValueChange={(val) => setSelectedStatus(val as ReportStatus)}
                                >
                                    <SelectTrigger id={`status-${report.id}`} className="h-14 rounded-xl bg-white border-gray-200 text-lg font-semibold" disabled={isFinalStatus}>
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
                                                    {label} {isNext && " (Próximo)"}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                                {isFinalStatus && (
                                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                      <CheckCircle2 className="h-4 w-4" />
                                      <p className="text-xs font-bold uppercase tracking-wider">Demanda concluída e validada.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={cn("space-y-4 transition-all duration-300", !isPhotoEnabled && "opacity-30 pointer-events-none")}>
                            <Label htmlFor={`photoAfter-${report.id}`} className="text-base font-bold text-gray-900 flex items-center justify-between">
                                Carregar foto
                                {isPhotoEnabled && <span className="text-[10px] font-bold uppercase tracking-wider bg-destructive/10 text-destructive px-2 py-1 rounded">Obrigatório</span>}
                            </Label>
                            <div className="aspect-video rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden bg-white hover:border-primary/50 transition-colors group">
                                {(photoAfterPreview || report.photoAfterUrl) ? (
                                    <Image src={photoAfterPreview || report.photoAfterUrl!} alt="Foto da solução" fill className="object-cover" />
                                ) : (
                                    <div className="text-center text-muted-foreground p-8">
                                        <Camera className="mx-auto h-12 w-12 text-gray-300 group-hover:text-primary/50 transition-colors" />
                                        <p className="mt-3 text-sm font-bold">Clique para carregar foto</p>
                                        <p className="text-xs mt-1">Evidência fotográfica do reparo</p>
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
                                    <Button type="button" disabled={isPending || selectedStatus === report.status} className="h-14 rounded-xl px-10 text-lg font-bold shadow-xl bg-primary hover:scale-105 transition-all">
                                        {isPending ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <Upload className="h-5 w-5 mr-3" />}
                                        Salvar Alterações
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-2xl font-bold">Confirmar Atualização de Status</AlertDialogTitle>
                                        <AlertDialogDescription className="text-lg">
                                            Tem certeza que deseja mover este relato para o próximo estágio? O cidadão será notificado automaticamente sobre esta mudança em seu painel de controle.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="mt-8">
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
          <div className="text-center py-24 border-2 border-dashed border-gray-200 rounded-3xl bg-white shadow-sm">
              <h3 className="text-2xl font-bold text-gray-900">Nenhum Relato Encontrado</h3>
              <p className="text-muted-foreground text-lg mt-2">Quando um novo problema for relatado, ele aparecerá aqui para acompanhamento.</p>
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
    <div className="space-y-12">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportStatus)} className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
            <TabsList className={cn("inline-flex h-14 w-full md:w-auto bg-white border border-gray-200 p-1 rounded-2xl shadow-sm", showUpvote ? "grid grid-cols-3" : "grid grid-cols-4")}>
                {!showUpvote && (
                    <TabsTrigger value="UNDER_REVIEW" className="rounded-xl font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all">Em Análise</TabsTrigger>
                )}
                <TabsTrigger value="PENDING" className="rounded-xl font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-amber-100 data-[state=active]:text-amber-800 transition-all">Em Aberto</TabsTrigger>
                <TabsTrigger value="IN_PROGRESS" className="rounded-xl font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-800 transition-all">Em Andamento</TabsTrigger>
                <TabsTrigger value="RESOLVED" className="rounded-xl font-bold text-xs uppercase tracking-widest px-6 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 transition-all">Resolvidos</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-widest mr-2">
                <Filter className="h-4 w-4" />
                Ordenar:
              </div>
              <Select onValueChange={(value) => setSortBy(value as typeof sortBy)} defaultValue={sortBy}>
                <SelectTrigger className="h-14 w-full md:w-[200px] bg-white border-gray-200 rounded-2xl font-semibold shadow-sm">
                    <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="rounded-xl shadow-xl">
                  <SelectItem value="newest" className="font-medium p-3">Mais Recentes</SelectItem>
                  <SelectItem value="oldest" className="font-medium p-3">Mais Antigos</SelectItem>
                  <SelectItem value="upvotes" className="font-medium p-3">Mais Apoiados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="min-h-[400px]">
            {!showUpvote && (
                <TabsContent value="UNDER_REVIEW" className="mt-0">
                    <div className="space-y-6">
                      {filteredReports("UNDER_REVIEW").length > 0 ? (
                        filteredReports("UNDER_REVIEW").map(r => (
                          <ReportCard key={r.id} report={r} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} isUpvoted={upvotedReports.has(r.id)} showUpvote={showUpvote} />
                        ))
                      ) : (
                        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                          <p className="text-muted-foreground font-medium">Nenhum relato aguardando análise no momento.</p>
                        </div>
                      )}
                    </div>
                </TabsContent>
            )}
            <TabsContent value="PENDING" className="mt-0">
                <div className="space-y-6">
                  {filteredReports("PENDING").length > 0 ? (
                    filteredReports("PENDING").map(r => (
                      <ReportCard key={r.id} report={r} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} isUpvoted={upvotedReports.has(r.id)} showUpvote={showUpvote} />
                    ))
                  ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                      <p className="text-muted-foreground font-medium">Nenhum relato em aberto nesta categoria.</p>
                    </div>
                  )}
                </div>
            </TabsContent>
            <TabsContent value="IN_PROGRESS" className="mt-0">
                <div className="space-y-6">
                  {filteredReports("IN_PROGRESS").length > 0 ? (
                    filteredReports("IN_PROGRESS").map(r => (
                      <ReportCard key={r.id} report={r} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} isUpvoted={upvotedReports.has(r.id)} showUpvote={showUpvote} />
                    ))
                  ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                      <p className="text-muted-foreground font-medium">Nenhum serviço em andamento no momento.</p>
                    </div>
                  )}
                </div>
            </TabsContent>
            <TabsContent value="RESOLVED" className="mt-0">
                <div className="space-y-6">
                  {filteredReports("RESOLVED").length > 0 ? (
                    filteredReports("RESOLVED").map(r => (
                      <ReportCard key={r.id} report={r} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} isUpvoted={upvotedReports.has(r.id)} showUpvote={showUpvote} />
                    ))
                  ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                      <p className="text-muted-foreground font-medium">Nenhum serviço concluído nesta categoria.</p>
                    </div>
                  )}
                </div>
            </TabsContent>
          </div>
      </Tabs>
    </div>
  );
}
