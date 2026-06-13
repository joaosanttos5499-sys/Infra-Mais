'use client';

import { useState } from "react";
import { useUser, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import { deleteAccountAction } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, ShieldAlert, Lock, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function ExclusaoContaClient() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;
    if (!confirmed) {
        toast({ variant: 'destructive', title: "Confirmação pendente", description: "Você precisa marcar a caixa de confirmação." });
        return;
    }

    setIsDeleting(true);
    try {
        const credential = EmailAuthProvider.credential(email, password);
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
        let message = "Erro ao processar a exclusão. Verifique suas credenciais.";
        if (error.code === 'auth/wrong-password') message = "Senha incorreta.";
        if (error.code === 'auth/user-mismatch') message = "E-mail não corresponde ao usuário atual.";
        
        toast({ variant: 'destructive', title: "Erro na exclusão", description: message });
        setIsDeleting(false);
    }
  };

  if (isUserLoading || !user) {
    return (
        <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <Card className="rounded-2xl shadow-xl border-destructive/20 bg-card overflow-hidden">
      <CardHeader className="bg-destructive/5 p-8 border-b border-destructive/10">
        <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
                <ShieldAlert className="h-10 w-10 text-destructive" />
            </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-destructive">Exclusão da Conta</CardTitle>
        <CardDescription className="text-center text-destructive/80 font-medium">
            Esta é uma ação de segurança para confirmar sua identidade e ciência sobre a exclusão definitiva.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-8">
        <form onSubmit={handleDelete} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">E-mail de Confirmação</Label>
                <div className="relative">
                    <Input 
                        id="email"
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        placeholder="seu@email.com"
                        required
                        className="h-11 rounded-xl pl-10"
                    />
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Senha da Conta</Label>
                <div className="relative">
                    <Input 
                        id="password"
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder="********"
                        required
                        className="h-11 rounded-xl pl-10"
                    />
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                </div>
            </div>
          </div>

          <Separator className="bg-border" />

          <div className="flex items-start space-x-3 p-4 bg-muted/20 rounded-xl border border-border">
            <Checkbox 
                id="confirm-aware" 
                checked={confirmed} 
                onCheckedChange={(val) => setConfirmed(val as boolean)}
                className="mt-1"
            />
            <Label htmlFor="confirm-aware" className="text-sm leading-relaxed text-muted-foreground cursor-pointer font-medium">
                Estou ciente de que a exclusão da conta é <strong className="text-destructive">irreversível</strong> e que perderei acesso a todos os meus relatos e dados pessoais no Infra Mais.
            </Label>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button 
                type="submit" 
                variant="destructive" 
                className="h-12 rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] transition-all"
                disabled={isDeleting || !confirmed}
            >
                {isDeleting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Confirmar Exclusão Permanente"}
            </Button>
            
            <Button 
                type="button" 
                variant="ghost" 
                onClick={() => router.back()}
                className="h-10 text-muted-foreground font-medium"
                disabled={isDeleting}
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Minha Conta
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}