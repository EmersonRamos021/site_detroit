import { auth } from "@/auth";
import { query } from "@/lib/db";

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
      code: string;
      status: string;
      price: number;
      product_title: string;
      mp_payment_id: number | null;
    }>(
      `SELECT o.code, o.status, o.price, o.mp_payment_id,
              p.title as product_title
       FROM orders o
       INNER JOIN products p ON o.product_id = p.id
       INNER JOIN users u ON o.user_id = u.id
       WHERE o.code = ? AND u.discord_id = ?`,
      [code, session.user.discord_id]
    );

    if (orders.length === 0) {
      return Response.json({ error: "Pedido não encontrado." }, { status: 404 });
    }

    const order = orders[0];

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
