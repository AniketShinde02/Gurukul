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

        // Run Whiteboard Schema
        console.log('Running Whiteboard Schema...');
        const sqlPath = path.join(__dirname, 'create-whiteboard-schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await client.query(sql);
        console.log('Whiteboard Schema completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

runMigration();
