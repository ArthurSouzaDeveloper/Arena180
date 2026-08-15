import { describe, expect, it } from "vitest";
import { calcularExpiracao, transicaoValida } from "./contratacao";

describe("transicaoValida", () => {
  it("permite PENDENTE -> ACEITA", () => {
    expect(transicaoValida("PENDENTE", "ACEITA")).toBe(true);
  });

  it("permite PENDENTE -> RECUSADA", () => {
    expect(transicaoValida("PENDENTE", "RECUSADA")).toBe(true);
  });

  it("permite PENDENTE -> EXPIRADA", () => {
    expect(transicaoValida("PENDENTE", "EXPIRADA")).toBe(true);
  });

  it("não permite ACEITA -> RECUSADA", () => {
    expect(transicaoValida("ACEITA", "RECUSADA")).toBe(false);
  });

  it("não permite transição a partir de um estado final (RECUSADA)", () => {
    expect(transicaoValida("RECUSADA", "ACEITA")).toBe(false);
  });

  it("não permite transição a partir de um estado final (EXPIRADA)", () => {
    expect(transicaoValida("EXPIRADA", "ACEITA")).toBe(false);
  });

  it("permite ACEITA -> PAGA", () => {
    expect(transicaoValida("ACEITA", "PAGA")).toBe(true);
  });

  it("não permite pular etapas (PENDENTE -> PAGA)", () => {
    expect(transicaoValida("PENDENTE", "PAGA")).toBe(false);
  });

  it("permite PAGA -> CONCLUIDA", () => {
    expect(transicaoValida("PAGA", "CONCLUIDA")).toBe(true);
  });

  it("permite CONCLUIDA -> AVALIADA", () => {
    expect(transicaoValida("CONCLUIDA", "AVALIADA")).toBe(true);
  });

  it("não permite avaliar antes de concluir (PAGA -> AVALIADA)", () => {
    expect(transicaoValida("PAGA", "AVALIADA")).toBe(false);
  });

  it("não permite avaliar mais de uma vez (AVALIADA -> AVALIADA)", () => {
    expect(transicaoValida("AVALIADA", "AVALIADA")).toBe(false);
  });
});

describe("calcularExpiracao", () => {
  it("soma 24 horas à data informada", () => {
    const agora = new Date("2026-01-01T00:00:00.000Z");
    const expiracao = calcularExpiracao(agora);

    expect(expiracao.toISOString()).toBe("2026-01-02T00:00:00.000Z");
  });
});
