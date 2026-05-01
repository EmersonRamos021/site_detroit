import { MercadoPagoConfig, Payment } from "mercadopago";

/**
 * Cliente singleton do Mercado Pago.
 * Utiliza o Access Token configurado nas variáveis de ambiente.
 */
function getClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("❌ MERCADOPAGO_ACCESS_TOKEN não definido nas variáveis de ambiente.");
  }

  return new MercadoPagoConfig({ accessToken });
}

/**
 * Cria um pagamento PIX no Mercado Pago.
 * Retorna o QR Code (base64), o código copia-e-cola, e o ID do pagamento.
 */
export async function createPixPayment({
  amount,
  description,
  payerEmail,
  externalReference,
}: {
  amount: number;
  description: string;
  payerEmail: string;
  externalReference: string;
}) {
  const client = getClient();
  const payment = new Payment(client);

  const now = new Date();
  const expiration = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutos
  
  // Mercado Pago exige formato ISO 8601 com offset explícito (ex: -03:00)
  // Subtraímos 3 horas do UTC para pegar o tempo em Brasília
  const spTime = new Date(expiration.getTime() - 3 * 60 * 60 * 1000);
  const dateOfExpiration = spTime.toISOString().replace("Z", "-03:00");

  const result = await payment.create({
    body: {
      transaction_amount: amount,
      description,
      payment_method_id: "pix",
      payer: {
        email: payerEmail,
      },
      external_reference: externalReference,
    },
    requestOptions: {
      idempotencyKey: `detroit-${externalReference}-${Date.now()}`,
    },
  });

  const transactionData = result.point_of_interaction?.transaction_data;

  return {
    paymentId: result.id!,
    status: result.status!,
    qrCodeBase64: transactionData?.qr_code_base64 || "",
    qrCode: transactionData?.qr_code || "",
    ticketUrl: transactionData?.ticket_url || "",
    expiresAt: expiration.toISOString(),
  };
}

/**
 * Busca o status de um pagamento no Mercado Pago pelo ID.
 */
export async function getPaymentStatus(paymentId: number) {
  const client = getClient();
  const payment = new Payment(client);

  const result = await payment.get({ id: paymentId });

  return {
    id: result.id,
    status: result.status,
    statusDetail: result.status_detail,
    externalReference: result.external_reference,
  };
}
