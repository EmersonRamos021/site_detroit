# 🚀 Detroit Roleplay - Documentação Completa do Ecossistema

Bem-vindo à documentação oficial arquitetural do **Detroit Roleplay**. Este documento explica detalhadamente como todo o ecossistema funciona, desde o banco de dados até a comunicação entre o site e o Discord.

---

## 🏛️ 1. Visão Geral da Arquitetura

O projeto foi construído dividindo as responsabilidades em 3 sistemas principais que se conectam ao mesmo banco de dados MySQL:

1. **Site Principal (Loja):** Focado na experiência do jogador. Autenticação rápida via Discord, visualização de produtos, uso de cupons de desconto e geração de pagamentos PIX automatizados.
2. **Painel Admin (Dashboard):** Focado na gestão da equipe. Permite criar novos produtos, controlar e alterar status de pedidos manualmente, gerenciar cupons, listar histórico de compras financeiro e coordenar IDs/Camarotes in-game.
3. **Bot do Discord:** Focado em utilidade e interação. Responsável por mandar DMs com confirmações de compra, entregar os benefícios (cargos VIP) quando uma compra é aprovada, postar logs de sistema e checar diariamente se algum VIP venceu para removê-lo.

### 🛠️ Stack Tecnológico
- **Frontend e Backend (Site & Admin):** React, Next.js (App Router), TypeScript, TailwindCSS.
- **Autenticação:** NextAuth.js (v5) com provider OAuth do Discord.
- **Banco de Dados:** MySQL2 puro (sem ORM pesado, usando queries limpas e preparadas para máxima performance).
- **Bot:** Discord.js, Node.js puro.
- **Hospedagem:** SquareCloud.

---

## 💾 2. Estrutura do Banco de Dados (Schema)

Todos os três serviços consultam o mesmo banco de dados. As tabelas principais são:

- `users`: Armazena os jogadores que logaram no site (Discord ID, Tag, Avatar, Email).
- `products`: Catálogo da loja (Título, Preço, Descrição, URL da Imagem, ID do Cargo Discord vinculado).
- `coupons`: Sistema de cupons de desconto (Código, % de Desconto, Limite de Usos).
- `orders`: O "coração" do sistema. Guarda todos os pedidos gerados.
  - Campos vitais: `status` (pendente, pago, entregue, cancelado), `price` (preço final), `mp_payment_id` (ID do PIX no Mercado Pago), `expires_at` (Data limite do VIP).

> O banco de dados foi construído com a abordagem "Lazy Initialization", conectando apenas quando necessário para poupar conexões da hospedagem.

---

## 🔄 3. O Fluxo de Compra (Passo a Passo)

Como a mágica acontece desde o clique no site até a entrega do cargo no Discord:

1. **Geração do Pedido:** O usuário logado clica em "Comprar". O site insere uma linha na tabela `orders` como `pendente`.
2. **Geração do PIX:** O site manda os dados para a API do **Mercado Pago**, que devolve um QR Code e um código "Copia e Cola". O usuário tem 30 minutos para pagar.
3. **Pagamento e Webhook:** O jogador paga no app do banco. O Mercado Pago envia um aviso instantâneo via HTTP (Webhook) para a rota `/api/webhooks/mercadopago` do nosso site.
4. **Baixa e Notificação:** 
   - O site marca o pedido como `pago` no banco.
   - O site aciona o Webhook de logs do Discord para avisar a staff.
   - O site envia uma requisição para o Bot mandar uma DM de confirmação e agradecimento ao jogador.
5. **Entrega In-Game:** O jogador abre um ticket no Discord mostrando a DM. A staff clica no Painel Admin e muda o pedido para `entregue` (opcionalmente o Bot já pode ter entregue o cargo no Discord).

---

## 💳 4. Integração Mercado Pago (Checkout)

O site não retém saldo e não guarda dados de cartão de crédito. Ele trabalha estritamente com **PIX Transparente** via API:

### Como Atualizar suas Chaves do Mercado Pago
1. Acesse o [Painel de Desenvolvedores do Mercado Pago](https://www.mercadopago.com.br/developers/panel/applications).
2. Selecione a aplicação "Detroit Roleplay".
3. Vá em **Credenciais de Produção** e copie o **Access Token** (`APP_USR-XXXXX...`).
4. Coloque esse valor na aba "Variáveis" da SquareCloud do Site Principal (`MERCADOPAGO_ACCESS_TOKEN`).

### Link Oficial do Webhook
No painel do Mercado Pago, configure o Webhook para eventos do tipo `payment` apontando para:
`https://detroit.squareweb.app/api/webhooks/mercadopago`

---

## 🤖 5. Bot do Discord e Rotinas (Cron)

O Bot não é apenas de comandos; ele é a ponte entre o site e a guilda:

- **DMs de Compra:** Ele ouve comandos internos do site para disparar as DMs bonitas com Embeds para os compradores.
- **Sistema Anti-Flood e Filtros:** Moderador automático para o chat global.
- **Vencimento de VIPs (CRON):** O site principal tem uma rota `/api/cron/vip-check`. Essa rota deve ser pingada a cada 24 horas (via serviços como cron-job.org ou UptimeRobot). Quando acionada, ela varre o banco de dados procurando VIPs expirados, remove os cargos dos usuários pelo Bot e atualiza o status no banco de dados.

---

## ⚙️ 6. Resumo de Variáveis de Ambiente Necessárias

Certifique-se de que a SquareCloud tenha exatamente estas variáveis:

| Variável | Onde Usar | Descrição |
|---|---|---|
| `DATABASE_URL` | Admin, Site, Bot | `mysql://user:pass@host:port/db` |
| `AUTH_SECRET` | Admin, Site | Hash de criptografia NextAuth |
| `AUTH_DISCORD_ID` | Admin, Site | Client ID do App Discord |
| `AUTH_DISCORD_SECRET`| Admin, Site | Client Secret do App Discord |
| `NEXTAUTH_URL` | Admin, Site | Ex: `https://detroit.squareweb.app` |
| `MERCADOPAGO_ACCESS_TOKEN`| Site Principal | Token de Produção MP |
| `DISCORD_WEBHOOK_URL`| Site Principal | Webhook canal de compras |
| `DISCORD_BOT_TOKEN` | Site, Bot | Token real do Bot Discord |
| `CRON_SECRET` | Site Principal | Senha para proteger a URL cron |

---

## 🔄 7. Manutenção e Deploy

Os projetos estão ligados ao **GitHub**. Sempre que alterações forem feitas no código base:
1. Abra o painel da SquareCloud.
2. Selecione a Aplicação correspondente.
3. Clique em **Commit / Update** (para a Square baixar o código novo do GitHub).
4. Aguarde a mensagem de sucesso e clique em **Restart**.
5. Em caso de mudanças no banco de dados (novas tabelas), lembre-se de rodar a rota protegida de seed ou atualizar manualmente, caso haja novas features grandes no futuro.

---
*Documentação gerada e mantida pela equipe de desenvolvimento de Detroit Roleplay.*
