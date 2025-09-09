import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { dailyReportRepository } from '@/repositories/dailyReportRepository'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const status = searchParams.get('status')
    const offset = parseInt(searchParams.get('offset') || '0')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
    }

    let reports
    if (status) {
      reports = await dailyReportRepository.findByStatus(parseInt(projectId), status, offset, limit)
    } else {
      reports = await dailyReportRepository.findByProjectId(parseInt(projectId), offset, limit)
    }

    return NextResponse.json({
      success: true,
      data: reports,
      count: reports.length
    })
  } catch (error) {
    console.error('Error fetching daily reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { projectId, reportDate, content, weather, progressNotes, issues } = body

    if (!projectId || !reportDate) {
      return NextResponse.json({ error: 'Project ID and report date are required' }, { status: 400 })
    }

    const report = await dailyReportRepository.create({
      projectId: parseInt(projectId),
      reportedBy: parseInt(session.user.id),
      reportDate: new Date(reportDate),
      content,
      weather,
      progressNotes,
      issues
    })

    return NextResponse.json({
      success: true,
      data: report
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating daily report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}