// Migration script runner for Student Dashboard enhancements
const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runStudentDashboardMigration() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting Student Dashboard migration...\n');

        // Read the migration SQL file
        const migrationPath = path.join(__dirname, '005_student_dashboard_enhancements.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        // Begin transaction
        await client.query('BEGIN');

        console.log('📋 Executing migration SQL...');
        await client.query(migrationSQL);

        // Commit transaction
        await client.query('COMMIT');

        console.log('\n✅ Student Dashboard migration completed successfully!\n');
        console.log('Created tables:');
        console.log('  - student_settings');
        console.log('  - student_feedback');
        console.log('  - announcements');
        console.log('  - quick_contact_messages');
        console.log('  - student_messages');
        console.log('\nEnhanced buses table with new columns');
        console.log('Created indexes and triggers');
        console.log('Inserted default quick contact messages\n');

    } catch (error) {
        // Rollback on error
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        throw error;
    } finally {
        client.release();
    }
}

// Run if called directly
if (require.main === module) {
    runStudentDashboardMigration()
        .then(() => {
            console.log('✨ Migration script finished\n');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Migration script failed\n');
            process.exit(1);
        });
}

module.exports = runStudentDashboardMigration;
