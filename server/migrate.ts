import { pool } from './db';
import fs from 'fs';
import path from 'path';

export async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();
  
  try {
    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      
      console.log(`🔄 Running migration: ${file}`);
      try {
        await client.query(sql);
        console.log(`✅ Migration completed: ${file}`);
      } catch (error: any) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists')) {
          console.log(`⏭️  Migration skipped (already applied): ${file}`);
        } else {
          console.error(`❌ Migration failed: ${file}`, error);
          throw error;
        }
      }
    }
    
    console.log('✅ All migrations completed successfully');
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations().catch(error => {
    console.error('Migration error:', error);
    process.exit(1);
  });
}
