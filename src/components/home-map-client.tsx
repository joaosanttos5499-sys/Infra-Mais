"use client";

import { type Report } from "@/lib/types";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
});

export function HomeMapClient({ reports }: { reports: Report[] }) {
  return <LeafletMap reports={reports} />;
}
