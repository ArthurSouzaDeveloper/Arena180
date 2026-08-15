import { afterEach, describe, expect, it, vi } from "vitest";
import { calcularComissao } from "./comissao";

describe("calcularComissao", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calcula 12% de comissão por padrão (exemplo do design: 250 -> 280)", () => {
    const resultado = calcularComissao(250);

    expect(resultado).toEqual({
      valorBarbeiro: 250,
      valorComissao: 30,
      valorTotal: 280,
    });
  });

  it("arredonda o valor da comissão para duas casas decimais", () => {
    const resultado = calcularComissao(99.9);

    expect(resultado.valorComissao).toBe(11.99);
    expect(resultado.valorTotal).toBe(111.89);
  });

  it("retorna valor de comissão zero para valor do barbeiro zero", () => {
    expect(calcularComissao(0)).toEqual({
      valorBarbeiro: 0,
      valorComissao: 0,
      valorTotal: 0,
    });
  });

  it("respeita um percentual customizado via variável de ambiente", () => {
    vi.stubEnv("COMISSAO_PERCENTUAL", "0.2");

    const resultado = calcularComissao(100);

    expect(resultado).toEqual({
      valorBarbeiro: 100,
      valorComissao: 20,
      valorTotal: 120,
    });
  });
});
