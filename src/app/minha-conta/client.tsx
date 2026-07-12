
"use client";

import { useUser, useAuth } from "@/firebase";
import { type Report, type UserProfile } from "@/lib/types";
import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, MapPin, Clock, Mail, Calendar, ShieldAlert, AlertTriangle, Eye, EyeOff, Maximize2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getCategory } from "@/lib/categories";
import Image from "next/image";
import { StatusBadge } from "@/components/status-badge";
import { ReportTime } from "@/components/report-time";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UpdateProfileSchema } from "@/lib/schemas";
import { updateUserProfileAction, deleteReportAction, deleteAccountAction } from "@/lib/actions";
import { getUserById, deleteReportPermanently as clientDeleteReportPermanently } from "@/lib/data";
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createAvatarSvg } from "@/lib/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { isEmailEmployee } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

const LOCAL_STORAGE_ACCOUNTS_KEY = 'infra_mais_saved_accounts';

const statusBorderColors: Record<string, string> = {
  UNDER_REVIEW: "border-l-slate-400",
  PENDING: "border-l-amber-500",
  IN_PROGRESS: "border-l-primary",
  RESOLVED: "border-l-emerald-500",
  EXCLUDED: "border-l-destructive",
};

function MyReportItem({ report }: { report: Report }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isDeleting, startDeleteTransition] = useTransition();
    const category = getCategory(report.category);
    const problem = category?.problems.find(p => p.value === report.problem);
    const displayCity = report.city === 'Picui' ? 'Picuí' : report.city;

    // O usuário pode excluir permanentemente se estiver em análise ou se já estiver excluído (para limpar a lista)
    const canDelete = report.status === 'UNDER_REVIEW' || report.status === 'EXCLUDED';
    const isPublic = report.status !== 'UNDER_REVIEW' && report.status !== 'EXCLUDED';

    const handleDelete = async () => {
        startDeleteTransition(async () => {
            try {
                const success = await clientDeleteReportPermanently(report.id, report.userId);
                if (success) {
                    toast({ title: "Relatório removido", description: "O relato foi excluído permanentemente do sistema." });
                    router.refresh();
                } else {
                    toast({ variant: "destructive", title: "Erro ao excluir", description: "Falha ao remover o relato." });
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Erro ao excluir", description: "Sem permissão para excluir este relato." });
            }
        });
    };

    return (
        <div className={cn(
            "flex flex-col sm:flex-row gap-6 border border-border border-l-4 rounded-2xl p-5 bg-card relative transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-primary/10 group animate-in fade-in slide-in-from-bottom-4",
            statusBorderColors[report.status] || "border-l-slate-400"
        )}>
            <div className="relative w-full sm:w-40 h-44 sm:h-auto rounded-xl overflow-hidden shrink-0 shadow-sm bg-muted group/photo">
                <Image
                    src={report.photoUrl}
                    alt={report.description || "Foto do problema"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover/photo:scale-110"
                />
                <Dialog>
                    <DialogTrigger asChild>
                        <button 
                            className="absolute bottom-2 right-2 z-20 bg-black/60 hover:bg-black/80 text-white p-2 rounded-lg opacity-0 group-hover/photo:opacity-100 transition-all backdrop-blur-md scale-90 group-hover/photo:scale-100"
                            title="Ver em tela cheia"
                        >
                            <Maximize2 className="h-4 w-4" />
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

            <div className="flex flex-col flex-grow min-w-0 justify-between">
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className="font-extrabold text-xl text-foreground leading-tight truncate">
                                {problem?.label || report.problem}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-6">
                                <div className="text-xs text-foreground/75 flex items-center gap-1.5 font-bold">
                                    {category?.icon && <category.icon className="h-3.5 w-3.5" style={{ color: category.color }} />}
                                    <span className="truncate">{category?.label || report.category}</span>
                                </div>
                                <div className="text-xs text-foreground/75 flex items-center gap-1.5 font-bold">
                                    <MapPin className="h-3.5 w-3.5 text-primary" />
                                    <span className="truncate">{displayCity} - {report.bairro}</span>
                                </div>
                            </div>
                        </div>
                        <div className="scale-90 origin-top-right">
                          <StatusBadge status={report.status} />
                        </div>
                    </div>

                    {report.summary && (
                      <div className="p-4 bg-primary/10 dark:bg-primary/5 rounded-2xl border border-primary/20 dark:border-primary/10 space-y-2 relative overflow-hidden group/summary">
                        <div className="flex items-center gap-1.5 text-[10px] font-black text-primary uppercase tracking-[0.15em]">
                          <Sparkles className="h-3 w-3" /> Resumo Inteligente
                        </div>
                        <p className="text-xs text-foreground/85 dark:text-muted-foreground italic font-medium leading-relaxed">
                          "{report.summary}"
                        </p>
                      </div>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-foreground/60 dark:text-muted-foreground uppercase tracking-wider">
                        <Clock className="h-3.5 w-3.5" />
                        <ReportTime date={new Date(report.createdAt)} />
                    </div>

                    <div className="flex items-center gap-1.5">
                        {isPublic && (
                            <Button asChild variant="ghost" size="sm" className="h-8 px-3 text-primary font-bold hover:bg-primary/10 rounded-lg text-[10px] uppercase tracking-wider">
                                <Link href={`/?lat=${report.latitude}&lng=${report.longitude}#map-section`}>
                                    <MapPin className="h-3.5 w-3.5 mr-1.5" /> Ver no mapa
                                </Link>
                            </Button>
                        )}
                        {canDelete && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors border border-transparent hover:border-destructive/20">
                                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                        <span className="sr-only">Excluir</span>
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir Relatório Permanentemente?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta ação não pode ser desfeita. O relato será removido permanentemente de nossos registros.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-xl font-bold">Excluir Permanente</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MyReportsList({ reports }: { reports: Report[] }) {
    if (reports.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-16 border-2 border-dashed border-border rounded-[2rem] bg-muted/10 mx-4 sm:mx-0">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-muted rounded-full">
                    <AlertTriangle className="h-8 w-8 opacity-20" />
                  </div>
                </div>
                <p className="text-sm font-medium">Você ainda não relatou nenhum problema.</p>
                <Button asChild variant="link" className="mt-2 text-primary font-bold">
                    <Link href="/report/new">Relatar um Problema</Link>
                </Button>
            </div>
        );
    }
    return (
        <div className="space-y-8 px-4 sm:px-0">
            {reports.map((report) => (
                <MyReportItem key={report.id} report={report} />
            ))}
        </div>
    );
}

function UserDataSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-12 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-12 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-12 w-full" /></div>
        </div>
    )
}

export function MinhaContaClient({ allReports }: { allReports: Report[] }) {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [isEditingName, setIsEditingName] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isConfirmEnabled, setIsConfirmEnabled] = useState(false);
    const [countdown, setCountdown] = useState(5);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [showDeletePassword, setShowDeletePassword] = useState(false);
    const [isAwareChecked, setIsAwareChecked] = useState(false);
    const [isDeletingProcess, setIsDeletingProcess] = useState(false);

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);
    const [userReports, setUserReports] = useState<Report[]>([]);
    
    const reportsRef = useRef<HTMLDivElement>(null);
    const isEmployee = isEmailEmployee(user?.email);

    const form = useForm<z.infer<typeof UpdateProfileSchema>>({
      resolver: zodResolver(UpdateProfileSchema),
      defaultValues: { name: "" },
    });

    useEffect(() => {
        if (!isUserLoading) {
            if (!user) {
                router.push('/report/auth');
            } else {
                if (!isEmployee) {
                    const now = new Date();
                    const filteredReports = allReports.filter(report => {
                        if (report.userId !== user.uid) return false;
                        
                        if (report.status === 'EXCLUDED') {
                            if (!report.excludedAt) return false;
                            const excludedDate = new Date(report.excludedAt);
                            const diffInDays = (now.getTime() - excludedDate.getTime()) / (1000 * 60 * 60 * 24);
                            return diffInDays <= 3;
                        }
                        
                        return true;
                    });
                    setUserReports(filteredReports);
                }

                setIsProfileLoading(true);
                getUserById(user.uid)
                    .then((data) => {
                        if (data) {
                            setUserProfile(data);
                            form.reset({ name: data.name });
                        } else {
                            const fallback: UserProfile = {
                                id: user.uid,
                                name: user.displayName || 'Usuário',
                                email: user.email || '',
                                dateOfBirth: 'Não informada',
                                role: isEmailEmployee(user.email) ? 'EMPLOYEE' : 'USER'
                            };
                            setUserProfile(fallback);
                            form.reset({ name: fallback.name });
                        }
                    })
                    .catch(err => {
                        console.error("Erro ao carregar perfil no cliente:", err);
                    })
                    .finally(() => setIsProfileLoading(false));
            }
        }
    }, [user, isUserLoading, allReports, router, isEmployee, form]);
    
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash === '#meus-relatorios' && reportsRef.current && !isProfileLoading) {
            setTimeout(() => {
                const element = reportsRef.current;
                if (element) {
                    const yOffset = -100;
                    const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }, 300);
        }
    }, [isProfileLoading]);

    useEffect(() => {
        if (isConfirmOpen) {
            setIsConfirmEnabled(false);
            setCountdown(5);
            const interval = setInterval(() => setCountdown(p => p > 0 ? p - 1 : 0), 1000);
            const timeout = setTimeout(() => setIsConfirmEnabled(true), 5000);
            return () => { clearInterval(interval); clearTimeout(timeout); };
        }
    }, [isConfirmOpen]);

    const getCooldownInfo = () => {
        if (!userProfile?.nameLastUpdatedAt) return { onCooldown: false, remainingDays: 0 };
        const nextAvailable = new Date(new Date(userProfile.nameLastUpdatedAt).getTime() + 7 * 24 * 60 * 60 * 1000);
        const diff = nextAvailable.getTime() - Date.now();
        if (diff <= 0) return { onCooldown: false, remainingDays: 0 };
        return { onCooldown: true, remainingDays: Math.ceil(diff / (1000 * 60 * 60 * 24)) };
    };

    const cooldown = getCooldownInfo();

    const handleEditClick = () => {
        if (cooldown.onCooldown) {
            toast({
                variant: "destructive",
                title: "Alteração Bloqueada",
                description: `Aguarde ${cooldown.remainingDays} ${cooldown.remainingDays === 1 ? 'dia' : 'dias'} para alterar o nome novamente.`,
            });
            return;
        }
        setIsEditingName(true);
    };

    const updateLocalStorageAccount = (uid: string, name: string) => {
        const saved = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
        if (saved) {
            try {
                let accounts = JSON.parse(saved);
                accounts = accounts.map((a: any) => a.uid === uid ? { ...a, displayName: name } : a);
                localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
            } catch (e) {}
        }
    };
    
    const onSubmit = async (data: z.infer<typeof UpdateProfileSchema>) => {
      if (!user) return;
      const result = await updateUserProfileAction(user.uid, { name: data.name });
      if (result.success) {
        if (auth.currentUser) updateProfile(auth.currentUser, { displayName: data.name }).catch(console.error);
        updateLocalStorageAccount(user.uid, data.name);
        setUserProfile(prev => prev ? { ...prev, name: data.name, nameLastUpdatedAt: new Date().toISOString() } : null);
        toast({ title: "Sucesso!", description: "Seu nome foi atualizado." });
        setIsEditingName(false);
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || "Não foi possível atualizar." });
      }
      setIsConfirmOpen(false);
    };

    const handleAccountDeletion = async () => {
        if (!user || !auth.currentUser) return;
        setIsDeletingProcess(true);
        try {
            const credential = EmailAuthProvider.credential(user.email!, deletePassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            const result = await deleteAccountAction(user.uid);
            if (result.success) {
                await deleteUser(auth.currentUser);
                toast({ title: "Conta excluída", description: "Seus dados foram removidos." });
                router.push('/');
            } else throw new Error(result.error);
        } catch (error: any) {
            let message = "Erro ao processar a exclusão. Verifique sua senha.";
            if (error.code === 'auth/wrong-password') message = "Senha incorreta.";
            toast({ variant: 'destructive', title: "Erro na exclusão", description: message });
            setIsDeletingProcess(false);
        }
    };

    if (isUserLoading || !user) {
        return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8">
             <Card className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8 space-y-6 overflow-hidden mx-4 sm:mx-0">
                <div className="flex flex-col items-center gap-4 mb-2">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src={userProfile?.photoURL || createAvatarSvg(user.email || 'U')} />
                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                            {(user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
                
                <CardContent className="p-0">
                    {isProfileLoading ? (
                        <UserDataSkeleton />
                    ) : (
                        <Form {...form}>
                          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex justify-between items-center">
                                    <FormLabel>Nome Completo</FormLabel>
                                    {!isEditingName && (
                                        <Button type="button" variant="link" className="p-0 h-auto text-xs text-primary font-bold" onClick={handleEditClick}>
                                            Alterar Nome
                                        </Button>
                                    )}
                                  </div>
                                  <FormControl>
                                      <Input {...field} disabled={!isEditingName} className="h-10" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="space-y-4 pt-2">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">E-mail</Label>
                                    <Input value={userProfile?.email || user.email || ''} disabled className="h-10" />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-sm font-medium">Data de Nascimento</Label>
                                    <Input value={userProfile?.dateOfBirth || 'Não informada'} disabled className="h-10" />
                                </div>
                            </div>

                            {isEditingName ? (
                                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                                    <Button type="button" variant="outline" onClick={() => { setIsEditingName(false); form.reset(); }} className="h-10 px-6 rounded-xl font-bold w-full sm:w-auto">Cancelar</Button>
                                    <Button type="button" onClick={() => setIsConfirmOpen(true)} disabled={!form.formState.isDirty} className="h-10 px-6 rounded-xl font-bold w-full sm:w-auto">
                                        <Save className="mr-2 h-4 w-4" /> Salvar Alterações
                                    </Button>
                                </div>
                            ) : (
                              <div className="pt-6 border-t border-border flex justify-start items-center">
                                <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { setIsDeleteDialogOpen(open); if(!open) { setDeletePassword(""); setIsAwareChecked(false); setShowDeletePassword(false); } }}>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="text-destructive text-xs hover:bg-destructive/10">
                                      <Trash2 className="mr-2 h-4 w-4" /> Excluir Minha Conta
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-2xl max-w-sm">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="h-5 w-5" /> Segurança</AlertDialogTitle>
                                      <AlertDialogDescription className="text-sm">Esta ação é irreversível. Por favor, confirme sua senha para prosseguir.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-4 space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="del-pass" className="text-xs font-bold uppercase tracking-widest">Sua Senha</Label>
                                        <div className="relative">
                                          <Input id="del-pass" type={showDeletePassword ? "text" : "password"} value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} placeholder="********" className="h-11 rounded-xl pr-10" />
                                          <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowDeletePassword(!showDeletePassword)}>
                                            {showDeletePassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="flex items-start space-x-3 p-3 bg-muted/20 rounded-xl border border-border">
                                        <Checkbox id="confirm-delete-aware" checked={isAwareChecked} onCheckedChange={(val) => setIsAwareChecked(val as boolean)} className="mt-1" />
                                        <Label htmlFor="confirm-delete-aware" className="text-xs leading-relaxed text-muted-foreground cursor-pointer font-bold">ENTENDO QUE MEUS DADOS SERÃO APAGADOS DEFINITIVAMENTE.</Label>
                                      </div>
                                    </div>
                                    <AlertDialogFooter className="gap-2">
                                      <AlertDialogCancel className="rounded-xl w-full sm:w-auto">Voltar</AlertDialogCancel>
                                      <AlertDialogAction disabled={!deletePassword || !isAwareChecked || isDeletingProcess} onClick={(e) => { e.preventDefault(); handleAccountDeletion(); }} className="bg-destructive text-destructive-foreground rounded-xl font-bold w-full sm:w-auto">
                                        {isDeletingProcess ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Excluir Agora
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </form>
                        </Form>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="rounded-2xl mx-4 sm:mx-0 bg-card border-border">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Alteração de Identidade</AlertDialogTitle>
                        <AlertDialogDescription>Você só poderá alterar seu nome novamente após 7 dias. Deseja prosseguir com a atualização?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="rounded-xl w-full sm:w-auto">Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={form.handleSubmit(onSubmit)} disabled={!isConfirmEnabled} className="bg-primary text-primary-foreground rounded-xl font-bold w-full sm:w-auto">
                           {isConfirmEnabled ? 'Confirmar Mudança' : `Aguarde (${countdown}s)`}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {!isEmployee && (
                <Card className="bg-card rounded-[2.5rem] shadow-md border border-border p-6 sm:p-10 mx-4 sm:mx-0 scroll-mt-24" id="meus-relatorios" ref={reportsRef}>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                          <h2 className="text-2xl font-black text-foreground tracking-tight">Meus Relatórios</h2>
                        </div>
                        <Button asChild variant="default" size="sm" className="rounded-xl h-10 px-5 font-bold shadow-lg shadow-primary/20">
                            <Link href="/report/new">Novo Relato</Link>
                        </Button>
                    </div>
                    <CardContent className="p-0">
                        <MyReportsList reports={userReports} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
