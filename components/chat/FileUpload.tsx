'use client'

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, Upload, Image, File } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface FileUploadProps {
  sessionId: string
  onUploadStart: () => void
  onUploadEnd: () => void
  onClose: () => void
}

export function FileUpload({ sessionId, onUploadStart, onUploadEnd, onClose }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    const file = files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'application/pdf'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only images (JPG, PNG, GIF, WebP) and PDF files are allowed')
      return
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    await uploadFile(file)
  }

  const uploadFile = async (file: File) => {
    onUploadStart()
    setUploadProgress(0)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('sessionId', sessionId)

      // Upload to our API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      const { fileUrl, fileName } = await response.json()

      // Save message to database
      const { error } = await supabase
        .from('messages')
        .insert({
          session_id: sessionId,
          sender_id: user.id,
          content: `Shared a ${file.type.startsWith('image/') ? 'image' : 'file'}`,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          file_url: fileUrl,
          file_name: fileName,
        })

      if (error) throw error

      toast.success('File uploaded successfully!')
      onClose()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
    } finally {
      onUploadEnd()
      setUploadProgress(0)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Upload File</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 dark:border-gray-600'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <Upload className="h-8 w-8 mx-auto text-gray-400" />
          <div>
            <p className="text-sm font-medium">
              Drop your file here or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-primary hover:underline"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-muted-foreground">
              Images (JPG, PNG, GIF, WebP) and PDF files up to 10MB
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInput}
          accept="image/*,.pdf"
          className="hidden"
        />
      </div>

      {uploadProgress > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  )
}

