
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/firebase';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';
import { fetchUserProfileAction } from '@/lib/actions';
import { useSearchParams } from 'next/navigation';
import { createAvatarSvg } from '@/lib/avatar';

const LOCAL_STORAGE_ACCOUNTS_KEY = 'infra_mais_saved_accounts';

export function AuthForm({ 
  onAuthSuccess, 
  onSignupClick 
}: { 
  onAuthSuccess?: () => void;
  onSignupClick?: () => void;
}) {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<'signIn' | 'resetPassword' | 'resetSuccess'>('signIn');

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam.trim());
    }
  }, [searchParams]);

  const saveAccountLocally = (user: any, profileName: string, profilePhoto: string) => {
    const saved = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
    let accounts = [];
    if (saved) {
      try {
        accounts = JSON.parse(saved);
      } catch (e) {}
    }

    const newAccount = {
      uid: user.uid,
      email: user.email,
      displayName: profileName,
      photoURL: profilePhoto
    };

    accounts = accounts.filter((a: any) => a.email !== user.email);
    accounts.unshift(newAccount);
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 5)));
  };

  const handleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      let profileName = user.displayName || 'Usuário';
      let profilePhoto = user.photoURL || createAvatarSvg(user.email || 'U');

      const profileResult = await fetchUserProfileAction(user.uid);
      if (profileResult.success && profileResult.data) {
        profileName = profileResult.data.name;
        profilePhoto = profileResult.data.photoURL || profilePhoto;
      }
      
      saveAccountLocally(user, profileName, profilePhoto);

      toast({ title: 'Bem-vindo(a) de volta!' });
      if (onAuthSuccess) onAuthSuccess();
    } catch (err: any) {
      let errorMessage = 'E-mail ou senha incorretos.';
      toast({ title: 'Erro de Autenticação', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePasswordReset = async () => {
    if (!email) {
      toast({ title: "Atenção", description: "Digite seu e-mail para prosseguir.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
        auth.languageCode = 'pt';
        const actionCodeSettings = {
          url: `${window.location.origin}/auth/action`,
          handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
        setView('resetSuccess');
    } catch (err: any) {
        toast({
            title: "Erro",
            description: "Não foi possível enviar o link. Verifique se o e-mail está correto.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (view === 'resetSuccess') {
    return (
        <div className="space-y-6 text-center py-8 animate-in fade-in zoom-in duration-500">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Mail className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div className="space-y-2">
                <h3 className="text-xl font-bold">Aguardando Verificação</h3>
                <p className='text-sm text-muted-foreground max-w-[280px] mx-auto'>
                    Enviamos um link de confirmação para <strong>{email}</strong>. 
                    Acesse seu e-mail e clique no link para ser redirecionado à redefinição de senha.
                </p>
            </div>
            <div className="pt-4 border-t border-border mt-4">
                <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setView('signIn')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para o login
                </Button>
            </div>
        </div>
    )
  }

  if (view === 'resetPassword') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('signIn')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-bold text-lg">Recuperar Senha</h3>
            </div>
            <p className='text-sm text-muted-foreground'>Informe seu e-mail cadastrado para receber o link de verificação.</p>
          <div className="space-y-2">
            <Label htmlFor="email-reset">Seu E-mail</Label>
            <Input
              id="email-reset"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="h-12 rounded-xl"
            />
          </div>
        </div>
        
        <Button
            onClick={handlePasswordReset}
            disabled={isSubmitting || !email}
            className="w-full h-12 rounded-xl font-bold"
        >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enviar Link de Verificação
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
            className="h-12 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="pr-10 h-12 rounded-xl"
            />
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
           <div className="flex justify-end">
             <Button 
                variant="link" 
                className="p-0 h-auto text-xs text-muted-foreground hover:text-primary font-bold" 
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
          className="w-full h-12 rounded-xl font-bold shadow-md"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Entrar
        </Button>
      
      <p className="text-center text-sm text-muted-foreground">
        Não tem uma conta?{' '}
        <Link 
          href="/signup" 
          className="text-primary font-bold hover:underline"
          onClick={() => onSignupClick?.()}
        >
          Crie uma agora
        </Link>
      </p>
    </div>
  );
}
