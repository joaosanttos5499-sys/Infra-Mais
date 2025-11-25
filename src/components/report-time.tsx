
"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ReportTime({ date }: { date: Date }) {
  const [timeAgo, setTimeAgo] = useState("");

  useEffect(() => {
    setTimeAgo(formatDistanceToNow(date, { addSuffix: true, locale: ptBR }));
  }, [date]);

  return <>{timeAgo}</>;
}
