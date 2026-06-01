"use client";

import { motion, AnimatePresence } from "framer-motion";
import { DiscordLogo, Package, SignOut, ShoppingCart } from "@phosphor-icons/react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

export function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { itemCount, openCart } = useCart();

  // Fechar menu ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
    >
      <div className="max-w-[1400px] mx-auto glass-panel rounded-[2rem] px-6 py-3 flex items-center justify-between">
        {/* LOGO */}
        <Link href="/" className="flex items-center group relative w-[140px] h-10 overflow-hidden">
          <Image 
            src="/logodetroit.png" 
            alt="Detroit Roleplay" 
            fill
            className="object-cover object-center drop-shadow-[0_0_15px_rgba(229,9,20,0.2)] opacity-90 group-hover:opacity-100 transition-opacity"
            priority
          />
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link href="/" className="hover:text-zinc-50 transition-colors">Início</Link>
          <Link href="/#store" className="hover:text-zinc-50 transition-colors">Loja VIP</Link>
          <Link href="https://discord.gg/detroitroleplay" target="_blank" rel="noopener noreferrer" className="hover:text-[#5865F2] hover:text-zinc-50 transition-colors flex items-center gap-1.5">
            <DiscordLogo weight="fill" size={16} />
            Discord
          </Link>
        </nav>

        {/* AUTH + CART */}
        <div className="flex items-center gap-3">
          {/* CART BUTTON */}
          <button
            onClick={openCart}
            className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-detroit-red)] hover:bg-[var(--color-detroit-red-hover)] text-sm font-bold text-white transition-all active:scale-[0.98] shadow-[0_0_15px_rgba(229,9,20,0.3)]"
          >
            <ShoppingCart weight="bold" size={18} />
            <span className="hidden sm:inline">Carrinho</span>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 flex items-center justify-center px-1 rounded-full bg-white text-[var(--color-detroit-red)] text-[11px] font-black shadow-lg">
                {itemCount}
              </span>
            )}
          </button>

          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-zinc-800 animate-pulse" />
          ) : session ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-white/5 transition-all"
              >
                {session.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "Avatar"}
                    width={32}
                    height={32}
                    className="rounded-full border border-white/10"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-white">
                    {session.user?.name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-zinc-300 max-w-[120px] truncate">
                  {session.user?.name}
                </span>
                <svg className={`w-4 h-4 text-zinc-500 transition-transform ${menuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* DROPDOWN */}
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                  >
                    <div className="p-3 border-b border-white/5">
                      <p className="text-sm font-medium text-white truncate">{session.user?.name}</p>
                      <p className="text-xs text-zinc-500 truncate">{session.user?.email}</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/orders"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                      >
                        <Package size={16} />
                        Meus Pedidos
                      </Link>
                    </div>
                    <div className="p-1 border-t border-white/5">
                      <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-400 hover:bg-white/5 hover:text-red-400 transition-colors"
                      >
                        <SignOut size={16} />
                        Sair
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => signIn("discord")}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#5865F2] hover:bg-[#4752C4] text-sm font-medium text-white transition-transform active:scale-[0.98] shadow-[0_0_20px_rgba(88,101,242,0.3)]"
            >
              <DiscordLogo weight="fill" size={18} />
              <span>Entrar com Discord</span>
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
