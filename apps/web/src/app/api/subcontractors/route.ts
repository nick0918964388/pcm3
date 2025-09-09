import { NextRequest, NextResponse } from 'next/server'
import { subcontractorRepository, CreateSubcontractorData, SubcontractorSearchFilters } from '@/repositories/subcontractorRepository'
import { DatabaseError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters: SubcontractorSearchFilters = {}
    
    // Sanitize search parameters to prevent injection
    if (searchParams.get('name')) {
      const name = searchParams.get('name')!.trim().substring(0, 255)
      filters.name = name.replace(/[<>\"'&;]/g, '')
    }
    
    if (searchParams.get('contactPerson')) {
      const contactPerson = searchParams.get('contactPerson')!.trim().substring(0, 255)
      filters.contactPerson = contactPerson.replace(/[<>\"'&;]/g, '')
    }
    
    if (searchParams.get('email')) {
      const email = searchParams.get('email')!.trim().substring(0, 255)
      filters.email = email.replace(/[<>\"'&;]/g, '')
    }

    const subcontractors = await subcontractorRepository.findAll(filters)
    
    return NextResponse.json({
      success: true,
      data: subcontractors,
      count: subcontractors.length
    })
  } catch (error) {
    console.error('Error fetching subcontractors:', error)
    
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

    // Sanitize input data to prevent injection
    const sanitize = (input: string) => input.replace(/[<>\"'&;]/g, '').substring(0, 255)
    
    const createData: CreateSubcontractorData = {
      name: sanitize(body.name.trim()),
      contactPerson: body.contactPerson ? sanitize(body.contactPerson.trim()) : undefined,
      phone: body.phone ? sanitize(body.phone.trim()) : undefined,
      email: body.email ? sanitize(body.email.trim()) : undefined,
      address: body.address ? sanitize(body.address.trim()) : undefined
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

    const subcontractor = await subcontractorRepository.create(createData)
    
    return NextResponse.json({
      success: true,
      data: subcontractor
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating subcontractor:', error)
    
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