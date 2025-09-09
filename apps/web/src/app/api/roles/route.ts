import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../auth/[...nextauth]/auth'
import { roleRepository } from '@/repositories/roleRepository'
import { permissionRepository } from '@/repositories/permissionRepository'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to read roles
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'roles.read'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const roles = await roleRepository.getAllRoles()
    return NextResponse.json(roles)
  } catch (error) {
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to create roles
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'roles.write'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || !description) {
      return NextResponse.json(
        { error: 'Name and description are required' },
        { status: 400 }
      )
    }

    const roleId = await roleRepository.createRole({ name, description })
    const role = await roleRepository.getRoleWithPermissions(roleId)

    return NextResponse.json(role, { status: 201 })
  } catch (error) {
    console.error('Error creating role:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}