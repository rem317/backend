const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🔄 Starting database connection...');
console.log('📊 DATABASE_URL exists:', !!process.env.DATABASE_URL);

// FORCE na gamitin ang DATABASE_URL kahit ano pa mangyari
if (!process.env.DATABASE_URL) {
    console.error('❌ CRITICAL: DATABASE_URL is not set!');
    process.exit(1);
}

const pool = mysql.createPool({
    uri: process.env.DATABASE_URL,
    // I-override ang SSL para sigurado
    ssl: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
    },
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Test connection agad
async function testConnection() {
    try {
        console.log('🔄 Attempting to connect to TiDB...');
        const connection = await pool.getConnection();
        console.log('✅ SUCCESS! Connected to TiDB!');
        console.log('📊 Database:', connection.config.database);
        
        // I-test ang query
        const [result] = await connection.query('SELECT 1 + 1 AS solution');
        console.log('✅ Query test successful:', result[0].solution === 2 ? '2 ✓' : 'Failed');
        
        connection.release();
    } catch (err) {
        console.error('❌ CONNECTION FAILED!');
        console.error('Error message:', err.message);
        console.error('Error code:', err.code);
        console.error('Full error:', err);
        
        // Eto ang importante - i-check kung anong URL ang ginamit
        console.log('🔍 DATABASE_URL used:', process.env.DATABASE_URL);
    }
}

// Run the test
testConnection();

module.exports = pool;
