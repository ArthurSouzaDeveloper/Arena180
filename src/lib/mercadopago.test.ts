import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buscarPagamento,
  criarPreferenciaPagamento,
  gerarUrlAutorizacaoOAuth,
  trocarCodigoPorToken,
} from "./mercadopago";

function mockFetchJson(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

describe("gerarUrlAutorizacaoOAuth", () => {
  beforeEach(() => {
    vi.stubEnv("MERCADOPAGO_CLIENT_ID", "cliente-123");
    vi.stubEnv(
      "MERCADOPAGO_REDIRECT_URI",
      "http://localhost:3000/api/mercadopago/callback",
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("monta a URL de autorização com client_id, redirect_uri e state", () => {
    const url = new URL(gerarUrlAutorizacaoOAuth("usuario-abc"));

    expect(url.origin + url.pathname).toBe(
      "https://auth.mercadopago.com/authorization",
    );
    expect(url.searchParams.get("client_id")).toBe("cliente-123");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/api/mercadopago/callback",
    );
    expect(url.searchParams.get("state")).toBe("usuario-abc");
    expect(url.searchParams.get("response_type")).toBe("code");
  });
});

describe("trocarCodigoPorToken", () => {
  beforeEach(() => {
    vi.stubEnv("MERCADOPAGO_CLIENT_ID", "cliente-123");
    vi.stubEnv("MERCADOPAGO_CLIENT_SECRET", "segredo-456");
    vi.stubEnv(
      "MERCADOPAGO_REDIRECT_URI",
      "http://localhost:3000/api/mercadopago/callback",
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("troca o código por um token de acesso", async () => {
    const fetchMock = mockFetchJson(200, {
      access_token: "token-abc",
      refresh_token: "refresh-abc",
      user_id: 999,
      expires_in: 21600,
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await trocarCodigoPorToken("codigo-oauth");

    expect(resultado.access_token).toBe("token-abc");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mercadopago.com/oauth/token",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("lança erro quando a API do Mercado Pago responde com falha", async () => {
    vi.stubGlobal("fetch", mockFetchJson(400, { message: "invalid_grant" }));

    await expect(trocarCodigoPorToken("codigo-invalido")).rejects.toThrow();
  });
});

describe("criarPreferenciaPagamento", () => {
  beforeEach(() => {
    vi.stubEnv("APP_URL", "http://localhost:3000");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("envia o marketplace_fee e a external_reference corretos", async () => {
    const fetchMock = mockFetchJson(200, {
      id: "pref-123",
      init_point: "https://mercadopago.com/checkout/pref-123",
    });
    vi.stubGlobal("fetch", fetchMock);

    const resultado = await criarPreferenciaPagamento({
      accessTokenVendedor: "token-vendedor",
      contratacaoId: "contratacao-1",
      descricao: "Contratação de teste",
      valorTotal: 280,
      valorComissao: 30,
    });

    expect(resultado.init_point).toBe(
      "https://mercadopago.com/checkout/pref-123",
    );

    const [, opcoes] = fetchMock.mock.calls[0];
    const corpo = JSON.parse(opcoes.body);
    expect(corpo.marketplace_fee).toBe(30);
    expect(corpo.external_reference).toBe("contratacao-1");
    expect(opcoes.headers.Authorization).toBe("Bearer token-vendedor");
  });

  it("lança erro quando a criação da preferência falha", async () => {
    vi.stubGlobal("fetch", mockFetchJson(401, { message: "invalid token" }));

    await expect(
      criarPreferenciaPagamento({
        accessTokenVendedor: "token-invalido",
        contratacaoId: "contratacao-1",
        descricao: "Contratação de teste",
        valorTotal: 280,
        valorComissao: 30,
      }),
    ).rejects.toThrow();
  });
});

describe("buscarPagamento", () => {
  beforeEach(() => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "token-plataforma");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("retorna os dados do pagamento consultado", async () => {
    vi.stubGlobal(
      "fetch",
      mockFetchJson(200, {
        id: 555,
        status: "approved",
        external_reference: "contratacao-1",
      }),
    );

    const pagamento = await buscarPagamento("555");

    expect(pagamento.status).toBe("approved");
    expect(pagamento.external_reference).toBe("contratacao-1");
  });

  it("lança erro quando o pagamento não é encontrado", async () => {
    vi.stubGlobal("fetch", mockFetchJson(404, { message: "not found" }));

    await expect(buscarPagamento("inexistente")).rejects.toThrow();
  });
});
