"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative min-h-[100dvh] w-full flex items-center pt-24 pb-12 px-6 overflow-hidden">
      {/* BACKGROUND IMAGE WITH GRADIENT OVERLAY */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <Image
          src="/Fundo-site.jpg"
          alt="Detroit Roleplay Background"
          fill
          className="object-cover opacity-80"
          priority
          quality={100}
          unoptimized
        />
        {/* Smooth gradients to ensure text readability without ruining the image */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/10 to-transparent" />
      </div>

      <div className="relative z-10 max-w-[1400px] w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* LEFT ALIGNED CONTENT (Asymmetric) */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
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

      {/* SCROLL INDICATOR */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
      >
        <a href="#store" className="flex flex-col items-center gap-2 group">
          <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-zinc-500 group-hover:text-zinc-300 transition-colors">
            Deslize para explorar
          </span>
          <div className="w-6 h-10 border-2 border-zinc-600/60 group-hover:border-zinc-400/80 rounded-full flex justify-center p-1 transition-colors">
            <motion.div
              className="w-1 h-2 bg-zinc-500 group-hover:bg-zinc-300 rounded-full"
              animate={{ y: [0, 14, 0], opacity: [1, 0, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
          </div>
        </a>
      </motion.div>
    </section>
  );
}
