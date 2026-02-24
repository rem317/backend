const { connect } = require('@tidbcloud/serverless');
require('dotenv').config();

console.log('🔄 Initializing TiDB Serverless connection...');

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set!');
    process.exit(1);
}

const connection = connect({
    url: process.env.DATABASE_URL
});

// Execute function para magamit sa server.js
async function execute(query, params = []) {
    try {
        console.log(`🔍 Executing query: ${query.substring(0, 100)}...`);
        const result = await connection.execute(query, params);
        // ✅ SIGURADUHIN NA MAY RESULT.ROWS
        return {
            rows: result.rows || [],
            fields: result.fields || []
        };
    } catch (err) {
        console.error('❌ Query error:', err.message);
        throw err;
    }
}

module.exports = {
    execute,
    connection
};
