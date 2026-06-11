
"use client";

import { type Report } from "@/lib/types";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
});

interface HomeMapClientProps {
  reports: Report[];
  selectedLocation?: { lat: number; lng: number } | null;
}

export function HomeMapClient({ reports, selectedLocation }: HomeMapClientProps) {
  return <LeafletMap reports={reports} selectedLocation={selectedLocation} />;
}
