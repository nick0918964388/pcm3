import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../auth/[...nextauth]/auth'
import { wbsRepository } from '@/repositories/wbsRepository'
import { wbsChangeLogRepository } from '@/repositories/wbsChangeLogRepository'
import { permissionRepository } from '@/repositories/permissionRepository'

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = parseInt(params.projectId)
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    // Check if user has permission to read WBS
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'wbs.read'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const wbsItems = await wbsRepository.findByProjectId(projectId)
    const hierarchicalWBS = wbsRepository.buildHierarchy(wbsItems)

    return NextResponse.json(hierarchicalWBS)
  } catch (error) {
    console.error('Error fetching WBS items:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const projectId = parseInt(params.projectId)
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 })
    }

    // Check if user has permission to create WBS items
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'wbs.create'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { parentId, code, name, description, changeReason } = body

    if (!code || !name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      )
    }

    const wbsData = {
      projectId,
      parentId: parentId || undefined,
      code,
      name,
      description,
      changeReason
    }

    const newWBSItem = await wbsRepository.create(wbsData)

    // Log the change
    await wbsChangeLogRepository.logWBSChange(
      newWBSItem.id,
      parseInt(session.user.id),
      'CREATE',
      undefined,
      newWBSItem,
      changeReason
    )

    return NextResponse.json(newWBSItem, { status: 201 })
  } catch (error) {
    console.error('Error creating WBS item:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}