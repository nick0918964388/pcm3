import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { dutyRosterRepository, UpdateDutyRosterData } from '../../../../repositories/dutyRosterRepository'
import { DatabaseError } from '../../../../lib/errors'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid duty roster ID'
      }, { status: 400 })
    }

    const dutyRoster = await dutyRosterRepository.findById(id)
    
    if (!dutyRoster) {
      return NextResponse.json({
        success: false,
        error: 'Duty roster not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: dutyRoster
    })
  } catch (error) {
    console.error('Error fetching duty roster:', error)
    
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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid duty roster ID'
      }, { status: 400 })
    }

    const body = await request.json()
    
    // Validate shiftType if provided
    if (body.shiftType) {
      const validShiftTypes = ['day', 'night', 'custom']
      if (!validShiftTypes.includes(body.shiftType)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid shift type. Must be one of: day, night, custom'
        }, { status: 400 })
      }
    }

    const updateData: UpdateDutyRosterData = {}
    
    if (body.projectId !== undefined) updateData.projectId = parseInt(body.projectId, 10)
    if (body.personnelId !== undefined) updateData.personnelId = parseInt(body.personnelId, 10)
    if (body.dutyDate !== undefined) updateData.dutyDate = new Date(body.dutyDate)
    if (body.shiftType !== undefined) updateData.shiftType = body.shiftType
    if (body.notes !== undefined) updateData.notes = body.notes

    const dutyRoster = await dutyRosterRepository.update(id, updateData)
    
    if (!dutyRoster) {
      return NextResponse.json({
        success: false,
        error: 'Duty roster not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: dutyRoster
    })
  } catch (error) {
    console.error('Error updating duty roster:', error)
    
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id, 10)
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid duty roster ID'
      }, { status: 400 })
    }

    const success = await dutyRosterRepository.delete(id)
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Duty roster not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Duty roster deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting duty roster:', error)
    
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