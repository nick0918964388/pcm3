import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]/route'
import { dailyReportRepository } from '@/repositories/dailyReportRepository'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reportId = parseInt(params.id)
    if (isNaN(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID' }, { status: 400 })
    }

    // Get current report to check if user is the owner
    const report = await dailyReportRepository.findById(reportId)
    
    if (report.reportedBy !== parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Only report owner can submit' }, { status: 403 })
    }

    if (report.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft reports can be submitted' }, { status: 400 })
    }

    const updatedReport = await dailyReportRepository.update(reportId, {
      status: 'submitted'
    })

    return NextResponse.json(updatedReport)
  } catch (error) {
    console.error('Error submitting report:', error)
    if (error instanceof Error && error.message === 'Daily report not found') {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}