import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  if (!fs.existsSync(migrationsDir)) { console.log('No migrations directory found.'); process.exit(0); }
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  await pool.query(`CREATE TABLE IF NOT EXISTS migrations (id SERIAL PRIMARY KEY, filename VARCHAR(255) UNIQUE NOT NULL, executed_at TIMESTAMP DEFAULT NOW())`);
  for (const file of files) {
    const alreadyRun = await pool.query('SELECT id FROM migrations WHERE filename = $1', [file]);
    if (alreadyRun.rows.length > 0) { console.log(`Skipping ${file} (already executed)`); continue; }
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
      console.log(`Migration ${file} executed successfully.`);
    } catch (error) {
      console.error(`Migration ${file} failed:`, error.message);
      process.exit(1);
    }
  }
  console.log('All migrations completed.');
  await pool.end();
  process.exit(0);
}

runMigrations().catch(err => { console.error('Migration error:', err); process.exit(1); });
