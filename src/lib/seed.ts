import { getPool } from "./db";

/**
 * Cria as tabelas `categories` e `products` se não existirem,
 * e insere dados iniciais (seed) caso as tabelas estejam vazias.
 *
 * Estas tabelas são independentes das tabelas do bot Discord
 * (settings, counters, reports) — não há conflito.
 */
export async function runSeed() {
  const db = getPool();

  // ═══════════════════════════════════════
  // TABELA: categories
  // ═══════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      icon VARCHAR(50) DEFAULT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ═══════════════════════════════════════
  // TABELA: products
  // ═══════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      price DECIMAL(10,2) NOT NULL,
      image_url VARCHAR(500) DEFAULT NULL,
      category_id INT NOT NULL,
      active BOOLEAN DEFAULT TRUE,
      featured BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      INDEX idx_active (active),
      INDEX idx_category (category_id)
    )
  `);

  // ═══════════════════════════════════════
  // TABELA: users (para auth Discord)
  // ═══════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      discord_id VARCHAR(30) UNIQUE NOT NULL,
      discord_tag VARCHAR(100) NOT NULL,
      avatar_url VARCHAR(500) DEFAULT NULL,
      email VARCHAR(200) DEFAULT NULL,
      role ENUM('user', 'admin') DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_discord_id (discord_id)
    )
  `);

  // ═══════════════════════════════════════
  // TABELA: orders (pedidos)
  // ═══════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(20) UNIQUE NOT NULL,
      user_id INT NOT NULL,
      product_id INT NOT NULL,
      status ENUM('pendente', 'pago', 'entregue', 'cancelado') DEFAULT 'pendente',
      original_price DECIMAL(10,2) NOT NULL,
      discount DECIMAL(10,2) DEFAULT 0,
      price DECIMAL(10,2) NOT NULL,
      coupon_code VARCHAR(50) DEFAULT NULL,
      mp_payment_id BIGINT DEFAULT NULL,
      expires_at TIMESTAMP NULL DEFAULT NULL,
      expiry_notified BOOLEAN DEFAULT FALSE,
      vip_days INT DEFAULT 30,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      INDEX idx_user (user_id),
      INDEX idx_status (status),
      INDEX idx_expires (expires_at)
    )
  `);

  // Migração: adicionar colunas de VIP se não existirem (para bancos já criados)
  try {
    await db.execute(`ALTER TABLE orders ADD COLUMN expires_at TIMESTAMP NULL DEFAULT NULL`);
    await db.execute(`ALTER TABLE orders ADD COLUMN expiry_notified BOOLEAN DEFAULT FALSE`);
    await db.execute(`ALTER TABLE orders ADD COLUMN vip_days INT DEFAULT 30`);
    await db.execute(`ALTER TABLE orders ADD INDEX idx_expires (expires_at)`);
    console.log("✅ Colunas de VIP adicionadas à tabela orders.");
  } catch {
    // Colunas já existem — ignorar o erro
  }

  // Migração: adicionar coluna mp_payment_id para Mercado Pago
  try {
    await db.execute(`ALTER TABLE orders ADD COLUMN mp_payment_id BIGINT DEFAULT NULL`);
    console.log("✅ Coluna mp_payment_id adicionada à tabela orders.");
  } catch {
    // Coluna já existe — ignorar o erro
  }

  // ═══════════════════════════════════════
  // TABELA: coupons (cupons de desconto)
  // ═══════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INT AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      discount_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
      discount_value DECIMAL(10,2) NOT NULL,
      min_price DECIMAL(10,2) DEFAULT 0,
      max_uses INT DEFAULT NULL,
      used_count INT DEFAULT 0,
      active BOOLEAN DEFAULT TRUE,
      expires_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_code (code),
      INDEX idx_active (active)
    )
  `);

  // ═══════════════════════════════════════
  // SEED: Inserir categorias iniciais
  // ═══════════════════════════════════════
  const [existingCategories] = await db.execute(
    "SELECT COUNT(*) as count FROM categories"
  );
  const catCount = (existingCategories as Array<{ count: number }>)[0].count;

  if (catCount === 0) {
    await db.execute(`
      INSERT INTO categories (name, slug, icon, sort_order) VALUES
        ('Veículos', 'veiculos', '🚗', 1),
        ('VIPs', 'vips', '⭐', 2),
        ('Planos', 'planos', '📦', 3),
        ('Drops', 'drops', '🎁', 4)
    `);
    console.log("✅ Categorias iniciais inseridas.");
  }

  // ═══════════════════════════════════════
  // SEED: Inserir produtos iniciais
  // ═══════════════════════════════════════
  const [existingProducts] = await db.execute(
    "SELECT COUNT(*) as count FROM products"
  );
  const prodCount = (existingProducts as Array<{ count: number }>)[0].count;

  if (prodCount === 0) {
    // Buscar IDs das categorias
    const [cats] = await db.execute("SELECT id, slug FROM categories");
    const catMap = new Map(
      (cats as Array<{ id: number; slug: string }>).map((c) => [c.slug, c.id])
    );

    const veiculosId = catMap.get("veiculos")!;
    const vipsId = catMap.get("vips")!;
    const planosId = catMap.get("planos")!;

    await db.execute(
      `
      INSERT INTO products (title, description, price, image_url, category_id, featured) VALUES
        (?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?)
    `,
      [
        "Mustang GT",
        "Ford Mustang GT exclusivo com tunagem completa. Domine as ruas de Detroit com estilo.",
        120.0,
        "https://picsum.photos/seed/mustang/600/400",
        veiculosId,
        true,

        "VIP Black",
        "Acesso premium com benefícios exclusivos: prioridade no servidor, cores exclusivas e muito mais.",
        80.0,
        "https://picsum.photos/seed/vipblack/600/400",
        vipsId,
        true,

        "Lancer Evo",
        "Mitsubishi Lancer Evolution com performance máxima para corridas.",
        90.0,
        "https://picsum.photos/seed/lancer/600/400",
        veiculosId,
        false,

        "Plano Magnata",
        "O plano mais completo: todos os VIPs + veículos exclusivos + benefícios permanentes.",
        250.0,
        "https://picsum.photos/seed/magnata/600/400",
        planosId,
        true,

        "Audi RS5",
        "Audi RS5 Sportback — potência e elegância em um só pacote.",
        110.0,
        "https://picsum.photos/seed/audirs5/600/400",
        veiculosId,
        false,

        "VIP Premium",
        "Pacote VIP intermediário com vantagens exclusivas no servidor.",
        50.0,
        "https://picsum.photos/seed/vippremium/600/400",
        vipsId,
        false,
      ]
    );
    console.log("✅ Produtos iniciais inseridos.");
  }

  return { categories: catCount === 0, products: prodCount === 0 };
}
