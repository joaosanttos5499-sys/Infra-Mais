'use client';

import { useUser, useAuth } from "@/firebase";
import { type Report, type UserProfile } from "@/lib/types";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { updateUserProfileAction, fetchUserProfileAction, saveUserProfileAction, deleteReportAction } from "@/lib/actions";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createAvatarSvg } from "@/lib/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { isEmailEmployee } from "@/lib/config";


function MyReportItem({ report }: { report: Report }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isDeleting, startDeleteTransition] = useTransition();
    const category = getCategory(report.category);
    const problem = category?.problems.find(p => p.value === report.problem);

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
        <Card className="overflow-hidden flex flex-col sm:flex-row h-full group relative">
            <Link href={`/dashboard#report-${report.id}`} className="absolute inset-0 z-0" />
            <div className="relative aspect-video sm:aspect-square sm:w-48 flex-shrink-0 z-10">
                <Image
                    src={report.photoUrl}
                    alt={report.description}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 192px"
                />
                <div className="absolute top-2 right-2">
                    <StatusBadge status={report.status} />
                </div>
            </div>
            <div className="flex flex-col flex-grow z-10">
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {category?.icon && <category.icon className="h-5 w-5" style={{ color: category.color }} />}
                        <span>{category?.label || report.category}</span>
                    </CardTitle>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 -mt-1 -mr-2" onClick={(e) => e.stopPropagation()}>
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                <span className="sr-only">Excluir Relatório</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Relatório?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. O relatório será removido permanentemente de todas as páginas.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Excluir permanentemente
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                    <div className="flex-grow">
                        <p className="font-semibold text-sm line-clamp-1">{problem?.label || report.problem}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {report.location}
                        </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                        <ReportTime date={new Date(report.createdAt)} />
                    </p>
                </CardContent>
            </div>
        </Card>
    );
}

function MyReportsList({ reports }: { reports: Report[] }) {
    if (reports.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">Você ainda não relatou nenhum problema.</h3>
                <p className="mt-2">Quando você relatar um problema, ele aparecerá aqui.</p>
                <Button asChild className="mt-4">
                    <Link href="/report/new">Relatar um Problema</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reports.map((report) => (
                <MyReportItem key={report.id} report={report} />
            ))}
        </div>
    )
}

function UserDataSkeleton() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-48" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-64" />
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-32" />
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
    const [countdown, setCountdown] = useState(3);


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
                        let firestoreProfile = result.data;

                        // Lógica de Autocorreção: Verifica se o avatar corresponde ao e-mail (necessário para corrigir evidenciadetudo@gmail.com)
                        const correctAvatar = createAvatarSvg(firestoreProfile.email);
                        let needsUpdate = false;

                        if (firestoreProfile.photoURL !== correctAvatar) {
                            firestoreProfile = { ...firestoreProfile, photoURL: correctAvatar };
                            needsUpdate = true;
                        }

                        // Patch específico para data de nascimento conforme solicitado anteriormente
                        if (firestoreProfile.email === 'joaosanttos528@gmail.com' && firestoreProfile.dateOfBirth !== '04/06/2008') {
                            firestoreProfile = { ...firestoreProfile, dateOfBirth: '04/06/2008' };
                            needsUpdate = true;
                        }

                        if (needsUpdate) {
                            await saveUserProfileAction(firestoreProfile);
                        }

                        // Sincroniza com Firebase Auth se necessário
                        if (auth.currentUser && (auth.currentUser.photoURL !== firestoreProfile.photoURL || auth.currentUser.displayName !== firestoreProfile.name)) {
                            updateProfile(auth.currentUser, {
                                displayName: firestoreProfile.name,
                                photoURL: firestoreProfile.photoURL,
                            }).catch(e => console.error("Sync error:", e));
                        }

                        setUserProfile(firestoreProfile);
                        form.reset({ name: firestoreProfile.name });
                        
                    } else if (user?.uid && user.email) {
                        // Criação inicial do perfil
                        const newProfileData = {
                            id: user.uid,
                            name: user.displayName || user.email.split('@')[0],
                            email: user.email,
                            dateOfBirth: user.email === 'joaosanttos528@gmail.com' ? '04/06/2008' : 'Data não informada',
                        };

                        saveUserProfileAction(newProfileData).then(creationResult => {
                            if (creationResult.success && creationResult.photoURL) {
                                const finalProfile = { ...newProfileData, photoURL: creationResult.photoURL } as UserProfile;
                                setUserProfile(finalProfile);
                                form.reset({ name: finalProfile.name });

                                if (auth.currentUser) {
                                    updateProfile(auth.currentUser, {
                                        displayName: newProfileData.name,
                                        photoURL: creationResult.photoURL
                                    }).catch(e => console.error("Auth update error:", e));
                                }
                            }
                        });
                    }
                })
                .finally(() => {
                    setIsProfileLoading(false);
                });
        } else if (!isUserLoading) {
            setIsProfileLoading(false);
        }
    }, [user, isUserLoading, form, toast, auth]);

    useEffect(() => {
        if (isConfirmOpen) {
            setIsConfirmEnabled(false);
            setCountdown(3);
            
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
            }, 3000);

            return () => {
                clearInterval(countdownInterval);
                clearTimeout(enableTimeout);
            };
        }
    }, [isConfirmOpen]);
    
    const onSubmit = async (data: z.infer<typeof UpdateProfileSchema>) => {
      if (!user) return;
  
      const result = await updateUserProfileAction(user.uid, { name: data.name });
  
      if (result.success) {
        if (auth.currentUser) {
          try {
            await updateProfile(auth.currentUser, {
              displayName: data.name,
            });
            setUserProfile(prev => prev ? { ...prev, name: data.name } : null);
          } catch(e) {
             console.error("Error updating firebase auth profile:", e)
          }
        }
        toast({ title: "Sucesso!", description: "Seu nome foi atualizado." });
        setIsEditingName(false);
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || "Não foi possível atualizar o perfil." });
      }
      setIsConfirmOpen(false);
    };

    const handleSaveClick = () => {
        form.trigger().then(isValid => {
            if (!isValid) return;

            const { name } = form.formState.dirtyFields;
            
            if (name) {
                setIsConfirmOpen(true);
            } else {
                setIsEditingName(false);
            }
        });
    };

    const handleCancel = () => {
      if (userProfile) {
        form.reset({ name: userProfile.name });
      }
      form.clearErrors();
      setIsEditingName(false);
    }


    if (isUserLoading || !user) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Verificando autenticação...</p>
            </div>
        )
    }

    const avatarInitial = (user.email || 'U').charAt(0).toUpperCase();

    return (
        <div className="space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Meus Dados</CardTitle>
                    <Separator/>
                    <CardDescription>Visualize e edite as informações da sua conta.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isProfileLoading ? (
                        <UserDataSkeleton />
                    ) : !userProfile ? (
                        <p className="text-sm text-muted-foreground">Não foi possível carregar os dados do seu perfil.</p>
                    ) : (
                        <Form {...form}>
                          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                            <FormItem className="flex flex-col items-center gap-4">
                              <Avatar className="h-24 w-24">
                                <AvatarImage src={userProfile.photoURL || createAvatarSvg(userProfile.email)} />
                                <AvatarFallback>{avatarInitial}</AvatarFallback>
                              </Avatar>
                            </FormItem>
                            
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex justify-between items-center">
                                    <FormLabel>Nome Completo</FormLabel>
                                    {!isEditingName && (
                                        <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => setIsEditingName(true)}>
                                            Alterar
                                        </Button>
                                    )}
                                  </div>
                                  <FormControl>
                                      <Input {...field} disabled={!isEditingName} className="disabled:opacity-100 disabled:cursor-not-allowed disabled:bg-muted" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {isEditingName && (
                                <Alert variant="default" className="bg-amber-50 border-amber-200">
                                    <AlertDescription className="text-amber-800 text-xs">
                                    Você só pode alterar seu nome uma vez por semana.
                                    </AlertDescription>
                                </Alert>
                            )}
                            
                            <FormItem>
                                <FormLabel>
                                    Data de Nascimento
                                    {isEditingName && <span className="text-xs text-destructive/90 font-normal ml-2">(Não pode ser alterada)</span>}
                                </FormLabel>
                                <Input value={userProfile.dateOfBirth} disabled className="disabled:opacity-100 disabled:bg-muted" />
                            </FormItem>
                            
                            <FormItem>
                                <FormLabel>
                                  Email
                                  {isEditingName && <span className="text-xs text-destructive/90 font-normal ml-2">(Não pode ser alterado)</span>}
                                </FormLabel>
                                <Input value={userProfile.email} disabled className="disabled:opacity-100 disabled:bg-muted" />
                            </FormItem>

                            {isEditingName && (
                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={handleCancel}>
                                        <X className="mr-2 h-4 w-4" /> Cancelar
                                    </Button>
                                    <Button type="button" onClick={handleSaveClick} disabled={form.formState.isSubmitting || !form.formState.isDirty}>
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Aviso de Alteração de Nome</AlertDialogTitle>
                        <AlertDialogDescription>
                            Você só pode alterar seu nome uma vez por semana. Deseja continuar?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={form.handleSubmit(onSubmit)} disabled={!isConfirmEnabled || form.formState.isSubmitting}>
                           {isConfirmEnabled ? 'Estou ciente' : `Estou ciente (${countdown})`}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {!isEmployee && (
                <Card>
                    <CardHeader>
                        <CardTitle>Meus Relatórios</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <MyReportsList reports={userReports} />
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
