import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: Number(process.env.PGPORT || 5432),
  user: process.env.PGUSER || "skylersmith",
  password: process.env.PGPASSWORD || "",
  database: process.env.PGDATABASE || "upath_db",
});

export async function testDbConnection() {
  const client = await pool.connect();
  try {
    await client.query("SELECT 1");
  } finally {
    client.release();
  }
}

export async function query(text, params = []) {
  return pool.query(text, params);
}
