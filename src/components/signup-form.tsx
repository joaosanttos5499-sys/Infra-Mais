
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveUserProfileAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MailCheck, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { SignupSchema } from "@/lib/schemas";
import { useAuth, useFirestore } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { z } from "zod";
import { createAvatarSvg } from "@/lib/avatar";
import { isEmailEmployee } from "@/lib/config";

type SignupFormData = z.infer<typeof SignupSchema>;

const LOCAL_STORAGE_ACCOUNTS_KEY = 'infra_mais_saved_accounts';

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const form = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      dateOfBirth: "",
    },
  });

  const { control, handleSubmit } = form;

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isVerificationSent) {
      interval = setInterval(async () => {
        try {
          const currentUser = auth.currentUser;
          if (currentUser) {
            await currentUser.reload();
            if (currentUser.emailVerified) {
              clearInterval(interval);
              toast({
                title: "E-mail verificado!",
                description: "Sua conta foi ativada com sucesso. Redirecionando...",
              });
              router.push('/');
            }
          }
        } catch (error) {
          console.error("Erro ao verificar status de ativação:", error);
        }
      }, 2000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVerificationSent, auth, router, toast]);

  const handleSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
        console.log(`[Signup] Iniciando criação de conta para: ${data.email}`);
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;
        const uid = user.uid;

        console.log(`[Signup] Conta criada no Auth com sucesso. UID: ${uid}`);

        // Configura perfil no Firestore diretamente do cliente para garantir permissões (isOwner)
        const role = isEmailEmployee(data.email) ? "EMPLOYEE" : "USER";
        const profilePhoto = createAvatarSvg(data.email);
        
        const profileData = {
          id: uid, // Obrigatório para bater com o path /users/{uid} e regra de segurança
          name: data.name,
          email: data.email,
          dateOfBirth: data.dateOfBirth,
          photoURL: profilePhoto,
          role: role,
          createdAt: new Date().toISOString()
        };

        console.log(`[Signup] Tentando salvar perfil em /users/${uid}`);
        console.log(`[Signup] Dados do perfil:`, JSON.stringify(profileData));

        try {
          // Gravação direta no Firestore usando o UID como ID do documento
          const userRef = doc(firestore, "users", uid);
          await setDoc(userRef, profileData);
          console.log(`[Signup] Perfil salvo no Firestore com sucesso.`);
        } catch (firestoreError: any) {
          console.error(`[Signup] Erro CRÍTICO ao salvar no Firestore:`, firestoreError);
          throw new Error(`Falha ao salvar perfil no banco de dados: ${firestoreError.message}`);
        }

        try {
          auth.languageCode = 'pt';
          await sendEmailVerification(user);
          console.log(`[Signup] E-mail de verificação enviado.`);
        } catch (verificationError) {
          console.error("[Signup] Erro ao enviar verificação:", verificationError);
        }

        await updateProfile(user, {
          displayName: data.name,
          photoURL: profilePhoto,
        });

        saveAccountLocally(user, data.name, profilePhoto);

        toast({
            title: "Conta criada!",
            description: "Verifique seu e-mail para ativar sua conta.",
        });
        setIsVerificationSent(true);

    } catch (error: any) {
        console.error("[Signup] Erro geral no fluxo:", error);
        let errorMessage = error.message || "Ocorreu um erro inesperado.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Este e-mail já está em uso.";
        }
        toast({ variant: 'destructive', title: 'Erro ao criar conta', description: errorMessage });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    if (value.length > 5) {
      value = `${value.slice(0, 5)}/${value.slice(5, 9)}`;
    }
    e.target.value = value;
    return value;
  };

  if (isVerificationSent) {
    return (
      <div className="text-center space-y-6 py-10 px-4 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="bg-green-100 p-4 rounded-full shadow-sm">
            <MailCheck className="h-14 w-14 text-green-600 animate-bounce" />
          </div>
        </div>
        <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-blue-400">Verifique seu e-mail</h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Enviamos um link de confirmação para <strong>{auth.currentUser?.email}</strong>. 
              Acesse seu e-mail para ativar sua conta e ser redirecionado.
            </p>
        </div>
        
        <div className="flex flex-col items-center gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-primary text-sm font-bold">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aguardando ativação...
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                O redirecionamento será automático após a confirmação
            </p>
        </div>

        <Button asChild variant="ghost" className="mt-2 text-gray-500 hover:text-primary">
          <Link href="/report/auth">Voltar para o Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(handleSignup)} className="space-y-4">
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Nascimento</FormLabel>
              <FormControl>
                 <Input 
                    placeholder="DD/MM/AAAA" 
                    {...field}
                    onChange={(e) => field.onChange(handleDateChange(e))}
                    maxLength={10}
                 />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input type="email" placeholder="seu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="********" 
                    {...field} 
                    className="pr-10"
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
                  <span className="sr-only">{showPassword ? "Ocultar senha" : "Mostrar senha"}</span>
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmação da Senha</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input 
                    type={showConfirmPassword ? "text" : "password"} 
                    placeholder="********" 
                    {...field} 
                    className="pr-10"
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
                  <span className="sr-only">{showConfirmPassword ? "Ocultar senha" : "Mostrar senha"}</span>
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Conta
        </Button>
        
        <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/report/auth" className="underline hover:text-primary">
                Faça login
            </Link>
        </p>
      </form>
    </Form>
  );
}
