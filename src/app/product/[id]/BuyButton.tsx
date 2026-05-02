"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface BuyButtonProps {
  productId: number;
  productTitle: string;
  price: number;
}

export function BuyButton({ productId, productTitle, price }: BuyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [discountInfo, setDiscountInfo] = useState<{ code: string; amount: number; finalPrice: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Form Fields
  const [gameId, setGameId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  async function handleValidateCoupon() {
    if (!couponCode) return;
    setValidatingCoupon(true);
    setMessage(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, productPrice: price }),
      });
      const data = await res.json();

      if (!res.ok) {
        setDiscountInfo(null);
        throw new Error(data.error);
      }

      setDiscountInfo({ code: data.discountCode, amount: data.discountAmount, finalPrice: data.finalPrice });
      setMessage({ type: "success", text: `Cupom aplicado: R$ ${data.discountAmount.toFixed(2)} de desconto!` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erro." });
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function handleBuy() {
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
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          productId,
          couponCode: discountInfo ? discountInfo.code : undefined,
          gameId,
          fullName,
          email,
          cpf
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/api/auth/signin");
          return;
        }
        throw new Error(data.error || "Erro ao criar pedido");
      }

      // Redirecionar para o checkout PIX
      router.push(`/checkout/${data.order.code}`);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Erro desconhecido",
      });
      setLoading(false);
    }
  }

  // Preço que vamos mostrar
  const displayPrice = discountInfo ? discountInfo.finalPrice : price;

  return (
    <div className="flex flex-col gap-6 w-full max-w-md mx-auto sm:mx-0">
      
      {/* INFORMATIVE ALERT */}
      <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 text-sm text-zinc-400">
        <span className="font-bold text-white">Atenção:</span> Para garantir a entrega correta de seu pedido, é essencial que você forneça seu <span className="font-bold text-white">nome completo</span> e <span className="font-bold text-white">CPF válido</span>. Por favor, verifique a precisão dessas informações, pois a entrega será realizada com base nos dados informados.
      </div>

      {/* FORM FIELDS */}
      <div className="flex flex-col gap-3">
        <input 
          type="text" 
          placeholder="Seu ID na cidade" 
          value={gameId}
          onChange={e => setGameId(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors"
        />
        <input 
          type="text" 
          placeholder="Nome completo" 
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors"
        />
        <input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors"
        />
        <input 
          type="text" 
          placeholder="CPF" 
          value={cpf}
          onChange={e => setCpf(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors"
        />
      </div>

      {/* COUPON INPUT */}
      <div className="flex items-center gap-2">
        <input 
          type="text" 
          value={couponCode} 
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Possui um cupom?" 
          className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-[var(--color-detroit-red)] transition-colors"
        />
        <button 
          onClick={handleValidateCoupon} 
          disabled={!couponCode || validatingCoupon}
          className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-bold hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          {validatingCoupon ? "..." : "Aplicar"}
        </button>
      </div>

      {/* TERMS CHECKBOX */}
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-center justify-center mt-0.5">
          <input 
            type="checkbox" 
            checked={termsAccepted}
            onChange={e => setTermsAccepted(e.target.checked)}
            className="peer appearance-none w-5 h-5 border-2 border-zinc-600 rounded bg-transparent checked:bg-[var(--color-detroit-red)] checked:border-[var(--color-detroit-red)] transition-all"
          />
          <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors leading-relaxed">
          Eu aceito os <span className="font-bold text-white">termos e condições</span> desta compra e <span className="font-bold text-white">confirmo</span> que os produtos serão entregues exclusivamente à conta vinculada ao <span className="font-bold text-white">ID informado acima</span>, ciente de que a entrega depende desses dados estarem corretos.
        </span>
      </label>

      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full sm:w-auto px-10 py-5 rounded-full bg-[var(--color-detroit-red)] text-white font-bold text-lg hover:bg-[var(--color-detroit-red-hover)] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(229,9,20,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-2 justify-center">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Processando...
          </span>
        ) : (
          <span className="flex flex-col items-center">
            {discountInfo && (
              <span className="text-xs line-through text-white/50 mb-0.5">De R$ {price.toFixed(2)} por</span>
            )}
            <span>Comprar por R$ {displayPrice.toFixed(2)}</span>
          </span>
        )}
      </button>

      {message && (
        <div
          className={`px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
