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
      game_id VARCHAR(50) DEFAULT NULL,
      full_name VARCHAR(255) DEFAULT NULL,
      email VARCHAR(255) DEFAULT NULL,
      cpf VARCHAR(20) DEFAULT NULL,
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

  // Migração: adicionar campos de checkout (game_id, full_name, email, cpf)
  try {
    await db.execute(`ALTER TABLE orders ADD COLUMN game_id VARCHAR(50) DEFAULT NULL`);
    await db.execute(`ALTER TABLE orders ADD COLUMN full_name VARCHAR(255) DEFAULT NULL`);
    await db.execute(`ALTER TABLE orders ADD COLUMN email VARCHAR(255) DEFAULT NULL`);
    await db.execute(`ALTER TABLE orders ADD COLUMN cpf VARCHAR(20) DEFAULT NULL`);
    console.log("✅ Colunas de checkout adicionadas à tabela orders.");
  } catch {
    // Colunas já existem — ignorar o erro
  }

  // ═══════════════════════════════════════
  // TABELA: order_items (itens do carrinho)
  // ═══════════════════════════════════════
  await db.execute(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id),
      INDEX idx_order (order_id)
    )
  `);
  console.log("✅ Tabela order_items verificada/criada.");

  // Modificar product_id em orders para permitir NULL (retrocompatibilidade)
  try {
    await db.execute(`ALTER TABLE orders MODIFY product_id INT NULL`);
    console.log("✅ Tabela orders atualizada para aceitar múltiplos produtos (product_id NULL).");
  } catch {
    // Ignorar se falhar
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
        (?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?, ?)
    `,
      [
        // Veículos Reais do Servidor
        "BMW X6 Competition", "SUV de luxo com alta performance e design imponente.", 150000.0, "/detroit_bg.png", veiculosId, true,
        "Lamborghini Huracan Tecnica 2023", "Superesportivo incrível com motor V10.", 2190000.0, "/detroit_bg.png", veiculosId, true,
        "Honda Civic G10", "Sedan icônico com excelente dirigibilidade e conforto.", 1373950.0, "/detroit_bg.png", veiculosId, false,
        "Toyota Corolla 2023", "O sedan mais vendido do mundo, confiável e moderno.", 416810.0, "/detroit_bg.png", veiculosId, false,
        "Vw Gol G5", "Hatch compacto ideal para o dia a dia.", 242013.0, "/detroit_bg.png", veiculosId, false,
        "Vw Golf MK8", "Hatch esportivo de alta tecnologia e performance.", 330000.0, "/detroit_bg.png", veiculosId, true,
        "Toyota Hilux 2022", "Picape robusta preparada para qualquer terreno.", 249990.0, "/detroit_bg.png", veiculosId, true,
        "Honda Start 160 2025", "Moto econômica e ágil para entregas e locomoção urbana.", 88390.0, "/detroit_bg.png", veiculosId, false,
        "BMW 1250", "Moto premium para aventuras e viagens.", 131300.0, "/detroit_bg.png", veiculosId, true,

        // VIP (Mantendo o VIP Padrão como exemplo)
        "VIP Black", "Acesso premium com benefícios exclusivos: prioridade no servidor e muito mais.", 80.0, "/detroit_bg.png", vipsId, true
      ]
    );
    console.log("✅ Produtos iniciais inseridos.");
  }

  return { categories: catCount === 0, products: prodCount === 0 };
}
