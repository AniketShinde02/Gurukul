const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Error: DATABASE_URL is not defined in .env file');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runOptimizations() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully.');

        // 1. Secure XP Function
        console.log('Applying XP Security Fixes...');
        const sqlPath1 = path.join(__dirname, 'secure-xp-function.sql');
        const sql1 = fs.readFileSync(sqlPath1, 'utf8');
        await client.query(sql1);
        console.log('XP Security Fixes applied!');

        // 2. Performance Indices
        console.log('Applying DB Performance Indices...');
        const sqlPath2 = path.join(__dirname, 'optimize-db-indices.sql');
        const sql2 = fs.readFileSync(sqlPath2, 'utf8');
        await client.query(sql2);
        console.log('DB Performance Indices applied!');

        console.log('✅ ALL OPTIMISATIONS APPLIED SUCCESSFULLY!');
    } catch (err) {
        console.error('❌ Application failed:', err);
    } finally {
        await client.end();
    }
}

runOptimizations();
