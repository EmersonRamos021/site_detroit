import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { query } from "@/lib/db";

interface DbUser {
  id: number;
  discord_id: string;
  role: string;
}

// IDs Discord que recebem role 'admin' automaticamente (separados por vírgula no .env)
const ADMIN_DISCORD_IDS = (process.env.ADMIN_DISCORD_IDS || "303184113639358464").split(",");

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      if (!profile?.id) return false;

      try {
        // Verifica se o usuário já existe
        const existing = await query<DbUser>(
          "SELECT id FROM users WHERE discord_id = ?",
          [String(profile.id)]
        );

        if (existing.length === 0) {
          // Cria novo usuário (admin se estiver na lista)
          const role = ADMIN_DISCORD_IDS.includes(String(profile.id)) ? "admin" : "user";
          await query(
            `INSERT INTO users (discord_id, discord_tag, avatar_url, email, role)
             VALUES (?, ?, ?, ?, ?)`,
            [
              String(profile.id),
              String(profile.username || user.name || "Unknown"),
              user.image || null,
              user.email || null,
              role,
            ]
          );
        } else {
          // Atualiza último login e dados
          await query(
            `UPDATE users SET discord_tag = ?, avatar_url = ?, email = ?, last_login = NOW()
             WHERE discord_id = ?`,
            [
              String(profile.username || user.name || "Unknown"),
              user.image || null,
              user.email || null,
              String(profile.id),
            ]
          );
        }
        return true;
      } catch (error) {
        console.error("❌ Erro ao salvar usuário:", error);
        return true; // Permite login mesmo se falhar no banco
      }
    },
    async jwt({ token, profile }) {
      if (profile?.id) {
        token.discord_id = String(profile.id);

        // Buscar role do banco
        try {
          const users = await query<DbUser>(
            "SELECT id, role FROM users WHERE discord_id = ?",
            [String(profile.id)]
          );
          if (users.length > 0) {
            token.db_id = users[0].id;
            token.role = users[0].role;
          }
        } catch {
          token.role = "user";
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.discord_id = token.discord_id as string;
        session.user.db_id = token.db_id as number;
        session.user.role = (token.role as string) || "user";
      }
      return session;
    },
  },
});
