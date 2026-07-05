
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { verifyPasswordResetCode } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle } from 'lucide-react';

export function AuthActionClient() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState<'validating' | 'error'>('validating');
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    const validateAction = async () => {
      if (mode === 'resetPassword' && oobCode) {
        try {
          // Valida se o código é legítimo antes de redirecionar para a página de redefinição interna
          await verifyPasswordResetCode(auth, oobCode);
          router.push(`/report/auth/reset-password?oobCode=${oobCode}`);
        } catch (error) {
          console.error('Falha na validação do código:', error);
          setStatus('error');
        }
      } else {
        // Se não for resetPassword ou não tiver o código, é um link inválido para este fluxo
        setStatus('error');
      }
    };

    validateAction();
  }, [mode, oobCode, auth, router]);

  if (status === 'validating') {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold">Validando solicitação...</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md border-destructive/20 shadow-xl text-center">
      <CardHeader className="p-8">
        <div className="flex justify-center mb-4 text-destructive">
          <AlertTriangle className="h-16 w-16" />
        </div>
        <CardTitle className="text-xl font-bold">Link Inválido</CardTitle>
        <CardDescription className="mt-2">
          Este link expirou ou já foi utilizado. Por favor, solicite uma nova recuperação de senha no site.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-8">
        <button 
          onClick={() => router.push('/report/auth')}
          className="text-primary font-bold hover:underline text-sm"
        >
          Voltar para o login
        </button>
      </CardContent>
    </Card>
  );
}
