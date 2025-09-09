import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../auth/[...nextauth]/auth'
import { permissionRepository } from '@/repositories/permissionRepository'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { permission, projectId } = body

    if (!permission) {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      )
    }

    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      permission,
      projectId ? parseInt(projectId) : undefined
    )

    return NextResponse.json({ 
      hasPermission,
      userId: parseInt(session.user.id),
      permission,
      projectId: projectId ? parseInt(projectId) : null
    })
  } catch (error) {
    console.error('Error checking permission:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const userPermissions = await permissionRepository.getUserPermissions(
      parseInt(session.user.id),
      projectId ? parseInt(projectId) : undefined
    )

    return NextResponse.json({
      userId: parseInt(session.user.id),
      projectId: projectId ? parseInt(projectId) : null,
      permissions: userPermissions
    })
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}