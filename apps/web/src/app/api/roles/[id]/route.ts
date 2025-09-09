import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../auth/[...nextauth]/auth'
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

    // Check if user has permission to read roles
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'roles.read'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const roleId = parseInt(params.id)
    if (isNaN(roleId)) {
      return NextResponse.json({ error: 'Invalid role ID' }, { status: 400 })
    }

    const role = await roleRepository.getRoleWithPermissions(roleId)
    
    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json(role)
  } catch (error) {
    console.error('Error fetching role:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}