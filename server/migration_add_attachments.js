const { pool } = require('./config/db');

async function migrate() {
    try {
        console.log('Starting migration...');
        const query = `
            ALTER TABLE notifications 
            ADD COLUMN IF NOT EXISTS attachment_url TEXT, 
            ADD COLUMN IF NOT EXISTS attachment_name TEXT, 
            ADD COLUMN IF NOT EXISTS attachment_type TEXT, 
            ADD COLUMN IF NOT EXISTS attachment_size INTEGER;
        `;
        await pool.query(query);
        console.log('Migration successful: Added attachment columns to notifications table.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

migrate();
