'use client';

import { useUser, useAuth } from "@/firebase";
import { type Report, type UserProfile } from "@/lib/types";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, MapPin, Clock, Mail, Calendar, Plus } from "lucide-react";
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
import { updateUserProfileAction, fetchUserProfileAction, deleteReportAction } from "@/lib/actions";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createAvatarSvg } from "@/lib/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { isEmailEmployee } from "@/lib/config";

function MyReportItem({ report }: { report: Report }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isDeleting, startDeleteTransition] = useTransition();
    const category = getCategory(report.category);
    const problem = category?.problems.find(p => p.value === report.problem);
    const displayCity = report.city === 'Picui' ? 'Picuí' : report.city;

    const canDelete = report.status === 'UNDER_REVIEW';

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
        <div className="flex flex-col sm:flex-row gap-4 items-center border border-border rounded-xl p-4 bg-card group relative animate-in fade-in slide-in-from-bottom-4">
            
            <div className="relative w-full sm:w-24 h-40 sm:h-24 rounded-lg overflow-hidden shrink-0 z-10 shadow-sm bg-muted">
                <Image
                    src={report.photoUrl}
                    alt={report.description || "Foto do problema"}
                    fill
                    className="object-cover"
                />
            </div>

            <div className="flex flex-col flex-grow min-w-0 z-10 w-full">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-foreground truncate">
                        {problem?.label || report.problem}
                    </h3>
                    <div className="shrink-0">
                        <StatusBadge status={report.status} />
                    </div>
                </div>

                <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    {category?.icon && <category.icon className="h-3 w-3" style={{ color: category.color }} />}
                    <span className="truncate">{category?.label || report.category}</span>
                </div>

                <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="truncate">{displayCity} - {report.bairro}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <Clock className="h-3.5 w-3.5" />
                    <ReportTime date={new Date(report.createdAt)} />
                </div>
            </div>

            <div className="flex sm:flex-col items-center justify-center gap-4 sm:gap-2 z-10 w-full sm:w-auto border-t border-border sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                <Button asChild variant="ghost" size="sm" className="h-9 px-3 text-primary font-bold">
                    <Link href={`/?lat=${report.latitude}&lng=${report.longitude}#map-section`}>
                        <MapPin className="h-3.5 w-3.5 mr-1.5" /> Ver no mapa
                    </Link>
                </Button>

                {canDelete && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive transition shrink-0" onClick={(e) => e.stopPropagation()}>
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
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                                    Excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>
    );
}

function MyReportsList({ reports }: { reports: Report[] }) {
    if (reports.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10 border-2 border-dashed border-border rounded-2xl bg-muted/20 mx-4 sm:mx-0">
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
            
            <div className="pt-4 flex justify-center">
                <Button asChild className="w-full sm:w-auto rounded-xl h-11 px-8 shadow-sm">
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
    const [deleteCountdown, setDeleteCountdown] = useState(5);
    const [isDeleteConfirmEnabled, setIsDeleteConfirmEnabled] = useState(false);


    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    const [userReports, setUserReports] = useState<Report[]>([]);

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
        if (user?.uid) {
            setIsProfileLoading(true);
            fetchUserProfileAction(user.uid)
                .then(async (result) => {
                    if (result.success && result.data) {
                        setUserProfile(result.data);
                        form.reset({ name: result.data.name });
                    } else {
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

    useEffect(() => {
        if (isDeleteDialogOpen) {
            setIsDeleteConfirmEnabled(false);
            setDeleteCountdown(5);
            
            const countdownInterval = setInterval(() => {
                setDeleteCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            const enableTimeout = setTimeout(() => {
                setIsDeleteConfirmEnabled(true);
            }, 5000);

            return () => {
                clearInterval(countdownInterval);
                clearTimeout(enableTimeout);
            };
        }
    }, [isDeleteDialogOpen]);

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
    
    const onSubmit = async (data: z.infer<typeof UpdateProfileSchema>) => {
      if (!user) return;
      const result = await updateUserProfileAction(user.uid, { name: data.name });
      if (result.success) {
        if (auth.currentUser) {
          updateProfile(auth.currentUser, { displayName: data.name }).catch(console.error);
        }
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

    const handleProceedToDelete = () => {
        router.push('/exclusao-da-conta');
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
             <Card className="bg-card rounded-2xl shadow-md border border-border p-6 sm:p-8 space-y-6 overflow-hidden mx-4 sm:mx-0">
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
                                    <FormLabel className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Nome Completo</FormLabel>
                                    {!isEditingName && (
                                        <Button type="button" variant="link" className="p-0 h-auto text-sm text-primary font-bold hover:text-primary/80" onClick={handleEditClick}>
                                            Alterar
                                        </Button>
                                    )}
                                  </div>
                                  <FormControl>
                                      <Input {...field} disabled={!isEditingName} className="h-12 rounded-xl bg-muted/30 focus:bg-background border-border" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="space-y-6 pt-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <FormLabel className="text-sm font-medium text-muted-foreground uppercase tracking-wider">E-mail</FormLabel>
                                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <Input value={userProfile?.email || user.email || ''} disabled className="h-12 rounded-xl bg-muted/50 text-muted-foreground cursor-not-allowed opacity-100 border-border" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <FormLabel className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Data de Nascimento</FormLabel>
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    <Input value={userProfile?.dateOfBirth || 'Não informada'} disabled className="h-12 rounded-xl bg-muted/50 text-muted-foreground cursor-not-allowed opacity-100 border-border" />
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
                <Card className="bg-card rounded-2xl shadow-md border border-border p-6 mx-4 sm:mx-0" id="meus-relatorios">
                    <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-xl font-bold text-foreground">Meus Relatórios</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <MyReportsList reports={userReports} />
                    </CardContent>
                </Card>
            )}

            <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 space-y-4 mx-4 sm:mx-0">
                <div className="flex items-center gap-2">
                    <Trash2 className="h-5 w-5 text-destructive" />
                    <h3 className="text-destructive font-bold text-lg">Zona de Perigo</h3>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                        <p className="text-sm text-destructive/80 font-medium">
                            {isEmployee 
                                ? "Ação irreversível. Todos os seus dados de funcionário serão removidos." 
                                : "Ação irreversível. Todos os seus dados e relatos serão removidos permanentemente."}
                        </p>
                    </div>
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="rounded-xl px-6 h-11 shadow-sm w-full sm:w-auto font-bold">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir Conta
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl mx-4 sm:mx-0 bg-card border-border">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Protocolo de Segurança</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Para sua proteção, você será redirecionado para uma página de confirmação de identidade. Deseja prosseguir com a exclusão definitiva?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 gap-2">
                                <AlertDialogCancel className="rounded-xl w-full sm:w-auto">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleProceedToDelete} disabled={!isDeleteConfirmEnabled} className="bg-destructive text-destructive-foreground rounded-xl font-bold w-full sm:w-auto">
                                    {isDeleteConfirmEnabled ? 'Sim, excluir meus dados' : `Aguarde (${deleteCountdown}s)`}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    )
}