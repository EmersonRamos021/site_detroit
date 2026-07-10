"use client";

import { motion } from "framer-motion";
import { BookOpen } from "@phosphor-icons/react";

export default function RegrasPage() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col pt-32 pb-12 px-6">
      <div className="max-w-[1400px] w-full mx-auto flex-1 flex flex-col">
        {/* Header da Página */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="p-3 bg-red-500/10 rounded-xl">
              <BookOpen size={28} className="text-red-500" weight="duotone" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              Regulamento Oficial
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-lg max-w-2xl"
          >
            Navegue pelas diretrizes, regras básicas e códigos de conduta da Detroit Roleplay.
          </motion.p>
        </div>

        {/* Container do Iframe */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 w-full bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden relative min-h-[600px] shadow-2xl"
        >
          {/* O GitBook será carregado aqui */}
          <iframe 
            src="https://regulamento.detroitroleplay.com/" 
            className="w-full h-full border-0 absolute inset-0"
            title="Regulamento Detroit Roleplay"
            allow="fullscreen"
          />
        </motion.div>
      </div>
    </main>
  );
}
