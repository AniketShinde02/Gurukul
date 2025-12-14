/**
 * Screenshot Capture Utility
 * Captures video frames from HTMLVideoElement for report evidence
 */

/**
 * Capture screenshot from video element
 * @param videoElement - The video element to capture from
 * @param quality - JPEG quality (0-1), default 0.8
 * @returns Base64 encoded image string
 */
export function captureVideoScreenshot(
    videoElement: HTMLVideoElement,
    quality: number = 0.8
): string {
    const canvas = document.createElement('canvas')
    canvas.width = videoElement.videoWidth || 640
    canvas.height = videoElement.videoHeight || 480

    const ctx = canvas.getContext('2d')
    if (!ctx) {
        throw new Error('Failed to get canvas context')
    }

    // Draw current video frame
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

    // Convert to base64 JPEG
    return canvas.toDataURL('image/jpeg', quality)
}

/**
 * Upload screenshot to Supabase Storage
 * @param base64Image - Base64 encoded image
 * @param reportId - Report ID for filename
 * @returns Public URL of uploaded image
 */
export async function uploadScreenshot(
    base64Image: string,
    reportId: string
): Promise<string> {
    try {
        // Convert base64 to blob
        const response = await fetch(base64Image)
        const blob = await response.blob()

        // Dynamic import to avoid SSR issues
        const { supabase } = await import('@/lib/supabase/client')

        const filename = `report_${reportId}_${Date.now()}.jpg`
        const filepath = `screenshots/${filename}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('report-screenshots')
            .upload(filepath, blob, {
                contentType: 'image/jpeg',
                cacheControl: '3600'
            })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('report-screenshots')
            .getPublicUrl(filepath)

        return publicUrl
    } catch (error) {
        console.error('Screenshot upload error:', error)
        throw error
    }
}

/**
 * Capture and upload screenshot in one call
 * @param videoElement - Video element to capture
 * @param reportId - Report ID
 * @returns Public URL of uploaded screenshot
 */
export async function captureAndUploadScreenshot(
    videoElement: HTMLVideoElement,
    reportId: string
): Promise<string> {
    const screenshot = captureVideoScreenshot(videoElement)
    return uploadScreenshot(screenshot, reportId)
}
