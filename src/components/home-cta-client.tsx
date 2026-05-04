"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Plus } from "lucide-react";
import { useUser } from "@/firebase";
import { isEmailEmployee } from "@/lib/config";

export function HomeCtaClient() {
  const { user, isUserLoading } = useUser();
  const isEmployee = isEmailEmployee(user?.email);

  if (isUserLoading) {
      return (
          <Button size="lg" disabled className="w-full sm:w-auto rounded-xl px-10 h-12 md:h-14 text-base md:text-lg font-bold opacity-50 bg-primary">
              Carregando...
          </Button>
      );
  }

  if (isEmployee) {
      return (
          <Button asChild size="lg" className="w-full sm:w-auto rounded-xl px-10 h-12 md:h-14 text-base md:text-lg font-bold shadow-xl hover:scale-105 transition-all duration-300 bg-blue-600 text-white">
            <Link href="/funcionarios" className="flex items-center gap-2 justify-center">
              Ir para Gestão <ShieldCheck className="h-6 w-6" />
            </Link>
          </Button>
      );
  }

  return (
    <Button asChild size="lg" className="w-full sm:w-auto rounded-xl px-10 h-12 md:h-14 text-base md:text-lg font-bold shadow-xl hover:scale-105 hover:brightness-110 transition-all duration-300 bg-primary text-white">
      <Link href="/report/auth" className="flex items-center gap-2 justify-center">
        Enviar Relato <Plus className="h-6 w-6" />
      </Link>
    </Button>
  );
}