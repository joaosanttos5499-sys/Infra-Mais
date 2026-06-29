'use client';

import { useUser, useAuth } from "@/firebase";
import { type Report, type UserProfile } from "@/lib/types";
import { useEffect, useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, MapPin, Clock, Mail, Calendar, Plus, ShieldAlert, ArrowUpRight, AlertTriangle } from "lucide-react";
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
import { updateUserProfileAction, fetchUserProfileAction, deleteReportAction, deleteAccountAction } from "@/lib/actions";
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createAvatarSvg } from "@/lib/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { isEmailEmployee } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const LOCAL_STORAGE_ACCOUNTS_KEY = 'infra_mais_saved_accounts';

function MyReportItem({ report }: { report: Report }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isDeleting, startDeleteTransition] = useTransition();
    const category = getCategory(report.category);
    const problem = category?.problems.find(p => p.value === report.problem);
    const displayCity = report.city === 'Picui' ? 'Picuí' : report.city;

    const canDelete = report.status === 'UNDER_REVIEW';
    const isPublic = report.status !== 'UNDER_REVIEW';

    const handleDelete = async () => {
        startDeleteTransition(async () => {
            const result = await deleteReportAction(report.id);
            if (result.success) {
                toast({ title: "Relatório excluído", description: "O problema foi removido do sistema." });
                router.refresh();
            } else {
                toast({ variant: "destructive", title: "Erro ao excluir", description: result.message });
            }
        });
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 border border-border rounded-xl p-4 bg-card group relative animate-in fade-in slide-in-from-bottom-4 min-h-[160px]">
            
            <div className="absolute top-4 right-4 z-20">
                <StatusBadge status={report.status} />
            </div>

            <div className="relative w-full sm:w-32 h-40 sm:h-auto rounded-lg overflow-hidden shrink-0 z-10 shadow-sm bg-muted">
                <Image
                    src={report.photoUrl}
                    alt={report.description || "Foto do problema"}
                    fill
                    className="object-cover"
                />
            </div>

            <div className="flex flex-col flex-grow min-w-0 z-10 w-full justify-between">
                <div className="space-y-1 pr-24 sm:pr-28">
                    <h3 className="font-bold text-lg text-foreground truncate">
                        {problem?.label || report.problem}
                    </h3>

                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                        {category?.icon && <category.icon className="h-3.5 w-3.5" style={{ color: category.color }} />}
                        <span className="truncate">{category?.label || report.category}</span>
                    </div>

                    <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                        <span className="truncate">{displayCity} - {report.bairro}</span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <ReportTime date={new Date(report.createdAt)} />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 w-full mt-4 sm:mt-0">
                    {isPublic && (
                        <Link 
                            href={`/dashboard#report-${report.id}`}
                            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 uppercase tracking-wider mr-auto"
                        >
                            <ArrowUpRight className="h-3 w-3" /> Ver Detalhes
                        </Link>
                    )}

                    {isPublic && (
                        <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-primary font-bold hover:bg-primary/10 transition-colors">
                            <Link href={`/?lat=${report.latitude}&lng=${report.longitude}#map-section`}>
                                <MapPin className="h-3.5 w-3.5 mr-1.5" /> Ver no mapa
                            </Link>
                        </Button>
                    )}

                    {canDelete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition shrink-0" onClick={(e) => e.stopPropagation()}>
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    <span className="sr-only">Excluir</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Relatório?</AlertDialogTitle>
                                    <AlertDialogDescription>Esta ação não pode ser desfeita. O relatório será removido permanentemente.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-xl font-bold">
                                        Excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </div>
        </div>
    );
}

function MyReportsList({ reports }: { reports: Report[] }) {
    if (reports.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-12 border-2 border-dashed border-border rounded-2xl bg-muted/20 mx-4 sm:mx-0">
                <p className="text-sm">Você ainda não relatou nenhum problema.</p>
                <Button asChild variant="link" className="mt-2 text-primary font-bold">
                    <Link href="/report/new">Relatar um Problema</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 px-4 sm:px-0">
            <div className="space-y-4">
                {reports.map((report) => (
                    <MyReportItem key={report.id} report={report} />
                ))}
            </div>
            
            <div className="pt-6 flex justify-center">
                <Button asChild className="w-full sm:w-auto rounded-xl h-12 px-10 shadow-lg hover:scale-105 transition-all">
                    <Link href="/report/new" className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Relatar um Problema
                    </Link>
                </Button>
            </div>
        </div>
    )
}

function UserDataSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
            </div>
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
    const [isDeletingProcess, setIsDeletingProcess] = useState(false);

    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    const [userReports, setUserReports] = useState<Report[]>([]);
    
    const reportsRef = useRef<HTMLDivElement>(null);

    const isEmployee = isEmailEmployee(user?.email);

    const form = useForm<z.infer<typeof UpdateProfileSchema>>({
      resolver: zodResolver(UpdateProfileSchema),
      defaultValues: {
        name: "",
      },
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/report/auth');
        } else if (user && !isEmployee) {
            const filteredReports = allReports.filter(report => report.userId === user.uid);
            setUserReports(filteredReports);
        }
    }, [user, isUserLoading, allReports, router, isEmployee]);
    
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash === '#meus-relatorios' && reportsRef.current && !isProfileLoading) {
            setTimeout(() => {
                const element = reportsRef.current;
                if (element) {
                    const yOffset = -100;
                    const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }
            }, 300);
        }
    }, [isProfileLoading]);

    useEffect(() => {
        if (user?.uid) {
            setIsProfileLoading(true);
            fetchUserProfileAction(user.uid)
                .then(async (result) => {
                    if (result.success && result.data) {
                        setUserProfile(result.data);
                        form.reset({ name: result.data.name });
                    } else if (user) {
                        const fallbackProfile: UserProfile = {
                            id: user.uid,
                            name: user.displayName || 'Usuário',
                            email: user.email || '',
                            dateOfBirth: 'Não informada',
                            role: isEmailEmployee(user.email) ? 'EMPLOYEE' : 'USER'
                        };
                        setUserProfile(fallbackProfile);
                        form.reset({ name: fallbackProfile.name });
                    }
                })
                .catch(() => {
                   if (user) {
                        const fallbackProfile: UserProfile = {
                            id: user.uid,
                            name: user.displayName || 'Usuário',
                            email: user.email || '',
                            dateOfBirth: 'Não informada',
                            role: isEmailEmployee(user.email) ? 'EMPLOYEE' : 'USER'
                        };
                        setUserProfile(fallbackProfile);
                        form.reset({ name: fallbackProfile.name });
                   }
                })
                .finally(() => {
                    setIsProfileLoading(false);
                });
        }
    }, [user, form]);

    useEffect(() => {
        if (isConfirmOpen) {
            setIsConfirmEnabled(false);
            setCountdown(5);
            
            const countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            const enableTimeout = setTimeout(() => {
                setIsConfirmEnabled(true);
            }, 5000);

            return () => {
                clearInterval(countdownInterval);
                clearTimeout(enableTimeout);
            };
        }
    }, [isConfirmOpen]);

    const getCooldownInfo = () => {
        if (!userProfile?.nameLastUpdatedAt) return { onCooldown: false, remainingDays: 0 };
        const lastUpdate = new Date(userProfile.nameLastUpdatedAt);
        const nextAvailable = new Date(lastUpdate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const now = new Date();
        const diff = nextAvailable.getTime() - now.getTime();
        if (diff <= 0) return { onCooldown: false, remainingDays: 0 };
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return { onCooldown: true, remainingDays: days };
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
        if (auth.currentUser) {
          updateProfile(auth.currentUser, { displayName: data.name }).catch(console.error);
        }
        updateLocalStorageAccount(user.uid, data.name);
        setUserProfile(prev => prev ? { ...prev, name: data.name, nameLastUpdatedAt: new Date().toISOString() } : null);
        toast({ title: "Sucesso!", description: "Seu nome foi atualizado." });
        setIsEditingName(false);
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || "Não foi possível atualizar o perfil." });
      }
      setIsConfirmOpen(false);
    };

    const handleSaveClick = () => {
        form.trigger().then(isValid => {
            if (isValid && form.formState.isDirty) setIsConfirmOpen(true);
            else setIsEditingName(false);
        });
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
                toast({ title: "Conta excluída", description: "Sentiremos sua falta! Seus dados foram removidos." });
                router.push('/');
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            console.error("Deletion error:", error);
            let message = "Erro ao processar a exclusão. Verifique sua senha.";
            if (error.code === 'auth/wrong-password') message = "Senha incorreta.";
            toast({ variant: 'destructive', title: "Erro na exclusão", description: message });
            setIsDeletingProcess(false);
        }
    };

    if (isUserLoading || !user) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
             <Card className="bg-card rounded-2xl shadow-md border border-border p-6 sm:p-8 space-y-6 overflow-hidden mx-4 sm:mx-0 relative">
                <div className="flex flex-col items-center gap-4 mb-2">
                    <Avatar className="h-24 w-24 shadow-md border-4 border-background">
                        <AvatarImage src={userProfile?.photoURL || createAvatarSvg(user.email || 'U')} />
                        <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                            {(user.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
                
                <CardContent className="p-0">
                    {isProfileLoading ? (
                        <UserDataSkeleton />
                    ) : (
                        <Form {...form}>
                          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex justify-between items-center mb-1">
                                    <FormLabel className="text-sm font-bold text-foreground uppercase tracking-wider">Nome Completo</FormLabel>
                                    {!isEditingName && (
                                        <Button type="button" variant="link" className="p-0 h-auto text-sm text-primary font-bold hover:text-primary/80" onClick={handleEditClick}>
                                            Alterar
                                        </Button>
                                    )}
                                  </div>
                                  <FormControl>
                                      <Input {...field} disabled={!isEditingName} className="h-12 rounded-xl bg-muted/40 focus:bg-background border-border" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="space-y-6 pt-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <FormLabel className="text-sm font-bold text-foreground uppercase tracking-wider">E-mail</FormLabel>
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <Input value={userProfile?.email || user.email || ''} disabled className="h-12 rounded-xl bg-muted/60 text-muted-foreground cursor-not-allowed opacity-100 border-border" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <FormLabel className="text-sm font-bold text-foreground uppercase tracking-wider">Data de Nascimento</FormLabel>
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <Input value={userProfile?.dateOfBirth || 'Não informada'} disabled className="h-12 rounded-xl bg-muted/60 text-muted-foreground cursor-not-allowed opacity-100 border-border" />
                                </div>
                            </div>

                            {isEditingName && (
                                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-border">
                                    <Button type="button" variant="outline" onClick={() => { setIsEditingName(false); form.reset(); }} className="h-11 px-6 rounded-xl font-bold w-full sm:w-auto">
                                        Cancelar
                                    </Button>
                                    <Button 
                                        type="button" 
                                        onClick={handleSaveClick} 
                                        disabled={form.formState.isSubmitting || !form.formState.isDirty}
                                        className="h-11 px-6 rounded-xl font-bold shadow-md w-full sm:w-auto"
                                    >
                                        {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Salvar Alterações
                                    </Button>
                                </div>
                            )}
                            
                            {!isEditingName && (
                              <div className="pt-6 border-t border-border flex justify-start items-center">
                                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" className="text-destructive hover:bg-destructive/5 text-xs font-bold gap-2 p-0 h-auto">
                                      <Trash2 className="h-3.5 w-3.5" /> Excluir Conta
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-2xl max-w-sm">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                        <ShieldAlert className="h-5 w-5" /> Confirmar Exclusão
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-sm">
                                        Esta ação é permanente. Informe sua senha para confirmar a exclusão da sua conta.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="py-4 space-y-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="del-pass" className="text-xs font-bold uppercase">Senha</Label>
                                        <Input 
                                          id="del-pass"
                                          type="password" 
                                          value={deletePassword} 
                                          onChange={(e) => setDeletePassword(e.target.value)} 
                                          placeholder="********"
                                          className="h-11 rounded-xl"
                                        />
                                      </div>
                                      <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                                        <p className="text-[10px] text-destructive leading-relaxed font-medium">
                                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                                          Todos os seus relatos e dados pessoais serão removidos definitivamente.
                                        </p>
                                      </div>
                                    </div>
                                    <AlertDialogFooter className="gap-2">
                                      <AlertDialogCancel className="rounded-xl w-full sm:w-auto" onClick={() => setDeletePassword("")}>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction 
                                        disabled={!deletePassword || isDeletingProcess}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleAccountDeletion();
                                        }}
                                        className="bg-destructive text-destructive-foreground rounded-xl font-bold w-full sm:w-auto"
                                      >
                                        {isDeletingProcess ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        Confirmar Exclusão
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
                        <AlertDialogTitle>Aviso de Alteração</AlertDialogTitle>
                        <AlertDialogDescription>
                            Alterações de nome só são permitidas uma vez a cada 7 dias. Deseja confirmar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="rounded-xl w-full sm:w-auto">Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={form.handleSubmit(onSubmit)} disabled={!isConfirmEnabled} className="bg-primary text-primary-foreground rounded-xl font-bold w-full sm:w-auto">
                           {isConfirmEnabled ? 'Confirmar' : `Aguarde (${countdown})`}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {!isEmployee && (
                <Card className="bg-card rounded-2xl shadow-md border border-border p-6 mx-4 sm:mx-0 scroll-mt-24" id="meus-relatorios" ref={reportsRef}>
                    <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-xl font-bold text-foreground">Meus Relatórios</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <MyReportsList reports={userReports} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}