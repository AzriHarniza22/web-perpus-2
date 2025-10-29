import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer, storageHelpers } from '@/lib/supabase'
import { withAuth, errorResponse, successResponse, type AuthenticatedRequest } from '@/lib/api-middleware'
import { validateFileUpload } from '@/lib/validation'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    let uploadedFileName: string | null = null

    try {
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        return errorResponse('No file provided', 400)
      }

      // Validate file
      const validation = await validateFileUpload(file)
      if (!validation.isValid) {
        return errorResponse(validation.error!, 400)
      }

      // Upload to Supabase Storage
      const supabase = await getSupabaseServer()
      const fileName = `${req.user.id}/${Date.now()}-${file.name}`
      uploadedFileName = fileName // Track for cleanup

      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, {
          contentType: file.type,
          upsert: false
        })

      if (error) {
        console.error('File upload error:', error)
        return errorResponse('Failed to upload file', 500)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName)

      // Clear the uploaded file name since upload succeeded
      uploadedFileName = null

      return successResponse({
        fileName: file.name,
        fileUrl: publicUrl,
        fileSize: file.size,
        fileType: file.type
      }, 'File uploaded successfully')

    } catch (error) {
      console.error('Upload API error:', error)

      // Cleanup orphaned file if upload failed after storage operation
      if (uploadedFileName) {
        try {
          const supabase = await getSupabaseServer()
          await storageHelpers.deleteFile(supabase, 'uploads', uploadedFileName)
          console.log(`Cleaned up orphaned file: ${uploadedFileName}`)
        } catch (cleanupError) {
          console.error('Failed to cleanup orphaned file:', cleanupError)
        }
      }

      return errorResponse('Internal server error', 500)
    }
  })
}

// New endpoint for batch upload operations (used by queue system)
export async function PUT(request: NextRequest) {
  return withAuth(request, async (req: AuthenticatedRequest) => {
    try {
      const { operation, itemId } = await request.json()

      switch (operation) {
        case 'cancel':
          // For cancellation, we rely on client-side abort controllers
          // This endpoint can be used for server-side cleanup if needed
          return successResponse({ cancelled: true }, 'Upload cancelled')

        case 'cleanup':
          // Cleanup failed uploads
          const supabase = await getSupabaseServer()
          const { data: files } = await supabase.storage
            .from('uploads')
            .list(req.user.id)

          if (files) {
            const failedFiles = files.filter(file =>
              file.name.includes('failed-') || file.name.includes('cancelled-')
            )

            for (const file of failedFiles) {
              await storageHelpers.deleteFile(supabase, 'uploads', `${req.user.id}/${file.name}`)
            }
          }

          return successResponse({ cleaned: true }, 'Cleanup completed')

        default:
          return errorResponse('Invalid operation', 400)
      }
    } catch (error) {
      console.error('Batch upload operation error:', error)
      return errorResponse('Internal server error', 500)
    }
  })
}