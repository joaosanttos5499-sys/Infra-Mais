
'use client';

import { useState } from 'react';
import { useAuth } from '@/firebase';
import {
  createUserWithEmailAndPassword,
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

  const handleAuthAction = async (action: 'signIn' | 'signUp') => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (action === 'signUp') {
        await createUserWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Sucesso!',
          description: 'Sua conta foi criada.',
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Bem-vindo(a) de volta!',
        });
      }
      if (onAuthSuccess) onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Erro de Autenticação',
        description:
          err.code === 'auth/wrong-password'
            ? 'Senha incorreta.'
            : err.code === 'auth/user-not-found'
            ? 'Usuário não encontrado.'
            : err.code === 'auth/email-already-in-use'
            ? 'Este e-mail já está em uso.'
            : 'Ocorreu um erro. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
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
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex w-full gap-2">
          <Button
            onClick={() => handleAuthAction('signIn')}
            disabled={isSubmitting || !email || !password}
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Entrar
          </Button>
          <Button
            onClick={() => handleAuthAction('signUp')}
            disabled={isSubmitting || !email || !password}
            variant="secondary"
            className="w-full"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Conta
          </Button>
        </div>
      </div>
    </div>
  );
}
