import { getPool } from "./src/lib/db";

async function syncVehicles() {
  const db = getPool();
  try {
    console.log("Conectando ao banco de dados...");
    
    // Buscar ID da categoria Veículos
    const [cats] = await db.execute("SELECT id, slug FROM categories WHERE slug = 'veiculos'");
    const veiculosId = (cats as any[])[0]?.id;

    if (!veiculosId) {
      console.log("Categoria de veículos não encontrada.");
      process.exit(1);
    }

    console.log("Ocultando os veículos de teste antigos...");
    await db.execute("UPDATE products SET active = FALSE WHERE category_id = ?", [veiculosId]);
    
    console.log("Inserindo a nova frota real...");
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
        (?, ?, ?, ?, ?, ?)
    `,
      [
        "BMW X6 Competition", "SUV de luxo com alta performance e design imponente.", 150000.0, "/detroit_bg.png", veiculosId, true,
        "Lamborghini Huracan Tecnica 2023", "Superesportivo incrível com motor V10.", 2190000.0, "/detroit_bg.png", veiculosId, true,
        "Honda Civic G10", "Sedan icônico com excelente dirigibilidade e conforto.", 1373950.0, "/detroit_bg.png", veiculosId, false,
        "Toyota Corolla 2023", "O sedan mais vendido do mundo, confiável e moderno.", 416810.0, "/detroit_bg.png", veiculosId, false,
        "Vw Gol G5", "Hatch compacto ideal para o dia a dia.", 242013.0, "/detroit_bg.png", veiculosId, false,
        "Vw Golf MK8", "Hatch esportivo de alta tecnologia e performance.", 330000.0, "/detroit_bg.png", veiculosId, true,
        "Toyota Hilux 2022", "Picape robusta preparada para qualquer terreno.", 249990.0, "/detroit_bg.png", veiculosId, true,
        "Honda Start 160 2025", "Moto econômica e ágil para entregas e locomoção urbana.", 88390.0, "/detroit_bg.png", veiculosId, false,
        "BMW 1250", "Moto premium para aventuras e viagens.", 131300.0, "/detroit_bg.png", veiculosId, true
      ]
    );

    console.log("✅ Frota atualizada com sucesso no banco de dados principal!");
    process.exit(0);
  } catch (error) {
    console.error("Erro durante a atualização:", error);
    process.exit(1);
  }
}

syncVehicles();
