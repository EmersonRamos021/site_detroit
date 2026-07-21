"use client";

import { useEffect } from "react";

export default function JogarRedirect() {
  useEffect(() => {
    // Tenta abrir o MTA diretamente usando o protocolo
    window.location.href = "mtasa://jogar.detroitroleplay.com:22003";
    
    // Fallback: Volta para a página inicial após 3 segundos
    setTimeout(() => {
      window.location.href = "/";
    }, 3000);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white font-sans">
      <div className="w-16 h-16 border-4 border-[var(--color-detroit-red)] border-t-transparent rounded-full animate-spin mb-8"></div>
      <h1 className="text-3xl font-bold mb-4">Iniciando o MTA:SA...</h1>
      <p className="text-zinc-400 max-w-md text-center">
        Se o jogo não abrir automaticamente, certifique-se de que o MTA está instalado ou abra o jogo e use o comando <code className="bg-white/10 px-2 py-1 rounded text-white mx-1">connect jogar.detroitroleplay.com</code> no console (F8).
      </p>
    </div>
  );
}
