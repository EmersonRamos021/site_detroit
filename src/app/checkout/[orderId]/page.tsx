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

  const orders = await query<OrderDetail>(
    `SELECT o.code, o.status, o.price, o.mp_payment_id,
            p.title as product_title, p.image_url as product_image
     FROM orders o
     INNER JOIN products p ON o.product_id = p.id
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
      productTitle={order.product_title}
      productImage={order.product_image}
      price={Number(order.price)}
    />
  );
}
