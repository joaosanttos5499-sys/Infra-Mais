
'use client';

import { AuthForm } from "@/components/auth-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth, useUser } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthReportClient() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const auth = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/report/new');
        }
    }, [user, isUserLoading, router]);

    const handleAnonymousReport = () => {
        initiateAnonymousSignIn(auth);
        toast({
            title: "Modo anônimo",
            description: "Você está relatando como um usuário anônimo."
        });
    }
    
    if (isUserLoading || user) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Carregando...</p>
            </div>
        );
    }

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Entrar</CardTitle>
                <CardDescription>Faça login para que seus relatórios fiquem salvos em sua conta.</CardDescription>
            </CardHeader>
            <CardContent>
                <AuthForm onAuthSuccess={() => router.push('/report/new')} />

                <div className="relative my-6">
                    <Separator />
                    <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-card px-2 text-sm text-muted-foreground">OU</span>
                </div>

                <Button variant="outline" className="w-full" onClick={handleAnonymousReport}>
                    Relatar Anonimamente
                </Button>
            </CardContent>
        </Card>
    )
}
