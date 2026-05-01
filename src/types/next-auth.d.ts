import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      discord_id?: string;
      db_id?: number;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discord_id?: string;
    db_id?: number;
    role?: string;
  }
}
