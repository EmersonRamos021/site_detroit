import mysql from "mysql2/promise";

/**
 * Singleton pool de conexões MySQL.
 * Reutiliza o mesmo pool entre hot-reloads do Next.js (dev mode).
 * Limita a 5 conexões para coexistir com o bot Discord no mesmo banco.
 */

const globalForDb = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

export function getPool(): mysql.Pool {
  if (globalForDb.mysqlPool) {
    return globalForDb.mysqlPool;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    // Apenas avisa no console durante o build, mas lança erro em execução
    if (process.env.npm_lifecycle_event === "build") {
      console.warn("⚠️ DATABASE_URL não definida, mas ignorando erro durante o build.");
      // Retorna um pool mock falso ou vazio para não quebrar a tipagem (nunca será usado no build)
    } else {
      throw new Error("❌ DATABASE_URL não definida nas variáveis de ambiente.");
    }
  }

  const pool = mysql.createPool({
    uri: databaseUrl || "mysql://dummy:dummy@localhost:3306/dummy",
    connectionLimit: 5,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    queueLimit: 0,
  });

  globalForDb.mysqlPool = pool;
  return pool;
}

/**
 * Executa uma query SQL e retorna o resultado tipado.
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: (string | number | boolean | null)[] = []
): Promise<T[]> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}
