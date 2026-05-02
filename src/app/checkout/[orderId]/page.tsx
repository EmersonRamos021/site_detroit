import { auth } from "@/auth";
import { query } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckoutClient } from "./CheckoutClient";

interface OrderDetail {
  code: string;
  status: string;
  price: number;
  product_title: string;
  product_image: string | null;
  mp_payment_id: number | null;
}

export const metadata: Metadata = {
  title: "Checkout PIX | Detroit Roleplay",
  description: "Finalize seu pagamento via PIX",
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await auth();
  const { orderId } = await params;

  if (!session?.user?.discord_id) {
    redirect("/api/auth/signin");
  }

  const orders = await query<{
    code: string;
    status: string;
    price: number;
    mp_payment_id: number | null;
    legacy_product_title: string;
    legacy_product_image: string | null;
    items_title: string;
    items_image: string | null;
  }>(
    `SELECT o.code, o.status, o.price, o.mp_payment_id,
            p.title as legacy_product_title, p.image_url as legacy_product_image,
            (SELECT GROUP_CONCAT(CONCAT(oi.quantity, 'x ', p2.title) SEPARATOR ', ')
             FROM order_items oi
             INNER JOIN products p2 ON oi.product_id = p2.id
             WHERE oi.order_id = o.id) as items_title,
            (SELECT p3.image_url 
             FROM order_items oi2 
             INNER JOIN products p3 ON oi2.product_id = p3.id 
             WHERE oi2.order_id = o.id LIMIT 1) as items_image
     FROM orders o
     LEFT JOIN products p ON o.product_id = p.id
     INNER JOIN users u ON o.user_id = u.id
     WHERE o.code = ? AND u.discord_id = ?`,
    [orderId, session.user.discord_id]
  );

  if (orders.length === 0) {
    notFound();
  }

  const order = orders[0];

  // Se já pago, redirecionar para pedidos
  if (order.status === "pago" || order.status === "entregue") {
    redirect("/orders");
  }

  return (
    <CheckoutClient
      orderCode={order.code}
      productTitle={order.items_title || order.legacy_product_title || "Vários Itens"}
      productImage={order.items_image || order.legacy_product_image || "/logodetroit.png"}
      price={Number(order.price)}
    />
  );
}
