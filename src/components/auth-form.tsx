'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import {
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export function AuthForm({ onAuthSuccess }: { onAuthSuccess?: () => void }) {
  const auth = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Bem-vindo(a) de volta!',
      });
      if (onAuthSuccess) onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Erro de Autenticação',
        description:
          err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential'
            ? 'E-mail ou senha incorretos.'
            : err.code === 'auth/user-not-found'
            ? 'Usuário não encontrado.'
            : 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
