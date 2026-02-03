const { pool } = require('./config/db');

async function checkColumns() {
    try {
        const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'buses';
    `);

        console.log(JSON.stringify(result.rows.map(r => r.column_name), null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkColumns();
