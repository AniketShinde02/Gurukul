import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // ✅ Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ Receive JSON metadata (Server never sees the file)
    const json = await request.json()
    const { filename, filetype, filesize, sessionId } = json

    if (!filename || !sessionId || !filetype) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // ✅ Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ]

    if (!allowedTypes.includes(filetype)) {
      return NextResponse.json({
        error: 'Only images (JPG, PNG, GIF, WebP) and PDF files are allowed'
      }, { status: 400 })
    }

    // ✅ Validate file size (100MB max)
    if (filesize > 100 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File size must be less than 100MB'
      }, { status: 400 })
    }

    // ✅ Generate presigned upload URL
    const uniqueName = `${user.id}/${sessionId}/${Date.now()}-${filename}`

    const { data, error } = await supabase.storage
      .from('uploads')
      .createSignedUploadUrl(uniqueName)

    if (error) {
      console.error('Failed to generate upload URL:', error)
      return NextResponse.json({ error: 'Failed to generate upload URL. Ensure "uploads" bucket exists.' }, { status: 500 })
    }

    // ✅ Return upload URL to client
    return NextResponse.json({
      uploadUrl: data.signedUrl,
      path: data.path,
      fileName: filename
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ✅ NEW: Return public URL after upload completes (call from client)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const path = request.nextUrl.searchParams.get('path')
    if (!path) {
      return NextResponse.json({ error: 'Missing path' }, { status: 400 })
    }

    // ✅ Create a signed download URL (valid for 24 hours)
    const { data, error } = await supabase.storage
      .from('uploads')
      .createSignedUrl(path, 86400)  // 24 hours

    if (error) {
      return NextResponse.json({ error: 'Failed to get file URL' }, { status: 500 })
    }

    return NextResponse.json({ publicUrl: data.signedUrl })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

