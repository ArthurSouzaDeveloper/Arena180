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

export const perfilBarbeiroSchema = z.object({
  anosExperiencia: z.coerce
    .number()
    .int()
    .min(0, "Anos de experiência não pode ser negativo."),
  especialidades: z
    .array(z.string().trim().min(1))
    .min(1, "Informe ao menos uma especialidade."),
  cidade: z.string().trim().min(2, "Informe a cidade."),
  bairro: z.string().trim().optional(),
  raioAtendimentoKm: z.coerce
    .number()
    .int()
    .min(1, "Raio de atendimento deve ser de ao menos 1km."),
  valorDiariaPadrao: z.coerce
    .number()
    .positive("Informe um valor de diária válido."),
});

export const solicitarContratacaoSchema = z
  .object({
    barbeiroId: z.string().min(1, "Selecione um barbeiro."),
    dataInicio: z.coerce.date("Data de início inválida."),
    dataFim: z.coerce.date("Data de fim inválida."),
  })
  .refine((dados) => dados.dataFim >= dados.dataInicio, {
    message: "A data de fim deve ser igual ou posterior à data de início.",
    path: ["dataFim"],
  });

export type CadastroBarbeariaInput = z.infer<typeof cadastroBarbeariaSchema>;
export type CadastroBarbeiroInput = z.infer<typeof cadastroBarbeiroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PerfilBarbeiroInput = z.infer<typeof perfilBarbeiroSchema>;
export type SolicitarContratacaoInput = z.infer<
  typeof solicitarContratacaoSchema
>;
