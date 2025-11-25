
"use client";

import React, { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupUser } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Criar Conta
    </Button>
  );
}

export function SignupForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [formState, formAction, isPending] = useActionState(signupUser, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  const [date, setDate] = useState("");

  useEffect(() => {
    if (formState?.success) {
      toast({
        title: "Sucesso!",
        description: "Sua conta foi criada. Você será redirecionado.",
      });
      router.push('/');
    }
  }, [formState, router, toast]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    if (value.length > 5) {
      value = `${value.slice(0, 5)}/${value.slice(5, 9)}`;
    }
    setDate(value);
  };

  return (
    <form action={formAction} ref={formRef} className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" name="name" placeholder="Seu nome" required disabled={isPending} />
            {formState?.errors?.name && (
                <p className="text-sm font-medium text-destructive">{formState.errors.name}</p>
            )}
        </div>

        <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              placeholder="DD/MM/AAAA"
              value={date}
              onChange={handleDateChange}
              maxLength={10}
              required
              disabled={isPending}
            />
            {formState?.errors?.dateOfBirth && (
                <p className="text-sm font-medium text-destructive">{formState.errors.dateOfBirth}</p>
            )}
        </div>

        <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="seu@email.com" required disabled={isPending} />
            {formState?.errors?.email && (
                <p className="text-sm font-medium text-destructive">{formState.errors.email}</p>
            )}
        </div>

        <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" name="password" type="password" placeholder="********" required disabled={isPending} />
            {formState?.errors?.password && (
                <p className="text-sm font-medium text-destructive">{formState.errors.password}</p>
            )}
        </div>

        {formState?.errors?._form && (
            <Alert variant="destructive">
                <AlertTitle>Erro ao Criar Conta</AlertTitle>
                <AlertDescription>{formState.errors._form.join(", ")}</AlertDescription>
            </Alert>
        )}

        <SubmitButton />
        
        <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link href="/report/auth" className="underline hover:text-primary">
                Faça login
            </Link>
        </p>
    </form>
  );
}
