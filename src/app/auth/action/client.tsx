
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { verifyPasswordResetCode } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { verifyResetRequestAction } from '@/lib/actions';
import { Loader2, ShieldCheck, MailCheck, AlertTriangle } from 'lucide-react';

export function AuthActionClient() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState<'validating' | 'verified' | 'error'>('validating');
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  const requestId = searchParams.get('requestId');

  useEffect(() => {
    if (!mode || !oobCode || mode !== 'resetPassword') {
      setStatus('error');
      return;
    }

    const validateAction = async () => {
      try {
        // Valida o código do Firebase
        await verifyPasswordResetCode(auth, oobCode);
        
        // Se houver um requestId, notifica o banco simulado para a outra aba
        if (requestId) {
          await verifyResetRequestAction(requestId, oobCode);
        }
        
        setStatus('verified');
      } catch (error) {
        console.error('Link de verificação inválido:', error);
        setStatus('error');
      }
    };

    validateAction();
  }, [mode, oobCode, requestId, auth]);

  if (status === 'validating') {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold">Verificando sua identidade...</p>
      </div>
    );
  }

  if (status === 'verified') {
    return (
      <Card className="w-full max-w-md border-primary/20 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <CardHeader className="bg-primary/5 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <MailCheck className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Conta Verificada!</CardTitle>
          <CardDescription className="text-base mt-2">
            Sua identidade foi confirmada com sucesso. Agora você pode fechar esta aba e voltar para a janela onde solicitou a recuperação para definir sua nova senha.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 pt-0 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">O Infra Mais agradece sua colaboração.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-destructive/20 shadow-xl text-center">
      <CardHeader className="p-8">
        <div className="flex justify-center mb-4 text-destructive">
          <AlertTriangle className="h-16 w-16" />
        </div>
        <CardTitle className="text-xl font-bold">Verificação Falhou</CardTitle>
        <CardDescription className="mt-2">
          Este link de verificação expirou ou já foi utilizado. Por favor, solicite uma nova recuperação de senha no site.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
