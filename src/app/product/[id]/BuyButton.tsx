"use client";

import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";

interface BuyButtonProps {
  productId: number;
  productTitle: string;
  price: number;
  image: string;
}

export function BuyButton({ productId, productTitle, price, image }: BuyButtonProps) {
  const router = useRouter();
  const { addItem, closeCart } = useCart();

  function handleAddToCart() {
    addItem({
      productId,
      title: productTitle,
      price,
      image,
    });
  }

  function handleBuyNow() {
    addItem({
      productId,
      title: productTitle,
      price,
      image,
    });
    closeCart(); // Close it in case it opens automatically
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
      <button
        onClick={handleBuyNow}
        className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-[var(--color-detroit-red)] text-white font-bold text-lg hover:bg-[var(--color-detroit-red-hover)] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(229,9,20,0.4)] relative overflow-hidden group flex items-center justify-center gap-2"
      >
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
        <svg className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="relative z-10">Comprar agora</span>
      </button>

      <button
        onClick={handleAddToCart}
        className="w-full sm:w-auto py-4 px-8 rounded-2xl bg-zinc-900 border border-white/10 text-white font-bold text-base hover:bg-zinc-800 hover:border-white/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
      >
        <span className="text-xl leading-none">+</span>
        Adicionar ao carrinho
      </button>
    </div>
  );
}
