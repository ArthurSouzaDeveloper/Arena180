function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export type NovaMediaAvaliacao = {
  novaMedia: number;
  novoTotal: number;
};

export function calcularNovaMediaAvaliacao(
  mediaAtual: number,
  totalAtual: number,
  notaNova: number,
): NovaMediaAvaliacao {
  const novoTotal = totalAtual + 1;
  const novaMedia = arredondar(
    (mediaAtual * totalAtual + notaNova) / novoTotal,
  );

  return { novaMedia, novoTotal };
}
