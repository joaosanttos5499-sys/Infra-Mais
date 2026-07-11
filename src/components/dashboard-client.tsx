"use client";

import { useOptimistic, useState, useRef, useActionState, useEffect, useTransition, startTransition, memo, useMemo, useCallback } from "react";
import Image from "next/image";
import { updateReportStatus, upvoteReportAction, downvoteReportAction, deleteReportAction, submitComplaintAction } from "@/lib/actions";
import { type Report, type ReportStatus, type Complaint } from "@/lib/types";
import { categories, getCategory } from "@/lib/categories";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { ThumbsUp, Camera, Upload, Loader2, Filter, Trash2, MapPin, Settings2, Clock, CheckCircle2, ShieldAlert, Mail, Maximize2, Info, ImagePlus, User, ChevronRight, Flag, AlertTriangle, ShieldCheck, MessageSquare, ArrowRight, Sparkles } from "lucide-react";
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

  const [formState, formAction, isPending] = useActionState(async (prev: any, formData: FormData) => {
    const status = formData.get("status") as ReportStatus;
    if (onStatusUpdate && status !== report.status) {
        onStatusUpdate(report.id, status);
    }
    return updateReportStatus(prev, { reportId: report.id, formData });
  }, undefined);

  const formRef = useRef<HTMLFormElement>(null);

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

    setIsReporting(false);
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
    if(formState?.success === false && formState.message) {
        toast({ title: "Erro ao Atualizar", description: formState.message, variant: "destructive" });
    } else if (formState?.success === true && formState.message) {
        toast({ title: "Sucesso", description: formState.message });
        setIsStatusConfirmOpen(false);
        
        const timeout = setTimeout(() => {
          if (onSuccess) onSuccess();
          router.refresh();
        }, 800);

        return () => clearTimeout(timeout);
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
    if (!deleteReasonValue) {
        toast({ variant: "destructive", title: "Motivo obrigatório", description: "Selecione um motivo para a exclusão." });
        return;
    }
    if (deleteReasonValue === "other" && !deleteOtherDescription.trim()) {
        toast({ variant: "destructive", title: "Descrição obrigatória", description: "Informe o motivo no campo de descrição." });
        return;
    }

    const finalReason = deleteReasonValue === "other" ? deleteOtherDescription : EXCLUSION_REASONS.find(r => r.value === deleteReasonValue)?.label || deleteReasonValue;

    startDeleteTransition(async () => {
        const result = await deleteReportAction(report.id, report.userId, finalReason, user?.uid || "unknown");
        if (result.success) {
            toast({ title: "Relatório removido", description: "O registro foi movido para a Central de Moderação." });
            setIsDeleteDialogOpen(false);
            if (onSuccess) onSuccess();
        } else {
            toast({ variant: "destructive", title: "Erro ao excluir", description: result.message });
        }
    });
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
                    <div className="absolute top-4 left-4 z-10">
                        <StatusBadge status={report.status} />
                    </div>

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

                <div className="p-6 md:p-8 flex flex-col flex-grow min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="space-y-1.5 min-w-0">
                            <h3 className="font-bold text-xl text-foreground leading-tight tracking-tight truncate">
                                {problem?.label || report.problem}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground font-semibold">
                                {category?.icon && <category.icon className="h-4 w-4" style={{ color: category?.color }} />}
                                <span className="uppercase tracking-wider text-[11px] opacity-80">{category?.label || report.category}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 py-4 border-y border-border/50 mt-2">
                        <div className="flex items-center gap-2.5 text-sm font-bold text-foreground/90">
                            <MapPin className="h-4 w-4 text-primary shrink-0" />
                            <span>{displayCity} - {report.bairro}</span>
                        </div>
                        {isEmployee && (
                          <div className="flex items-center gap-2.5 text-xs text-muted-foreground pt-0.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                              <span className="font-medium">{report.relatorEmail}</span>
                          </div>
                        )}
                    </div>

                    {isEmployee && report.summary && (
                      <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                          "{report.summary}"
                        </p>
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
                                  onClick={(e) => { e.stopPropagation(); onUpvote(report.id, report.userId); }}
                                  className={cn("rounded-xl font-bold h-10 px-6 text-xs transition-all shadow-sm active:scale-95", isUpvoted ? "bg-primary hover:bg-primary/90" : "bg-muted/30 border-border hover:bg-muted")}
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
              <form action={formAction} ref={formRef}>
                <input type="hidden" name="reportUserId" value={report.userId} />
                <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
                    {report.summary && (
                      <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold text-primary uppercase tracking-widest">Resumo Inteligente (IA)</span>
                        </div>
                        <p className="text-sm text-foreground leading-relaxed italic">
                          "{report.summary}"
                        </p>
                      </div>
                    )}

                    <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                        <div className="lg:col-span-8 flex flex-col gap-4">
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

                            <div className="flex-grow flex flex-col space-y-1.5">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase pl-1">Descrição</Label>
                                <Textarea 
                                  name="description" 
                                  value={editDescription} 
                                  onChange={(e) => setEditDescription(e.target.value)} 
                                  className="flex-grow min-h-[300px] rounded-lg bg-card border-border resize-none p-3 text-sm" 
                                />
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
                                    <Button type="button" onClick={() => setIsStatusConfirmOpen(true)} disabled={isPending} className="h-11 rounded-lg font-bold bg-primary hover:bg-primary/90 shadow-md w-full">
                                        {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
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
                                                <AlertDialogAction onClick={() => formRef.current?.requestSubmit()} disabled={!isStatusConfirmEnabled || isPending} className="rounded-lg px-6 font-bold">
                                                    {isStatusConfirmEnabled ? "Confirmar" : `Aguarde (${statusCountdown}s)`}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>

                                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border mt-2">
                                  {report.status !== 'EXCLUDED' && (
                                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          className="h-11 rounded-lg border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive font-bold gap-2 w-full"
                                        >
                                            <Trash2 className="h-4 w-4" /> Excluir Relato
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="rounded-2xl sm:rounded-3xl bg-card border-border shadow-2xl p-6 sm:p-8 max-w-[95vw] sm:max-w-xl max-h-[80vh] overflow-y-auto no-scrollbar">
                                          <AlertDialogHeader>
                                              <AlertDialogTitle className="text-2xl font-bold">Excluir Relato</AlertDialogTitle>
                                              <AlertDialogDescription className="text-base pt-2">
                                                Selecione o motivo da exclusão deste relato.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          
                                          <div className="py-4 space-y-4">
                                              <div className="space-y-3">
                                                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Motivo da exclusão</Label>
                                                  <RadioGroup value={deleteReasonValue} onValueChange={setDeleteReasonValue} className="grid gap-2">
                                                      {EXCLUSION_REASONS.map((reason) => (
                                                          <div key={reason.value} className="flex items-center space-x-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setDeleteReasonValue(reason.value)}>
                                                              <RadioGroupItem value={reason.value} id={`del-reason-${reason.value}`} />
                                                              <Label htmlFor={`del-reason-${reason.value}`} className="flex-grow cursor-pointer font-medium">{reason.label}</Label>
                                                          </div>
                                                      ))}
                                                  </RadioGroup>
                                              </div>

                                              {deleteReasonValue === "other" && (
                                                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                      <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição do motivo</Label>
                                                      <Textarea 
                                                          placeholder="Descreva o motivo detalhadamente..." 
                                                          value={deleteOtherDescription}
                                                          onChange={(e) => setDeleteOtherDescription(e.target.value)}
                                                          className="min-h-[100px] rounded-xl bg-muted/20 border-border resize-none"
                                                      />
                                                  </div>
                                              )}
                                          </div>

                                          <AlertDialogFooter className="mt-6 gap-3">
                                              <AlertDialogCancel className="rounded-xl h-12 px-6">Cancelar</AlertDialogCancel>
                                              <AlertDialogAction 
                                                  onClick={(e) => { e.preventDefault(); handleDelete(); }} 
                                                  className="bg-destructive text-destructive-foreground rounded-xl h-12 px-8 font-bold shadow-lg"
                                                  disabled={isDeleting || !deleteReasonValue || (deleteReasonValue === 'other' && !deleteOtherDescription.trim())}
                                              >
                                                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                                  Confirmar Exclusão
                                              </AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}

                                  <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                                    <DialogTrigger asChild>
                                      <Button 
                                          type="button" 
                                          variant="outline" 
                                          className="h-11 rounded-lg border-orange-500/20 text-orange-600 hover:bg-orange-500/10 hover:border-orange-500 font-bold gap-2 w-full"
                                      >
                                          <Flag className="h-4 w-4" /> 🚩 Denunciar Usuário
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="rounded-2xl sm:max-w-md">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-orange-600">
                                          <ShieldAlert className="h-5 w-5" /> Denunciar Usuário
                                        </DialogTitle>
                                        <DialogDescription>
                                          Utilize esta opção somente em casos de uso indevido da plataforma ou violação das normas.
                                        </DialogDescription>
                                      </DialogHeader>
                                      
                                      <div className="py-4 space-y-4">
                                        <div className="space-y-3">
                                          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Motivo da denúncia</Label>
                                          <RadioGroup value={reportReason} onValueChange={setReportReason} className="grid gap-2">
                                            {REPORT_REASONS.map((reason) => (
                                              <div key={reason.value} className="flex items-center space-x-3 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setReportReason(reason.value)}>
                                                <RadioGroupItem value={reason.value} id={`reason-${reason.value}`} />
                                                <Label htmlFor={`reason-${reason.value}`} className="flex-grow cursor-pointer font-medium">{reason.label}</Label>
                                              </div>
                                            ))}
                                          </RadioGroup>
                                        </div>

                                        {reportReason === "other" && (
                                          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição obrigatória</Label>
                                            <Textarea 
                                              placeholder="Descreva o problema de forma detalhada..." 
                                              value={reportDetails}
                                              onChange={(e) => setReportDetails(e.target.value)}
                                              className="min-h-[80px] rounded-xl bg-muted/20 border-border resize-none"
                                            />
                                          </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Observações do funcionário (opcional)</Label>
                                            <Textarea 
                                              placeholder="Informações adicionais para a análise superior..." 
                                              value={reportObservations}
                                              onChange={(e) => setReportObservations(e.target.value)}
                                              className="min-h-[80px] rounded-xl bg-muted/20 border-border resize-none"
                                            />
                                        </div>
                                      </div>

                                      <DialogFooter className="gap-2 sm:gap-0">
                                        <Button variant="ghost" onClick={() => setIsReportDialogOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
                                        <Button onClick={handleReportSubmit} disabled={isReporting || !reportReason || (reportReason === 'other' && !reportDetails.trim())} className="rounded-xl font-bold bg-orange-600 hover:bg-orange-700">
                                          {isReporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Flag className="h-4 w-4 mr-2" />}
                                          Enviar Denúncia
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                            </Card>
                        </div>
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
  const isEmployee = isEmailEmployee(user?.email);
  const [upvotedReports, setUpvotedReports] = useState<Set<string>>(new Set());

  const handleUpvote = async (id: string, userId: string) => {
    if (upvotedReports.has(id)) {
      await downvoteReportAction(id, userId);
      setUpvotedReports(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      await upvoteReportAction(id, userId);
      setUpvotedReports(prev => new Set(prev).add(id));
    }
    if (onSuccess) onSuccess();
  };

  const filteredReports = useMemo(() => ({
    under_review: reports.filter(r => r.status === "UNDER_REVIEW"),
    pending: reports.filter(r => r.status === "PENDING"),
    in_progress: reports.filter(r => r.status === "IN_PROGRESS"),
    resolved: reports.filter(r => r.status === "RESOLVED"),
    excluded: reports.filter(r => r.status === "EXCLUDED"),
  }), [reports]);

  return (
    <Tabs defaultValue="pending" className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 overflow-x-auto pb-2">
        <TabsList className="bg-muted/50 p-1 rounded-2xl h-12 flex-nowrap w-max">
          {isEmployee && (
            <TabsTrigger value="under_review" className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider">Em Análise</TabsTrigger>
          )}
          <TabsTrigger value="pending" className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider">Pendente</TabsTrigger>
          <TabsTrigger value="in_progress" className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider">Em Andamento</TabsTrigger>
          <TabsTrigger value="resolved" className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider">Resolvido</TabsTrigger>
          {isEmployee && (
            <TabsTrigger value="moderation" className="rounded-xl h-10 px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Central de Moderação
            </TabsTrigger>
          )}
        </TabsList>
        <div className="flex items-center gap-3 self-end sm:self-auto bg-card border border-border px-4 h-12 rounded-2xl shadow-sm">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Filtros</span>
            <Separator orientation="vertical" className="h-4 bg-border mx-1" />
            <button className="text-[10px] font-black uppercase text-primary hover:underline">Limpar</button>
        </div>
      </div>

      {isEmployee && (
        <TabsContent value="under_review" className="space-y-6">
          {filteredReports.under_review.length === 0 ? (
            <EmptyState message="Nenhum relato em análise no momento." />
          ) : (
            filteredReports.under_review.map(report => (
              <ReportCard 
                key={report.id} 
                report={report} 
                onUpvote={handleUpvote} 
                isUpvoted={upvotedReports.has(report.id)} 
                showUpvote={showUpvote} 
                onSuccess={onSuccess}
              />
            ))
          )}
        </TabsContent>
      )}

      <TabsContent value="pending" className="space-y-6">
        {filteredReports.pending.length === 0 ? (
          <EmptyState message="Nenhum relato pendente no momento." />
        ) : (
          filteredReports.pending.map(report => (
            <ReportCard 
              key={report.id} 
              report={report} 
              onUpvote={handleUpvote} 
              isUpvoted={upvotedReports.has(report.id)} 
              showUpvote={showUpvote} 
              onSuccess={onSuccess}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="in_progress" className="space-y-6">
        {filteredReports.in_progress.length === 0 ? (
          <EmptyState message="Nenhum relato em andamento no momento." />
        ) : (
          filteredReports.in_progress.map(report => (
            <ReportCard 
              key={report.id} 
              report={report} 
              onUpvote={handleUpvote} 
              isUpvoted={upvotedReports.has(report.id)} 
              showUpvote={showUpvote} 
              onSuccess={onSuccess}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="resolved" className="space-y-6">
        {filteredReports.resolved.length === 0 ? (
          <EmptyState message="Nenhum relato resolvido no momento." />
        ) : (
          filteredReports.resolved.map(report => (
            <ReportCard 
              key={report.id} 
              report={report} 
              onUpvote={handleUpvote} 
              isUpvoted={upvotedReports.has(report.id)} 
              showUpvote={showUpvote} 
              onSuccess={onSuccess}
            />
          ))
        )}
      </TabsContent>

      {isEmployee && (
        <TabsContent value="moderation">
          <Card className="rounded-2xl border-orange-500/20 bg-card/50 overflow-hidden">
            <Tabs defaultValue="excluded" className="w-full">
              <div className="bg-muted/10 p-4 border-b border-border">
                <TabsList className="bg-transparent h-auto p-0 gap-8">
                  <TabsTrigger 
                    value="excluded" 
                    className="data-[state=active]:text-red-600 data-[state=active]:border-b-2 data-[state=active]:border-red-600 rounded-none bg-transparent px-0 pb-2 h-auto text-sm font-bold uppercase tracking-widest border-b-2 border-transparent transition-all"
                  >
                    Relatos Excluídos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="complaints" 
                    className="data-[state=active]:text-orange-500 data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none bg-transparent px-0 pb-2 h-auto text-sm font-bold uppercase tracking-widest border-b-2 border-transparent transition-all"
                  >
                    Relatos Denunciados
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="excluded" className="p-6 space-y-6">
                {filteredReports.excluded.length === 0 ? (
                  <EmptyState message="Nenhum relato excluído para exibir." />
                ) : (
                  filteredReports.excluded.map(report => (
                    <ReportCard 
                      key={report.id} 
                      report={report} 
                      onUpvote={handleUpvote} 
                      isUpvoted={upvotedReports.has(report.id)} 
                      showUpvote={showUpvote} 
                      onSuccess={onSuccess}
                    />
                  ))
                )}
              </TabsContent>

              <TabsContent value="complaints" className="p-6 space-y-6">
                {complaints.length === 0 ? (
                  <EmptyState message="Nenhuma denúncia registrada no momento." />
                ) : (
                  complaints.map(complaint => (
                    <Card key={complaint.id} className="p-6 border-orange-500/20 bg-card rounded-2xl shadow-sm">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="bg-orange-500/10 p-4 rounded-xl flex items-center justify-center shrink-0">
                          <Flag className="h-8 w-8 text-orange-600" />
                        </div>
                        <div className="flex-grow space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-bold text-foreground">Denúncia: {complaint.reason}</h3>
                              <p className="text-sm text-muted-foreground font-medium">Usuário Denunciado: {complaint.denouncedUserEmail}</p>
                            </div>
                            <span className="text-xs font-bold text-muted-foreground uppercase bg-muted px-3 py-1 rounded-full">
                                {complaint.status === 'PENDING' ? 'Pendente de análise' : 'Resolvida'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/30 p-4 rounded-xl border border-border">
                            <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5" /> Registrado por: {complaint.reporterUserId === user?.uid ? 'Você' : 'Funcionário'}
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" /> <ReportTime date={new Date(complaint.createdAt)} />
                            </div>
                          </div>

                          {complaint.details && (
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Descrição do motivo:</p>
                              <div className="p-4 bg-muted/20 border border-border rounded-xl text-sm italic">
                                "{complaint.details}"
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end gap-3 pt-2">
                            <Button asChild variant="outline" size="sm" className="rounded-lg font-bold">
                                <Link href={`/dashboard#report-${complaint.reportId}`}>
                                    <MessageSquare className="h-4 w-4 mr-2" /> Abrir Relato Relacionado
                                </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </TabsContent>
      )}
    </Tabs>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card/50 rounded-3xl border border-dashed border-border shadow-inner animate-in fade-in zoom-in duration-500">
      <div className="bg-muted p-6 rounded-full mb-6">
        <Filter className="h-10 w-10 text-muted-foreground/30" />
      </div>
      <p className="text-lg font-bold text-foreground">{message}</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        Continue acompanhando as atualizações da comunidade. Novas ocorrências aparecerão aqui assim que forem registradas.
      </p>
    </div>
  );
}