import { describe, expect, it } from "vitest";
import { calcularNovaMediaAvaliacao } from "./avaliacao";

describe("calcularNovaMediaAvaliacao", () => {
  it("define a média como a própria nota na primeira avaliação", () => {
    expect(calcularNovaMediaAvaliacao(0, 0, 5)).toEqual({
      novaMedia: 5,
      novoTotal: 1,
    });
  });

  it("calcula a média ponderada considerando o histórico", () => {
    expect(calcularNovaMediaAvaliacao(4, 2, 5)).toEqual({
      novaMedia: 4.33,
      novoTotal: 3,
    });
  });

  it("reduz a média quando a nova nota é mais baixa que a média atual", () => {
    expect(calcularNovaMediaAvaliacao(5, 1, 1)).toEqual({
      novaMedia: 3,
      novoTotal: 2,
    });
  });
});
