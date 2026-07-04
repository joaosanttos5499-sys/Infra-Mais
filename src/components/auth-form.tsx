
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
      setEmail(emailParam);
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

    // Remove duplicates and add the newest one
    accounts = accounts.filter((a: any) => a.email !== user.email);
    accounts.unshift(newAccount);
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 5)));
  };

  const handleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        toast({
          title: 'E-mail não verificado',
          description: 'Por favor, verifique seu e-mail para ter acesso total a todas as funções.',
          variant: 'default',
        });
      }

      let profileName = user.displayName || 'Usuário';
      let profilePhoto = user.photoURL || createAvatarSvg(user.email || 'U');

      try {
        const profileResult = await fetchUserProfileAction(user.uid);
        if (profileResult.success && profileResult.data) {
          const ourProfile = profileResult.data;
          profileName = ourProfile.name;
          profilePhoto = ourProfile.photoURL || profilePhoto;
          if (user.displayName !== ourProfile.name || user.photoURL !== ourProfile.photoURL) {
            await updateProfile(user, {
              displayName: ourProfile.name,
              photoURL: ourProfile.photoURL
            });
          }
        }
      } catch (syncError) {
        console.error("Failed to sync profile on login:", syncError);
      }
      
      saveAccountLocally(user, profileName, profilePhoto);

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
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas falhas. Tente novamente mais tarde.';
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
    if (!email) {
      toast({
        title: "Atenção",
        description: "Por favor, digite seu e-mail primeiro.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
        auth.languageCode = 'pt';
        // Configura o redirecionamento para a nossa página personalizada de ação
        const actionCodeSettings = {
          url: `${window.location.origin}/auth/action`,
          handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        setView('resetSuccess');
    } catch (err: any) {
        console.error("Reset error:", err);
        toast({
            title: "Erro",
            description: err.code === 'auth/user-not-found' ? 'Nenhuma conta encontrada com este e-mail.' : 'Ocorreu um erro ao enviar o e-mail de recuperação.',
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (view === 'resetSuccess') {
    return (
        <div className="space-y-6 text-center py-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-6 w-6 text-green-600" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-medium">Link enviado!</h3>
                <p className='text-sm text-muted-foreground'>
                    Enviamos as instruções para <strong>{email}</strong>. 
                    Verifique sua caixa de entrada e a pasta de spam.
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
            <div className="flex items-center gap-2 mb-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setView('signIn')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold text-lg">Recuperar Senha</h3>
            </div>
            <p className='text-sm text-muted-foreground'>Digite seu e-mail cadastrado. Enviaremos um link para você criar uma nova senha com segurança.</p>
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
            Enviar link de recuperação
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
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              <span className="sr-only">{showPassword ? "Ocultar senha" : "Mostrar senha"}</span>
            </Button>
          </div>
           <div className="flex justify-end">
             <Button 
                variant="link" 
                className="p-0 h-auto text-xs text-muted-foreground hover:text-primary" 
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
        <Link 
          href="/signup" 
          className="underline font-medium hover:text-primary transition-colors"
          onClick={() => onSignupClick?.()}
        >
          Crie uma agora
        </Link>
      </p>
    </div>
  );
}
