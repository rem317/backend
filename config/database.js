const mysql = require('mysql2');
require('dotenv').config();

console.log('🔄 Connecting to MySQL via Railway...');

const pool = mysql.createPool({
    host: process.env.DB_HOST,         // mysql.railway.internal
    user: process.env.DB_USER,         // root
    password: process.env.DB_PASSWORD, // from Railway
    database: process.env.DB_NAME,     // railway
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true
});

const promisePool = pool.promise();

// Test connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Railway MySQL connection failed:', err.message);
    } else {
        console.log('✅ Connected to Railway MySQL!');
        connection.release();
    }
});

module.exports = { promisePool };
