import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../auth/[...nextauth]/auth'
import { permissionRepository } from '@/repositories/permissionRepository'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to read permissions
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'roles.read'  // Using roles.read as it covers permission management too
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const resource = searchParams.get('resource')

    let permissions
    if (resource) {
      permissions = await permissionRepository.getPermissionsByResource(resource)
    } else {
      permissions = await permissionRepository.getAllPermissions()
    }

    return NextResponse.json(permissions)
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has system admin permission to create permissions
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'system.admin'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, resource, action } = body

    if (!name || !description || !resource || !action) {
      return NextResponse.json(
        { error: 'Name, description, resource, and action are required' },
        { status: 400 }
      )
    }

    const permissionId = await permissionRepository.createPermission({
      name,
      description,
      resource,
      action
    })

    // Fetch the created permission to return it
    const permissions = await permissionRepository.getAllPermissions()
    const createdPermission = permissions.find(p => p.id === permissionId)

    return NextResponse.json(createdPermission, { status: 201 })
  } catch (error) {
    console.error('Error creating permission:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}