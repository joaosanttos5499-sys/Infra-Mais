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
  { value: "pothole", label: "Pothole", icon: AlertTriangle },
  {
    value: "streetlight",
    label: "Broken Streetlight",
    icon: LightbulbOff,
  },
  { value: "water_leak", label: "Water Leak", icon: Droplets },
  { value: "garbage", label: "Uncollected Garbage", icon: Trash2 },
  { value: "graffiti", label: "Graffiti", icon: SprayCan },
];

export const getCategory = (value: string) => {
  return categories.find((c) => c.value === value);
};
