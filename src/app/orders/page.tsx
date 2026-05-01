"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import Link from "next/link";
import Image from "next/image";

interface Order {
  id: number;
  code: string;
  status: string;
  price: number;
  product_title: string;
  product_image: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pendente: { label: "Pendente", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  pago: { label: "Pago", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
  entregue: { label: "Entregue", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
  cancelado: { label: "Cancelado", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
};

export default function OrdersPage() {
  const { data: session, status: authStatus } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    async function fetchOrders() {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        setOrders(data.orders || []);
      } catch {
        console.error("Erro ao buscar pedidos");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [authStatus]);

  if (authStatus === "loading") {
    return (
      <>
        <Navbar />
        <main className="flex-1 pt-28 pb-20 px-6 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-zinc-700 border-t-white animate-spin" />
        </main>
      </>
    );
  }

  if (authStatus === "unauthenticated") {
    return (
      <>
        <Navbar />
        <main className="flex-1 pt-28 pb-20 px-6 flex flex-col items-center justify-center gap-6 text-center">
          <h1 className="text-3xl font-bold text-white">Acesso Restrito</h1>
          <p className="text-zinc-400">Faça login com Discord para ver seus pedidos.</p>
          <Link
            href="/api/auth/signin"
            className="px-6 py-3 rounded-full bg-[#5865F2] text-white font-bold hover:bg-[#4752C4] transition-all"
          >
            Entrar com Discord
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-6">
        <div className="max-w-[1000px] mx-auto">
          <h1 className="text-4xl font-bold tracking-tighter text-white mb-2">Meus Pedidos</h1>
          <p className="text-zinc-400 mb-12">Acompanhe o status dos seus pedidos em Detroit.</p>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-zinc-500 text-lg mb-6">Você ainda não fez nenhum pedido.</p>
              <Link
                href="/#store"
                className="px-6 py-3 rounded-full bg-[var(--color-detroit-red)] text-white font-bold hover:bg-[var(--color-detroit-red-hover)] transition-all"
              >
                Explorar Loja
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, idx) => {
                const sc = statusConfig[order.status] || statusConfig.pendente;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-5 p-5 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-all"
                  >
                    {/* Product Image */}
                    {order.product_image && (
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                        <Image src={order.product_image} alt={order.product_title} fill className="object-cover" sizes="64px" />
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-mono text-zinc-500">{order.code}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                          {sc.label}
                        </span>
                      </div>
                      <p className="text-white font-semibold truncate">{order.product_title}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(order.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-lg font-mono font-bold text-white">
                        R$ {Number(order.price).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
