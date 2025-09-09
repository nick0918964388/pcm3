import { NextRequest, NextResponse } from 'next/server'
import { subcontractorRepository, UpdateSubcontractorData } from '@/repositories/subcontractorRepository'
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
          error: 'Invalid subcontractor ID'
        },
        { status: 400 }
      )
    }

    const subcontractor = await subcontractorRepository.findById(id)
    
    if (!subcontractor) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Subcontractor not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: subcontractor
    })
  } catch (error) {
    console.error('Error fetching subcontractor:', error)
    
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
          error: 'Invalid subcontractor ID'
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    
    const updateData: UpdateSubcontractorData = {}
    
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
    
    if (body.contactPerson !== undefined) {
      updateData.contactPerson = body.contactPerson?.trim() || null
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
    
    if (body.address !== undefined) {
      updateData.address = body.address?.trim() || null
    }

    const subcontractor = await subcontractorRepository.update(id, updateData)
    
    if (!subcontractor) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Subcontractor not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: subcontractor
    })
  } catch (error) {
    console.error('Error updating subcontractor:', error)
    
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
          error: 'Invalid subcontractor ID'
        },
        { status: 400 }
      )
    }

    const deleted = await subcontractorRepository.delete(id)
    
    if (!deleted) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Subcontractor not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Subcontractor deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting subcontractor:', error)
    
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