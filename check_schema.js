const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });

async function main() {
  const db = await mysql.createConnection(process.env.DATABASE_URL);
  const [tables] = await db.execute("SHOW TABLES");
  console.log("Tables:");
  console.log(tables);
  
  try {
    const [users] = await db.execute("DESCRIBE users");
    console.log("\nUsers Table:");
    console.log(users);
  } catch(e) {}
  
  process.exit(0);
}
main();
