const { Pool } = require('pg');
const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 2000;

async function wait() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'db',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'Postgres_user',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'auditorios_db',
    connectionTimeoutMillis: 5000,
  });

  for (let i = 1; i <= MAX_RETRIES; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('PostgreSQL está listo');
      await pool.end();
      process.exit(0);
    } catch {
      console.log(`Esperando PostgreSQL... (${i}/${MAX_RETRIES})`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }

  console.error('No se pudo conectar a PostgreSQL');
  await pool.end();
  process.exit(1);
}

wait();
