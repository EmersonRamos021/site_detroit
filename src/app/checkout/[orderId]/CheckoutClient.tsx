"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface CheckoutClientProps {
  orderCode: string;
  productTitle: string;
  productImage: string | null;
  price: number;
}

interface PixData {
  qrCodeBase64: string;
  qrCode: string;
  expiresAt: string;
}

type CheckoutState = "loading" | "pix_ready" | "paid" | "expired" | "error";

export function CheckoutClient({
  orderCode,
  productTitle,
  productImage,
  price,
}: CheckoutClientProps) {
  const router = useRouter();
  const [state, setState] = useState<CheckoutState>("loading");
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 min em segundos
  const [errorMsg, setErrorMsg] = useState("");
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Gerar o PIX ao carregar a página
  useEffect(() => {
    async function generatePix() {
      try {
        const res = await fetch("/api/checkout/pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderCode }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Erro ao gerar PIX");
        }

        setPixData({
          qrCodeBase64: data.pix.qrCodeBase64,
          qrCode: data.pix.qrCode,
          expiresAt: data.pix.expiresAt,
        });

        // Calcular tempo restante
        const expires = new Date(data.pix.expiresAt).getTime();
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expires - now) / 1000));
        setTimeLeft(remaining);

        setState("pix_ready");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Erro ao gerar PIX");
        setState("error");
      }
    }

    generatePix();
  }, [orderCode]);

  // Polling: verificar status do pedido a cada 5s
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderCode}/status`);
      const data = await res.json();

      if (data.status === "pago" || data.status === "entregue") {
        setState("paid");
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    } catch {
      // Ignorar erros de polling silenciosamente
    }
  }, [orderCode]);

  useEffect(() => {
    if (state !== "pix_ready") return;

    pollingRef.current = setInterval(checkStatus, 5000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [state, checkStatus]);

  // Timer regressivo
  useEffect(() => {
    if (state !== "pix_ready") return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setState("expired");
          clearInterval(interval);
          if (pollingRef.current) clearInterval(pollingRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state]);

  // Copiar código PIX
  function handleCopy() {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  // Formatar tempo
  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-28 pb-20 px-6">
        <div className="max-w-[600px] mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-10">
            <Link href="/" className="hover:text-zinc-300 transition-colors">
              Início
            </Link>
            <span className="text-zinc-700">/</span>
            <Link href="/orders" className="hover:text-zinc-300 transition-colors">
              Meus Pedidos
            </Link>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-300">Checkout</span>
          </nav>

          {/* Cabeçalho do Pedido */}
          <div className="flex items-center gap-5 p-5 rounded-2xl bg-zinc-900/60 border border-white/5 mb-8">
            {productImage && (
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                <Image
                  src={productImage}
                  alt={productTitle}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-zinc-500">{orderCode}</p>
              <p className="text-white font-semibold truncate">{productTitle}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-2xl font-mono font-bold text-white">
                R$ {price.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Estados do Checkout */}
          <AnimatePresence mode="wait">
            {/* LOADING */}
            {state === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 gap-4"
              >
                <div className="w-12 h-12 rounded-full border-2 border-zinc-700 border-t-[var(--color-detroit-red)] animate-spin" />
                <p className="text-zinc-400 font-medium">Gerando QR Code do PIX...</p>
              </motion.div>
            )}

            {/* PIX PRONTO */}
            {state === "pix_ready" && pixData && (
              <motion.div
                key="pix"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center gap-6"
              >
                {/* Timer */}
                <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-zinc-900/60 border border-white/5 w-full justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-yellow-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-zinc-400 text-sm">PIX expira em</span>
                  <span
                    className={`font-mono font-bold text-lg ${
                      timeLeft < 120 ? "text-red-400" : "text-white"
                    }`}
                  >
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {/* QR Code */}
                <div className="relative p-6 rounded-3xl bg-white">
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-64 h-64"
                  />
                </div>

                <p className="text-zinc-400 text-sm text-center max-w-[40ch]">
                  Abra o app do seu banco, escaneie o QR Code ou copie o código abaixo.
                </p>

                {/* Código Copia e Cola */}
                <div className="w-full flex flex-col gap-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                    PIX Copia e Cola
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixData.qrCode}
                      className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-300 font-mono truncate focus:outline-none"
                    />
                    <button
                      onClick={handleCopy}
                      className={`px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                        copied
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-[var(--color-detroit-red)] text-white hover:bg-[var(--color-detroit-red-hover)]"
                      }`}
                    >
                      {copied ? "✓ Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>

                {/* Status de espera */}
                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-yellow-500/5 border border-yellow-500/20 w-full">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse flex-shrink-0" />
                  <span className="text-yellow-400/80 text-sm font-medium">
                    Aguardando pagamento... esta página atualiza automaticamente.
                  </span>
                </div>
              </motion.div>
            )}

            {/* PAGO COM SUCESSO */}
            {state === "paid" && (
              <motion.div
                key="paid"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-6 py-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                  className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center"
                >
                  <svg
                    className="w-12 h-12 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </motion.div>

                <div className="text-center">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Pagamento Confirmado!
                  </h2>
                  <p className="text-zinc-400 max-w-[40ch]">
                    Seu pedido <span className="text-white font-mono">{orderCode}</span>{" "}
                    foi pago com sucesso. Você receberá uma notificação no Discord.
                  </p>
                </div>

                <Link
                  href="/orders"
                  className="px-8 py-4 rounded-full bg-emerald-500 text-white font-bold text-lg hover:bg-emerald-600 transition-all"
                >
                  Ver Meus Pedidos
                </Link>
              </motion.div>
            )}

            {/* EXPIRADO */}
            {state === "expired" && (
              <motion.div
                key="expired"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-6 py-12"
              >
                <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-zinc-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    PIX Expirado
                  </h2>
                  <p className="text-zinc-400">
                    O tempo de pagamento expirou. Gere um novo PIX abaixo.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setState("loading");
                    setTimeLeft(30 * 60);
                    // Re-trigger PIX generation
                    fetch("/api/checkout/pix", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ orderCode }),
                    })
                      .then((res) => res.json())
                      .then((data) => {
                        if (data.pix) {
                          setPixData({
                            qrCodeBase64: data.pix.qrCodeBase64,
                            qrCode: data.pix.qrCode,
                            expiresAt: data.pix.expiresAt,
                          });
                          const expires = new Date(data.pix.expiresAt).getTime();
                          const remaining = Math.max(
                            0,
                            Math.floor((expires - Date.now()) / 1000)
                          );
                          setTimeLeft(remaining);
                          setState("pix_ready");
                        }
                      })
                      .catch(() => setState("error"));
                  }}
                  className="px-8 py-4 rounded-full bg-[var(--color-detroit-red)] text-white font-bold text-lg hover:bg-[var(--color-detroit-red-hover)] transition-all"
                >
                  Gerar Novo PIX
                </button>
              </motion.div>
            )}

            {/* ERRO */}
            {state === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center gap-6 py-12"
              >
                <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>

                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Erro ao gerar PIX
                  </h2>
                  <p className="text-zinc-400">{errorMsg}</p>
                </div>

                <Link
                  href="/orders"
                  className="px-8 py-4 rounded-full bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-all"
                >
                  Voltar para Pedidos
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
}
