"use client";

import { useOptimistic, useState, useRef, useActionState, useEffect, useTransition, startTransition, memo, useMemo, useCallback } from "react";
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
import { ThumbsUp, Camera, Upload, Loader2, Filter, Trash2, MapPin, Settings2, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { statusConfig, StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { useUser } from "@/firebase";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useRouter } from "next/navigation";
import { ReportTime } from "./report-time";
import { Separator } from "./ui/separator";
import Link from "next/link";

const STATUS_PROGRESSION: Record<ReportStatus, ReportStatus | null> = {
  UNDER_REVIEW: "PENDING",
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: null,
};

const ReportCard = memo(({ 
    report,
    onUpvote,
    onStatusUpdate,
    onSuccess,
    isUpvoted,
    showUpvote,
}: { 
    report: Report,
    onUpvote: (id: string) => void,
    onStatusUpdate?: (id: string, newStatus: ReportStatus) => void,
    onSuccess?: () => void,
    isUpvoted: boolean,
    showUpvote: boolean
}) => {
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
    if (onStatusUpdate && status !== report.status) {
        onStatusUpdate(report.id, status);
    }
    return updateReportStatus(prev, { reportId: report.id, formData });
  }, undefined);

  const formRef = useRef<HTMLFormElement>(null);
  const [photoAfterPreview, setPhotoAfterPreview] = useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoAfterPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if(formState?.success === false && formState.message) {
        toast({ title: "Erro ao Atualizar", description: formState.message, variant: "destructive" });
    } else if (formState?.success === true && formState.message) {
        toast({ title: "Sucesso", description: formState.message });
        setPhotoAfterPreview(null);
        setIsStatusConfirmOpen(false);
        if (onSuccess) onSuccess();
        router.refresh();
    }
  }, [formState, toast, router, onSuccess]);

  useEffect(() => {
    if (isStatusConfirmOpen) {
      setIsStatusConfirmEnabled(false);
      setStatusCountdown(3);
      const interval = setInterval(() => setStatusCountdown(p => Math.max(0, p - 1)), 1000);
      const timeout = setTimeout(() => setIsStatusConfirmEnabled(true), 3000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    }
  }, [isStatusConfirmOpen]);

  const handleDelete = async () => {
    startDeleteTransition(async () => {
        const result = await deleteReportAction(report.id);
        if (result.success) {
            toast({ title: "Relatório removido", description: "O registro indevido foi excluído do sistema." });
            router.refresh();
            if (onSuccess) onSuccess();
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
      className="overflow-hidden bg-card border-border shadow-sm transition-all duration-300 hover:shadow-lg rounded-xl animate-in fade-in" 
      id={`report-${report.id}`}
    >
      <CardContent className="p-0">
        <Accordion type="single" collapsible disabled={showUpvote}>
          <AccordionItem value={report.id} className="border-b-0">
            <div className="flex flex-col md:flex-row h-full">
                <div className="relative w-full md:w-56 h-48 md:h-auto overflow-hidden bg-muted shrink-0">
                    <Image
                        src={report.photoUrl}
                        alt="Foto do problema"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 224px"
                        priority={false}
                    />
                    <div className="absolute top-3 left-3 z-10">
                        <StatusBadge status={report.status} />
                    </div>
                </div>

                <div className="p-4 md:p-6 flex flex-col flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-2">
                        <div className="space-y-1 min-w-0">
                            <h3 className="font-bold text-lg text-foreground leading-tight truncate">
                                {problem?.label || report.problem}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                {category?.icon && <category.icon className="h-4 w-4" style={{ color: category?.color }} />}
                                <span>{category?.label || report.category}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1 py-3 border-t border-border mt-2">
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground/80">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span>{displayCity} - {report.bairro}</span>
                        </div>
                    </div>

                    <div className="mt-auto pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-border gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium uppercase">
                                <Clock className="h-3.5 w-3.5" />
                                <ReportTime date={new Date(report.createdAt)} />
                            </div>
                            
                            {report.status === 'RESOLVED' && report.photoAfterUrl && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 hover:underline">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Solução
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl p-2 rounded-2xl bg-card border-border">
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                                            <Image src={report.photoAfterUrl} alt="Trabalho concluído" fill className="object-contain" />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-primary font-bold hover:bg-primary/10">
                                <Link href={`/?lat=${report.latitude}&lng=${report.longitude}#map-section`}>
                                    <MapPin className="h-3.5 w-3.5 mr-1.5" /> Ver no mapa
                                </Link>
                            </Button>

                            {canDelete && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive h-9 px-3 hover:bg-destructive/10">
                                            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Remover
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-2xl bg-card border-border">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir Relatório?</AlertDialogTitle>
                                            <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-xl">Confirmar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            
                            {showUpvote ? (
                                <Button 
                                  variant={isUpvoted ? "default" : "outline"} 
                                  size="sm" 
                                  onClick={(e) => { e.stopPropagation(); onUpvote(report.id); }}
                                  className={cn("rounded-full font-bold h-9 px-5 text-xs transition-all shadow-sm", isUpvoted ? "bg-primary hover:bg-primary/90" : "bg-muted/50 border-border hover:bg-muted")}
                                >
                                    <ThumbsUp className={cn("h-3.5 w-3.5 mr-2", isUpvoted && "fill-current")} />
                                    Apoiar ({report.upvotes})
                                </Button>
                            ) : (
                                <AccordionTrigger className="py-0 px-4 h-9 rounded-full bg-primary/10 text-primary font-bold hover:bg-primary/20 hover:no-underline flex items-center gap-2 text-xs">
                                    <Settings2 className="h-3.5 w-3.5" /> {isFinalStatus ? "Detalhes" : "Gerenciar"}
                                </AccordionTrigger>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {!showUpvote && (
            <AccordionContent className="bg-muted/20 border-t border-border">
              <form action={formAction} ref={formRef}>
                <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Atualizar Situação</Label>
                            <Select name="status" defaultValue={report.status} onValueChange={(val) => setSelectedStatus(val as ReportStatus)}>
                                <SelectTrigger className="h-12 rounded-xl bg-card border-border shadow-sm" disabled={isFinalStatus}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent side="bottom" position="popper" className="z-[1001] bg-card border-border">
                                    {Object.entries(statusConfig).map(([key, { label }]) => (
                                        <SelectItem key={key} value={key} disabled={key !== nextAllowedStatus && key !== report.status} className="rounded-lg">
                                            {label} {key === nextAllowedStatus && "(Próximo)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            
                            {!isFinalStatus && (
                                <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button type="button" disabled={isPending || selectedStatus === report.status} className="h-12 w-full rounded-xl px-8 font-bold shadow-md">
                                            {isPending ? <Loader2 className="animate-spin h-5 w-5 mr-3" /> : <Upload className="h-5 w-5 mr-3" />}
                                            Salvar Alterações
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-2xl bg-card border-border">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirmar Atualização</AlertDialogTitle>
                                            <AlertDialogDescription>O cidadão autor do relato será notificado sobre a mudança.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => formRef.current?.requestSubmit()} disabled={!isStatusConfirmEnabled || isPending} className="bg-primary text-primary-foreground rounded-xl">
                                                {isStatusConfirmEnabled ? "Confirmar" : `Aguarde (${statusCountdown}s)`}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>

                        <div className={cn("space-y-4", !isPhotoEnabled && "opacity-40 pointer-events-none")}>
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Foto do Reparo Realizado</Label>
                            <div className="aspect-video rounded-xl border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden bg-card hover:border-primary/50 transition-colors">
                                {(photoAfterPreview || report.photoAfterUrl) ? (
                                    <Image src={photoAfterPreview || report.photoAfterUrl!} alt="Preview" fill className="object-cover" />
                                ) : (
                                    <div className="text-center p-4">
                                        <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
                                        <p className="mt-2 text-xs font-bold text-muted-foreground">Anexar evidência</p>
                                    </div>
                                )}
                                <Input id={`photoAfter-${report.id}`} name="photoAfter" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoChange} disabled={!isPhotoEnabled || isFinalStatus} />
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border" />

                    <div className="bg-destructive/5 p-5 rounded-xl border border-destructive/20 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldAlert className="h-5 w-5 text-destructive" />
                            <h4 className="text-sm font-bold text-destructive uppercase tracking-wider">Ações de Moderação</h4>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="outline" className="flex-1 h-11 border-destructive/20 text-destructive hover:bg-destructive/10 font-bold rounded-xl transition-colors">
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Excluir Relatório Indevido
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl bg-card border-border">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação removerá o relato do mapa e de todos os painéis. Utilize apenas para trotes, spam ou conteúdos ofensivos.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-xl">Sim, excluir relato</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight text-center sm:text-left">
                            As ações acima são registradas no log de auditoria do sistema.
                        </p>
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
});

ReportCard.displayName = "ReportCard";

type OptimisticUpdate = { type: 'upvote', id: string, amount: 1 | -1 } | { type: 'status', reportId: string, newStatus: ReportStatus };

const LOCAL_STORAGE_UPVOTES_KEY = 'infra_mais_upvoted_reports';

export function DashboardClient({ reports, showUpvote = true, onSuccess }: { reports: Report[], showUpvote?: boolean, onSuccess?: () => void }) {
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
    const saved = localStorage.getItem(LOCAL_STORAGE_UPVOTES_KEY);
    if (saved) {
      try {
        setUpvotedReports(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error("Erro ao carregar apoios persistidos", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_UPVOTES_KEY, JSON.stringify(Array.from(upvotedReports)));
  }, [upvotedReports]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const reportId = hash.replace("#report-", "");
      const report = reports.find(r => r.id === reportId);
      if (report) {
        setActiveTab(report.status);
        setTimeout(() => {
          const element = document.getElementById(hash.substring(1));
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
      }
    }
  }, [reports]);

  const handleUpvote = useCallback((reportId: string) => {
    const isAlreadyUpvoted = upvotedReports.has(reportId);
    
    setUpvotedReports(prev => {
        const next = new Set(prev);
        if (isAlreadyUpvoted) next.delete(reportId);
        else next.add(reportId);
        return next;
    });

    startTransition(async () => {
      setOptimisticReports({ 
        type: 'upvote', 
        id: reportId, 
        amount: isAlreadyUpvoted ? -1 : 1 
      });

      const result = isAlreadyUpvoted 
        ? await downvoteReportAction(reportId) 
        : await upvoteReportAction(reportId);

      if (!result?.success) {
        toast({ title: "Erro ao registrar apoio", variant: "destructive" });
        setUpvotedReports(prev => {
            const next = new Set(prev);
            if (isAlreadyUpvoted) next.add(reportId);
            else next.delete(reportId);
            return next;
        });
      }
    });
  }, [upvotedReports, toast, setOptimisticReports]);

  const handleStatusUpdate = useCallback((reportId: string, newStatus: ReportStatus) => {
      startTransition(() => {
          setOptimisticReports({ type: 'status', reportId, newStatus });
      });
  }, [setOptimisticReports]);

  const sortedReports = useMemo(() => {
    return [...optimisticReports].sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [optimisticReports, sortBy]);

  const filteredReports = sortedReports.filter(r => r.status === activeTab);

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportStatus)} className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 mb-8">
            <TabsList className="bg-muted p-1 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar shadow-inner">
                {!showUpvote && (
                  <TabsTrigger 
                    value="UNDER_REVIEW" 
                    className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-slate-500 data-[state=active]:text-white"
                  >
                    Em Análise
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="PENDING" 
                  className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-white"
                >
                  Pendente
                </TabsTrigger>
                <TabsTrigger 
                  value="IN_PROGRESS" 
                  className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  Em Andamento
                </TabsTrigger>
                <TabsTrigger 
                  value="RESOLVED" 
                  className="rounded-xl px-5 py-2.5 text-sm font-bold data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  Resolvido
                </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <Filter className="h-4 w-4" /> Ordenar
              </div>
              <Select onValueChange={(v) => setSortBy(v as any)} defaultValue={sortBy}>
                <SelectTrigger className="h-10 w-[180px] bg-card border-border rounded-xl shadow-sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent side="bottom" position="popper" className="bg-card border-border rounded-xl shadow-xl z-[1001]">
                  <SelectItem value="newest" className="rounded-lg">Mais Recentes</SelectItem>
                  <SelectItem value="oldest" className="rounded-lg">Mais Antigos</SelectItem>
                  <SelectItem value="upvotes" className="rounded-lg">Mais Apoiados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4">
            <TabsContent value={activeTab} className="mt-0 outline-none">
                <div className="space-y-5">
                  {filteredReports.length > 0 ? (
                    filteredReports.map(r => (
                      <ReportCard 
                        key={r.id} 
                        report={r} 
                        onUpvote={handleUpvote} 
                        onStatusUpdate={handleStatusUpdate} 
                        onSuccess={onSuccess}
                        isUpvoted={upvotedReports.has(r.id)} 
                        showUpvote={showUpvote} 
                      />
                    ))
                  ) : (
                    <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-border shadow-inner">
                      <p className="text-muted-foreground font-medium">Nenhum relato nesta categoria.</p>
                    </div>
                  )}
                </div>
            </TabsContent>
          </div>
      </Tabs>
    </div>
  );
}