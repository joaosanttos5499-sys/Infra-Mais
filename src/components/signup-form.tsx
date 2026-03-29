
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveUserProfileAction } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { SignupSchema } from "@/lib/schemas";
import { useAuth } from "@/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { z } from "zod";


type SignupFormData = z.infer<typeof SignupSchema>;

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<SignupFormData>({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      dateOfBirth: "",
    },
  });

  const { control, handleSubmit } = form;

  const handleSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    try {
        // 1. Create user with Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        // 2. Save additional profile info using a server action
        const result = await saveUserProfileAction({
            id: user.uid,
            name: data.name,
            email: data.email,
            dateOfBirth: data.dateOfBirth
        });

        if(result.success) {
            // Update auth profile with name and generated/uploaded photo
            if (auth.currentUser) {
              await updateProfile(auth.currentUser, {
                displayName: data.name,
                photoURL: result.photoURL,
              });
            }

            toast({
                title: "Sucesso!",
                description: "Sua conta foi criada. Você será redirecionado.",
            });
            router.push('/');
        } else {
            throw new Error(result.error || "Falha ao salvar o perfil.");
        }

    } catch (error: any) {
        let errorMessage = "Ocorreu um erro inesperado.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Este e-mail já está em uso por outra conta.";
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
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
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
