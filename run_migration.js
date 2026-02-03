require('dotenv').config({ path: './server/.env' });
const { pool } = require('./server/config/db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('📖 Reading migration file...');
        const migrationPath = path.join(__dirname, 'server/migrations/005_live_tracking_updates.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('🔄 Executing migration...');
        await pool.query(sql);

        console.log('✅ Migration 005_live_tracking_updates.sql executed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
