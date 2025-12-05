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

async function verifyTables() {
    console.log('Verifying database schema...');

    const tables = ['room_timers', 'whiteboard_data', 'xp_logs', 'profiles'];
    let allGood = true;

    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`❌ Table '${table}': Error - ${error.message}`);
            if (error.code === '42P01') console.error(`   (Table does not exist)`);
            allGood = false;
        } else {
            console.log(`✅ Table '${table}': Exists and accessible.`);
        }
    }

    // Check specific columns in profiles
    const { data: profile } = await supabase.from('profiles').select('xp, level').limit(1);
    if (profile && profile.length > 0) {
        if (profile[0].xp !== undefined && profile[0].level !== undefined) {
            console.log(`✅ Columns 'xp' and 'level' exist in 'profiles'.`);
        } else {
            console.error(`❌ Columns 'xp' or 'level' MISSING in 'profiles'.`);
            allGood = false;
        }
    }

    if (allGood) {
        console.log('\n🎉 Database verification PASSED! You are ready to test the UI.');
    } else {
        console.log('\n⚠️ Database verification FAILED. Please check the errors above.');
    }
}

verifyTables();
