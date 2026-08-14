import { describe, expect, it } from "vitest";
import {
  cadastroBarbeariaSchema,
  cadastroBarbeiroSchema,
  loginSchema,
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
