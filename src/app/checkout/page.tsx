"use client";

import { useCart } from "@/contexts/CartContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

export default function CheckoutCartPage() {
  const { items, getTotal, clearCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{ code: string; amount: number; finalTotal: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Form Fields
  const [gameId, setGameId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") {
      router.push("/api/auth/signin");
    }
  }, [status, router]);

  if (!mounted || status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-20">
        <h1 className="text-2xl font-bold text-white">Seu carrinho está vazio</h1>
        <button onClick={() => router.push("/#store")} className="px-6 py-3 bg-[var(--color-detroit-red)] text-white font-bold rounded-full hover:bg-[var(--color-detroit-red-hover)]">
          Voltar para a loja
        </button>
      </div>
    );
  }

  const subtotal = getTotal();
  const displayTotal = discountInfo ? discountInfo.finalTotal : subtotal;

  async function handleValidateCoupon() {
    if (!couponCode) return;
    setValidatingCoupon(true);
    setMessage(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, productPrice: subtotal }), // Validating against subtotal
      });
      const data = await res.json();

      if (!res.ok) {
        setDiscountInfo(null);
        throw new Error(data.error);
      }

      setDiscountInfo({ code: data.discountCode, amount: data.discountAmount, finalTotal: data.finalPrice });
      setMessage({ type: "success", text: `Cupom aplicado: R$ ${data.discountAmount.toFixed(2)} de desconto!` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro." });
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function handleCheckout() {
    if (!gameId || !fullName || !email || !cpf) {
      setMessage({ type: "error", text: "Preencha todos os dados obrigatórios para continuar." });
      return;
    }
    if (!termsAccepted) {
      setMessage({ type: "error", text: "Você precisa aceitar os termos e condições." });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/checkout/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
          couponCode: discountInfo ? discountInfo.code : undefined,
          gameId,
          fullName,
          email,
          cpf
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar pedido");
      }

      // Limpar carrinho e redirecionar para PIX
      clearCart();
      router.push(`/checkout/${data.order.code}`);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro desconhecido",
      });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] pt-32 pb-20 px-6 max-w-[1200px] mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* ESQUERDA: Itens do Carrinho */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Resumo do Pedido</h2>
            <div className="flex flex-col gap-4">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950/50 border border-white/5">
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="text-sm text-zinc-400">Quantidade: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-white">R$ {(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex justify-between items-center text-zinc-400 mb-2">
                <span>Subtotal</span>
                <span>R$ {subtotal.toFixed(2)}</span>
              </div>
              {discountInfo && (
                <div className="flex justify-between items-center text-emerald-400 mb-2">
                  <span>Desconto ({discountInfo.code})</span>
                  <span>- R$ {discountInfo.amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-white text-xl font-bold mt-4 pt-4 border-t border-white/5">
                <span>Total</span>
                <span className="font-mono text-[var(--color-detroit-red)]">R$ {displayTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* DIREITA: Formulário de Checkout */}
        <div className="lg:col-span-5">
          <div className="sticky top-32 flex flex-col gap-6 bg-zinc-900/30 p-8 rounded-[2rem] border border-white/5 shadow-2xl backdrop-blur-sm relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[var(--color-detroit-red)] blur-[100px] opacity-10 pointer-events-none" />

            <div className="p-4 rounded-2xl bg-zinc-950/50 border border-white/5 text-sm text-zinc-400 leading-relaxed shadow-inner">
              <span className="font-bold text-white">Atenção:</span> Para garantir a entrega, é essencial que forneça seu <span className="font-bold text-white">nome completo</span> e <span className="font-bold text-white">CPF válido</span>.
            </div>

            <div className="flex flex-col gap-3 relative z-10">
              <input type="text" placeholder="Seu ID na cidade" value={gameId} onChange={e => setGameId(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-zinc-950/50 border border-white/5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors shadow-inner" />
              <input type="text" placeholder="Nome completo" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-zinc-950/50 border border-white/5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors shadow-inner" />
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-zinc-950/50 border border-white/5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors shadow-inner" />
              <input type="text" placeholder="CPF" value={cpf} onChange={e => setCpf(e.target.value)} className="w-full px-5 py-3.5 rounded-2xl bg-zinc-950/50 border border-white/5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors shadow-inner" />
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="Possui um cupom?" className="flex-1 px-5 py-3.5 rounded-2xl bg-zinc-950/50 border border-white/5 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors shadow-inner" />
              <button onClick={handleValidateCoupon} disabled={!couponCode || validatingCoupon} className="px-6 py-3.5 rounded-2xl bg-white/5 border border-white/5 text-zinc-300 text-sm font-bold hover:bg-white/10 hover:text-white disabled:opacity-50 transition-colors">
                {validatingCoupon ? "..." : "Aplicar"}
              </button>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group mt-2 relative z-10">
              <div className="relative flex items-center justify-center mt-0.5">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="peer appearance-none w-5 h-5 border-2 border-zinc-600 rounded bg-transparent checked:bg-[var(--color-detroit-red)] checked:border-[var(--color-detroit-red)] transition-all" />
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">
                Eu aceito os <span className="font-bold text-white">termos e condições</span> desta compra e <span className="font-bold text-white">confirmo</span> que a entrega ocorrerá para o <span className="font-bold text-white">ID informado</span>.
              </span>
            </label>

            <button onClick={handleCheckout} disabled={loading} className="w-full mt-2 px-10 py-5 rounded-full bg-[var(--color-detroit-red)] text-white font-bold text-lg hover:bg-[var(--color-detroit-red-hover)] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(229,9,20,0.4)] disabled:opacity-50 relative overflow-hidden group">
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
              {loading ? "Processando..." : `Pagar R$ ${displayTotal.toFixed(2)}`}
            </button>

            {message && (
              <div className={`px-4 py-3 rounded-xl text-sm font-medium relative z-10 ${message.type === "success" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
