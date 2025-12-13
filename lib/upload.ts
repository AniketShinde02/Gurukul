// File Upload Utilities - Chunked uploads with progress tracking

export async function uploadFileInChunks(
    file: File,
    onProgress?: (progress: number) => void
): Promise<string> {
    const CHUNK_SIZE = 1024 * 1024 // 1MB chunks
    const chunks = Math.ceil(file.size / CHUNK_SIZE)

    // Compress image before upload if it's an image
    let fileToUpload = file
    if (file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file)
    }

    // For now, upload directly (chunking requires backend support)
    // This is a placeholder for future chunked upload implementation
    const formData = new FormData()
    formData.append('file', fileToUpload)

    const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
    })

    if (!response.ok) {
        throw new Error('Upload failed')
    }

    const { url } = await response.json()
    return url
}

async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                // Calculate new dimensions
                const maxDimension = 1920
                if (width > height && width > maxDimension) {
                    height = (height / width) * maxDimension
                    width = maxDimension
                } else if (height > maxDimension) {
                    width = (width / height) * maxDimension
                    height = maxDimension
                }

                canvas.width = width
                canvas.height = height

                const ctx = canvas.getContext('2d')
                ctx?.drawImage(img, 0, 0, width, height)

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            })
                            resolve(compressedFile)
                        } else {
                            reject(new Error('Image compression failed'))
                        }
                    },
                    'image/jpeg',
                    0.8 // Quality
                )
            }
            img.src = e.target?.result as string
        }

        reader.onerror = () => reject(new Error('File read failed'))
        reader.readAsDataURL(file)
    })
}

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
