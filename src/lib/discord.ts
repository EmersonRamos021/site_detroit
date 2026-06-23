/**
 * Utilitários para enviar notificações ao Discord via Webhook.
 * Sem dependências externas — usa fetch nativo do Node 18+.
 */

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_API = "https://discord.com/api/v10";

/**
 * Cria um canal de DM com o usuário e retorna o channel_id.
 * O Discord retorna o mesmo canal se já existir (idempotente).
 */
async function getOrCreateDMChannel(discordUserId: string): Promise<string | null> {
  if (!BOT_TOKEN) {
    console.warn("⚠️  DISCORD_BOT_TOKEN não configurado — DM ignorada.");
    return null;
  }

  try {
    const res = await fetch(`${DISCORD_API}/users/@me/channels`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipient_id: discordUserId }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Falha ao criar canal DM: ${res.status} — ${err}`);
      return null;
    }

    const channel = await res.json();
    return channel.id as string;
  } catch (error) {
    console.error("❌ Erro ao criar canal DM:", error);
    return null;
  }
}

/**
 * Envia uma mensagem direta para um usuário Discord.
 * Retorna true se enviou com sucesso.
 */
async function sendDM(discordUserId: string, payload: object): Promise<boolean> {
  const channelId = await getOrCreateDMChannel(discordUserId);
  if (!channelId) return false;

  try {
    const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bot ${BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`❌ Falha ao enviar DM: ${res.status} — ${err}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error("❌ Erro ao enviar DM:", error);
    return false;
  }
}

const STATUS_EMOJI: Record<string, string> = {
  pendente: "🟡",
  pago: "🟢",
  entregue: "✅",
  cancelado: "🔴",
};

interface OrderNotificationPayload {
  code: string;
  productTitle: string;
  userTag: string;
  userDiscordId: string;
  originalPrice: number;
  discount: number;
  finalPrice: number;
  couponCode?: string | null;
  status?: string;
  gameId?: string;
  fullName?: string;
  email?: string;
  cpf?: string;
}

/**
 * Envia embed de novo pedido para o canal Discord configurado.
 * Falha silenciosamente para não quebrar o fluxo de compra.
 */
export async function sendOrderNotification(order: OrderNotificationPayload): Promise<void> {
  if (!WEBHOOK_URL) {
    console.warn("⚠️  DISCORD_WEBHOOK_URL não configurada — notificação ignorada.");
    return;
  }

  const status = order.status || "pendente";
  const statusEmoji = STATUS_EMOJI[status] || "❓";
  const adminUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/orders`;

  const fields = [
    { name: "📦 Produto", value: order.productTitle, inline: true },
    {
      name: "👤 Usuário",
      value: `<@${order.userDiscordId}> (${order.userTag})`,
      inline: true,
    },
    {
      name: "💰 Valor",
      value:
        order.discount > 0
          ? `~~R$ ${order.originalPrice.toFixed(2)}~~ → **R$ ${order.finalPrice.toFixed(2)}**`
          : `R$ ${order.finalPrice.toFixed(2)}`,
      inline: true,
    },
  ];

  if (order.gameId || order.fullName || order.email || order.cpf) {
    fields.push({
      name: "📋 Dados de Entrega",
      value: `**ID:** ${order.gameId || "N/A"}\n**Nome:** ${order.fullName || "N/A"}\n**Email:** ${order.email || "N/A"}\n**CPF:** ${order.cpf || "N/A"}`,
      inline: false,
    });
  }

  if (order.couponCode) {
    fields.push({
      name: "🎟️ Cupom",
      value: `\`${order.couponCode}\` (-R$ ${order.discount.toFixed(2)})`,
      inline: true,
    });
  }

  fields.push({
    name: "📋 Status",
    value: `${statusEmoji} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    inline: true,
  });

  const payload = {
    embeds: [
      {
        title: `🛒 Novo Pedido — \`${order.code}\``,
        color: 0xe50914, // detroit-red
        fields,
        footer: {
          text: "Detroit Roleplay Store",
        },
        timestamp: new Date().toISOString(),
        url: adminUrl,
      },
    ],
    username: "Detroit Store",
    avatar_url: "https://i.imgur.com/4M34hi2.png",
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`❌ Falha ao enviar webhook Discord: ${res.status} — ${text}`);
    }
  } catch (error) {
    console.error("❌ Erro ao chamar webhook Discord:", error);
  }
}

/**
 * Notifica atualização de status de um pedido (chamado pelo admin).
 */
export async function sendStatusUpdateNotification(payload: {
  code: string;
  productTitle: string;
  userDiscordId: string;
  newStatus: string;
  price: number;
}): Promise<void> {
  if (!WEBHOOK_URL) return;

  const statusEmoji = STATUS_EMOJI[payload.newStatus] || "❓";

  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: `🔄 Pedido Atualizado — \`${payload.code}\``,
            color:
              payload.newStatus === "entregue"
                ? 0x22c55e
                : payload.newStatus === "cancelado"
                ? 0xef4444
                : payload.newStatus === "pago"
                ? 0x3b82f6
                : 0xeab308,
            fields: [
              { name: "📦 Produto", value: payload.productTitle, inline: true },
              {
                name: "👤 Usuário",
                value: `<@${payload.userDiscordId}>`,
                inline: true,
              },
              {
                name: "📋 Novo Status",
                value: `${statusEmoji} ${payload.newStatus.charAt(0).toUpperCase() + payload.newStatus.slice(1)}`,
                inline: true,
              },
              {
                name: "💰 Valor",
                value: `R$ ${payload.price.toFixed(2)}`,
                inline: true,
              },
            ],
            footer: { text: "Detroit Roleplay Store" },
            timestamp: new Date().toISOString(),
          },
        ],
        username: "Detroit Store",
        avatar_url: "https://i.imgur.com/4M34hi2.png",
      }),
    });
  } catch (error) {
    console.error("❌ Erro ao notificar atualização de status:", error);
  }
}

/**
 * Envia DM privada ao comprador confirmando o pedido.
 * Chamado logo após criar o pedido no banco.
 */
export async function sendPurchaseDM(
  discordUserId: string,
  order: {
    code: string;
    productTitle: string;
    finalPrice: number;
    discount: number;
    originalPrice: number;
    couponCode?: string | null;
    expiresAt?: Date | null;
  },
  status: "pendente" | "pago" = "pendente"
): Promise<void> {
  const storeUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const expiryLine = order.expiresAt
    ? `\n⏳ **Válido até:** ${order.expiresAt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}`
    : "";

  const discountLine =
    order.discount > 0
      ? `\n🎟️ **Desconto:** -R$ ${order.discount.toFixed(2)} (cupom \`${order.couponCode}\`)`
      : "";

  const title = status === "pago" 
    ? "🛒 Detroit Roleplay — Pagamento Aprovado!" 
    : "🛒 Detroit Roleplay — Pedido Confirmado!";

  const description = status === "pago"
    ? `Olá! O pagamento do seu pedido foi **aprovado** com sucesso.\n\n` +
      `📦 **Produto:** ${order.productTitle}\n` +
      `🔖 **Código:** \`${order.code}\`\n` +
      `💰 **Valor:** R$ ${order.finalPrice.toFixed(2)}${discountLine}${expiryLine}\n` +
      `📋 **Status:** 🟢 Pago\n\n` +
      `O seu pedido já está na fila de entrega automática do servidor!`
    : `Olá! Seu pedido foi criado com sucesso e está aguardando confirmação de pagamento.\n\n` +
      `📦 **Produto:** ${order.productTitle}\n` +
      `🔖 **Código:** \`${order.code}\`\n` +
      `💰 **Valor:** R$ ${order.finalPrice.toFixed(2)}${discountLine}${expiryLine}\n` +
      `📋 **Status:** 🟡 Pendente\n\n` +
      `Assim que o pagamento for confirmado, você receberá uma nova notificação!`;

  await sendDM(discordUserId, {
    embeds: [
      {
        title,
        description,
        color: status === "pago" ? 0x22c55e : 0xe50914, // verde para pago, vermelho para pendente
        footer: { text: "Detroit Roleplay Store" },
        timestamp: new Date().toISOString(),
        url: `${storeUrl}/orders`,
      },
    ],
  });
}

/**
 * Envia DM de aviso de expiração de VIP (quando faltam ≤ 5 dias).
 * Chamado pela rota de cron /api/cron/vip-check.
 */
export async function sendVipExpiryWarningDM(
  discordUserId: string,
  order: {
    code: string;
    productTitle: string;
    expiresAt: Date;
    daysLeft: number;
  }
): Promise<void> {
  const storeUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const expiryFormatted = order.expiresAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  await sendDM(discordUserId, {
    embeds: [
      {
        title: "⚠️ Detroit Roleplay — VIP Expirando em Breve!",
        description:
          `Atenção! Seu VIP está prestes a expirar.\n\n` +
          `📦 **Produto:** ${order.productTitle}\n` +
          `🔖 **Pedido:** \`${order.code}\`\n` +
          `⏳ **Expira em:** **${order.daysLeft} ${order.daysLeft === 1 ? "dia" : "dias"}** (${expiryFormatted})\n\n` +
          `Renove agora para não perder seus benefícios exclusivos!`,
        color: 0xf59e0b, // amarelo
        footer: { text: "Detroit Roleplay Store" },
        timestamp: new Date().toISOString(),
        url: `${storeUrl}/#store`,
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: "🔗 Renovar na Loja",
            url: `${storeUrl}/#store`,
          },
        ],
      },
    ],
  });
}

/**
 * Envia um log de erro fatal para um canal privado da Staff.
 * Útil para monitorar falhas no banco de dados ou APIs externas.
 */
export async function sendErrorLog(errorContext: string, errorDetails: any): Promise<void> {
  const ERROR_WEBHOOK = process.env.DISCORD_ERROR_WEBHOOK_URL;
  if (!ERROR_WEBHOOK) return;

  const errorMessage = errorDetails instanceof Error ? errorDetails.message : String(errorDetails);
  const stack = errorDetails instanceof Error ? errorDetails.stack?.slice(0, 1000) : "N/A";

  try {
    await fetch(ERROR_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        embeds: [
          {
            title: "🚨 ERRO CRÍTICO NO SITE",
            color: 0x000000, // preto
            description: `**Contexto:** ${errorContext}\n\n**Mensagem:** \`${errorMessage}\``,
            fields: [
              {
                name: "Stack Trace",
                value: `\`\`\`js\n${stack}\n\`\`\``,
              },
            ],
            timestamp: new Date().toISOString(),
          },
        ],
        username: "Detroit Error Monitor",
      }),
    });
  } catch (e) {
    console.error("Falha ao enviar log de erro ao Discord:", e);
  }
}
