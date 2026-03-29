
'use client';

import { useUser, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { type Report, type UserProfile } from "@/lib/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Edit, Loader2, Save, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getCategory } from "@/lib/categories";
import Image from "next/image";
import { StatusBadge } from "@/components/status-badge";
import { ReportTime } from "@/components/report-time";
import { Button } from "@/components/ui/button";
import { doc } from "firebase/firestore";
import { useDoc } from "@/firebase/firestore/use-doc";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UpdateProfileSchema } from "@/lib/schemas";
import { updateUserProfileAction } from "@/lib/actions";
import { updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createAvatarSvg } from "@/lib/avatar";


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
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);

    const userProfileRef = useMemoFirebase(() => {
        if (!user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [user?.uid, firestore]);
    
    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

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
      if (userProfile && isEditing) {
        form.reset({ name: userProfile.name });
      }
    }, [userProfile, form, isEditing]);


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
          } catch(e) {
             console.error("Error updating firebase auth profile:", e)
          }
        }
        toast({ title: "Sucesso!", description: "Seu perfil foi atualizado." });
        setIsEditing(false);
        setPhotoPreview(null);
      } else {
        toast({ variant: 'destructive', title: 'Erro', description: result.error || "Não foi possível atualizar o perfil." });
      }
    };

    const handleCancel = () => {
      if (userProfile) {
        form.reset({ name: userProfile.name });
      }
      setIsEditing(false);
      setPhotoPreview(null);
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
                <CardHeader className="flex flex-row items-start sm:items-center justify-between">
                    <div>
                        <CardTitle>Meus Dados</CardTitle>
                        <CardDescription>Visualize e edite as informações da sua conta.</CardDescription>
                    </div>
                    {!isEditing && (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                            <Edit className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Editar Perfil</span>
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {isProfileLoading ? (
                        <UserDataSkeleton />
                    ) : isEditing ? (
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormItem className="flex flex-col items-center gap-4">
                              <Avatar className="h-24 w-24">
                                <AvatarImage src={photoPreview || userProfile?.photoURL || createAvatarSvg(userProfile?.name || '')} />
                                <AvatarFallback>{userProfile?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                              </Avatar>
                              <FormControl>
                                <Input id="photo-upload" type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
                              </FormControl>
                              <FormLabel htmlFor="photo-upload" className="cursor-pointer text-sm font-medium text-primary hover:underline flex items-center gap-2">
                                <Camera className="h-4 w-4" /> Mudar foto de perfil
                              </FormLabel>
                               <FormMessage>{form.formState.errors.photo?.message as string}</FormMessage>
                            </FormItem>
                            
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome Completo</FormLabel>
                                  <FormControl><Input {...field} /></FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Alert variant="default" className="bg-amber-50 border-amber-200">
                                <AlertDescription className="text-amber-800 text-xs">
                                Você só pode alterar seu nome uma vez por semana.
                                </AlertDescription>
                            </Alert>
                            
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                                <p className="text-sm text-gray-500">{userProfile?.dateOfBirth} (não pode ser alterada)</p>
                            </div>
                            
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Email</p>
                                <p className="text-sm text-gray-500">{userProfile?.email} (não pode ser alterado)</p>
                            </div>

                             <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    <X className="mr-2 h-4 w-4" /> Cancelar
                                </Button>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Salvar
                                </Button>
                            </div>
                          </form>
                        </Form>
                    ) : userProfile ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                               <Avatar className="h-20 w-20">
                                  <AvatarImage src={userProfile.photoURL || createAvatarSvg(userProfile.name || '')} alt={userProfile.name || 'Avatar do usuário'} />
                                  <AvatarFallback>{userProfile.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Nome Completo</p>
                                    <p className="text-lg font-semibold">{userProfile.name}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                                <p>{userProfile.dateOfBirth}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Email</p>
                                <p>{userProfile.email}</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">Não foi possível carregar os dados do seu perfil.</p>
                    )}
                </CardContent>
            </Card>
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
