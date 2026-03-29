
import { z } from "zod";
import { categories } from "./categories";
import { differenceInYears, parse } from "date-fns";

export const ReportSchema = z.object({
  userId: z.string().min(1, 'Você precisa estar logado para criar um relatório.'),
  category: z.string().refine(val => categories.some(c => c.value === val), {
    message: "Por favor, selecione uma categoria válida.",
  }),
  problem: z.string().min(1, "Por favor, selecione um problema específico."),
  bairro: z.string().min(3, "O bairro deve ter pelo menos 3 caracteres."),
  address: z.string().min(3, "A localização deve ter pelo menos 3 caracteres."),
  reference: z.string().optional(),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres."),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const SignupSchema = z.object({
  name: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
  email: z.string().email({ message: "Por favor, insira um e-mail válido." }),
  password: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres." }),
  dateOfBirth: z.string().refine((dob) => {
    try {
      const date = parse(dob, 'dd/MM/yyyy', new Date());
      return differenceInYears(new Date(), date) >= 16;
    } catch {
      return false;
    }
  }, {
    message: "Você deve ter pelo menos 16 anos e a data deve estar no formato DD/MM/AAAA.",
  }),
});
