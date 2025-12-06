import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function addArchiveColumns() {
    console.log('Adding archive columns to dm_conversations...')

    // Add archived columns
    const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
            ALTER TABLE dm_conversations 
            ADD COLUMN IF NOT EXISTS archived_by_user1 BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS archived_by_user2 BOOLEAN DEFAULT FALSE;
        `
    })

    if (alterError) {
        console.error('Error adding columns:', alterError)
        // Try alternative method
        console.log('Trying alternative method...')
        const { error } = await supabase
            .from('dm_conversations')
            .update({
                archived_by_user1: false,
                archived_by_user2: false
            })
            .limit(0)

        if (error) {
            console.log('Columns might already exist or need manual migration')
        }
    } else {
        console.log('✅ Archive columns added successfully')
    }
}

addArchiveColumns()
