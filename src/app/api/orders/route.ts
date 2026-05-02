import { auth } from "@/auth";
import { query } from "@/lib/db";
import { sendOrderNotification, sendPurchaseDM } from "@/lib/discord";

export const dynamic = "force-dynamic";

interface DbUser {
  id: number;
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.discord_id) {
      return Response.json(
        { error: "Você precisa estar logado para comprar." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, couponCode, gameId, fullName, email, cpf } = body;

    if (!productId) {
      return Response.json(
        { error: "ID do produto é obrigatório." },
        { status: 400 }
      );
    }

    // Buscar user do banco
    const users = await query<DbUser>(
      "SELECT id FROM users WHERE discord_id = ?",
      [session.user.discord_id]
    );

    if (users.length === 0) {
      return Response.json(
        { error: "Usuário não encontrado no banco." },
        { status: 404 }
      );
    }

    const userId = users[0].id;

    // Buscar produto (com categoria para detectar VIP)
    const products = await query<{ id: number; price: number; title: string; category_slug: string }>(
      `SELECT p.id, p.price, p.title, c.slug as category_slug
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       WHERE p.id = ? AND p.active = 1`,
      [productId]
    );

    if (products.length === 0) {
      return Response.json(
        { error: "Produto não encontrado ou indisponível." },
        { status: 404 }
      );
    }

    const product = products[0];
    let discount = 0;
    let finalPrice = Number(product.price);
    let appliedCoupon = null;

    // Validar e calcular cupom
    if (couponCode) {
      const coupons = await query<any>(
        "SELECT * FROM coupons WHERE code = ? AND active = 1",
        [couponCode.toUpperCase()]
      );

      if (coupons.length > 0) {
        const coupon = coupons[0];
        const isValid = 
          (!coupon.expires_at || new Date(coupon.expires_at) >= new Date()) &&
          (coupon.max_uses === null || coupon.used_count < coupon.max_uses) &&
          (coupon.min_price === 0 || finalPrice >= coupon.min_price);

        if (isValid) {
          if (coupon.discount_type === "percent") {
             discount = finalPrice * (Number(coupon.discount_value) / 100);
          } else {
             discount = Number(coupon.discount_value);
          }
          if (discount > finalPrice) discount = finalPrice;
          
          finalPrice -= discount;
          appliedCoupon = coupon.code;

          // Incrementar uso do cupom
          await query("UPDATE coupons SET used_count = used_count + 1 WHERE id = ?", [coupon.id]);
        }
      }
    }

    // Gerar código do pedido (DR-XXXXX)
    const code = `DR-${String(Date.now()).slice(-5)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;

    // Calcular data de expiração para VIPs e Planos (30 dias)
    const VIP_CATEGORIES = ["vips", "planos"];
    const isVip = VIP_CATEGORIES.includes(product.category_slug);
    let expiresAt: Date | null = null;
    if (isVip) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // Criar pedido
    await query(
      `INSERT INTO orders (code, user_id, product_id, status, original_price, discount, price, coupon_code, expires_at, game_id, full_name, email, cpf)
       VALUES (?, ?, ?, 'pendente', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, userId, product.id, product.price, discount, finalPrice, appliedCoupon, expiresAt, gameId, fullName, email, cpf]
    );

    // Buscar tag do usuário para a notificação
    const userInfo = await query<{ discord_tag: string; discord_id: string }>(
      "SELECT discord_tag, discord_id FROM users WHERE id = ?",
      [userId]
    );

    // Enviar notificação no canal Discord (fire-and-forget)
    sendOrderNotification({
      code,
      productTitle: product.title,
      userTag: userInfo[0]?.discord_tag || "Desconhecido",
      userDiscordId: session.user.discord_id,
      originalPrice: Number(product.price),
      discount,
      finalPrice,
      couponCode: appliedCoupon,
      status: "pendente",
      gameId,
      fullName,
      email,
      cpf,
    });

    // Enviar DM privada ao comprador (fire-and-forget)
    sendPurchaseDM(session.user.discord_id, {
      code,
      productTitle: product.title,
      finalPrice,
      discount,
      originalPrice: Number(product.price),
      couponCode: appliedCoupon,
      expiresAt,
    });

    return Response.json({
      success: true,
      order: {
        code,
        product: product.title,
        price: finalPrice,
        status: "pendente",
      },
    });
  } catch (error) {
    console.error("❌ Erro ao criar pedido:", error);
    return Response.json(
      { error: "Erro interno ao processar pedido." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.discord_id) {
      return Response.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const orders = await query(
      `SELECT o.id, o.code, o.status, o.price, o.created_at, o.updated_at,
              p.title as product_title, p.image_url as product_image
       FROM orders o
       INNER JOIN products p ON o.product_id = p.id
       INNER JOIN users u ON o.user_id = u.id
       WHERE u.discord_id = ?
       ORDER BY o.created_at DESC`,
      [session.user.discord_id]
    );

    return Response.json({ orders });
  } catch (error) {
    console.error("❌ Erro ao buscar pedidos:", error);
    return Response.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}
