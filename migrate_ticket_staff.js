const fs = require('fs');
const mysql = require('mysql2/promise');

async function migrate() {
  try {
    const envFile = fs.readFileSync('.env', 'utf8');
    const dbUrlMatch = envFile.match(/DATABASE_URL=["']?([^"'\n]+)/);
    if (!dbUrlMatch) throw new Error("DATABASE_URL not found in .env");
    
    const dbUrl = dbUrlMatch[1];
    const db = await mysql.createConnection(dbUrl);
    
    console.log("Criando tabela ticket_staff...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ticket_staff (
        id INT AUTO_INCREMENT PRIMARY KEY,
        discord_id VARCHAR(255) NOT NULL UNIQUE,
        categories JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log("Tabela criada com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro:", error);
    process.exit(1);
  }
}

migrate();
