
/**
 * Configurações globais do sistema Infra Mais.
 * 
 * EMPLOYEE_EMAILS: Lista de e-mails credenciados como funcionários.
 * Para adicionar ou remover um funcionário, basta editar esta lista.
 */
export const EMPLOYEE_EMAILS = [
  "joaosanttos528@gmail.com",
];

export function isEmailEmployee(email?: string | null): boolean {
  if (!email) return false;
  return EMPLOYEE_EMAILS.includes(email.toLowerCase());
}
