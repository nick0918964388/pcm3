import { NextRequest, NextResponse } from 'next/server'
import { personnelRepository, UpdatePersonnelData } from '@/repositories/personnelRepository'
import { subcontractorRepository } from '@/repositories/subcontractorRepository'
import { DatabaseError } from '@/lib/errors'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid personnel ID'
        },
        { status: 400 }
      )
    }

    const personnel = await personnelRepository.findById(id)
    
    if (!personnel) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Personnel not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: personnel
    })
  } catch (error) {
    console.error('Error fetching personnel:', error)
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database error occurred',
          code: error.code
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid personnel ID'
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    const updateData: UpdatePersonnelData = {}
    
    if (body.subcontractorId !== undefined) {
      if (typeof body.subcontractorId !== 'number' || body.subcontractorId <= 0) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Valid subcontractorId is required'
          },
          { status: 400 }
        )
      }

      const subcontractor = await subcontractorRepository.findById(body.subcontractorId)
      if (!subcontractor) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Subcontractor not found'
          },
          { status: 400 }
        )
      }

      updateData.subcontractorId = body.subcontractorId
    }
    
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Name must be a non-empty string'
          },
          { status: 400 }
        )
      }
      updateData.name = body.name.trim()
    }
    
    if (body.position !== undefined) {
      updateData.position = body.position?.trim() || null
    }
    
    if (body.phone !== undefined) {
      updateData.phone = body.phone?.trim() || null
    }
    
    if (body.email !== undefined) {
      const email = body.email?.trim() || null
      if (email && !isValidEmail(email)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid email format'
          },
          { status: 400 }
        )
      }
      updateData.email = email
    }
    
    if (body.employeeId !== undefined) {
      updateData.employeeId = body.employeeId?.trim() || null
    }

    const personnel = await personnelRepository.update(id, updateData)
    
    if (!personnel) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Personnel not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: personnel
    })
  } catch (error) {
    console.error('Error updating personnel:', error)
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database error occurred',
          code: error.code
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid personnel ID'
        },
        { status: 400 }
      )
    }

    const deleted = await personnelRepository.delete(id)
    
    if (!deleted) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Personnel not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Personnel deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting personnel:', error)
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Database error occurred',
          code: error.code
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}