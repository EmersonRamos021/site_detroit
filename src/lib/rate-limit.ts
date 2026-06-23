type RateLimitMap = Map<string, { count: number; expiresAt: number }>;

// Armazena dados de uso globalmente em memória
const rateLimiter: RateLimitMap = new Map();

/**
 * Limitador de requisições simples em memória para proteger a API contra spam.
 * @param identifier Identificador único (IP, Discord ID, etc.)
 * @param limit Número máximo de requisições permitidas na janela
 * @param windowMs Duração da janela em milissegundos
 * @returns Retorna se a requisição é permitida (success) e os avisos de limite
 */
export function rateLimit(identifier: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = rateLimiter.get(identifier);

  if (!entry || entry.expiresAt < now) {
    // Cria nova entrada se não existir ou se a anterior já expirou
    rateLimiter.set(identifier, { count: 1, expiresAt: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  // Se já bateu o limite dentro do tempo estipulado
  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  // Caso contrário, apenas incrementa o uso
  entry.count += 1;
  return { success: true, remaining: limit - entry.count };
}
