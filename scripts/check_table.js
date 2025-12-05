const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
    const { data, error } = await supabase
        .from('whiteboard_data')
        .select('count', { count: 'exact', head: true });

    if (error) {
        console.error('Error checking table:', error.message);
    } else {
        console.log('Table whiteboard_data exists and is accessible.');
    }
}

checkTable();
