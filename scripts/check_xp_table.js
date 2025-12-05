const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    console.log('Checking for xp_logs table...');
    const { data, error } = await supabase
        .from('xp_logs')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error accessing table:', error.message);
        if (error.code === '42P01') { // undefined_table
            console.log('Table does not exist.');
        }
    } else {
        console.log('Table exists and is accessible.');
    }
}

checkTable();
