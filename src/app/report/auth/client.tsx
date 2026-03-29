
'use client';

import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthReportClient() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/report/new');
        }
    }, [user, isUserLoading, router]);

    
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
                <CardTitle>Entrar ou Criar Conta</CardTitle>
                <CardDescription>Faça login ou crie uma conta para que seus relatórios fiquem salvos.</CardDescription>
            </CardHeader>
            <CardContent>
                <AuthForm onAuthSuccess={() => router.push('/report/new')} />
            </CardContent>
        </Card>
    )
}
