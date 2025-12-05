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

async function disableRLS() {
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully.');

        console.log('Disabling RLS for whiteboard and timers...');
        const sqlPath = path.join(__dirname, 'disable_rls.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log('RLS disabled successfully!');

    } catch (err) {
        console.error('Operation failed:', err);
    } finally {
        await client.end();
    }
}

disableRLS();
