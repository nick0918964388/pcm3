import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth/[...nextauth]/auth'
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

    // Check if user has permission to read WBS change logs
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'wbs.read'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam) : undefined

    const changes = await wbsChangeLogRepository.findByProjectId(projectId, limit)

    return NextResponse.json(changes)
  } catch (error) {
    console.error('Error fetching WBS project changes:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}