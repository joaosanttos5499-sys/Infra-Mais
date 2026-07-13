
"use client";

import { useOptimistic, useState, useRef, useActionState, useEffect, useTransition, startTransition, memo, useMemo, useCallback } from "react";
import Image from "next/image";
import { 
  updateReportStatus as dbUpdateReportStatus, 
  upvoteReport as dbUpvoteReport, 
  downvoteReport as dbDownvoteReport, 
  deleteReport as dbDeleteReport, 
  deleteReportPermanentlyAction,
  submitComplaintAction 
} from "@/lib/actions";
import { 
  updateReportStatus as clientUpdateReportStatus,
  upvoteReport as clientUpvoteReport,
  downvoteReport as clientDownvoteReport,
  deleteReport as clientDeleteReport,
  addNotification
} from "@/lib/data";
import { type Report, type ReportStatus, type Complaint } from "@/lib/types";
import { categories, getCategory } from "@/lib/categories";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { ThumbsUp, Camera, Upload, Loader2, Filter, Trash2, MapPin, Settings2, Clock, CheckCircle2, ShieldAlert, Mail, Maximize2, Info, ImagePlus, User, ChevronRight, Flag, AlertTriangle, ShieldCheck, MessageSquare, ArrowRight, Sparkles, X, SortAsc, SortDesc } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { statusConfig, StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { useUser } from "@/firebase";
import { isEmailEmployee } from "@/lib/config";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useRouter } from "next/navigation";
import { ReportTime } from "./report-time";
import { Separator } from "./ui/separator";
import Link from "next/link";
import dynamic from 'next/dynamic';
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-xl" />
});

const STATUS_PROGRESSION: Record<ReportStatus, ReportStatus | null> = {
  UNDER_REVIEW: "PENDING",
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: null,
  EXCLUDED: null,
};

const PICUI_NEIGHBORHOODS = [
  "Cenecista", "Centro", "JK", "Limeira", "Monte Santo", 
  "Pedro Salustino de Lima", "Pedro Tomáz Dantas", "São José", "Zona Rural"
].sort((a, b) => a.localeCompare(b));

const REPORT_REASONS = [
  { value: "conteudo_improprio", label: "Conteúdo impróprio" },
  { value: "imagem_incompativel", label: "Imagem incompatível" },
  { value: "relato_falso", label: "Relato falso" },
  { value: "localizacao_incorreta", label: "Localização incorreta" },
  { value: "relato_duplicado", label: "Relato duplicado" },
  { value: "informacoes_insuficientes", label: "Informações insuficientes" },
  { value: "uso_indevido_plataforma", label: "Uso indevido da plataforma" },
  { value: "violação_normas_plataforma", label: "Violação das normas da plataforma" },
  { value: "other", label: "Outro" },
];

const EXCLUSION_REASONS = [
  { value: "relato_duplicado", label: "Relato duplicado" },
  { value: "informacoes_insuficientes", label: "Informações insuficientes" },
  { value: "categoria_incorreta", label: "Categoria incorreta" },
  { value: "localizacao_incorreta", label: "Localização incorreta" },
  { value: "problema_inexistente", label: "Problema inexistente" },
  { value: "problema_ja_resolvido", label: "Problema já resolvido" },
  { value: "nao_relacionado_infraestrutura", label: "Não relacionado à infraestrutura" },
  { value: "relato_enviado_engano", label: "Relato enviado por engano" },
  { value: "other", label: "Outro" },
];

const ReportCard = memo(({ 
    report,
    onUpvote,
    onStatusUpdate,
    onSuccess,
    isUpvoted,
    showUpvote,
}: { 
    report: Report,
    onUpvote: (id: string, userId: string) => void,
    onStatusUpdate?: (id: string, newStatus: ReportStatus) => void,
    onSuccess?: () => void,
    isUpvoted: boolean,
    showUpvote: boolean
}) => {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isUpdating, startUpdateTransition] = useTransition();
  const [isDeletingPermanently, setIsDeletingPermanently] = useState(false);
  const category = getCategory(report.category);
  const problem = category?.problems.find(p => p.value === report.problem);
  
  const [isStatusConfirmOpen, setIsStatusConfirmOpen] = useState(false);
  const [statusCountdown, setStatusCountdown] = useState(3);
  const [isStatusConfirmEnabled, setIsStatusConfirmEnabled] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus>(report.status);

  const [editCategory, setEditCategory] = useState(report.category);
  const [editProblem, setEditProblem] = useState(report.problem);
  const [editBairro, setEditBairro] = useState(report.bairro);
  const [editLocation, setEditLocation] = useState(report.location);
  const [editDescription, setEditDescription] = useState(report.description);
  const [editLat, setEditLat] = useState(report.latitude);
  const [editLng, setEditLng] = useState(report.longitude);

  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);
  const [reportObservations, setReportObservations] = useState("");
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteReasonValue, setDeleteReasonValue] = useState("");
  const [deleteOtherDescription, setDeleteOtherDescription] = useState("");

  const editProblems = useMemo(() => getCategory(editCategory)?.problems || [], [editCategory]);

  const handleReportSubmit = async () => {
    if (!reportReason) {
      toast({ variant: "destructive", title: "Selecione um motivo", description: "É necessário escolher o motivo da denúncia." });
      return;
    }
    if (reportReason === "other" && !reportDetails.trim()) {
      toast({ variant: "destructive", title: "Detalhes necessários", description: "Para o motivo 'Outro', por favor descreva o problema." });
      return;
    }

    setIsReporting(true);
    const finalReason = reportReason === "other" ? reportDetails : REPORT_REASONS.find(r => r.value === reportReason)?.label || reportReason;
    
    const result = await submitComplaintAction({
      reportId: report.id,
      denouncedUserId: report.userId,
      denouncedUserEmail: report.relatorEmail,
      reporterUserId: user?.uid || "anonymous",
      reason: finalReason,
      details: reportObservations
    });

    setIsReporting(true);
    if (result.success) {
      setIsReportDialogOpen(false);
      setReportReason("");
      setReportDetails("");
      setReportObservations("");
      toast({
        title: "Denúncia Enviada",
        description: "A conduta do usuário foi marcada para análise administrativa.",
      });
      if (onSuccess) onSuccess();
    } else {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao enviar denúncia." });
    }
  };

  useEffect(() => {
    if (isStatusConfirmOpen) {
      setIsStatusConfirmEnabled(false);
      setStatusCountdown(3);
      const interval = setInterval(() => setStatusCountdown(p => Math.max(0, p - 1)), 1000);
      const timeout = setTimeout(() => setIsStatusConfirmEnabled(true), 3000);
      return () => { clearInterval(interval); clearTimeout(timeout); };
    }
  }, [isStatusConfirmOpen]);

  const handleUpdateStatus = async () => {
    startUpdateTransition(async () => {
        try {
            const updated = await clientUpdateReportStatus(report.id, report.userId, selectedStatus, undefined, {
                category: editCategory,
                problem: editProblem,
                bairro: editBairro,
                location: editLocation,
                description: editDescription,
                latitude: editLat,
                longitude: editLng
            });

            if (updated) {
                if (report.status === 'UNDER_REVIEW' && selectedStatus !== 'UNDER_REVIEW') {
                    await addNotification(report.userId, report.id, 'APPROVED', 'Relato aprovado', 'Seu relato foi aprovado e agora está disponível para acompanhamento público.');
                } else if (selectedStatus === 'RESOLVED' && report.status !== 'RESOLVED') {
                    await addNotification(report.userId, report.id, 'RESOLVED', 'Problema resolvido', 'Seu relato foi marcado como resolvido. Agradecemos por contribuir com a cidade.');
                }

                toast({ title: "Sucesso", description: "Relato atualizado com sucesso." });
                setIsStatusConfirmOpen(false);
                if (onSuccess) onSuccess();
                router.refresh();
            } else {
                throw new Error("Falha ao atualizar");
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao atualizar", description: "Ocorreu um problema ao salvar as alterações." });
        }
    });
  };

  const handleDelete = async () => {
    if (!deleteReasonValue) {
        toast({ variant: "destructive", title: "Motivo obrigatório", description: "Selecione um motivo para a exclusão." });
        return;
    }
    const finalReason = deleteReasonValue === "other" ? deleteOtherDescription : EXCLUSION_REASONS.find(r => r.value === deleteReasonValue)?.label || deleteReasonValue;

    startDeleteTransition(async () => {
        try {
            const success = await clientDeleteReport(report.id, report.userId, finalReason, user?.uid || "unknown");
            if (success) {
                await addNotification(report.userId, report.id, 'EXCLUDED', 'Relato removido', `Seu relato foi removido. Motivo: ${finalReason}`);
                toast({ title: "Relatório removido", description: "O registro foi movido para a Central de Moderação." });
                setIsDeleteDialogOpen(false);
                if (onSuccess) onSuccess();
                router.refresh();
            } else {
                toast({ variant: "destructive", title: "Erro ao excluir", description: "Não foi possível remover o relato." });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao excluir", description: "Ocorreu um erro de permissão ou conexão." });
        }
    });
  };

  const handlePermanentDelete = async () => {
    setIsDeletingPermanently(true);
    try {
      const result = await deleteReportPermanentlyAction(report.id, report.userId);
      if (result.success) {
        toast({ title: "Remoção Definitiva", description: "O relato foi apagado permanentemente." });
        if (onSuccess) onSuccess();
      } else {
        toast({ variant: "destructive", title: "Erro", description: "Falha na remoção definitiva." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Erro de conexão." });
    } finally {
      setIsDeletingPermanently(false);
    }
  };

  const isEmployee = isEmailEmployee(user?.email);
  const displayCity = report.city === 'Picui' ? 'Picuí' : report.city;
  const nextAllowedStatus = STATUS_PROGRESSION[report.status];
  const isPublic = report.status !== 'UNDER_REVIEW' && report.status !== 'EXCLUDED';

  return (
    <Card 
      className={cn(
        "overflow-hidden bg-card border-border shadow-sm transition-all duration-300 hover:shadow-lg rounded-2xl animate-in fade-in"
      )}
      id={`report-${report.id}`}
    >
      <CardContent className="p-0">
        <Accordion type="single" collapsible disabled={showUpvote}>
          <AccordionItem value={report.id} className="border-b-0">
            <div className="flex flex-col md:flex-row h-full">
                <div className="relative w-full md:w-64 lg:w-72 h-56 md:h-auto overflow-hidden bg-muted shrink-0 group/photo">
                    <Image
                        src={report.photoUrl}
                        alt="Foto do problema"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 300px"
                    />
                    
                    <Dialog>
                        <DialogTrigger asChild>
                            <button 
                                className="absolute bottom-4 right-4 z-20 bg-black/60 hover:bg-black/80 text-white p-2.5 rounded-xl opacity-0 group-hover/photo:opacity-100 transition-all backdrop-blur-md scale-90 group-hover/photo:scale-100"
                                title="Ver em tela cheia"
                            >
                                <Maximize2 className="h-5 w-5" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none bg-transparent shadow-none">
                            <DialogHeader className="sr-only">
                                <DialogTitle>Visualização da Foto</DialogTitle>
                                <DialogDescription>Foto em alta resolução do problema relatado.</DialogDescription>
                            </DialogHeader>
                            <div className="relative w-full h-full flex items-center justify-center p-2 sm:p-4">
                                <img 
                                    src={report.photoUrl} 
                                    alt="Foto em tamanho real" 
                                    className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in duration-300" 
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="pt-2 pb-6 md:pb-8 px-6 md:px-8 flex flex-col flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-2">
                        <div className="space-y-2 min-w-0 pt-2">
                            <h3 className="font-bold text-xl text-foreground leading-tight tracking-tight truncate">
                                {problem?.label || report.problem}
                            </h3>
                            <div className={cn(
                                "flex gap-y-1.5",
                                showUpvote ? "flex-row flex-wrap items-center gap-x-5" : "flex-col items-start"
                            )}>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                                    {category?.icon && <category.icon className="h-3.5 w-3.5" style={{ color: category?.color }} />}
                                    <span className="uppercase tracking-wider text-[11px] opacity-80">{category?.label || report.category}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                    <span>{displayCity} - {report.bairro}</span>
                                </div>
                            </div>
                        </div>
                        <div className="shrink-0 pt-2 -mr-1">
                            <StatusBadge status={report.status} />
                        </div>
                    </div>

                    {showUpvote && report.summary && (
                      <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-2 relative overflow-hidden group/summary animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-[0.15em]">
                          <Sparkles className="h-3 w-3" /> Resumo Inteligente
                        </div>
                        <p className="text-xs text-foreground/85 italic font-medium leading-relaxed">
                          "{report.summary}"
                        </p>
                      </div>
                    )}

                    {!showUpvote && isEmployee && (
                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground pt-4 mt-2 border-t border-border/50">
                            <User className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                            <span className="font-medium">{report.relatorEmail}</span>
                        </div>
                    )}

                    <div className="mt-auto pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-tight">
                                <Clock className="h-3.5 w-3.5" />
                                <ReportTime date={new Date(report.createdAt)} />
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            {isPublic && (
                                <Button asChild variant="ghost" size="sm" className="h-10 px-4 text-primary font-bold hover:bg-primary/10 rounded-xl transition-all">
                                    <Link href={`/?lat=${report.latitude}&lng=${report.longitude}#map-section`}>
                                        <MapPin className="h-4 w-4 mr-2" /> No mapa
                                    </Link>
                                </Button>
                            )}
                            
                            {showUpvote ? (
                                <Button 
                                  variant={isUpvoted ? "default" : "outline"} 
                                  size="sm" 
                                  onClick={(e) => { 
                                    if (isEmployee) return; 
                                    e.stopPropagation(); 
                                    onUpvote(report.id, report.userId); 
                                  }}
                                  className={cn(
                                    "rounded-xl font-bold h-10 px-6 text-xs transition-all shadow-sm active:scale-95", 
                                    isUpvoted ? "bg-primary hover:bg-primary/90" : "bg-muted/30 border-border hover:bg-muted",
                                    isEmployee && "opacity-50 pointer-events-none cursor-default" 
                                  )}
                                  aria-disabled={isEmployee}
                                >
                                    <ThumbsUp className={cn("h-4 w-4 mr-2", isUpvoted && "fill-current")} />
                                    Apoiar ({report.upvotes})
                                </Button>
                            ) : (
                                <AccordionTrigger className={cn(
                                  "py-0 px-6 h-10 rounded-xl font-bold hover:no-underline flex items-center gap-2 text-xs transition-all active:scale-95",
                                  report.status === 'EXCLUDED' ? "bg-orange-100 text-orange-600 hover:bg-orange-200" : "bg-primary/10 text-primary hover:bg-primary/20"
                                )}>
                                    <Settings2 className="h-4 w-4" /> Gerenciar Relato
                                </AccordionTrigger>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {!showUpvote && (
            <AccordionContent className="bg-muted/5 border-t border-border/50">
                <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
                    <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                        <div className="lg:col-span-8 flex flex-col gap-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase pl-1">Categoria</Label>
                                    <Select name="category" value={editCategory} onValueChange={setEditCategory}>
                                        <SelectTrigger className="h-10 rounded-lg bg-card border-border"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-lg">{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase pl-1">Problema</Label>
                                    <Select name="problem" value={editProblem} onValueChange={setEditProblem}>
                                        <SelectTrigger className="h-10 rounded-lg bg-card border-border"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-lg">{editProblems.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase pl-1">Bairro</Label>
                                    <Select name="bairro" value={editBairro} onValueChange={setEditBairro}>
                                        <SelectTrigger className="h-10 rounded-lg bg-card border-border"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-lg">{PICUI_NEIGHBORHOODS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase pl-1">Referência</Label>
                                    <Input name="location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="h-10 rounded-lg bg-card border-border" />
                                </div>
                            </div>

                            <div className="space-y-5">
                                {report.summary && (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <Label className="text-[10px] font-black text-muted-foreground uppercase pl-1 flex items-center gap-1.5">
                                            <Sparkles className="h-3 w-3 text-primary" /> Resumo Inteligente (IA)
                                        </Label>
                                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl shadow-sm italic font-medium text-sm text-foreground/90 leading-relaxed">
                                            "{report.summary}"
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-black text-muted-foreground uppercase pl-1">Descrição do Cidadão</Label>
                                    <Textarea 
                                        name="description" 
                                        value={editDescription} 
                                        onChange={(e) => setEditDescription(e.target.value)} 
                                        className="h-20 rounded-lg bg-card border-border resize-none p-3 text-sm" 
                                        placeholder="Nenhuma descrição adicional fornecida."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase pl-1">Localização no Mapa</Label>
                                <div className="h-[200px] rounded-lg overflow-hidden border border-border relative z-0">
                                    <LeafletMap interactive={true} onLocationSelect={(lat, lng) => { setEditLat(lat); setEditLng(lng); }} selectedLocation={{ lat: editLat, lng: editLng }} />
                                </div>
                                <input type="hidden" name="latitude" value={editLat} />
                                <input type="hidden" name="longitude" value={editLng} />
                            </div>

                            <Card className="rounded-xl bg-card border-border shadow-sm p-4 space-y-4">
                                <div className="flex flex-col items-stretch gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-black text-muted-foreground uppercase">Alterar Status</Label>
                                        <Select name="status" value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as ReportStatus)}>
                                            <SelectTrigger className="h-11 rounded-lg bg-background border-primary/20 font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-lg">
                                                {Object.entries(statusConfig).map(([key, { label }]) => (
                                                    <SelectItem key={key} value={key} disabled={key !== nextAllowedStatus && key !== report.status}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="button" onClick={() => setIsStatusConfirmOpen(true)} disabled={isUpdating} className="h-11 rounded-lg font-bold bg-primary hover:bg-primary/90 shadow-md w-full">
                                        {isUpdating ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
                                        <span className="ml-2">Salvar Alterações</span>
                                    </Button>
                                    
                                    <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
                                        <AlertDialogContent className="rounded-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Atualizar Dados?</AlertDialogTitle>
                                                <AlertDialogDescription>O cidadão será notificado sobre as alterações.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-lg">Voltar</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleUpdateStatus} disabled={!isStatusConfirmEnabled || isUpdating} className="rounded-lg px-6 font-bold">
                                                    {isStatusConfirmEnabled ? "Confirmar" : `Aguarde (${statusCountdown}s)`}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border mt-2">
                                  {report.status !== 'EXCLUDED' ? (
                                    <>
                                      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                                        <DialogTrigger asChild>
                                          <Button 
                                            type="button" 
                                            variant="outline" 
                                            className="h-11 rounded-lg border-orange-500/20 text-orange-600 hover:bg-orange-50 font-bold w-full"
                                          >
                                            Denunciar
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="rounded-2xl">
                                          <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold">Denunciar Relato</DialogTitle>
                                            <DialogDescription className="text-base pt-2">
                                              Escolha o motivo para denunciar este relato.
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="py-4 space-y-4">
                                            <RadioGroup value={reportReason} onValueChange={setReportReason}>
                                              {REPORT_REASONS.map((reason) => (
                                                <div key={reason.value} className="flex items-center space-x-3 p-3 rounded-xl border border-border">
                                                  <RadioGroupItem value={reason.value} id={`rep-reason-${reason.value}`} />
                                                  <Label htmlFor={`rep-reason-${reason.value}`}>{reason.label}</Label>
                                                </div>
                                              ))}
                                            </RadioGroup>
                                            {reportReason === "other" && (
                                              <div className="space-y-2">
                                                <Label>Descreva o motivo</Label>
                                                <Textarea value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} placeholder="Detalhes da denúncia..." className="h-20" />
                                              </div>
                                            )}
                                            <div className="space-y-2">
                                              <Label>Observações Adicionais (Opcional)</Label>
                                              <Textarea value={reportObservations} onChange={(e) => setReportObservations(e.target.value)} placeholder="Mais informações para a moderação..." className="h-20" />
                                            </div>
                                          </div>
                                          <DialogFooter>
                                            <Button variant="ghost" onClick={() => setIsReportDialogOpen(false)}>Cancelar</Button>
                                            <Button onClick={handleReportSubmit} disabled={isReporting || !reportReason} className="bg-orange-500 hover:bg-orange-600 text-white font-bold">
                                              {isReporting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                                              Enviar Denúncia
                                            </Button>
                                          </DialogFooter>
                                        </DialogContent>
                                      </Dialog>

                                      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                        <AlertDialogTrigger asChild>
                                          <Button 
                                            type="button" 
                                            variant="outline" 
                                            className="h-11 rounded-lg border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive font-bold w-full"
                                          >
                                            Excluir
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-2xl font-bold">Excluir Relato</AlertDialogTitle>
                                                <AlertDialogDescription className="text-base pt-2">
                                                  Selecione o motivo da exclusão deste relato.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <div className="py-4 space-y-4">
                                                <RadioGroup value={deleteReasonValue} onValueChange={setDeleteReasonValue}>
                                                    {EXCLUSION_REASONS.map((reason) => (
                                                        <div key={reason.value} className="flex items-center space-x-3 p-3 rounded-xl border border-border">
                                                            <RadioGroupItem value={reason.value} id={`del-reason-${reason.value}`} />
                                                            <Label htmlFor={`del-reason-${reason.value}`}>{reason.label}</Label>
                                                        </div>
                                                    ))}
                                                </RadioGroup>
                                                {deleteReasonValue === "other" && (
                                                  <div className="space-y-2">
                                                    <Label>Descreva o motivo</Label>
                                                    <Textarea value={deleteOtherDescription} onChange={(e) => setDeleteOtherDescription(e.target.value)} placeholder="Detalhes da exclusão..." className="h-20" />
                                                  </div>
                                                )}
                                            </div>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-xl px-8 font-bold" disabled={isDeleting || !deleteReasonValue || (deleteReasonValue === "other" && !deleteOtherDescription)}>
                                                    Confirmar Exclusão
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </>
                                  ) : (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button 
                                                type="button" 
                                                variant="destructive" 
                                                className="h-11 rounded-lg font-bold w-full col-span-2"
                                            >
                                                Excluir Definitivamente
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-2xl">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Exclusão Definitiva</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Este relato já está excluído. Deseja removê-lo permanentemente do banco de dados? Esta ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
                                                <AlertDialogAction 
                                                    onClick={handlePermanentDelete} 
                                                    className="bg-destructive text-destructive-foreground rounded-lg px-6 font-bold"
                                                >
                                                    {isDeletingPermanently ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                    Confirmar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </AccordionContent>
            )}
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
});

const EmptyState = ({ hasFilters }: { hasFilters: boolean }) => (
  <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-dashed border-border shadow-sm animate-in fade-in">
    <div className="bg-muted p-4 rounded-full mb-4">
      <Info className="h-8 w-8 text-muted-foreground opacity-50" />
    </div>
    <h3 className="text-lg font-bold text-foreground">
      {hasFilters ? "Nenhum relato encontrado" : "Nada por aqui"}
    </h3>
    <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
      {hasFilters 
        ? "Com os filtros selecionados, não há relatos no momento."
        : "Não há relatos no momento."}
    </p>
  </div>
);

export function DashboardClient({ 
    reports, 
    complaints = [], 
    showUpvote = true, 
    onSuccess 
}: { 
    reports: Report[], 
    complaints?: Complaint[], 
    showUpvote?: boolean, 
    onSuccess?: () => void 
}) {
  const { user } = useUser();
  const router = useRouter();
  const [upvotedReports, setUpvotedReports] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [bairroFilter, setBairroFilter] = useState<string>("all");
  const [sortOption, setSortOption] = useState<string>("recent");

  const handleUpvote = async (id: string, userId: string) => {
    try {
        if (upvotedReports.has(id)) {
          await clientDownvoteReport(id, userId);
          setUpvotedReports(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
        } else {
          await clientUpvoteReport(id, userId);
          setUpvotedReports(prev => new Set(prev).add(id));
        }
        if (onSuccess) onSuccess();
        router.refresh();
    } catch (error) {
        console.error("Erro ao votar:", error);
    }
  };

  const filteredReports = useMemo(() => {
    const applyFiltersAndSort = (list: Report[]) => {
      const filtered = list.filter(report => {
        const matchesCategory = categoryFilter === "all" || report.category === categoryFilter;
        const matchesBairro = bairroFilter === "all" || report.bairro === bairroFilter;
        return matchesCategory && matchesBairro;
      });

      return [...filtered].sort((a, b) => {
        if (sortOption === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortOption === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortOption === "upvotes") return b.upvotes - a.upvotes;
        return 0;
      });
    };

    return {
      under_review: applyFiltersAndSort(reports.filter(r => r.status === "UNDER_REVIEW")),
      pending: applyFiltersAndSort(reports.filter(r => r.status === "PENDING")),
      in_progress: applyFiltersAndSort(reports.filter(r => r.status === "IN_PROGRESS")),
      resolved: applyFiltersAndSort(reports.filter(r => r.status === "RESOLVED")),
      excluded: applyFiltersAndSort(reports.filter(r => r.status === "EXCLUDED")),
    };
  }, [reports, categoryFilter, bairroFilter, sortOption]);

  const clearFilters = () => {
    setCategoryFilter("all");
    setBairroFilter("all");
    setSortOption("recent");
  };

  const hasActiveFilters = categoryFilter !== "all" || bairroFilter !== "all" || sortOption !== "recent";

  return (
    <Tabs defaultValue="pending" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 overflow-x-auto pb-2">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-12 flex-nowrap w-max">
          {!showUpvote && (
            <TabsTrigger value="under_review" className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider">Em Análise</TabsTrigger>
          )}
          <TabsTrigger value="pending" className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider">Pendente</TabsTrigger>
          <TabsTrigger value="in_progress" className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider">Em Andamento</TabsTrigger>
          <TabsTrigger value="resolved" className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider">Resolvido</TabsTrigger>
          {!showUpvote && (
            <TabsTrigger value="moderation" className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Central de Moderação
            </TabsTrigger>
          )}
        </TabsList>

        <Popover>
          <PopoverTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 bg-card border px-4 h-12 rounded-2xl shadow-sm transition-all hover:bg-muted/50",
              hasActiveFilters ? "border-primary ring-1 ring-primary/20" : "border-border"
            )}>
              <Filter className={cn("h-4 w-4", hasActiveFilters ? "text-primary" : "text-muted-foreground")} />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Filtros</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-6 rounded-2xl border-border shadow-2xl" align="end" side="top">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Ordenar Por</Label>
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="h-10 rounded-xl bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="recent">Mais Recentes</SelectItem>
                    <SelectItem value="oldest">Mais Antigos</SelectItem>
                    <SelectItem value="upvotes">Mais Apoiados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Categoria</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 rounded-xl bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Bairro</Label>
                <Select value={bairroFilter} onValueChange={setBairroFilter}>
                  <SelectTrigger className="h-10 rounded-xl bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">Todos</SelectItem>
                    {PICUI_NEIGHBORHOODS.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button variant="outline" className="w-full rounded-xl h-10 text-[10px] font-black uppercase tracking-widest" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {!showUpvote && (
        <TabsContent value="under_review" className="space-y-6">
          {filteredReports.under_review.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} />
          ) : (
            filteredReports.under_review.map(report => (
              <ReportCard key={report.id} report={report} onUpvote={handleUpvote} isUpvoted={upvotedReports.has(report.id)} showUpvote={showUpvote} onSuccess={onSuccess} />
            ))
          )}
        </TabsContent>
      )}

      <TabsContent value="pending" className="space-y-6">
        {filteredReports.pending.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} />
        ) : (
          filteredReports.pending.map(report => (
            <ReportCard key={report.id} report={report} onUpvote={handleUpvote} isUpvoted={upvotedReports.has(report.id)} showUpvote={showUpvote} onSuccess={onSuccess} />
          ))
        )}
      </TabsContent>

      <TabsContent value="in_progress" className="space-y-6">
        {filteredReports.in_progress.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} />
        ) : (
          filteredReports.in_progress.map(report => (
            <ReportCard key={report.id} report={report} onUpvote={handleUpvote} isUpvoted={upvotedReports.has(report.id)} showUpvote={showUpvote} onSuccess={onSuccess} />
          ))
        )}
      </TabsContent>

      <TabsContent value="resolved" className="space-y-6">
        {filteredReports.resolved.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} />
        ) : (
          filteredReports.resolved.map(report => (
            <ReportCard key={report.id} report={report} onUpvote={handleUpvote} isUpvoted={upvotedReports.has(report.id)} showUpvote={showUpvote} onSuccess={onSuccess} />
          ))
        )}
      </TabsContent>

      {!showUpvote && (
        <TabsContent value="moderation">
          <Tabs defaultValue="excluded">
            <TabsList className="bg-muted/10 p-4 border-b border-border w-full flex justify-start">
              <TabsTrigger value="excluded" className="text-xs uppercase tracking-widest font-bold">Relatos Excluídos</TabsTrigger>
              <TabsTrigger value="complaints" className="text-xs uppercase tracking-widest font-bold">Relatos Denunciados</TabsTrigger>
            </TabsList>
            <TabsContent value="excluded" className="p-6 space-y-6">
              {filteredReports.excluded.length === 0 ? (
                <EmptyState hasFilters={hasActiveFilters} />
              ) : (
                filteredReports.excluded.map(report => (
                  <ReportCard key={report.id} report={report} onUpvote={handleUpvote} isUpvoted={upvotedReports.has(report.id)} showUpvote={showUpvote} onSuccess={onSuccess} />
                ))
              )}
            </TabsContent>
            <TabsContent value="complaints" className="p-6 space-y-6">
              {complaints.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-2xl border border-dashed border-border shadow-sm animate-in fade-in">
                  <div className="bg-muted p-4 rounded-full mb-4">
                    <ShieldCheck className="h-8 w-8 text-muted-foreground opacity-50" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Nenhuma denúncia</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                    Não há denúncias registradas no momento.
                  </p>
                </div>
              ) : (
                complaints.map(complaint => (
                  <Card key={complaint.id} className="p-6 border-orange-500/20 bg-card rounded-2xl">
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="text-lg font-bold">Denúncia: {complaint.reason}</h3>
                              <p className="text-sm text-muted-foreground">Usuário: {complaint.denouncedUserEmail}</p>
                              {complaint.details && <p className="text-sm italic mt-2">"{complaint.details}"</p>}
                          </div>
                          <Button asChild variant="outline" size="sm" className="rounded-lg h-9 font-bold border-primary/20 text-primary hover:bg-primary/5">
                              <Link href={`/dashboard#report-${complaint.reportId}`}>Ver Relato</Link>
                          </Button>
                      </div>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </TabsContent>
      )}
    </Tabs>
  );
}
