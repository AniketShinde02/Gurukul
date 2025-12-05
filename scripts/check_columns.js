const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking columns for study_rooms table...');
    const { data, error } = await supabase
        .from('study_rooms')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error accessing table:', error.message);
    } else if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('Table is empty, cannot infer columns from data.');
        // Try to insert a dummy row to see error or just fail gracefully if empty
    }
}

checkColumns();
