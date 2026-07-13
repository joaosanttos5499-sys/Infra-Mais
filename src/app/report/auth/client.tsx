'use client';

import { AuthForm } from "@/components/auth-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Separator } from "@/components/ui/separator";

export function AuthReportClient() {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isUserLoading && user) {
            // Redireciona para a página inicial conforme solicitado
            router.push('/');
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
            <CardHeader className="pb-4">
                <CardTitle>Entrar</CardTitle>
            </CardHeader>
            <CardContent>
                <Separator className="mb-6" />
                <AuthForm onAuthSuccess={() => {
                    // O redirecionamento principal é tratado pelo useEffect acima
                }} />
            </CardContent>
        </Card>
    )
}
