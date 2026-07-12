import { query } from "@/lib/db";
import { getPaymentStatus } from "@/lib/mercadopago";
import { sendOrderNotification, sendPurchaseDM } from "@/lib/discord";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Webhook do Mercado Pago — recebe notificações de pagamento.
 * Quando o pagamento é aprovado, atualiza o pedido e notifica via Discord.
 */
export async function POST(request: Request) {
  try {
    const signature = request.headers.get("x-signature");
    const requestId = request.headers.get("x-request-id");
    
    // Ler o body como texto primeiro para não consumir o buffer
    const bodyText = await request.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const paymentId = body.data?.id || (new URL(request.url).searchParams.get("data.id"));
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

    // Validação da assinatura x-signature (Recomendado pelo Mercado Pago)
    if (secret && signature && requestId && paymentId) {
      const parts = signature.split(",");
      let ts = "";
      let v1 = "";
      parts.forEach(part => {
        const [key, val] = part.split("=");
        if (key.trim() === "ts") ts = val.trim();
        if (key.trim() === "v1") v1 = val.trim();
      });

      const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
      const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

      if (hmac !== v1) {
        console.error("❌ Webhook MP: Assinatura x-signature inválida!");
        return Response.json({ error: "Assinatura inválida" }, { status: 403 });
      }
    } else if (secret) {
      console.error("❌ Webhook MP: Requisição sem assinatura x-signature.");
      return Response.json({ error: "Assinatura ausente" }, { status: 403 });
    }

    // O Mercado Pago envia diferentes tipos de notificação
    // Estamos interessados em notificações do tipo "payment"
    if (body.type !== "payment" && body.action !== "payment.updated") {
      return Response.json({ received: true });
    }

    if (!paymentId) {
      return Response.json({ received: true });
    }

    // Buscar status do pagamento no Mercado Pago
    const paymentInfo = await getPaymentStatus(Number(paymentId));

    if (!paymentInfo || paymentInfo.status !== "approved") {
      // Pagamento não aprovado ainda, só confirmar recebimento
      return Response.json({ received: true, status: paymentInfo?.status });
    }

    // Pagamento aprovado! Buscar o pedido pelo external_reference (order code)
    const orderCode = paymentInfo.externalReference;

    if (!orderCode) {
      console.error("❌ Webhook MP: Sem external_reference no pagamento", paymentId);
      return Response.json({ received: true });
    }

    // Verificar se o pedido já foi marcado como pago
    const orders = await query<{
      id: number;
      code: string;
      status: string;
      price: number;
      original_price: number;
      discount: number;
      coupon_code: string | null;
      user_discord_id: string;
      user_discord_tag: string;
      game_id: string | null;
    }>(
      `SELECT o.id, o.code, o.status, o.price, o.original_price, o.discount, o.coupon_code, o.game_id,
              u.discord_id as user_discord_id,
              u.discord_tag as user_discord_tag
       FROM orders o
       INNER JOIN users u ON o.user_id = u.id
       WHERE o.code = ?`,
      [orderCode]
    );

    if (orders.length === 0) {
      console.error("❌ Webhook MP: Pedido não encontrado:", orderCode);
      return Response.json({ received: true });
    }

    const order = orders[0];

    // Já pago? Ignorar
    if (order.status === "pago" || order.status === "entregue") {
      return Response.json({ received: true, alreadyPaid: true });
    }

    // Atualizar pedido para "pago"
    await query(
      "UPDATE orders SET status = 'pago', updated_at = NOW() WHERE id = ?",
      [order.id]
    );

    // Registrar no financeiro automaticamente
    await query(
      `INSERT INTO finance_transactions (type, amount, description, category) VALUES (?, ?, ?, ?)`,
      ["entrada", Number(order.price), `Compra Automática (#${order.code})`, "Loja Automática"]
    );

    // Buscar itens para o titulo e comandos in-game
    const items = await query<{ quantity: number; title: string; in_game_command: string | null }>(
      `SELECT oi.quantity, p.title, p.in_game_command 
       FROM order_items oi
       INNER JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [order.id]
    );

    const productTitle = items.length > 0 
      ? items.map(i => `${i.quantity}x ${i.title}`).join(", ")
      : "Pedido Legado (Sem Itens)";

    console.log(`✅ Pedido ${order.code} pago via PIX! (MP ID: ${paymentId})`);

    // Enviar notificação no canal Discord (fire-and-forget)
    sendOrderNotification({
      code: order.code,
      productTitle,
      userTag: order.user_discord_tag,
      userDiscordId: order.user_discord_id,
      originalPrice: Number(order.original_price),
      discount: Number(order.discount),
      finalPrice: Number(order.price),
      couponCode: order.coupon_code,
      status: "pago",
    });

    // Enviar DM privada ao comprador
    sendPurchaseDM(order.user_discord_id, {
      code: order.code,
      productTitle,
      finalPrice: Number(order.price),
      discount: Number(order.discount),
      originalPrice: Number(order.original_price),
      couponCode: order.coupon_code,
      expiresAt: null,
    }, "pago");

    return Response.json({ received: true, paid: true, orderCode: order.code });
  } catch (error) {
    console.error("❌ Erro no webhook Mercado Pago:", error);
    // Sempre retornar 200 para o MP não reenviar
    return Response.json({ received: true, error: true });
  }
}

// Mercado Pago também pode fazer GET para verificar se o endpoint está ativo
export async function GET() {
  return Response.json({ status: "ok", service: "Detroit Roleplay - Mercado Pago Webhook" });
}
