'use client';

import { useUser, useAuth } from "@/firebase";
import { type Report, type UserProfile } from "@/lib/types";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, AlertTriangle, MapPin, Clock, ChevronRight, Mail, Calendar } from "lucide-react";
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
        <div className="flex flex-col sm:flex-row gap-4 items-center border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-white group relative animate-in fade-in slide-in-from-bottom-4">
            <Link href={`/dashboard#report-${report.id}`} className="absolute inset-0 z-0" />
            
            <div className="relative w-full sm:w-24 h-40 sm:h-24 rounded-lg overflow-hidden shrink-0 z-10 shadow-sm">
                <Image
                    src={report.photoUrl}
                    alt={report.description}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
            </div>

            <div className="flex flex-col flex-grow min-w-0 z-10 w-full">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-gray-800 truncate">
                        {problem?.label || report.problem}
                    </h3>
                    <div className="shrink-0">
                        <StatusBadge status={report.status} />
                    </div>
                </div>

                <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                    {category?.icon && <category.icon className="h-3 w-3" style={{ color: category.color }} />}
                    <span className="truncate">{category?.label || report.category}</span>
                </div>

                <div className="text-sm text-gray-600 flex items-center gap-1.5 mt-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    <span className="truncate">{displayCity} - {report.bairro}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                    <Clock className="h-3 w-3" />
                    <ReportTime date={new Date(report.createdAt)} />
                </div>
            </div>

            <div className="flex sm:flex-col items-center justify-center gap-4 sm:gap-2 z-10 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                {canDelete && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-8 sm:w-8 text-gray-400 hover:text-red-500 transition shrink-0" onClick={(e) => e.stopPropagation()}>
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
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white">
                                    Excluir
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
                <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4 text-gray-300 group-hover:text-primary transition-colors hidden sm:block" />
                <Button variant="outline" size="sm" className="sm:hidden w-full font-bold text-primary border-primary/20">Ver detalhes</Button>
            </div>
        </div>
    );
}

function MyReportsList({ reports }: { reports: Report[] }) {
    if (reports.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-2xl bg-gray-50/50 mx-4 sm:mx-0">
                <p className="text-sm">Você ainda não relatou nenhum problema.</p>
                <Button asChild variant="link" className="mt-2 text-primary font-bold">
                    <Link href="/report/new">Relatar um Problema</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4 px-4 sm:px-0">
            {reports.map((report) => (
                <MyReportItem key={report.id} report={report} />
            ))}
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
             <Card className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 sm:p-8 space-y-6 overflow-hidden mx-4 sm:mx-0">
                <div className="flex flex-col items-center gap-4 mb-2">
                    <Avatar className="h-20 w-20 shadow-sm border-2 border-gray-50">
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
                          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex justify-between items-center mb-1">
                                    <FormLabel className="text-sm font-medium text-gray-700">Nome Completo</FormLabel>
                                    {!isEditingName && (
                                        <Button type="button" variant="link" className="p-0 h-auto text-sm text-primary font-medium hover:text-primary/80" onClick={handleEditClick}>
                                            Alterar
                                        </Button>
                                    )}
                                  </div>
                                  <FormControl>
                                      <Input {...field} disabled={!isEditingName} className="h-11 rounded-lg border border-gray-300 px-4 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-100 disabled:cursor-not-allowed" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="space-y-4 pt-2">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <FormLabel className="text-sm font-medium text-gray-700">E-mail</FormLabel>
                                        <Mail className="h-3.5 w-3.5 text-gray-400" />
                                    </div>
                                    <Input value={userProfile?.email || user.email || ''} disabled className="h-11 rounded-lg border border-gray-300 px-4 bg-gray-100 text-gray-500 cursor-not-allowed opacity-100" />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <FormLabel className="text-sm font-medium text-gray-700">Data de Nascimento</FormLabel>
                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                    </div>
                                    <Input value={userProfile?.dateOfBirth || 'Não informada'} disabled className="h-11 rounded-lg border border-gray-300 px-4 bg-gray-100 text-gray-500 cursor-not-allowed opacity-100" />
                                </div>
                            </div>

                            {isEditingName && (
                                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                                    <Button type="button" variant="outline" onClick={() => { setIsEditingName(false); form.reset(); }} className="h-10 px-6 rounded-lg font-bold w-full sm:w-auto">
                                        Cancelar
                                    </Button>
                                    <Button 
                                        type="button" 
                                        onClick={handleSaveClick} 
                                        disabled={form.formState.isSubmitting || !form.formState.isDirty}
                                        className="h-10 px-6 rounded-lg font-bold shadow-md hover:scale-[1.02] transition-all w-full sm:w-auto"
                                    >
                                        {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                        Salvar
                                    </Button>
                                </div>
                            )}
                          </form>
                        </Form>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent className="rounded-2xl mx-4 sm:mx-0">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Aviso de Alteração</AlertDialogTitle>
                        <AlertDialogDescription>
                            Alterações de nome só são permitidas uma vez a cada 7 dias. Deseja confirmar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="rounded-xl w-full sm:w-auto">Voltar</AlertDialogCancel>
                        <AlertDialogAction onClick={form.handleSubmit(onSubmit)} disabled={!isConfirmEnabled} className="bg-primary text-white rounded-xl font-bold w-full sm:w-auto">
                           {isConfirmEnabled ? 'Confirmar' : `Aguarde (${countdown})`}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {!isEmployee && (
                <Card className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 mx-4 sm:mx-0" id="meus-relatorios">
                    <CardHeader className="p-0 mb-6">
                        <CardTitle className="text-xl font-semibold text-gray-800">Meus Relatórios</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <MyReportsList reports={userReports} />
                    </CardContent>
                </Card>
            )}

            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4 mx-4 sm:mx-0">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h3 className="text-red-600 font-semibold text-lg">Excluir minha conta</h3>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                        <p className="text-sm text-red-500">
                            {isEmployee 
                                ? "Ação irreversível. Todos os seus dados serão removidos." 
                                : "Ação irreversível. Todos os seus dados e relatos serão removidos."}
                        </p>
                    </div>
                    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-6 h-11 shadow-sm transition-all hover:scale-[1.02] w-full sm:w-auto">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir Conta
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl mx-4 sm:mx-0">
                            <AlertDialogHeader>
                                <AlertDialogTitle>Protocolo de Segurança</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Para sua proteção, você será redirecionado para uma página de confirmação de identidade. Deseja prosseguir com a exclusão definitiva?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 gap-2">
                                <AlertDialogCancel className="rounded-xl w-full sm:w-auto">Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleProceedToDelete} disabled={!isDeleteConfirmEnabled} className="bg-red-600 text-white rounded-xl font-bold w-full sm:w-auto">
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
