
"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useUser } from "@/firebase";
import { isEmailEmployee } from "@/lib/config";

export function HomeCtaClient() {
  const { user, isUserLoading } = useUser();
  const isEmployee = isEmailEmployee(user?.email);

  if (isUserLoading) {
      return (
          <Button size="lg" className="mt-6 w-full sm:w-auto bg-amber-400 text-black opacity-50 cursor-not-allowed">
              Carregando...
          </Button>
      );
  }

  if (isEmployee) {
      return (
          <Button asChild size="lg" className="mt-6 w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700">
            <Link href="/funcionarios">
              Ir para Gestão <ShieldCheck className="ml-2 h-5 w-5" />
            </Link>
          </Button>
      );
  }

  return (
    <Button asChild size="lg" className="mt-6 w-full sm:w-auto bg-amber-400 text-black hover:bg-amber-400/90 focus-visible:ring-amber-500">
      <Link href="/report/auth">
        Relatar um Problema <ArrowRight className="ml-2 h-5 w-5" />
      </Link>
    </Button>
  );
}
