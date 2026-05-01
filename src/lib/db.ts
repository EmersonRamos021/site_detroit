import mysql from "mysql2/promise";

/**
 * Singleton pool de conexões MySQL.
 * Reutiliza o mesmo pool entre hot-reloads do Next.js (dev mode).
 * Limita a 5 conexões para coexistir com o bot Discord no mesmo banco.
 */

const globalForDb = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

function createPool(): mysql.Pool {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "❌ DATABASE_URL não definida. Crie um arquivo .env.local com a variável."
    );
  }

  return mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 5,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    queueLimit: 0,
  });
}

export const pool = globalForDb.mysqlPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.mysqlPool = pool;
}

/**
 * Executa uma query SQL e retorna o resultado tipado.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}
