const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔄 Initializing MySQL connection...');

// Check required environment variables
const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnv = requiredEnv.filter(env => !process.env[env]);

if (missingEnv.length > 0) {
    console.error(`❌ Missing environment variables: ${missingEnv.join(', ')}`);
    console.error('Please check your .env file or Railway variables');
}

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'polylearn_db',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const promisePool = pool.promise();

// ============================================
// AUTO-DATABASE INITIALIZATION FUNCTION
// ============================================
async function initializeDatabase() {
    try {
        console.log('🔄 Checking database tables...');
        
        // Check if users table exists
        const [tables] = await promisePool.query("SHOW TABLES LIKE 'users'");
        
        if (tables.length === 0) {
            console.log('📦 No tables found. Creating database schema...');
            
            // Look for schema.sql in multiple possible locations
            const possiblePaths = [
                path.join(__dirname, '../database/schema.sql'),
                path.join(__dirname, '../../database/schema.sql'),
                path.join(process.cwd(), 'database/schema.sql')
            ];
            
            let schemaPath = null;
            for (const p of possiblePaths) {
                if (fs.existsSync(p)) {
                    schemaPath = p;
                    break;
                }
            }
            
            if (schemaPath) {
                console.log(`📄 Found schema at: ${schemaPath}`);
                const schema = fs.readFileSync(schemaPath, 'utf8');
                
                // Split by semicolon and execute each statement
                const statements = schema.split(';').filter(stmt => stmt.trim());
                
                for (let stmt of statements) {
                    if (stmt.trim()) {
                        try {
                            await promisePool.query(stmt);
                            console.log(`✅ Executed: ${stmt.substring(0, 50)}...`);
                        } catch (stmtErr) {
                            // Ignore errors like "already exists"
                            if (!stmtErr.message.includes('already exists')) {
                                console.log('⚠️ Statement error:', stmtErr.message.substring(0, 100));
                            }
                        }
                    }
                }
                
                console.log('✅ Database schema created successfully!');
            } else {
                console.log('⚠️ schema.sql not found. Creating essential tables...');
                
                // Create essential tables if schema.sql is missing
                await promisePool.query(`
                    CREATE TABLE IF NOT EXISTS users (
                        user_id INT PRIMARY KEY AUTO_INCREMENT,
                        username VARCHAR(50) UNIQUE NOT NULL,
                        email VARCHAR(100) UNIQUE NOT NULL,
                        password_hash VARCHAR(255) NOT NULL,
                        full_name VARCHAR(100),
                        role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        last_login TIMESTAMP NULL,
                        is_active BOOLEAN DEFAULT TRUE
                    )
                `);
                
                console.log('✅ Created users table');
            }
        } else {
            console.log('✅ Database tables already exist');
        }
        
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
    }
}

// Test connection and initialize
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('🔍 Check your environment variables:');
        console.error(`   DB_HOST: ${process.env.DB_HOST || 'not set'}`);
        console.error(`   DB_USER: ${process.env.DB_USER || 'not set'}`);
        console.error(`   DB_NAME: ${process.env.DB_NAME || 'not set'}`);
        console.error(`   DB_PORT: ${process.env.DB_PORT || 'not set'}`);
    } else {
        console.log('✅ Connected to MySQL database');
        connection.release();
        
        // Initialize tables
        initializeDatabase();
    }
});

// Execute function for compatibility
async function execute(query, params = []) {
    try {
        console.log(`🔍 Executing query: ${query.substring(0, 100)}...`);
        const [rows] = await promisePool.query(query, params);
        return {
            rows: rows || [],
            fields: []
        };
    } catch (err) {
        console.error('❌ Query error:', err.message);
        throw err;
    }
}

module.exports = {
    execute,
    promisePool,
    connection: promisePool
};
