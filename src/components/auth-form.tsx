
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Check } from 'lucide-react';

export function AuthForm({ onAuthSuccess }: { onAuthSuccess?: () => void }) {
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [view, setView] = useState<'signIn' | 'resetPassword' | 'resetSuccess'>('signIn');

  const handleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Bem-vindo(a) de volta!',
      });
      if (onAuthSuccess) onAuthSuccess();
    } catch (err: any) {
      let errorMessage = 'Ocorreu um erro. Tente novamente.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = 'E-mail ou senha incorretos.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'Nenhuma conta encontrada com este e-mail.';
      }
      toast({
        title: 'Erro de Autenticação',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePasswordReset = async () => {
    setIsSubmitting(true);
    try {
        auth.languageCode = 'pt';
        await sendPasswordResetEmail(auth, email);
        setView('resetSuccess');
    } catch (err: any) {
        toast({
            title: "Erro",
            description: err.code === 'auth/user-not-found' ? 'Nenhuma conta encontrada com este e-mail.' : 'Ocorreu um erro ao enviar o e-mail.',
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (view === 'resetSuccess') {
    return (
        <div className="space-y-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Link de redefinição enviado!</h3>
                <p className='text-sm text-muted-foreground'>
                    Se o e-mail <strong>{email}</strong> estiver associado a uma conta, você receberá um link. Verifique sua caixa de entrada e pasta de spam.
                </p>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setView('signIn')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o login
            </Button>
        </div>
    )
  }


  if (view === 'resetPassword') {
    return (
      <div className="space-y-6">
        <div className="space-y-4">
            <p className='text-sm text-muted-foreground'>Digite seu e-mail para receber um link de redefinição de senha.</p>
          <div className="space-y-2">
            <Label htmlFor="email-reset">E-mail</Label>
            <Input
              id="email-reset"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        <Button
            onClick={handlePasswordReset}
            disabled={isSubmitting || !email}
            className="w-full"
        >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar link de redefinição
        </Button>

        <Button variant="link" className="w-full" onClick={() => setView('signIn')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o login
        </Button>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
           <div className="flex justify-end">
             <Button 
                variant="link" 
                className="p-0 h-auto text-xs text-muted-foreground" 
                onClick={() => setView('resetPassword')}
             >
                Esqueci minha senha
             </Button>
           </div>
        </div>
      </div>
      
        <Button
          onClick={handleSignIn}
          disabled={isSubmitting || !email || !password}
          className="w-full"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Entrar
        </Button>
      
      <p className="text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link href="/signup" className="underline hover:text-primary">
          Crie uma agora
        </Link>
      </p>
    </div>
  );
}
