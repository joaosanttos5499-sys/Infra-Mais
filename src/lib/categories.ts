import {
  LightbulbOff,
  Droplets,
  Trash2,
  SprayCan,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";

export type Category = {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
};

export const categories: Category[] = [
  { value: "pothole", label: "Buraco no asfalto", icon: AlertTriangle, color: "#f59e0b" }, // Amber 500
  { value: "garbage", label: "Lixo", icon: Trash2, color: "#84cc16" }, // Lime 500
  { value: "streetlight", label: "Iluminação", icon: LightbulbOff, color: "#60a5fa" }, // Blue 400
  { value: "vandalism", label: "Vandalismo", icon: SprayCan, color: "#ef4444" }, // Red 500
  { value: "water_leak", label: "Vazamento de água", icon: Droplets, color: "#3b82f6" }, // Blue 500
];

export const getCategory = (value: string) => {
  return categories.find((c) => c.value === value);
};
