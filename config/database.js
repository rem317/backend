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
        const result = await connection.execute(query, params);
        return result;
    } catch (err) {
        console.error('❌ Query error:', err.message);
        throw err;
    }
}

module.exports = {
    execute,
    connection
};
