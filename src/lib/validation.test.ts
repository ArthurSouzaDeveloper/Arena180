import { describe, expect, it } from "vitest";
import {
  cadastroBarbeariaSchema,
  cadastroBarbeiroSchema,
  loginSchema,
  perfilBarbeiroSchema,
  solicitarContratacaoSchema,
} from "./validation";

describe("cadastroBarbeariaSchema", () => {
  it("aceita dados válidos com CNPJ opcional ausente", () => {
    const resultado = cadastroBarbeariaSchema.safeParse({
      nome: "Barbearia do João",
      email: "contato@barbearia.com",
      senha: "senhaSegura123",
      endereco: "Rua das Flores, 123",
    });

    expect(resultado.success).toBe(true);
  });

  it("rejeita quando o endereço está ausente", () => {
    const resultado = cadastroBarbeariaSchema.safeParse({
      nome: "Barbearia do João",
      email: "contato@barbearia.com",
      senha: "senhaSegura123",
    });

    expect(resultado.success).toBe(false);
  });

  it("rejeita e-mail inválido", () => {
    const resultado = cadastroBarbeariaSchema.safeParse({
      nome: "Barbearia do João",
      email: "nao-e-email",
      senha: "senhaSegura123",
      endereco: "Rua das Flores, 123",
    });

    expect(resultado.success).toBe(false);
  });
});

describe("cadastroBarbeiroSchema", () => {
  it("aceita dados válidos com CPF", () => {
    const resultado = cadastroBarbeiroSchema.safeParse({
      nome: "João Barbeiro",
      email: "joao@email.com",
      senha: "senhaSegura123",
      cpf: "12345678900",
    });

    expect(resultado.success).toBe(true);
  });

  it("rejeita quando o CPF está ausente", () => {
    const resultado = cadastroBarbeiroSchema.safeParse({
      nome: "João Barbeiro",
      email: "joao@email.com",
      senha: "senhaSegura123",
    });

    expect(resultado.success).toBe(false);
  });

  it("rejeita senha menor que 8 caracteres", () => {
    const resultado = cadastroBarbeiroSchema.safeParse({
      nome: "João Barbeiro",
      email: "joao@email.com",
      senha: "curta",
      cpf: "12345678900",
    });

    expect(resultado.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("aceita e-mail e senha preenchidos", () => {
    const resultado = loginSchema.safeParse({
      email: "joao@email.com",
      senha: "qualquer",
    });

    expect(resultado.success).toBe(true);
  });

  it("rejeita senha vazia", () => {
    const resultado = loginSchema.safeParse({
      email: "joao@email.com",
      senha: "",
    });

    expect(resultado.success).toBe(false);
  });
});

describe("perfilBarbeiroSchema", () => {
  it("aceita dados válidos e converte campos numéricos vindos como string", () => {
    const resultado = perfilBarbeiroSchema.safeParse({
      anosExperiencia: "5",
      especialidades: ["degradê", "barba"],
      cidade: "São Paulo",
      raioAtendimentoKm: "10",
      valorDiariaPadrao: "250.00",
    });

    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.anosExperiencia).toBe(5);
      expect(resultado.data.valorDiariaPadrao).toBe(250);
    }
  });

  it("rejeita quando não há nenhuma especialidade", () => {
    const resultado = perfilBarbeiroSchema.safeParse({
      anosExperiencia: 5,
      especialidades: [],
      cidade: "São Paulo",
      raioAtendimentoKm: 10,
      valorDiariaPadrao: 250,
    });

    expect(resultado.success).toBe(false);
  });

  it("rejeita valor de diária negativo ou zero", () => {
    const resultado = perfilBarbeiroSchema.safeParse({
      anosExperiencia: 5,
      especialidades: ["barba"],
      cidade: "São Paulo",
      raioAtendimentoKm: 10,
      valorDiariaPadrao: 0,
    });

    expect(resultado.success).toBe(false);
  });
});

describe("solicitarContratacaoSchema", () => {
  it("aceita um período válido", () => {
    const resultado = solicitarContratacaoSchema.safeParse({
      barbeiroId: "abc-123",
      dataInicio: "2026-09-01",
      dataFim: "2026-09-02",
    });

    expect(resultado.success).toBe(true);
  });

  it("rejeita quando a data de fim é anterior à data de início", () => {
    const resultado = solicitarContratacaoSchema.safeParse({
      barbeiroId: "abc-123",
      dataInicio: "2026-09-02",
      dataFim: "2026-09-01",
    });

    expect(resultado.success).toBe(false);
  });

  it("rejeita quando o barbeiroId está ausente", () => {
    const resultado = solicitarContratacaoSchema.safeParse({
      dataInicio: "2026-09-01",
      dataFim: "2026-09-02",
    });

    expect(resultado.success).toBe(false);
  });
});
