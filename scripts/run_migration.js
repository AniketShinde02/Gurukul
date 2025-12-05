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

async function runMigration() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully.');



        // Run Recursion Fix
        console.log('Running Recursion Fix...');
        const sqlPath3 = path.join(__dirname, 'fix-recursion.sql');
        const sql3 = fs.readFileSync(sqlPath3, 'utf8');
        await client.query(sql3);
        console.log('Recursion Fix completed successfully!');

        // Run Channel RLS Fix (Secure)
        console.log('Running Channel RLS Fix (Secure)...');
        const sqlPath4 = path.join(__dirname, 'fix-channel-rls.sql');
        const sql4 = fs.readFileSync(sqlPath4, 'utf8');
        await client.query(sql4);
        console.log('Channel RLS Fix completed successfully!');

        // Run Whiteboard Schema
        console.log('Running Whiteboard Schema...');
        const sqlPath5 = path.join(__dirname, 'create-whiteboard-schema.sql');
        const sql5 = fs.readFileSync(sqlPath5, 'utf8');
        await client.query(sql5);
        console.log('Whiteboard Schema completed successfully!');

        // Run Timer Schema
        console.log('Running Timer Schema...');
        const sqlPath6 = path.join(__dirname, 'create-timer-schema.sql');
        const sql6 = fs.readFileSync(sqlPath6, 'utf8');
        await client.query(sql6);
        console.log('Timer Schema completed successfully!');

        // Run XP Schema
        console.log('Running XP Schema...');
        const sqlPath7 = path.join(__dirname, 'add-xp-schema.sql');
        const sql7 = fs.readFileSync(sqlPath7, 'utf8');
        await client.query(sql7);
        console.log('XP Schema completed successfully!');

        console.log('ALL MIGRATIONS COMPLETED SUCCESSFULLY!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
