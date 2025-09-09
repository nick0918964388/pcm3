import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../auth/[...nextauth]/route'
import { reportAttachmentRepository } from '@/repositories/reportAttachmentRepository'
import { readFile, unlink } from 'fs/promises'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string, attachmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachmentId = parseInt(params.attachmentId)
    if (isNaN(attachmentId)) {
      return NextResponse.json({ error: 'Invalid attachment ID' }, { status: 400 })
    }

    const attachment = await reportAttachmentRepository.findById(attachmentId)
    
    // Check if file exists on disk
    if (!existsSync(attachment.filePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }

    // Read file and return it
    const fileBuffer = await readFile(attachment.filePath)
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${attachment.filename}"`
      }
    })
  } catch (error) {
    console.error('Error downloading attachment:', error)
    if (error instanceof Error && error.message === 'Attachment not found') {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest, 
  { params }: { params: { id: string, attachmentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const attachmentId = parseInt(params.attachmentId)
    if (isNaN(attachmentId)) {
      return NextResponse.json({ error: 'Invalid attachment ID' }, { status: 400 })
    }

    // Get attachment info before deleting from DB
    const attachment = await reportAttachmentRepository.findById(attachmentId)
    
    // Delete from database
    await reportAttachmentRepository.delete(attachmentId)
    
    // Delete file from disk if it exists
    if (existsSync(attachment.filePath)) {
      try {
        await unlink(attachment.filePath)
      } catch (fileError) {
        console.error('Error deleting file from disk:', fileError)
        // Continue - we've already deleted from DB
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    if (error instanceof Error && error.message === 'Attachment not found') {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}