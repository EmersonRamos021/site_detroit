import { auth } from "@/auth";
import { query } from "@/lib/db";
import { createPixPayment } from "@/lib/mercadopago";

export const dynamic = "force-dynamic";

interface OrderData {
  id: number;
  code: string;
  price: number;
  status: string;
  product_title: string;
  mp_payment_id: number | null;
}

interface UserData {
  email: string | null;
  discord_id: string;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.discord_id) {
      return Response.json(
        { error: "Você precisa estar logado." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orderCode } = body;

    if (!orderCode) {
      return Response.json(
        { error: "Código do pedido é obrigatório." },
        { status: 400 }
      );
    }

    // Buscar pedido
    const orders = await query<OrderData>(
      `SELECT o.id, o.code, o.price, o.status, o.mp_payment_id,
              p.title as product_title
       FROM orders o
       INNER JOIN products p ON o.product_id = p.id
       INNER JOIN users u ON o.user_id = u.id
       WHERE o.code = ? AND u.discord_id = ?`,
      [orderCode, session.user.discord_id]
    );

    if (orders.length === 0) {
      return Response.json(
        { error: "Pedido não encontrado." },
        { status: 404 }
      );
    }

    const order = orders[0];

    // Se já pagou, não gerar novo PIX
    if (order.status === "pago" || order.status === "entregue") {
      return Response.json(
        { error: "Este pedido já foi pago." },
        { status: 400 }
      );
    }

    // Buscar email do usuário
    const users = await query<UserData>(
      "SELECT email, discord_id FROM users WHERE discord_id = ?",
      [session.user.discord_id]
    );

    const payerEmail = users[0]?.email || `discord_${session.user.discord_id}@detroitroleplay.com`;

    // Criar pagamento PIX no Mercado Pago
    const pixData = await createPixPayment({
      amount: Number(order.price),
      description: `Detroit RP - ${order.product_title} (${order.code})`,
      payerEmail,
      externalReference: order.code,
    });

    // Salvar ID do pagamento MP no pedido
    await query(
      "UPDATE orders SET mp_payment_id = ?, status = 'pendente' WHERE id = ?",
      [pixData.paymentId, order.id]
    );

    return Response.json({
      success: true,
      pix: {
        qrCodeBase64: pixData.qrCodeBase64,
        qrCode: pixData.qrCode,
        ticketUrl: pixData.ticketUrl,
        expiresAt: pixData.expiresAt,
        paymentId: pixData.paymentId,
      },
      order: {
        code: order.code,
        price: Number(order.price),
        product: order.product_title,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao criar PIX:", error);
    return Response.json(
      { error: "Erro interno ao gerar pagamento PIX." },
      { status: 500 }
    );
  }
}
