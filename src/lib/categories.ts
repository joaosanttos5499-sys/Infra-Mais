
import {
  Construction,
  Lightbulb,
  Droplets,
  Trash2,
  Trees,
  TrafficCone,
  Building,
  Bus,
  type LucideIcon,
} from "lucide-react";

export type Problem = {
    value: string;
    label: string;
}

export type Category = {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  problems: Problem[];
};

export const categories: Category[] = [
  { 
    value: "vias_publicas", 
    label: "Vias Públicas", 
    icon: Construction, 
    color: "#fb923c",
    problems: [
        { value: "buracos_rua", label: "Buracos na rua" },
        { value: "asfalto_danificado", label: "Asfalto danificado" },
        { value: "rua_sem_pavimentacao", label: "Rua sem pavimentação" },
        { value: "sinalizacao_danificada", label: "Sinalização apagada ou danificada" },
        { value: "lombada_irregular", label: "Lombada quebrada ou irregular" },
    ]
  },
  { 
    value: "iluminacao", 
    label: "Iluminação", 
    icon: Lightbulb, 
    color: "#60a5fa",
    problems: [
        { value: "poste_apagado", label: "Poste apagado" },
        { value: "oscilacao_luz", label: "Oscilação de luz" },
        { value: "lampada_queimada", label: "Lâmpada queimada" },
        { value: "poste_danificado", label: "Poste caído ou danificado" },
    ]
  },
  { 
    value: "agua_esgoto", 
    label: "Água e Esgoto", 
    icon: Droplets, 
    color: "#3c83f6",
    problems: [
        { value: "vazamento_agua", label: "Vazamento de água" },
        { value: "esgoto_ceu_aberto", label: "Esgoto a céu aberto" },
        { value: "bueiro_entupido", label: "Bueiro entupido" },
        { value: "tampa_bueiro_faltando", label: "Falta de tampa no bueiro" },
    ]
  },
  { 
    value: "limpeza_meio_ambiente", 
    label: "Limpeza e Meio Ambiente", 
    icon: Trash2, 
    color: "#84cc16",
    problems: [
        { value: "acumulo_lixo", label: "Acúmulo de lixo" },
        { value: "coleta_nao_realizada", label: "Coleta não realizada" },
        { value: "foco_entulho", label: "Foco de entulho" },
        { value: "queimada_irregular", label: "Queimada irregular" },
        { value: "queda_arvore", label: "Queda de árvore" },
    ]
  },
  { 
    value: "espacos_publicos", 
    label: "Espaços Públicos", 
    icon: Trees, 
    color: "#22c55e",
    problems: [
        { value: "praca_depredada", label: "Praça depredada" },
        { value: "parquinho_quebrado", label: "Parquinho quebrado" },
        { value: "academia_publica_danificada", label: "Academia pública danificada" },
        { value: "banco_publico_danificado", label: "Banco público danificado" },
    ]
  },
  { 
    value: "transito_seguranca", 
    label: "Trânsito e Segurança", 
    icon: TrafficCone, 
    color: "#f97316",
    problems: [
        { value: "semaforo_quebrado", label: "Semáforo quebrado" },
        { value: "placas_danificadas", label: "Placas de trânsito danificadas" },
        { value: "falta_faixa_pedestres", label: "Falta de faixa de pedestres" },
        { value: "redutor_velocidade_necessario", label: "Redutor de velocidade necessário" },
    ]
  },
  { 
    value: "obras_estruturas", 
    label: "Obras e Estruturas", 
    icon: Building, 
    color: "#f59e0b",
    problems: [
        { value: "obra_abandonada", label: "Obra abandonada" },
        { value: "rachadura_muros", label: "Rachadura em muros públicos" },
        { value: "ponte_danificada", label: "Ponte ou passarela danificada" },
    ]
  },
  { 
    value: "transporte_publico", 
    label: "Transporte Público", 
    icon: Bus, 
    color: "#a855f7",
    problems: [
        { value: "ponto_onibus_danificado", label: "Ponto de ônibus danificado" },
        { value: "abrigo_quebrado", label: "Abrigo quebrado ou sem cobertura" },
        { value: "transporte_pessimas_condicoes", label: "Transporte em péssima condições" },
    ]
  },
];

export const getCategory = (value: string) => {
  return categories.find((c) => c.value === value);
};
