# 🚀 Detroit Roleplay — Documentação do Ecossistema

Bem-vindo à documentação oficial arquitetural do **Detroit Roleplay**. Este documento explica detalhadamente como todo o ecossistema funciona, desde o banco de dados até a comunicação entre o site e o Discord.

---

## 🏛️ 1. Visão Geral da Arquitetura

O projeto foi construído dividindo as responsabilidades em 3 sistemas principais que se conectam ao mesmo banco de dados MySQL:

1. **Site Principal (Loja):** Focado na experiência do jogador. Autenticação rápida via Discord, visualização de produtos, uso de cupons de desconto e geração de pagamentos PIX automatizados.
2. **Painel Admin (Dashboard):** Focado na gestão da equipe. Permite criar novos produtos com envio automático de imagens para a **SquareCloud Blob API**, gerenciar cupons, listar histórico financeiro, coordenar IDs in-game e acessar o histórico em HTML de tickets fechados.
3. **Bot do Discord:** Focado em utilidade e interação. Responsável por mandar DMs com confirmações de compra, entregar benefícios in-game via tickets (salvando transcrições no banco de dados), e fornecer moderação automática e auto-role.

```mermaid
graph TD
    subgraph "Ecossistema Detroit Roleplay"
        SITE["🌐 Site (Loja)<br>Next.js 16 + TS"]
        ADMIN["🛡️ Admin Panel<br>Next.js 16 + TS"]
        BOT["🤖 Discord Bot<br>discord.js 14"]
    end
    
    DB[("💾 MySQL<br>Banco Compartilhado")]
    MP["💳 Mercado Pago<br>PIX API"]
    DISCORD["💬 Discord API<br>Webhooks + Bot Token"]
    BLOB["☁️ SquareCloud Blob<br>Hospedagem de Imagens"]
    
    SITE -->|"queries"| DB
    ADMIN -->|"queries"| DB
    BOT -->|"queries"| DB
    
    SITE -->|"createPixPayment"| MP
    MP -->|"webhook payment.updated"| SITE
    
    SITE -->|"DMs + Webhooks"| DISCORD
    ADMIN -->|"DMs + Webhooks"| DISCORD
    BOT -->|"comandos + eventos"| DISCORD
    
    ADMIN -->|"Upload via Axios/Fetch"| BLOB
    SITE -->|"Fetch/Render"| BLOB
```

---

## 📁 2. Repositórios e Diretórios

O código-fonte está dividido nas seguintes pastas e repositórios (hospedados na SquareCloud):

| Módulo | Repositório | Stack | Propósito |
|--------|-------------|-------|-----------|
| 🌐 Site | [site_detroit](https://github.com/EmersonRamos021/site_detroit.git) | Next.js 16, React 19, Tailwind 4 | Loja pública com login via Discord OAuth |
| 🛡️ Admin | [site-detroit_administração](https://github.com/EmersonRamos021/site-detroit_administra-o.git) | Next.js 16, React 19, Tailwind 4 | Painel administrativo com login por credenciais |
| 🤖 Bot | [botdetroid-](https://github.com/EmersonRamos021/botdetroid-.git) | Node.js, discord.js 14 | Bot de moderação, tickets, denúncias e auto-role |

---

## 💾 3. Estrutura do Banco de Dados (Schema)

Todos os serviços consultam o mesmo banco de dados MySQL para consistência.

```mermaid
erDiagram
    users {
        INT id PK
        VARCHAR discord_id UK
        VARCHAR discord_tag
        VARCHAR avatar_url
        VARCHAR email
        ENUM role "user | admin"
    }
    
    categories {
        INT id PK
        VARCHAR name
        VARCHAR slug UK
        VARCHAR icon
        INT sort_order
    }
    
    products {
        INT id PK
        VARCHAR title
        TEXT description
        DECIMAL price
        VARCHAR image_url
        INT category_id FK
        BOOLEAN active
        BOOLEAN featured
    }
    
    orders {
        INT id PK
        VARCHAR code UK
        INT user_id FK
        INT product_id FK "NULL para multi-item"
        ENUM status "pendente|pago|entregue|cancelado"
        DECIMAL original_price
        DECIMAL discount
        DECIMAL price
        VARCHAR coupon_code
        BIGINT mp_payment_id
        TIMESTAMP expires_at
        BOOLEAN expiry_notified
        INT vip_days
        VARCHAR game_id
        VARCHAR full_name
        VARCHAR email
        VARCHAR cpf
    }
    
    order_items {
        INT id PK
        INT order_id FK
        INT product_id FK
        INT quantity
        DECIMAL unit_price
    }
    
    coupons {
        INT id PK
        VARCHAR code UK
        ENUM discount_type "percent | fixed"
        DECIMAL discount_value
        DECIMAL min_price
        INT max_uses
        INT used_count
        BOOLEAN active
        TIMESTAMP expires_at
    }
    
    settings {
        VARCHAR key PK
        TEXT value "Configurações do Bot Discord"
    }
    
    counters {
        VARCHAR name PK
        INT count "Contador de tickets, denúncias, etc"
    }
    
    reports {
        INT id PK
        VARCHAR code UK
        ENUM type "denuncia | revisao"
        VARCHAR user_id
        ENUM status
    }
    
    tickets {
        INT id PK
        VARCHAR ticket_id UK
        VARCHAR user_id
        VARCHAR user_tag
        VARCHAR owner_id "Equipe/staff"
        ENUM status "open | closed"
        LONGTEXT transcript_html
        TIMESTAMP created_at
        TIMESTAMP closed_at
    }
    
    users ||--o{ orders : "faz"
    products ||--o{ orders : "legacy"
    categories ||--o{ products : "contém"
    orders ||--o{ order_items : "contém"
    products ||--o{ order_items : "referencia"
```

---

## 🔄 4. O Fluxo de Compra (End-to-End)

Como a mágica acontece desde o clique no site até a entrega do cargo no Discord:

1. **Autenticação:** O usuário loga na loja usando o Discord (NextAuth OAuth).
2. **Checkout:** O jogador adiciona itens ao carrinho, aplica um cupom (opcional) e finaliza o pedido. O site insere o pedido na tabela `orders` como `pendente`.
3. **Geração do PIX:** O site manda os dados para a API do **Mercado Pago**, que devolve um QR Code e um código "Copia e Cola".
4. **Pagamento e Webhook:** O jogador paga no app do banco. O Mercado Pago envia um aviso instantâneo via HTTP (Webhook) para a rota `/api/webhooks/mercadopago` do site.
5. **Baixa e Notificação:** 
   - O site marca o pedido como `pago` no banco de dados.
   - O site aciona o Webhook de logs do Discord para avisar a staff no canal de compras.
   - O site aciona o Bot para mandar uma DM bonita de confirmação e agradecimento ao jogador.
6. **Entrega In-Game:** O jogador abre um ticket no Discord mostrando a DM e seu ID. A staff clica no Painel Admin e muda o status do pedido para `entregue`.

---

## 🤖 5. Bot do Discord: Funcionalidades

O Bot é a ponte entre a plataforma e o servidor do Discord, contando com:

- **DMs Transacionais:** Envia mensagens diretas para usuários em nome da loja (confirmações e avisos de VIP).
- **Auto-Moderação:** Sistema de filtro de palavras (mute de 5 min para infratores recorrentes), anti-flood (mute de 15 min) e filtro de convites de outros servidores.
- **Auto-Role:** Aplicação automática de um cargo configurado assim que o usuário entra no servidor (evento `guildMemberAdd`).
- **Tickets e Denúncias:** Fluxo de criação de canais temporários de atendimento e análise, com suporte a botões, modais, painéis de aceitar/recusar (staff) e transcrições em HTML.
- **Painel de Configuração Dinâmico:** Comando `/config` para os administradores definirem canais, cargos, e palavras bloqueadas sem precisar alterar o código-fonte (salvo na tabela `settings`).

---

## ⚙️ 6. Variáveis de Ambiente Necessárias

| Variável | Onde Usar | Descrição |
|----------|-----------|-----------|
| `DATABASE_URL` | Admin, Site, Bot | `mysql://user:pass@host:port/db` (Conexão MySQL) |
| `AUTH_SECRET` | Admin, Site | Hash de criptografia para NextAuth.js |
| `AUTH_DISCORD_ID` | Site Principal | Client ID do App Discord (OAuth) |
| `AUTH_DISCORD_SECRET`| Site Principal | Client Secret do App Discord (OAuth) |
| `NEXTAUTH_URL` | Admin, Site | URL do app na SquareCloud |
| `MERCADOPAGO_ACCESS_TOKEN`| Site Principal | Token de Produção Mercado Pago |
| `DISCORD_WEBHOOK_URL`| Admin, Site | Webhook do canal de log de compras |
| `DISCORD_BOT_TOKEN` | Site, Bot | Token real do Bot Discord (DMs e Bot runtime) |
| `CLIENT_ID` | Bot | Client ID do Bot Discord (para comandos Slash) |
| `CRON_SECRET` | Site Principal | Senha para proteger a URL cron (`/api/cron/vip-check`) |
| `ADMIN_DISCORD_IDS` | Site Principal | Discord IDs (separados por vírgula) que ganham cargo `admin` |
| `SQUARE_CLOUD_API_KEY` | Admin | Chave de API da SquareCloud para fazer o upload das imagens de produtos pro Blob |
