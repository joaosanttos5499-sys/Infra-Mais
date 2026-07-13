
"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Componente para exibição de tempo relativo.
 * Implementa proteção contra erros de hidratação (hydration mismatch)
 * garantindo que o tempo seja renderizado apenas após a montagem no cliente.
 */
export function ReportTime({ date }: { date: Date }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // No servidor e no primeiro render do cliente, renderizamos um placeholder invisível
  // para manter o espaço mas evitar discrepância de texto.
  if (!mounted) {
    return <span className="opacity-0">...</span>;
  }

  const timeString = formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  // Remove "cerca de " para tornar a exibição do tempo mais direta conforme solicitado.
  const optimizedTime = timeString.replace(/cerca de /g, "");

  return <>{optimizedTime}</>;
}
