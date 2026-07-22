import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "Termos e Condições | Detroit Roleplay",
};

export default function TermosPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans selection:bg-[var(--color-detroit-red)] selection:text-white">
      <Navbar />
      
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-32">
        <h1 className="text-4xl font-bold text-white mb-8">Termos e Condições</h1>
        
        <div className="text-zinc-300 space-y-6 leading-relaxed">
          <p>
            Bem-vindo ao <strong>Detroit Roleplay</strong>. Ao acessar nosso servidor e utilizar nossa loja, você concorda em cumprir e ficar vinculado aos seguintes termos e condições de uso.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Aceitação dos Termos</h2>
          <p>
            O uso de nossos serviços constitui a sua aceitação destes termos. Se você não concorda com qualquer parte destes termos, você não deve usar nosso servidor ou comprar em nossa loja.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Produtos Virtuais</h2>
          <p>
            Todos os itens disponíveis em nossa loja são produtos estritamente <strong>virtuais e digitais</strong>, utilizáveis apenas dentro do servidor Detroit Roleplay. Eles não possuem valor financeiro no mundo real e não podem ser transferidos para fora da plataforma.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Regras do Servidor</h2>
          <p>
            A compra de qualquer pacote VIP, veículo ou item não isenta o jogador de seguir as regras do servidor. Qualquer violação grave que resulte em banimento permanente resultará na perda do acesso aos itens virtuais adquiridos, sem direito a reclamações.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Política de Reembolso</h2>
          <p>
            Temos uma política estrita em relação a reembolsos. Por favor, leia nossa <Link href="/reembolso" className="text-[var(--color-detroit-red)] hover:underline">Política de Reembolso</Link> detalhada antes de realizar qualquer compra.
          </p>

          <div className="mt-12 pt-8 border-t border-white/10">
            <Link href="/" className="text-[var(--color-detroit-red)] hover:underline">
              &larr; Voltar para o Início
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
