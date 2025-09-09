import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { attendanceRepository } from '../../../../repositories/attendanceRepository'
import { DatabaseError } from '../../../../lib/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    const projectId = searchParams.get('projectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate required parameters
    if (!projectId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: projectId'
      }, { status: 400 })
    }

    const parsedProjectId = parseInt(projectId, 10)
    if (isNaN(parsedProjectId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid projectId format'
      }, { status: 400 })
    }

    let parsedStartDate: Date | undefined
    let parsedEndDate: Date | undefined

    if (startDate) {
      parsedStartDate = new Date(startDate)
      if (isNaN(parsedStartDate.getTime())) {
        return NextResponse.json({
          success: false,
          error: 'Invalid startDate format'
        }, { status: 400 })
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate)
      if (isNaN(parsedEndDate.getTime())) {
        return NextResponse.json({
          success: false,
          error: 'Invalid endDate format'
        }, { status: 400 })
      }
    }

    // Validate date range
    if (parsedStartDate && parsedEndDate && parsedEndDate <= parsedStartDate) {
      return NextResponse.json({
        success: false,
        error: 'End date must be after start date'
      }, { status: 400 })
    }

    const stats = await attendanceRepository.getStats(
      parsedProjectId,
      parsedStartDate,
      parsedEndDate
    )
    
    return NextResponse.json({
      success: true,
      data: {
        stats,
        filters: {
          projectId: parsedProjectId,
          startDate: parsedStartDate?.toISOString().split('T')[0],
          endDate: parsedEndDate?.toISOString().split('T')[0]
        }
      }
    })
  } catch (error) {
    console.error('Error generating attendance report:', error)
    
    if (error instanceof DatabaseError) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}