import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth/[...nextauth]/auth'
import { roleRepository } from '@/repositories/roleRepository'
import { permissionRepository } from '@/repositories/permissionRepository'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to read user roles
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'users.read'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const userRoles = await roleRepository.getUserRoles(userId)
    return NextResponse.json(userRoles)
  } catch (error) {
    console.error('Error fetching user roles:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to assign roles
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'roles.assign'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const body = await request.json()
    const { roleId, projectId } = body

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    await roleRepository.assignRoleToUser(userId, roleId, projectId)
    const updatedRoles = await roleRepository.getUserRoles(userId)

    return NextResponse.json(updatedRoles, { status: 201 })
  } catch (error) {
    console.error('Error assigning role to user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to assign roles (delete is part of assignment management)
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'roles.assign'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const roleId = searchParams.get('roleId')
    const projectId = searchParams.get('projectId')

    if (!roleId) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    await roleRepository.removeRoleFromUser(
      userId, 
      parseInt(roleId), 
      projectId ? parseInt(projectId) : undefined
    )

    const updatedRoles = await roleRepository.getUserRoles(userId)
    return NextResponse.json(updatedRoles)
  } catch (error) {
    console.error('Error removing role from user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}