"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  image: string;
  category: string;
  featured?: boolean;
  index: number;
}

export function ProductCard({ id, title, description, price, image, category, featured, index }: ProductCardProps) {
  return (
    <Link href={`/product/${id}`} className="block">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1, type: "spring", bounce: 0.4 }}
      whileHover={{ y: -5 }}
      className={`group relative flex flex-col rounded-[1.5rem] bg-zinc-900/40 border overflow-hidden transition-all hover:shadow-[0_10px_40px_-15px_rgba(229,9,20,0.15)] ${
        featured 
          ? "border-[var(--color-detroit-red)]/30 hover:border-[var(--color-detroit-red)]/60" 
          : "border-white/5 hover:border-[var(--color-detroit-red)]/50"
      }`}
    >
      {/* 1px inner refraction edge */}
      <div className="absolute inset-0 z-20 pointer-events-none rounded-[1.5rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />

      {/* Product Image Area */}
      <div className="relative w-full h-44 bg-zinc-800/50 overflow-hidden flex items-center justify-center">
        {/* Placeholder gradient just in case */}
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 to-zinc-800/80 z-0" />
        
        <Image 
          src={image}
          alt={title}
          fill
          className="object-cover z-10 group-hover:scale-105 transition-transform duration-700 ease-out mix-blend-screen opacity-90 grayscale group-hover:grayscale-0 group-hover:opacity-100"
        />

        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          <span className="px-2 py-1 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
            {category}
          </span>
          {featured && (
            <span className="px-2 py-1 rounded bg-[var(--color-detroit-red)]/80 backdrop-blur-md border border-[var(--color-detroit-red)]/40 text-[10px] font-bold text-white uppercase tracking-widest">
              ★ Destaque
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-xl font-bold tracking-tight text-white mb-1">{title}</h3>
        <p className="text-sm font-medium text-zinc-500 mb-6 line-clamp-2">
          {description || "Entrega imediata in-game"}
        </p>
        
        <div className="mt-auto flex items-end justify-between gap-4">
          <div className="flex flex-col shrink-0">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Valor Unitário</span>
            <span className="text-2xl font-mono tracking-tighter text-white font-bold">R$ {price.toFixed(2)}</span>
          </div>

          <button className="relative overflow-hidden flex items-center justify-center w-12 h-12 shrink-0 rounded-full bg-zinc-800 text-white transition-all duration-300 ease-out group-hover:bg-[var(--color-detroit-red)] group-hover:w-[140px] group-hover:shadow-[0_0_20px_rgba(229,9,20,0.4)]">
            <span className="absolute opacity-0 font-bold whitespace-nowrap text-sm right-10 translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
              Comprar
            </span>
            <svg className="w-5 h-5 absolute right-3.5 group-hover:-rotate-45 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
    </Link>
  );
}
