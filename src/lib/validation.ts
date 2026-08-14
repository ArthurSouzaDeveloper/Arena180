import { z } from "zod";

const camposComuns = {
  nome: z.string().trim().min(2, "Informe o nome completo."),
  email: z.email("E-mail inválido."),
  senha: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
  telefone: z.string().trim().min(8, "Telefone inválido.").optional(),
};

export const cadastroBarbeariaSchema = z.object({
  ...camposComuns,
  cnpj: z.string().trim().optional(),
  endereco: z.string().trim().min(5, "Informe o endereço do estabelecimento."),
});

export const cadastroBarbeiroSchema = z.object({
  ...camposComuns,
  cpf: z.string().trim().min(11, "CPF inválido."),
});

export const loginSchema = z.object({
  email: z.email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

export type CadastroBarbeariaInput = z.infer<typeof cadastroBarbeariaSchema>;
export type CadastroBarbeiroInput = z.infer<typeof cadastroBarbeiroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
