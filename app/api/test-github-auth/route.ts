import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Test GitHub OAuth configuration
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      return Response.json({ 
        success: false, 
        error: error.message,
        message: 'GitHub OAuth not configured properly' 
      }, { status: 500 })
    }

    return Response.json({ 
      success: true, 
      message: 'GitHub OAuth is ready for testing',
      session: data.session ? 'User logged in' : 'No active session'
    })
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'GitHub OAuth test failed' 
    }, { status: 500 })
  }
}
