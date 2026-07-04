import { auth } from "@/auth";
import { query } from "@/lib/db";
import { getPaymentStatus } from "@/lib/mercadopago";
import { sendOrderNotification, sendPurchaseDM } from "@/lib/discord";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders/[code]/status
 * Retorna o status atual de um pedido (usado para polling no checkout).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const session = await auth();
    const { code } = await params;

    if (!session?.user?.discord_id) {
      return Response.json({ error: "Não autenticado." }, { status: 401 });
    }

    const orders = await query<{
      id: number;
      code: string;
      status: string;
      price: number;
      original_price: number;
      discount: number;
      coupon_code: string | null;
      product_title: string;
      mp_payment_id: number | null;
      user_discord_tag: string;
      user_discord_id: string;
    }>(
      `SELECT o.id, o.code, o.status, o.price, o.original_price, o.discount, o.coupon_code, o.mp_payment_id,
              u.discord_tag as user_discord_tag, u.discord_id as user_discord_id,
              COALESCE(
                (SELECT GROUP_CONCAT(CONCAT(oi.quantity, 'x ', p2.title) SEPARATOR ', ')
                 FROM order_items oi
                 INNER JOIN products p2 ON oi.product_id = p2.id
                 WHERE oi.order_id = o.id),
                p.title,
                'Pedido'
              ) as product_title
       FROM orders o
       LEFT JOIN products p ON o.product_id = p.id
       INNER JOIN users u ON o.user_id = u.id
       WHERE o.code = ? AND u.discord_id = ?`,
      [code, session.user.discord_id]
    );

    if (orders.length === 0) {
      return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    const order = orders[0];

    // Fallback: se ainda pendente e tem mp_payment_id, consulta o MP diretamente
    // Isso cobre casos onde o webhook não foi entregue
    if (order.status === "pendente" && order.mp_payment_id) {
      try {
        const mpStatus = await getPaymentStatus(order.mp_payment_id);
        if (mpStatus.status === "approved") {
          await query(
            "UPDATE orders SET status = 'pago', updated_at = NOW() WHERE id = ?",
            [order.id]
          );

          // Registrar no financeiro automaticamente
          await query(
            `INSERT INTO finance_transactions (type, amount, description, category) VALUES (?, ?, ?, ?)`,
            ["entrada", Number(order.final_price), `Compra Automática (#${order.code})`, "Loja Automática"]
          );

          order.status = "pago";

          // Como o polling atualizou o status antes do webhook, enviamos a notificação aqui
          sendOrderNotification({
            code: order.code,
            productTitle: order.product_title,
            userTag: order.user_discord_tag,
            userDiscordId: order.user_discord_id,
            originalPrice: Number(order.original_price),
            discount: Number(order.discount),
            finalPrice: Number(order.price),
            couponCode: order.coupon_code,
            status: "pago",
          });

          sendPurchaseDM(order.user_discord_id, {
            code: order.code,
            productTitle: order.product_title,
            finalPrice: Number(order.price),
            discount: Number(order.discount),
            originalPrice: Number(order.original_price),
            couponCode: order.coupon_code,
            expiresAt: null,
          }, "pago");
        }
      } catch {
        // Ignorar falhas na consulta ao MP, o webhook pode entregar depois
      }
    }

    return Response.json({
      code: order.code,
      status: order.status,
      price: Number(order.price),
      product: order.product_title,
      hasPix: !!order.mp_payment_id,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar status:", error);
    return Response.json({ error: "Erro interno." }, { status: 500 });
  }
}
