
"use client";

import { useOptimistic, useState, useRef, useActionState, useEffect, useTransition, startTransition, memo, useMemo, useCallback } from "react";
import Image from "next/image";
import { updateReportStatus, upvoteReportAction, downvoteReportAction, deleteReportAction } from "@/lib/actions";
import { type Report, type ReportStatus } from "@/lib/types";
import { categories, getCategory } from "@/lib/categories";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./ui/button";
import { ThumbsUp, Camera, Upload, Loader2, Filter, Trash2, MapPin, Settings2, Clock, CheckCircle2, ShieldAlert, Mail, Maximize2, Info, ImagePlus, User, ChevronRight } from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { statusConfig, StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { useUser } from "@/firebase";
import { isEmailEmployee } from "@/lib/config";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useRouter } from "next/navigation";
import { ReportTime } from "./report-time";
import { Separator } from "./ui/separator";
import Link from "next/link";
import dynamic from 'next/dynamic';

const LeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-xl" />
});

const STATUS_PROGRESSION: Record<ReportStatus, ReportStatus | null> = {
  UNDER_REVIEW: "PENDING",
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "RESOLVED",
  RESOLVED: null,
};

const PICUI_NEIGHBORHOODS = [
  "Cenecista", "Centro", "JK", "Limeira", "Monte Santo", 
  "Pedro Salustino de Lima", "Pedro Tomáz Dantas", "São José", "Zona Rural"
].sort((a, b) => a.localeCompare(b));

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

  const [editCategory, setEditCategory] = useState(report.category);
  const [editProblem, setEditProblem] = useState(report.problem);
  const [editBairro, setEditBairro] = useState(report.bairro);
  const [editLocation, setEditLocation] = useState(report.location);
  const [editDescription, setEditDescription] = useState(report.description);
  const [editLat, setEditLat] = useState(report.latitude);
  const [editLng, setEditLng] = useState(report.longitude);

  const editProblems = useMemo(() => getCategory(editCategory)?.problems || [], [editCategory]);

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
        
        const timeout = setTimeout(() => {
          if (onSuccess) onSuccess();
          router.refresh();
          window.location.reload();
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
    startDeleteTransition(async () => {
        const result = await deleteReportAction(report.id);
        if (result.success) {
            toast({ title: "Relatório removido", description: "O registro indevido foi excluído do sistema." });
            router.refresh();
            if (onSuccess) onSuccess();
            window.location.reload();
        } else {
            toast({ variant: "destructive", title: "Erro ao excluir", description: result.message });
        }
    });
  };

  const isOwner = user?.uid === report.userId;
  const isEmployee = isEmailEmployee(user?.email);
  const canDelete = isOwner && report.status === 'UNDER_REVIEW';
  const displayCity = report.city === 'Picui' ? 'Picuí' : report.city;
  const nextAllowedStatus = STATUS_PROGRESSION[report.status];
  const isPhotoEnabled = selectedStatus === 'RESOLVED';
  const isPublic = report.status !== 'UNDER_REVIEW';

  return (
    <Card 
      className="overflow-hidden bg-card border-border shadow-sm transition-all duration-300 hover:shadow-lg rounded-2xl animate-in fade-in" 
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
                        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden border-none bg-transparent shadow-none">
                            <DialogHeader className="sr-only">
                                <DialogTitle>Visualização da Foto</DialogTitle>
                                <DialogDescription>Foto em alta resolução do problema relatado.</DialogDescription>
                            </DialogHeader>
                            <div className="relative w-full h-full flex items-center justify-center p-4">
                                <img 
                                    src={report.photoUrl} 
                                    alt="Foto em tamanho real" 
                                    className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in duration-300" 
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

                    <div className="mt-auto pt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                        <div className="flex items-center gap-5">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold uppercase tracking-tight">
                                <Clock className="h-3.5 w-3.5" />
                                <ReportTime date={new Date(report.createdAt)} />
                            </div>
                            
                            {report.status === 'RESOLVED' && report.photoAfterUrl && (
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Ver Solução
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl p-2 rounded-2xl bg-card border-border">
                                        <DialogHeader className="sr-only">
                                            <DialogTitle>Foto da Solução</DialogTitle>
                                            <DialogDescription>Registro fotográfico do problema resolvido.</DialogDescription>
                                        </DialogHeader>
                                        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                                            <Image src={report.photoAfterUrl} alt="Trabalho concluído" fill className="object-contain" />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                            {isPublic && (
                                <Button asChild variant="ghost" size="sm" className="h-10 px-4 text-primary font-bold hover:bg-primary/10 rounded-xl transition-all">
                                    <Link href={`/?lat=${report.latitude}&lng=${report.longitude}#map-section`}>
                                        <MapPin className="h-4 w-4 mr-2" /> No mapa
                                    </Link>
                                </Button>
                            )}

                            {canDelete && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive h-10 px-4 hover:bg-destructive/10 rounded-xl font-bold">
                                            <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-3xl bg-card border-border shadow-2xl p-8">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="text-2xl font-bold">Excluir Relatório?</AlertDialogTitle>
                                            <AlertDialogDescription className="text-base pt-2">
                                              Esta ação é irreversível e removerá permanentemente o relato do sistema.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className="mt-6 gap-3">
                                            <AlertDialogCancel className="rounded-xl h-12 px-6">Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-xl h-12 px-8 font-bold shadow-lg">Confirmar Exclusão</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                            
                            {showUpvote ? (
                                <Button 
                                  variant={isUpvoted ? "default" : "outline"} 
                                  size="sm" 
                                  onClick={(e) => { e.stopPropagation(); onUpvote(report.id); }}
                                  className={cn("rounded-xl font-bold h-10 px-6 text-xs transition-all shadow-sm active:scale-95", isUpvoted ? "bg-primary hover:bg-primary/90" : "bg-muted/30 border-border hover:bg-muted")}
                                >
                                    <ThumbsUp className={cn("h-4 w-4 mr-2", isUpvoted && "fill-current")} />
                                    Apoiar ({report.upvotes})
                                </Button>
                            ) : (
                                <AccordionTrigger className="py-0 px-6 h-10 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 hover:no-underline flex items-center gap-2 text-xs transition-all active:scale-95">
                                    <Settings2 className="h-4 w-4" /> Gerenciar Relato
                                </AccordionTrigger>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {!showUpvote && (
            <AccordionContent className="bg-muted/10 border-t border-border/50">
              <form action={formAction} ref={formRef}>
                <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto">
                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                        {/* Coluna de Inputs: Mais compacta */}
                        <div className="lg:col-span-6 space-y-4">
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

                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase pl-1">Descrição</Label>
                                <Textarea name="description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="min-h-[80px] rounded-lg bg-card border-border resize-none p-3 text-sm" />
                            </div>
                        </div>

                        {/* Coluna Lateral: Mapa e Ações Integradas */}
                        <div className="lg:col-span-6 space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black text-muted-foreground uppercase pl-1">Localização no Mapa</Label>
                                <div className="h-[180px] rounded-lg overflow-hidden border border-border relative z-0">
                                    <LeafletMap interactive={true} onLocationSelect={(lat, lng) => { setEditLat(lat); setEditLng(lng); }} selectedLocation={{ lat: editLat, lng: editLng }} />
                                </div>
                                <input type="hidden" name="latitude" value={editLat} />
                                <input type="hidden" name="longitude" value={editLng} />
                            </div>

                            <div className="p-4 rounded-xl bg-card border border-border shadow-sm space-y-4">
                                <div className="flex flex-col sm:flex-row items-end gap-3">
                                    <div className="space-y-1.5 w-full sm:flex-1">
                                        <Label className="text-[10px] font-black text-muted-foreground uppercase">Alterar Status</Label>
                                        <Select name="status" value={selectedStatus} onValueChange={(val) => setSelectedStatus(val as ReportStatus)}>
                                            <SelectTrigger className="h-10 rounded-lg bg-background border-primary/20 font-bold"><SelectValue /></SelectTrigger>
                                            <SelectContent className="rounded-lg">
                                                {Object.entries(statusConfig).map(([key, { label }]) => (
                                                    <SelectItem key={key} value={key} disabled={key !== nextAllowedStatus && key !== report.status}>
                                                        {label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <AlertDialog open={isStatusConfirmOpen} onOpenChange={setIsStatusConfirmOpen}>
                                            <AlertDialogTrigger asChild>
                                                <Button type="button" disabled={isPending} className="h-10 flex-1 sm:w-32 rounded-lg font-bold bg-primary hover:bg-primary/90">
                                                    {isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
                                                    <span className="ml-2">Salvar</span>
                                                </Button>
                                            </AlertDialogTrigger>
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

                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button type="button" variant="ghost" className="h-10 w-10 p-0 rounded-lg text-destructive hover:bg-destructive/10" title="Excluir Registro">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="rounded-2xl">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="text-destructive">Excluir Permanentemente?</AlertDialogTitle>
                                                    <AlertDialogDescription>Esta ação é irreversível e removerá o relato de todo o sistema.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="rounded-lg">Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white rounded-lg px-6 font-bold">Sim, Excluir</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>

                                {isPhotoEnabled && (
                                    <div className="space-y-1.5 animate-in slide-in-from-top-2 border-t border-border pt-4 mt-2">
                                        <Label className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2">
                                            <ImagePlus className="h-3 w-3" /> Foto da Solução (Obrigatório)
                                        </Label>
                                        <div className="h-10 rounded-lg border border-dashed border-emerald-500/40 flex items-center justify-center relative overflow-hidden bg-emerald-500/5 hover:bg-emerald-500/10 cursor-pointer transition-colors">
                                            {photoAfterPreview ? (
                                                <span className="text-[10px] font-bold text-emerald-700">✓ Foto Selecionada</span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-emerald-700 uppercase">Anexar Registro de Reparo</span>
                                            )}
                                            <input name="photoAfter" type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handlePhotoChange} />
                                        </div>
                                    </div>
                                )}
                            </div>
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

ReportCard.displayName = "ReportCard";

type OptimisticUpdate = { type: 'upvote', id: string, amount: 1 | -1 } | { type: 'status', reportId: string, newStatus: ReportStatus };

const LOCAL_STORAGE_UPVOTES_KEY = 'infra_mais_upvoted_reports';

export function DashboardClient({ reports, showUpvote = true, onSuccess }: { reports: Report[], showUpvote?: boolean, onSuccess?: () => void }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<ReportStatus>(showUpvote ? "PENDING" : "UNDER_REVIEW");
  const [upvotedReports, setUpvotedReports] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'upvotes'>('newest');
  
  const tabsRef = useRef<HTMLDivElement>(null);

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
      try { setUpvotedReports(new Set(JSON.parse(saved))); } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_UPVOTES_KEY, JSON.stringify(Array.from(upvotedReports)));
  }, [upvotedReports]);

  const handleUpvote = useCallback((reportId: string) => {
    const isAlreadyUpvoted = upvotedReports.has(reportId);
    setUpvotedReports(prev => {
        const next = new Set(prev);
        if (isAlreadyUpvoted) next.delete(reportId);
        else next.add(reportId);
        return next;
    });

    startTransition(async () => {
      setOptimisticReports({ type: 'upvote', id: reportId, amount: isAlreadyUpvoted ? -1 : 1 });
      const result = isAlreadyUpvoted ? await downvoteReportAction(reportId) : await upvoteReportAction(reportId);
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

  const filteredReports = useMemo(() => {
      return sortedReports.filter(r => r.status === activeTab);
  }, [sortedReports, activeTab]);

  return (
    <div className="space-y-10" ref={tabsRef}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReportStatus)} className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-10">
            <TabsList className="bg-muted/50 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar shadow-inner border border-border/40">
                {!showUpvote && (
                  <TabsTrigger value="UNDER_REVIEW" className="rounded-xl px-6 py-3 text-sm font-bold transition-all data-[state=active]:bg-slate-600 data-[state=active]:text-white data-[state=active]:shadow-lg">Em Análise</TabsTrigger>
                )}
                <TabsTrigger value="PENDING" className="rounded-xl px-6 py-3 text-sm font-bold transition-all data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg">Pendente</TabsTrigger>
                <TabsTrigger value="IN_PROGRESS" className="rounded-xl px-6 py-3 text-sm font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg">Em Andamento</TabsTrigger>
                <TabsTrigger value="RESOLVED" className="rounded-xl px-6 py-3 text-sm font-bold transition-all data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg">Resolvido</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
              <div className="flex items-center gap-2.5 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-70"><Filter className="h-4 w-4" /> Ordenar</div>
              <Select onValueChange={(v) => setSortBy(v as any)} defaultValue={sortBy}>
                <SelectTrigger className="h-12 w-[200px] bg-card border-border rounded-xl shadow-sm focus:ring-primary/10 transition-all"><SelectValue /></SelectTrigger>
                <SelectContent side="bottom" position="popper" className="bg-card border-border rounded-xl shadow-2xl z-[2100]">
                  <SelectItem value="newest" className="font-medium">Mais Recentes</SelectItem>
                  <SelectItem value="oldest" className="font-medium">Mais Antigos</SelectItem>
                  <SelectItem value="upvotes" className="font-medium">Mais Apoiados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-6">
            <TabsContent value={activeTab} className="mt-0 outline-none">
                <div className="grid gap-6">
                  {filteredReports.length > 0 ? (
                    filteredReports.map(r => (
                      <ReportCard key={r.id} report={r} onUpvote={handleUpvote} onStatusUpdate={handleStatusUpdate} onSuccess={onSuccess} isUpvoted={upvotedReports.has(r.id)} showUpvote={showUpvote} />
                    ))
                  ) : (
                    <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed border-border/60 shadow-inner flex flex-col items-center gap-4">
                      <div className="p-4 bg-muted/40 rounded-full">
                        <Filter className="h-8 w-8 text-muted-foreground/40" />
                      </div>
                      <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Nenhum relato nesta categoria.</p>
                    </div>
                  )}
                </div>
            </TabsContent>
          </div>
      </Tabs>
    </div>
  );
}
