import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Test the connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    if (error) {
      return Response.json({ 
        success: false, 
        error: error.message,
        message: 'Supabase connection failed' 
      }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'Supabase connection successful',
      data: data 
    })
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Supabase connection test failed' 
    }, { status: 500 })
  }
}
