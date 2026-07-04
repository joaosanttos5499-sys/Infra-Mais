
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ResetPasswordSchema } from '@/lib/schemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react';

export function AuthActionClient() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isValidating, setIsValidating] = useState(true);
  const [isValidCode, setIsValidCode] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (!mode || !oobCode || mode !== 'resetPassword') {
      setIsValidating(false);
      return;
    }

    const validateCode = async () => {
      try {
        await verifyPasswordResetCode(auth, oobCode);
        setIsValidCode(true);
      } catch (error) {
        console.error('Invalid code:', error);
        toast({
          variant: 'destructive',
          title: 'Link Inválido',
          description: 'O link de recuperação expirou ou já foi utilizado.',
        });
      } finally {
        setIsValidating(false);
      }
    };

    validateCode();
  }, [mode, oobCode, auth, toast]);

  const onSubmit = async (values: z.infer<typeof ResetPasswordSchema>) => {
    if (!oobCode) return;
    
    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      setIsSuccess(true);
      toast({
        title: 'Sucesso!',
        description: 'Sua senha foi alterada com êxito.',
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível redefinir a senha. Tente solicitar um novo link.',
      });
    }
  };

  if (isValidating) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Validando sua solicitação...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md border-primary/20 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <CardHeader className="bg-primary/5 p-8 text-center border-b border-primary/10">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Senha Alterada</CardTitle>
          <CardDescription className="text-base mt-2">
            A senha da sua conta foi alterada com sucesso. Agora você já pode utilizar suas novas credenciais para acessar o Infra Mais.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
           <Button asChild className="w-full h-12 rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] transition-all">
             <Link href="/report/auth">Voltar para o Login</Link>
           </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isValidCode) {
    return (
      <Card className="w-full max-w-md border-destructive/20 shadow-xl text-center">
        <CardHeader className="p-8">
          <div className="flex justify-center mb-4 text-destructive">
            <AlertTriangle className="h-16 w-16" />
          </div>
          <CardTitle className="text-xl font-bold">Solicitação Expirada</CardTitle>
          <CardDescription className="mt-2">
            Este link não é mais válido. Por favor, solicite uma nova recuperação de senha através da tela de login.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <Button asChild variant="outline" className="w-full h-11 rounded-xl font-bold">
            <Link href="/report/auth">Ir para Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border shadow-2xl rounded-2xl overflow-hidden bg-card animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="p-8 border-b border-border bg-muted/30">
        <CardTitle className="text-2xl font-bold">Criar nova senha</CardTitle>
        <CardDescription>
          Informe sua nova senha para concluir a recuperação da sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        className="h-12 rounded-xl pr-12 bg-muted/20"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="********"
                        className="h-12 rounded-xl pr-12 bg-muted/20"
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-bold text-base shadow-lg hover:scale-[1.02] transition-all"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Lock className="h-4 w-4 mr-2" />
              )}
              Salvar nova senha
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
