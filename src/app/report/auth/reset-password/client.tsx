
'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { confirmPasswordReset } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ResetPasswordSchema } from '@/lib/schemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';

export function ResetPasswordClient() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const oobCode = searchParams.get('oobCode');

  const form = useForm<z.infer<typeof ResetPasswordSchema>>({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  const onSubmit = async (values: z.infer<typeof ResetPasswordSchema>) => {
    if (!oobCode) return;
    
    try {
      await confirmPasswordReset(auth, oobCode, values.password);
      setIsSuccess(true);
      toast({
        title: 'Senha alterada!',
        description: 'Sua conta foi atualizada com sucesso.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar a nova senha. O link pode ter expirado.',
      });
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md border-primary/20 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <CardHeader className="bg-primary/5 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <ShieldCheck className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Senha Alterada!</CardTitle>
          <CardDescription className="text-base mt-2">
            A senha da sua conta foi atualizada com sucesso. Sua conta já pode ser acessada utilizando sua nova credencial.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Infra Mais • Zeladoria Urbana</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader className="p-8 border-b border-border bg-muted/30 text-center">
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
                  <FormLabel>Nova Senha</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite a nova senha"
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
                  <FormLabel>Confirmar Nova Senha</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirme a senha"
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
              className="w-full h-12 rounded-xl font-bold text-base shadow-lg"
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
