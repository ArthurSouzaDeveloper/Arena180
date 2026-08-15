const MP_API_BASE = "https://api.mercadopago.com";

function obterVariavel(nome: string): string {
  const valor = process.env[nome];
  if (!valor) {
    throw new Error(`Variável de ambiente ${nome} não configurada.`);
  }
  return valor;
}

export function gerarUrlAutorizacaoOAuth(state: string): string {
  const url = new URL("https://auth.mercadopago.com/authorization");
  url.searchParams.set("client_id", obterVariavel("MERCADOPAGO_CLIENT_ID"));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("platform_id", "mp");
  url.searchParams.set(
    "redirect_uri",
    obterVariavel("MERCADOPAGO_REDIRECT_URI"),
  );
  url.searchParams.set("state", state);
  return url.toString();
}

export type TokenOAuthMercadoPago = {
  access_token: string;
  refresh_token: string;
  user_id: number;
  expires_in: number;
};

export async function trocarCodigoPorToken(
  code: string,
): Promise<TokenOAuthMercadoPago> {
  const resposta = await fetch(`${MP_API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: obterVariavel("MERCADOPAGO_CLIENT_ID"),
      client_secret: obterVariavel("MERCADOPAGO_CLIENT_SECRET"),
      grant_type: "authorization_code",
      code,
      redirect_uri: obterVariavel("MERCADOPAGO_REDIRECT_URI"),
    }),
  });

  if (!resposta.ok) {
    throw new Error(
      "Falha ao trocar o código de autorização pelo token do Mercado Pago.",
    );
  }

  return resposta.json();
}

export type CriarPreferenciaInput = {
  accessTokenVendedor: string;
  contratacaoId: string;
  descricao: string;
  valorTotal: number;
  valorComissao: number;
};

export type PreferenciaMercadoPago = {
  id: string;
  init_point: string;
};

export async function criarPreferenciaPagamento(
  input: CriarPreferenciaInput,
): Promise<PreferenciaMercadoPago> {
  const appUrl = obterVariavel("APP_URL");

  const resposta = await fetch(`${MP_API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.accessTokenVendedor}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: input.descricao,
          quantity: 1,
          unit_price: input.valorTotal,
          currency_id: "BRL",
        },
      ],
      marketplace_fee: input.valorComissao,
      external_reference: input.contratacaoId,
      back_urls: {
        success: `${appUrl}/contratacoes`,
        failure: `${appUrl}/contratacoes`,
        pending: `${appUrl}/contratacoes`,
      },
      notification_url: `${appUrl}/api/mercadopago/webhook`,
    }),
  });

  if (!resposta.ok) {
    throw new Error(
      "Falha ao criar a preferência de pagamento no Mercado Pago.",
    );
  }

  return resposta.json();
}

export type PagamentoMercadoPago = {
  id: number;
  status: string;
  external_reference: string | null;
};

export async function buscarPagamento(
  paymentId: string,
): Promise<PagamentoMercadoPago> {
  const resposta = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${obterVariavel("MERCADOPAGO_ACCESS_TOKEN")}`,
    },
  });

  if (!resposta.ok) {
    throw new Error("Falha ao consultar o pagamento no Mercado Pago.");
  }

  return resposta.json();
}
