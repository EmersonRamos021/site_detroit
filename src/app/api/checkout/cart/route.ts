import { auth } from "@/auth";
import { query } from "@/lib/db";
import { sendOrderNotification, sendPurchaseDM, sendErrorLog } from "@/lib/discord";
import { ResultSetHeader } from "mysql2";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

interface DbUser {
  id: number;
  discord_tag: string;
}

interface CartItemInput {
  productId: number;
  quantity: number;
}

interface DbProduct {
  id: number;
  price: number;
  title: string;
  category_slug: string;
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

    const rateLimitResult = rateLimit(session.user.discord_id, 3, 5 * 60 * 1000); // Max 3 checkouts in 5 minutes
    if (!rateLimitResult.success) {
      return Response.json(
        { error: "Muitas tentativas em pouco tempo. Tente novamente em 5 minutos." },
        { status: 429 }
      );
    }

    const cartSchema = z.object({
      items: z.array(z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive().max(100),
        carId: z.number().int().positive().optional().nullable(),
      })).min(1, "Carrinho vazio."),
      couponCode: z.string().optional().nullable(),
      gameId: z.string().min(1, "ID in-game é obrigatório.").max(100),
      fullName: z.string().max(200).optional().nullable(),
      email: z.string().email("E-mail inválido.").max(200).optional().nullable(),
      cpf: z.string().max(20).optional().nullable(),
    });

    const body = await request.json();
    const parseResult = cartSchema.safeParse(body);

    if (!parseResult.success) {
      return Response.json(
        { error: "Dados do pedido inválidos.", details: parseResult.error.errors },
        { status: 400 }
      );
    }

    const { items, couponCode, gameId, fullName, email, cpf } = parseResult.data;

    // Buscar user do banco
    const users = await query<DbUser>(
      "SELECT id, discord_tag FROM users WHERE discord_id = ?",
      [session.user.discord_id]
    );

    if (users.length === 0) {
      return Response.json(
        { error: "Usuário não encontrado no banco." },
        { status: 404 }
      );
    }

    const userId = users[0].id;
    const userTag = users[0].discord_tag;

    // Buscar preços reais dos produtos do banco (segurança)
    const productIds = items.map(i => i.productId);
    const placeholders = productIds.map(() => "?").join(",");
    
    const dbProducts = await query<DbProduct>(
      `SELECT p.id, p.price, p.title, c.slug as category_slug
       FROM products p
       INNER JOIN categories c ON p.category_id = c.id
       WHERE p.id IN (${placeholders}) AND p.active = 1`,
      productIds
    );

    if (dbProducts.length !== productIds.length) {
      return Response.json(
        { error: "Um ou mais produtos não estão disponíveis." },
        { status: 404 }
      );
    }

    // Calcular Subtotal
    let subtotal = 0;
    const itemsToInsert = [];
    let containsVip = false;

    const VIP_CATEGORIES = ["vips", "planos"];

    for (const item of items) {
      const dbProduct = dbProducts.find(p => p.id === item.productId)!;
      const unitPrice = Number(dbProduct.price);
      subtotal += unitPrice * item.quantity;
      
      if (VIP_CATEGORIES.includes(dbProduct.category_slug)) {
        containsVip = true;
      }

      itemsToInsert.push({
        productId: dbProduct.id,
        title: dbProduct.title,
        quantity: item.quantity,
        unitPrice,
        carId: item.carId || null
      });
    }

    let discount = 0;
    let finalPrice = subtotal;
    let appliedCoupon = null;

    // Validar e calcular cupom sobre o SUBTOTAL
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

    // Calcular data de expiração se tiver VIP no carrinho (30 dias)
    let expiresAt: Date | null = null;
    if (containsVip) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // 1. Criar o pedido pai na tabela `orders`
    // Como a tabela exige product_id para retrocompatibilidade, passamos NULL
    const { getPool } = await import("@/lib/db");
    const [orderResult] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO orders (code, user_id, product_id, status, original_price, discount, price, coupon_code, expires_at, game_id, full_name, email, cpf)
       VALUES (?, ?, NULL, 'pendente', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [code, userId, subtotal, discount, finalPrice, appliedCoupon, expiresAt, gameId, fullName, email, cpf]
    );

    const orderId = orderResult.insertId;

    // 2. Criar os itens do pedido na tabela `order_items`
    for (const item of itemsToInsert) {
      await query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price, car_id) VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.productId, item.quantity, item.unitPrice, item.carId]
      );
    }

    // Format title for Discord: "3x VIP, 1x Carro"
    const formattedTitle = itemsToInsert.map(i => `${i.quantity}x ${i.title}`).join(", ");

    // Enviar notificação no canal Discord (fire-and-forget)
    sendOrderNotification({
      code,
      productTitle: formattedTitle,
      userTag,
      userDiscordId: session.user.discord_id,
      originalPrice: subtotal,
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
      productTitle: formattedTitle,
      finalPrice,
      discount,
      originalPrice: subtotal,
      couponCode: appliedCoupon,
      expiresAt,
    });

    return Response.json({
      success: true,
      order: {
        code,
        product: formattedTitle,
        price: finalPrice,
        status: "pendente",
      },
    });
  } catch (error: any) {
    console.error("❌ Erro ao processar checkout do carrinho:", error);
    await sendErrorLog("Checkout Carrinho (/api/checkout/cart)", error);
    return Response.json(
      { error: "Erro interno ao processar pedido." },
      { status: 500 }
    );
  }
}
