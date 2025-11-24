
import {
  Road,
  Lightbulb,
  Droplets,
  Trash2,
  Trees,
  TrafficCone,
  Construction,
  Bus,
  type LucideIcon,
} from "lucide-react";

export type Category = {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
};

export const categories: Category[] = [
  { value: "vias_publicas", label: "Vias Públicas", icon: Road, color: "#fb923c" }, // Orange 400
  { value: "iluminacao", label: "Iluminação", icon: Lightbulb, color: "#60a5fa" }, // Blue 400
  { value: "agua_esgoto", label: "Água e Esgoto", icon: Droplets, color: "#3b82f6" }, // Blue 500
  { value: "limpeza_meio_ambiente", label: "Limpeza e Meio Ambiente", icon: Trash2, color: "#84cc16" }, // Lime 500
  { value: "espacos_publicos", label: "Espaços Públicos", icon: Trees, color: "#22c55e" }, // Green 500
  { value: "transito_seguranca", label: "Trânsito e Segurança", icon: TrafficCone, color: "#f97316" }, // Orange 500
  { value: "obras_estruturas", label: "Obras e Estruturas", icon: Construction, color: "#f59e0b" }, // Amber 500
  { value: "transporte_publico", label: "Transporte Público", icon: Bus, color: "#a855f7" }, // Purple 500
];

export const getCategory = (value: string) => {
  return categories.find((c) => c.value === value);
};
