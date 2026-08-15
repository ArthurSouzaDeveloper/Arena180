const PERCENTUAL_COMISSAO_PADRAO = 0.12;

function percentualComissao(): number {
  const valorEnv = process.env.COMISSAO_PERCENTUAL;
  const percentual = valorEnv ? Number(valorEnv) : PERCENTUAL_COMISSAO_PADRAO;
  return Number.isFinite(percentual) ? percentual : PERCENTUAL_COMISSAO_PADRAO;
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export type CalculoComissao = {
  valorBarbeiro: number;
  valorComissao: number;
  valorTotal: number;
};

export function calcularComissao(valorBarbeiro: number): CalculoComissao {
  const valorComissao = arredondar(valorBarbeiro * percentualComissao());
  const valorTotal = arredondar(valorBarbeiro + valorComissao);

  return { valorBarbeiro, valorComissao, valorTotal };
}
