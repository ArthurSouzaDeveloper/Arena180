import { AppError } from "../../domain/errors";

const MERCADO_PAGO_API_URL = "https://api.mercadopago.com/v1/payments";

interface CreatePixPaymentInput {
  accessToken: string;
  amount: number;
  description: string;
  externalReference: string;
  payerEmail: string;
  notificationUrl?: string;
}

export interface PixPaymentResult {
  id: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
}

async function parseJsonResponse(response: Response): Promise<any> {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new AppError("O Mercado Pago está indisponível no momento. Tente novamente em instantes.", 502);
  }
}

export const mercadoPagoClient = {
  async createPixPayment(input: CreatePixPaymentInput): Promise<PixPaymentResult> {
    const response = await fetch(MERCADO_PAGO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`,
        "X-Idempotency-Key": input.externalReference,
      },
      body: JSON.stringify({
        transaction_amount: Number(input.amount.toFixed(2)),
        description: input.description,
        payment_method_id: "pix",
        external_reference: input.externalReference,
        notification_url: input.notificationUrl || undefined,
        payer: { email: input.payerEmail },
      }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new AppError(
        `Não foi possível gerar o pagamento Pix: ${data?.message ?? "erro desconhecido"}`,
        502,
      );
    }

    const pointOfInteraction = data.point_of_interaction?.transaction_data;
    if (!pointOfInteraction?.qr_code) {
      throw new AppError("O Mercado Pago não retornou um QR Code válido", 502);
    }

    return {
      id: String(data.id),
      status: data.status,
      qrCode: pointOfInteraction.qr_code,
      qrCodeBase64: pointOfInteraction.qr_code_base64,
    };
  },

  async getPayment(accessToken: string, paymentId: string): Promise<{ status: string }> {
    const response = await fetch(`${MERCADO_PAGO_API_URL}/${paymentId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) {
      throw new AppError(`Não foi possível consultar o pagamento: ${data?.message ?? "erro desconhecido"}`, 502);
    }
    return { status: data.status };
  },
};
