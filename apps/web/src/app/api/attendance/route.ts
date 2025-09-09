import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { attendanceRepository, CreateAttendanceData, AttendanceFilters } from '../../../repositories/attendanceRepository'
import { DatabaseError } from '../../../lib/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters: AttendanceFilters = {}

    const projectId = searchParams.get('projectId')
    const personnelId = searchParams.get('personnelId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const workType = searchParams.get('workType')

    if (projectId) filters.projectId = parseInt(projectId, 10)
    if (personnelId) filters.personnelId = parseInt(personnelId, 10)
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)
    if (workType) filters.workType = workType

    const attendance = await attendanceRepository.findAll(filters)
    
    return NextResponse.json({
      success: true,
      data: attendance
    })
  } catch (error) {
    console.error('Error fetching attendance records:', error)
    
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

export async function POST(request: NextRequest) {
  try {
    // Check for API key authentication for external attendance data
    const authHeader = request.headers.get('authorization')
    const apiKey = request.headers.get('x-api-key')
    
    let isApiKeyAuth = false
    if (apiKey) {
      // Validate API key (you should implement proper API key validation)
      const validApiKey = process.env.ATTENDANCE_API_KEY
      if (!validApiKey || apiKey !== validApiKey) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
      }
      isApiKeyAuth = true
    } else {
      // Regular session authentication
      const session = await getServerSession(authOptions)
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    
    // Validate required fields
    const { personnelId, projectId, workDate } = body
    if (!personnelId || !projectId || !workDate) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: personnelId, projectId, workDate'
      }, { status: 400 })
    }

    // Validate date format
    const parsedWorkDate = new Date(workDate)
    if (isNaN(parsedWorkDate.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid workDate format'
      }, { status: 400 })
    }

    // Check for duplicate entries
    const isDuplicate = await attendanceRepository.checkDuplicateEntry(
      parseInt(personnelId, 10),
      parseInt(projectId, 10),
      parsedWorkDate
    )

    if (isDuplicate) {
      return NextResponse.json({
        success: false,
        error: 'Attendance record already exists for this personnel on this date'
      }, { status: 409 })
    }

    const createData: CreateAttendanceData = {
      personnelId: parseInt(personnelId, 10),
      projectId: parseInt(projectId, 10),
      workDate: parsedWorkDate,
      checkInTime: body.checkInTime ? new Date(body.checkInTime) : undefined,
      checkOutTime: body.checkOutTime ? new Date(body.checkOutTime) : undefined,
      hoursWorked: body.hoursWorked ? parseFloat(body.hoursWorked) : undefined,
      workType: body.workType
    }

    // Validate check-in/check-out times
    if (createData.checkInTime && createData.checkOutTime) {
      if (createData.checkOutTime <= createData.checkInTime) {
        return NextResponse.json({
          success: false,
          error: 'Check-out time must be after check-in time'
        }, { status: 400 })
      }
    }

    const attendance = await attendanceRepository.create(createData)
    
    return NextResponse.json({
      success: true,
      data: attendance,
      message: isApiKeyAuth ? 'Attendance data received successfully' : 'Attendance record created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating attendance record:', error)
    
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