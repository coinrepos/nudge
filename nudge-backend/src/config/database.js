import pg from 'pg';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Force IPv4 resolution to avoid ENETUNREACH on IPv6-only networks (Railway)
dns.setDefaultResultOrder('ipv4first');

// Support both DATABASE_URL (Supabase connection string) and individual env vars
let pool;

if (process.env.DATABASE_URL) {
  // Supabase / Railway / Render style connection string
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
} else {
  // Individual env vars
  const host = process.env.DB_HOST || 'localhost';
  const isLocal = host === 'localhost' || host === '127.0.0.1';
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    host,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'nudge',
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
}

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export { pool };
export default pool;
