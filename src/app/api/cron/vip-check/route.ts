import { query } from "@/lib/db";
import { sendVipExpiryWarningDM } from "@/lib/discord";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const urlSecret = request.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (
    (!authHeader || authHeader !== `Bearer ${cronSecret}`) &&
    urlSecret !== cronSecret
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Busca pedidos que expiram em até 5 dias e ainda não foram notificados
    // Apenas pedidos com status = 'entregue'
    const orders = await query<{
      id: number;
      code: string;
      expires_at: Date;
      product_title: string;
      discord_id: string;
    }>(
      `SELECT o.id, o.code, o.expires_at, p.title as product_title, u.discord_id
       FROM orders o
       INNER JOIN products p ON o.product_id = p.id
       INNER JOIN users u ON o.user_id = u.id
       WHERE o.status = 'entregue'
         AND o.expires_at IS NOT NULL
         AND o.expiry_notified = 0
         AND o.expires_at <= DATE_ADD(NOW(), INTERVAL 5 DAY)
         AND o.expires_at > NOW()`
    );

    let notifiedCount = 0;

    for (const order of orders) {
      const msLeft = order.expires_at.getTime() - Date.now();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      try {
        await sendVipExpiryWarningDM(order.discord_id, {
          code: order.code,
          productTitle: order.product_title,
          expiresAt: order.expires_at,
          daysLeft,
        });

        // Marca como notificado
        await query("UPDATE orders SET expiry_notified = 1 WHERE id = ?", [order.id]);
        notifiedCount++;
      } catch (err) {
        console.error(`Erro ao notificar expiração do pedido ${order.code}:`, err);
      }
    }

    return Response.json({ success: true, notifiedCount, totalFound: orders.length });
  } catch (error) {
    console.error("Erro no cron vip-check:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
