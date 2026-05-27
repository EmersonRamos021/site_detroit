import { getPool } from "./src/lib/db";

async function clearOrders() {
  const db = getPool();
  try {
    console.log("Limpando histórico de pedidos de teste do banco de dados...");
    
    // Apaga os itens dos pedidos
    await db.execute("DELETE FROM order_items");
    
    // Apaga os pedidos
    await db.execute("DELETE FROM orders");
    
    console.log("✅ Todos os pedidos de teste foram apagados com sucesso! Fila limpa.");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao apagar pedidos:", error);
    process.exit(1);
  }
}

clearOrders();
