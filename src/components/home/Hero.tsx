"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] w-full flex items-center pt-24 pb-12 px-6 overflow-hidden">
      {/* BACKGROUND IMAGE WITH GRADIENT OVERLAY */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/detroit_bg.png"
          alt="Detroit Roleplay Background"
          fill
          className="object-cover opacity-60"
          priority
        />
        {/* Dark radial fade to blend with zinc-950 bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1400px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* LEFT ALIGNED CONTENT (Asymmetric) */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 80, damping: 20 }}
          className="max-w-2xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--color-detroit-red)]/30 bg-[var(--color-detroit-red)]/10 text-[var(--color-detroit-red)] text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--color-detroit-red)] animate-pulse" />
            Fase Beta
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05] text-zinc-50 mb-6 drop-shadow-lg">
            Domine as ruas de <span className="text-[var(--color-detroit-red)]">Detroit.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 leading-relaxed mb-10 max-w-[55ch]">
            Adquira veículos exclusivos, pacotes VIP e domine a economia da cidade. 
            Sua contribuição mantém o servidor online e a cidade viva.
          </p>

          <div className="flex items-center gap-5">
            <a href="#store" className="px-8 py-4 rounded-full bg-[var(--color-detroit-red)] text-white font-bold text-lg hover:bg-[var(--color-detroit-red-hover)] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(229,9,20,0.4)]">
              Explorar Loja
            </a>
            <a href="/#store" className="px-8 py-4 rounded-full border border-zinc-700 bg-zinc-900/50 text-zinc-300 font-bold text-lg hover:bg-zinc-800 hover:text-white active:scale-[0.98] transition-all backdrop-blur-md">
              Benefícios VIP
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
