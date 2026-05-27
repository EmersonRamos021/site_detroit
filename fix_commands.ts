import { getPool } from "./src/lib/db";

async function fixCommands() {
  const db = getPool();
  try {
    console.log("Atualizando in_game_command dos veículos...");
    
    const updates = [
      { title: "BMW X6 Competition", cmd: "add_car:BMW X6 Competition" },
      { title: "Lamborghini Huracan Tecnica 2023", cmd: "add_car:Lamborghini Huracan Tecnica 2023" },
      { title: "Honda Civic G10", cmd: "add_car:Honda Civic G10" },
      { title: "Toyota Corolla 2023", cmd: "add_car:Toyota Corolla 2023" },
      { title: "Vw Gol G5", cmd: "add_car:Vw Gol G5" },
      { title: "Vw Golf MK8", cmd: "add_car:Vw Golf MK8" },
      { title: "Toyota Hilux 2022", cmd: "add_car:Toyota Hilux 2022" },
      { title: "Honda Start 160 2025", cmd: "add_car:Honda Start 160 2025" },
      { title: "BMW 1250", cmd: "add_car:BMW 1250" },
    ];

    for (const update of updates) {
      await db.execute(
        "UPDATE products SET in_game_command = ? WHERE title = ?",
        [update.cmd, update.title]
      );
    }
    
    console.log("✅ Comandos In-Game atualizados com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao atualizar comandos:", error);
    process.exit(1);
  }
}

fixCommands();
