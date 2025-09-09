import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../auth/[...nextauth]/route'
import { dailyReportRepository } from '@/repositories/dailyReportRepository'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportId = parseInt(params.id)
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 })
    }

    const report = await dailyReportRepository.findById(reportId)
    return NextResponse.json(report)
  } catch (error) {
    console.error('Error fetching daily report:', error)
    if (error instanceof Error && error.message === 'Daily report not found') {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportId = parseInt(params.id)
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 })
    }

    const body = await request.json()
    const { content, weather, progressNotes, issues, status, reviewedBy, reviewComment } = body

    // Verify ownership for edit operations
    const existingReport = await dailyReportRepository.findById(reportId)
    const isOwner = existingReport.reportedBy === parseInt(session.user.id)
    const isReviewer = status && ['reviewed', 'rejected'].includes(status)

    if (!isOwner && !isReviewer) {
      return NextResponse.json({ error: 'Not authorized to modify this report' }, { status: 403 })
    }

    const updatedReport = await dailyReportRepository.update(reportId, {
      content,
      weather,
      progressNotes,
      issues,
      status,
      reviewedBy,
      reviewComment
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error('Error updating daily report:', error)
    if (error instanceof Error && error.message === 'Daily report not found') {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportId = parseInt(params.id)
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 })
    }

    await dailyReportRepository.delete(reportId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting daily report:', error)
    if (error instanceof Error && error.message === 'Daily report not found') {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}