
'use client';

import { useUser, useAuth } from "@/firebase";
import { type Report, type UserProfile } from "@/lib/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Save, X } from "lucide-react";
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
import { updateUserProfileAction, fetchUserProfileAction, saveUserProfileAction } from "@/lib/actions";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createAvatarSvg } from "@/lib/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


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
            {reports.map((report) => {
                const category = getCategory(report.category);
                const problem = category?.problems.find(p => p.value === report.problem);
                return (
                    <Link href={`/dashboard#report-${report.id}`} key={report.id} className="block group">
                        <Card className="overflow-hidden flex flex-col sm:flex-row h-full transition-all group-hover:shadow-lg group-hover:-translate-y-1">
                            <div className="relative aspect-video sm:aspect-square sm:w-48 flex-shrink-0">
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
                            <div className="flex flex-col flex-grow">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        {category?.icon && <category.icon className="h-5 w-5" style={{ color: category.color }} />}
                                        <span>{category?.label || report.category}</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow flex flex-col">
                                    <div className="flex-grow">
                                        <p className="font-semibold text-sm line-clamp-1">{problem?.label || report.problem}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {report.location}
                                        </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                                        <ReportTime date={report.createdAt} />
                                    </p>
                                </CardContent>
                            </div>
                        </Card>
                    </Link>
                )
            })}
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

const ClientUpdateProfileSchema = UpdateProfileSchema.extend({
  photo: z.instanceof(File).optional().refine(file => !file || file.size <= 2 * 1024 * 1024, 'A foto deve ter no máximo 2MB.'),
});

export function MinhaContaClient({ allReports }: { allReports: Report[] }) {
    const { user, isUserLoading } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isEditingName, setIsEditingName] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isConfirmEnabled, setIsConfirmEnabled] = useState(false);
    const [countdown, setCountdown] = useState(3);


    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    const [userReports, setUserReports] = useState<Report[]>([]);

    const form = useForm<z.infer<typeof ClientUpdateProfileSchema>>({
      resolver: zodResolver(ClientUpdateProfileSchema),
      defaultValues: {
        name: "",
        photo: undefined,
      },
    });

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/report/auth');
        } else if (user) {
            const filteredReports = allReports.filter(report => report.userId === user.uid);
            setUserReports(filteredReports);
        }
    }, [user, isUserLoading, allReports, router]);
    
    useEffect(() => {
        if (user?.uid) {
            setIsProfileLoading(true);
            fetchUserProfileAction(user.uid)
                .then(result => {
                    if (result.success && result.data) {
                        setUserProfile(result.data);
                        form.reset({ name: result.data.name });
                    } else if (user?.uid && user.email) {
                        // User exists in Auth, but not in our DB. Let's create their profile.
                        // This handles the case for users who signed up before profile persistence was fixed.
                        const newProfileData = {
                            id: user.uid,
                            name: user.displayName || user.email.split('@')[0],
                            email: user.email,
                            // Specific fix for the user as requested
                            dateOfBirth: user.email === 'joaosanttos528@gmail.com' ? '04/06/2008' : 'Data não informada',
                        };

                        saveUserProfileAction(newProfileData).then(creationResult => {
                            if (creationResult.success && creationResult.photoURL) {
                                const finalProfile = { ...newProfileData, photoURL: creationResult.photoURL };
                                setUserProfile(finalProfile);
                                form.reset({ name: finalProfile.name });
                                toast({ title: "Perfil Criado!", description: "Criamos seu perfil com as informações da sua conta." });
                            } else {
                                setUserProfile(null);
                                console.error("Could not create user profile:", creationResult.error);
                            }
                        });
                    } else {
                        // If profile is not found, and we can't create it, it's a genuine issue.
                        // We show the "could not load" message in the UI.
                        setUserProfile(null);
                        console.error("User profile could not be loaded:", result.error);
                    }
                })
                .finally(() => {
                    setIsProfileLoading(false);
                });
        } else if (!isUserLoading) {
            setIsProfileLoading(false);
        }
    }, [user, isUserLoading, form, toast]);

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


    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        form.setValue('photo', file, { shouldValidate: true });
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        form.setValue('photo', undefined);
        setPhotoPreview(null);
      }
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 2) {
        value = `${''}${value.slice(0, 2)}/${value.slice(2)}`;
      }
      if (value.length > 5) {
        value = `${''}${value.slice(0, 5)}/${value.slice(5, 9)}`;
      }
      e.target.value = value;
      return value;
    };

    const onSubmit = async (data: z.infer<typeof ClientUpdateProfileSchema>) => {
      if (!user) return;
  
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.photo) {
        formData.append('photo', data.photo);
      }
  
      const result = await updateUserProfileAction(user.uid, formData);
  
      if (result.success) {
        if (auth.currentUser) {
          try {
            await updateProfile(auth.currentUser, {
              displayName: data.name,
              photoURL: result.photoURL,
            });
            setUserProfile(prev => prev ? { ...prev, name: data.name, photoURL: result.photoURL || prev.photoURL } : null);
          } catch(e) {
             console.error("Error updating firebase auth profile:", e)
          }
        }
        toast({ title: "Sucesso!", description: "Seu perfil foi atualizado." });
        setPhotoPreview(null);
        setIsEditingName(false);
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || "Não foi possível atualizar o perfil." });
      }
      setIsConfirmOpen(false);
    };

    const handleSaveClick = () => {
        form.trigger().then(isValid => {
            if (!isValid) return;

            const { name, photo } = form.formState.dirtyFields;
            
            if (name) {
                setIsConfirmOpen(true);
            } else if (photo) {
                form.handleSubmit(onSubmit)();
            } else {
                setIsEditingName(false);
            }
        });
    };

    const handleCancel = () => {
      if (userProfile) {
        form.reset({ name: userProfile.name });
      }
      setPhotoPreview(null);
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

    return (
        <div className="space-y-8">
             <Card>
                <CardHeader>
                    <div>
                        <CardTitle>Meus Dados</CardTitle>
                        <CardDescription>Visualize e edite as informações da sua conta.</CardDescription>
                    </div>
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
                                <AvatarImage src={photoPreview || userProfile.photoURL || createAvatarSvg(userProfile.name || userProfile.email || '')} />
                                <AvatarFallback>{userProfile.name?.charAt(0).toUpperCase() || userProfile.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                              </Avatar>
                              <FormControl>
                                <Input id="photo-upload" type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={!isEditingName} />
                              </FormControl>
                              {isEditingName && (
                                <FormLabel htmlFor="photo-upload" className="cursor-pointer text-sm font-medium text-primary hover:underline flex items-center gap-2">
                                  <Camera className="h-4 w-4" /> Mudar foto de perfil
                                </FormLabel>
                              )}
                               <FormMessage>{form.formState.errors.photo?.message as string}</FormMessage>
                            </FormItem>
                            
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <div className="flex justify-between items-center">
                                    <FormLabel>Nome Completo</FormLabel>
                                    {!isEditingName && (
                                      <Button type="button" variant="link" size="sm" className="p-0 h-auto text-xs" onClick={() => setIsEditingName(true)}>
                                        Alterar
                                      </Button>
                                    )}
                                  </div>
                                  <FormControl>
                                      <Input {...field} disabled={!isEditingName} className="disabled:opacity-100 disabled:cursor-not-allowed" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Alert variant="default" className="bg-amber-50 border-amber-200">
                                <AlertDescription className="text-amber-800 text-xs">
                                Você só pode alterar seu nome uma vez por semana.
                                </AlertDescription>
                            </Alert>
                            
                            <FormItem>
                                <FormLabel>
                                    Data de Nascimento
                                    {isEditingName && <span className="text-xs text-destructive/90 font-normal ml-2">(Não pode ser alterada)</span>}
                                </FormLabel>
                                <Input value={userProfile.dateOfBirth} disabled className="disabled:opacity-100" />
                            </FormItem>
                            
                            <FormItem>
                                <FormLabel>
                                  Email
                                  {isEditingName && <span className="text-xs text-destructive/90 font-normal ml-2">(Não pode ser alterado)</span>}
                                </FormLabel>
                                <Input value={userProfile.email} disabled className="disabled:opacity-100" />
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

            <Card>
                <CardHeader>
                    <CardTitle>Meus Relatórios</CardTitle>
                </CardHeader>
                <CardContent>
                    <MyReportsList reports={userReports} />
                </CardContent>
            </Card>
        </div>
    )
}
