import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import { dutyRosterRepository, CreateDutyRosterData, DutyRosterFilters } from '../../../repositories/dutyRosterRepository'
import { DatabaseError } from '../../../lib/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filters: DutyRosterFilters = {}

    const projectId = searchParams.get('projectId')
    const personnelId = searchParams.get('personnelId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const shiftType = searchParams.get('shiftType')

    if (projectId) filters.projectId = parseInt(projectId, 10)
    if (personnelId) filters.personnelId = parseInt(personnelId, 10)
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)
    if (shiftType) filters.shiftType = shiftType

    const dutyRosters = await dutyRosterRepository.findAll(filters)
    
    return NextResponse.json({
      success: true,
      data: dutyRosters
    })
  } catch (error) {
    console.error('Error fetching duty rosters:', error)
    
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
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate required fields
    const { projectId, personnelId, dutyDate, shiftType } = body
    if (!projectId || !personnelId || !dutyDate || !shiftType) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: projectId, personnelId, dutyDate, shiftType'
      }, { status: 400 })
    }

    // Validate shiftType
    const validShiftTypes = ['day', 'night', 'custom']
    if (!validShiftTypes.includes(shiftType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid shift type. Must be one of: day, night, custom'
      }, { status: 400 })
    }

    const createData: CreateDutyRosterData = {
      projectId: parseInt(projectId, 10),
      personnelId: parseInt(personnelId, 10),
      dutyDate: new Date(dutyDate),
      shiftType,
      notes: body.notes
    }

    const dutyRoster = await dutyRosterRepository.create(createData)
    
    return NextResponse.json({
      success: true,
      data: dutyRoster
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating duty roster:', error)
    
    if (error instanceof DatabaseError) {
      if (error.code === 'CONFLICT_ERROR') {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 409 })
      }
      
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