import { describe, expect, it } from "vitest";
import { statusPermiteChat, usuarioParticipaContratacao } from "./chat";

describe("usuarioParticipaContratacao", () => {
  const contratacao = { barbeariaId: "barbearia-1", barbeiroId: "barbeiro-1" };

  it("permite a barbearia da contratação", () => {
    expect(usuarioParticipaContratacao(contratacao, "barbearia-1")).toBe(true);
  });

  it("permite o barbeiro da contratação", () => {
    expect(usuarioParticipaContratacao(contratacao, "barbeiro-1")).toBe(true);
  });

  it("rejeita um terceiro que não faz parte da contratação", () => {
    expect(usuarioParticipaContratacao(contratacao, "outro-usuario")).toBe(
      false,
    );
  });
});

describe("statusPermiteChat", () => {
  it("bloqueia o chat antes do pagamento (PENDENTE)", () => {
    expect(statusPermiteChat("PENDENTE")).toBe(false);
  });

  it("bloqueia o chat quando apenas aceita, ainda não paga", () => {
    expect(statusPermiteChat("ACEITA")).toBe(false);
  });

  it("bloqueia o chat em contratações recusadas ou expiradas", () => {
    expect(statusPermiteChat("RECUSADA")).toBe(false);
    expect(statusPermiteChat("EXPIRADA")).toBe(false);
  });

  it("libera o chat após o pagamento", () => {
    expect(statusPermiteChat("PAGA")).toBe(true);
  });

  it("mantém o chat liberado após conclusão e avaliação", () => {
    expect(statusPermiteChat("CONCLUIDA")).toBe(true);
    expect(statusPermiteChat("AVALIADA")).toBe(true);
  });
});
