import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata = {
  title: "Política de Reembolso | Detroit Roleplay",
};

export default function ReembolsoPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans selection:bg-[var(--color-detroit-red)] selection:text-white">
      <Navbar />
      
      <div className="flex-1 max-w-4xl w-full mx-auto px-6 py-32">
        <h1 className="text-4xl font-bold text-white mb-8">Política de Reembolso</h1>
        
        <div className="text-zinc-300 space-y-6 leading-relaxed">
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-100 shadow-inner">
            <h2 className="text-xl font-bold text-white mb-2">Aviso Importante</h2>
            <p>
              Ao realizar qualquer contribuição ou compra em nossa loja, você concorda explicitamente que <strong>NÃO há política de reembolso ou devolução do dinheiro</strong> sob nenhuma circunstância.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Natureza dos Produtos Digitais</h2>
          <p>
            Todos os pacotes (VIPs), moedas virtuais, veículos e outros itens comercializados em nossa plataforma são produtos estritamente digitais e imateriais, ativados instantaneamente de forma automatizada na sua conta do jogo. Devido à natureza irreversível da entrega destes produtos, não oferecemos qualquer forma de devolução de pagamento.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Ausência de Garantias por Banimento</h2>
          <p>
            Caso você sofra punições administrativas dentro do servidor (como banimentos temporários ou permanentes) decorrentes de quebras das regras da cidade, <strong>você perderá o acesso aos itens virtuais adquiridos</strong>. Em nenhuma hipótese o banimento justificará reembolso, chargeback ou estorno do valor pago.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Disputas e Chargebacks</h2>
          <p>
            Tentativas de estorno forçado (Chargeback) através de operadoras de cartão de crédito, bancos ou plataformas de pagamento sem o nosso consentimento serão tratadas como fraude. Nesses casos, a conta associada será imediatamente banida de forma permanente de todos os serviços do Detroit Roleplay e o caso poderá ser escalado para as autoridades competentes se julgado necessário.
          </p>

          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Problemas Técnicos</h2>
          <p>
            Caso você tenha feito a compra e não tenha recebido o produto devido a falhas técnicas no sistema automático (PIX/Mercado Pago), não se preocupe. Você deve abrir um Ticket na nossa comunidade oficial do Discord e nossa equipe administrativa ativará os benefícios de forma manual, assim que o comprovante for validado.
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
