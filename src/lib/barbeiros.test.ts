import { describe, expect, it } from "vitest";
import { construirFiltroBusca } from "./barbeiros";

describe("construirFiltroBusca", () => {
  it("retorna filtro vazio quando nenhum critério é informado", () => {
    expect(construirFiltroBusca({})).toEqual({});
  });

  it("filtra por cidade de forma case-insensitive", () => {
    expect(construirFiltroBusca({ cidade: "São Paulo" })).toEqual({
      cidade: { equals: "São Paulo", mode: "insensitive" },
    });
  });

  it("filtra por especialidade presente no array", () => {
    expect(construirFiltroBusca({ especialidade: "degradê" })).toEqual({
      especialidades: { has: "degradê" },
    });
  });

  it("filtra por faixa de preço com mínimo e máximo", () => {
    expect(construirFiltroBusca({ precoMin: 100, precoMax: 300 })).toEqual({
      valorDiariaPadrao: { gte: 100, lte: 300 },
    });
  });

  it("filtra por preço apenas com mínimo informado", () => {
    expect(construirFiltroBusca({ precoMin: 150 })).toEqual({
      valorDiariaPadrao: { gte: 150 },
    });
  });

  it("combina todos os critérios ao mesmo tempo", () => {
    expect(
      construirFiltroBusca({
        cidade: "Curitiba",
        especialidade: "barba",
        precoMin: 100,
        precoMax: 400,
      }),
    ).toEqual({
      cidade: { equals: "Curitiba", mode: "insensitive" },
      especialidades: { has: "barba" },
      valorDiariaPadrao: { gte: 100, lte: 400 },
    });
  });
});
