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
};

export const categories: Category[] = [
  { value: "pothole", label: "Buraco no asfalto", icon: AlertTriangle },
  { value: "garbage", label: "Lixo", icon: Trash2 },
  { value: "streetlight", label: "Iluminação", icon: LightbulbOff },
  { value: "vandalism", label: "Vandalismo", icon: SprayCan },
  { value: "water_leak", label: "Vazamento de água", icon: Droplets },
];

export const getCategory = (value: string) => {
  return categories.find((c) => c.value === value);
};
