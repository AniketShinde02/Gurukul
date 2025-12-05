import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const sessionId = formData.get('sessionId') as string

    if (!file || !sessionId) {
      return NextResponse.json({ error: 'Missing file or sessionId' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif', 
      'image/webp',
      'application/pdf'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Only images (JPG, PNG, GIF, WebP) and PDF files are allowed' 
      }, { status: 400 })
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ 
        error: 'File size must be less than 10MB' 
      }, { status: 400 })
    }

    // Setup Google Drive API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    })

    const drive = google.drive({ version: 'v3', auth })

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to Google Drive
    try {
      const driveResponse = await drive.files.create({
        requestBody: {
          name: `${Date.now()}-${file.name}`,
          parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
        },
        media: {
          mimeType: file.type,
          body: buffer,
        },
      })

      if (!driveResponse.data) {
        throw new Error('No data returned from Google Drive')
      }

      const driveFile = driveResponse.data

      // Set file permissions to allow anyone with link to view
      await drive.permissions.create({
        fileId: driveFile.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      })

      // Generate shareable URL
      const fileUrl = `https://drive.google.com/file/d/${driveFile.id}/view`

      return NextResponse.json({
        fileUrl,
        fileName: file.name,
        fileId: driveFile.id,
      })
    } catch (driveError) {
      console.error('Google Drive upload error:', driveError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

