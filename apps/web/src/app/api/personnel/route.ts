import { NextRequest, NextResponse } from 'next/server'
import { personnelRepository, CreatePersonnelData, PersonnelSearchFilters } from '@/repositories/personnelRepository'
import { subcontractorRepository } from '@/repositories/subcontractorRepository'
import { DatabaseError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: PersonnelSearchFilters = {}
    
    // Sanitize search parameters to prevent injection
    if (searchParams.get('name')) {
      const name = searchParams.get('name')!.trim().substring(0, 255)
      filters.name = name.replace(/[<>\"'&;]/g, '')
    }
    
    if (searchParams.get('position')) {
      const position = searchParams.get('position')!.trim().substring(0, 255)
      filters.position = position.replace(/[<>\"'&;]/g, '')
    }
    
    if (searchParams.get('email')) {
      const email = searchParams.get('email')!.trim().substring(0, 255)
      filters.email = email.replace(/[<>\"'&;]/g, '')
    }

    if (searchParams.get('subcontractorId')) {
      const subcontractorId = parseInt(searchParams.get('subcontractorId')!)
      if (!isNaN(subcontractorId)) {
        filters.subcontractorId = subcontractorId
      }
    }

    if (searchParams.get('subcontractorName')) {
      filters.subcontractorName = searchParams.get('subcontractorName')!
    }

    const personnel = await personnelRepository.findAll(filters)
    
    return NextResponse.json({
      success: true,
      data: personnel,
      count: personnel.length
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Name is required and must be a non-empty string'
        },
        { status: 400 }
      )
    }

    if (!body.subcontractorId || typeof body.subcontractorId !== 'number' || body.subcontractorId <= 0) {
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

    // Sanitize input data to prevent injection
    const sanitize = (input: string) => input.replace(/[<>\"'&;]/g, '').substring(0, 255)
    
    const createData: CreatePersonnelData = {
      subcontractorId: body.subcontractorId,
      name: sanitize(body.name.trim()),
      position: body.position ? sanitize(body.position.trim()) : undefined,
      phone: body.phone ? sanitize(body.phone.trim()) : undefined,
      email: body.email ? sanitize(body.email.trim()) : undefined,
      employeeId: body.employeeId ? sanitize(body.employeeId.trim()) : undefined
    }

    if (createData.email && !isValidEmail(createData.email)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid email format'
        },
        { status: 400 }
      )
    }

    const personnel = await personnelRepository.create(createData)
    
    return NextResponse.json({
      success: true,
      data: personnel
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating personnel:', error)
    
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