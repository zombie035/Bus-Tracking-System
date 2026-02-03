// server/migrations/runMigration.js
// Script to run database migrations

const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigration(filename) {
    try {
        console.log(`\n📦 Running migration: ${filename}...`);

        const migrationPath = path.join(__dirname, filename);
        const sql = fs.readFileSync(migrationPath, 'utf8');

        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(stmt => stmt.trim());

        for (const statement of statements) {
            if (statement.trim()) {
                await pool.query(statement);
            }
        }

        console.log(`✅ Migration ${filename} completed successfully`);
        return true;
    } catch (error) {
        console.error(`❌ Migration ${filename} failed:`, error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting database migrations...\n');

    const migrations = [
        '004_driver_dashboard_enhancements.sql'
    ];

    for (const migration of migrations) {
        const success = await runMigration(migration);
        if (!success) {
            console.error('\n❌ Migration process stopped due to errors');
            process.exit(1);
        }
    }

    console.log('\n✅ All migrations completed successfully!');
    process.exit(0);
}

main();
