import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, productPrice } = body;

    if (!code || productPrice === undefined) {
      return Response.json({ error: "Código e preço são obrigatórios." }, { status: 400 });
    }

    const coupons = await query<any>(
      `SELECT * FROM coupons WHERE code = ? AND active = 1`,
      [code.toUpperCase()]
    );

    if (coupons.length === 0) {
      return Response.json({ error: "Cupom inválido ou inativo." }, { status: 404 });
    }

    const coupon = coupons[0];

    // Verificar expiração
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return Response.json({ error: "Este cupom já expirou." }, { status: 400 });
    }

    // Verificar uso máximo
    if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
      return Response.json({ error: "Este cupom esgotou o limite de usos." }, { status: 400 });
    }

    // Verificar valor mínimo
    if (coupon.min_price > 0 && productPrice < coupon.min_price) {
      return Response.json({ error: `Valor mínimo da compra deve ser R$ ${coupon.min_price.toFixed(2)}.` }, { status: 400 });
    }

    // Calcular desconto
    let discount = 0;
    if (coupon.discount_type === "percent") {
      discount = productPrice * (Number(coupon.discount_value) / 100);
    } else {
      discount = Number(coupon.discount_value);
    }

    if (discount > productPrice) discount = productPrice; // Não ficar negativo

    return Response.json({
      success: true,
      discountCode: coupon.code,
      discountAmount: discount,
      finalPrice: productPrice - discount
    });

  } catch (error) {
    console.error("Erro na validação do cupom:", error);
    return Response.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
