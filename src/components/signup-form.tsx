
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupUser, type SignupFormState, SignupSchema } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { useFormStatus } from "react-dom";

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
  
  const form = useForm({
    resolver: zodResolver(SignupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      dateOfBirth: "",
    },
  });

  const { formState, setError, control } = form;

  const handleAction = async (data: FormData): Promise<SignupFormState> => {
    const result = await signupUser(undefined, data);
    if (result?.errors) {
      Object.keys(result.errors).forEach((key) => {
        const field = key as keyof SignupFormState['errors'];
        const message = result.errors?.[field]?.join(', ');
        if(field === '_form') {
            toast({ variant: 'destructive', title: 'Erro ao criar conta', description: message });
        } else if (message) {
            setError(field, { type: 'manual', message });
        }
      });
    }
    return result;
  };

  useEffect(() => {
    if (formState.isSubmitSuccessful) {
        toast({
            title: "Sucesso!",
            description: "Sua conta foi criada. Você será redirecionado.",
        });
        router.push('/');
    }
  }, [formState.isSubmitSuccessful, router, toast]);

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
      <form action={() => form.handleSubmit(() => {
          const formData = new FormData();
          const values = form.getValues();
          Object.keys(values).forEach(key => {
            formData.append(key, values[key as keyof typeof values]);
          })
          handleAction(formData);
        })()} 
        className="space-y-4"
      >
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
        
        <SubmitButton />
        
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
