import { query } from "./db";

// Mapeamento de Títulos de Produtos para IDs de Cargos VIP no Discord
const VIP_ROLES: Record<string, string> = {
  "Vip Basic": "1446913369625071858",
  "Vip Eclipse": "1446907908724887685",
  "Vip Diamond": "1446905828794826762",
  "Vip Royal": "1446907328543854742",
  "Vip Aura": "1446905784284872704",
};

/**
 * Entrega automaticamente os produtos de um pedido que acabou de ser pago.
 */
export async function processOrderDelivery(
  orderCode: string,
  discordId: string,
  items: { quantity: number; title: string; in_game_command: string | null }[]
) {
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  // GUILD ID fixo do Detroit Roleplay
  const GUILD_ID = "1446901495197995160";

  for (const item of items) {
    // Identificar se o produto é um VIP
    let roleIdToGive: string | null = null;
    
    for (const [vipName, roleId] of Object.entries(VIP_ROLES)) {
      if (item.title.toLowerCase().includes(vipName.toLowerCase())) {
        roleIdToGive = roleId;
        break;
      }
    }

    // Se for um VIP reconhecido
    if (roleIdToGive) {
      console.log(`[DELIVERY] Entregando VIP: ${item.title} (Role ID: ${roleIdToGive}) para o usuário ${discordId}`);

      // 1. Tentar dar o cargo no Discord via API
      if (BOT_TOKEN) {
        try {
          const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${discordId}/roles/${roleIdToGive}`, {
            method: "PUT",
            headers: {
              Authorization: `Bot ${BOT_TOKEN}`,
            },
          });

          if (!res.ok) {
            const err = await res.text();
            console.error(`[DELIVERY] Erro ao entregar cargo no Discord (${res.status}):`, err);
          } else {
            console.log(`[DELIVERY] Cargo entregue no Discord com sucesso!`);
          }
        } catch (e) {
          console.error(`[DELIVERY] Exceção ao entregar cargo no Discord:`, e);
        }
      } else {
        console.warn("[DELIVERY] DISCORD_BOT_TOKEN ausente. Não foi possível entregar o cargo.");
      }

      // 2. Salvar no banco (active_vips) para o Bot remover em 30 dias
      try {
        await query(
          `INSERT INTO active_vips (discord_id, role_id, order_code, expires_at) 
           VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
          [discordId, roleIdToGive, orderCode]
        );
        console.log(`[DELIVERY] VIP registrado no banco de dados. Vencerá em 30 dias.`);
      } catch (e) {
        console.error(`[DELIVERY] Erro ao salvar VIP no banco de dados:`, e);
      }
    }
  }
}