const GRAPH_API_VERSION = "v20.0";

interface SendTemplateInput {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  templateName: string;
  bodyParams: string[];
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export const whatsappClient = {
  async sendTemplateMessage(input: SendTemplateInput): Promise<void> {
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${input.phoneNumberId}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: normalizePhone(input.to),
        type: "template",
        template: {
          name: input.templateName,
          language: { code: "pt_BR" },
          components: [
            {
              type: "body",
              parameters: input.bodyParams.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Falha ao enviar WhatsApp: ${response.status} ${text}`);
    }
  },
};
