import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth/[...nextauth]/auth'
import { wbsRepository } from '@/repositories/wbsRepository'
import { wbsChangeLogRepository } from '@/repositories/wbsChangeLogRepository'
import { permissionRepository } from '@/repositories/permissionRepository'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid WBS item ID' }, { status: 400 })
    }

    // Check if user has permission to reorder WBS items
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'wbs.update'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get current item for change tracking
    const oldItem = await wbsRepository.findById(id)
    if (!oldItem) {
      return NextResponse.json({ error: 'WBS item not found' }, { status: 404 })
    }

    const body = await request.json()
    const { newParentId, newSortOrder, changeReason } = body

    if (typeof newSortOrder !== 'number') {
      return NextResponse.json(
        { error: 'newSortOrder is required and must be a number' },
        { status: 400 }
      )
    }

    const reorderData = {
      newParentId,
      newSortOrder,
      changeReason
    }

    const reorderedItem = await wbsRepository.reorder(id, reorderData)

    if (!reorderedItem) {
      return NextResponse.json({ error: 'Failed to reorder WBS item' }, { status: 500 })
    }

    // Log the change
    await wbsChangeLogRepository.logWBSChange(
      id,
      parseInt(session.user.id),
      'REORDER',
      {
        parentId: oldItem.parentId,
        sortOrder: oldItem.sortOrder,
        levelNumber: oldItem.levelNumber
      },
      {
        parentId: reorderedItem.parentId,
        sortOrder: reorderedItem.sortOrder,
        levelNumber: reorderedItem.levelNumber
      },
      changeReason
    )

    return NextResponse.json(reorderedItem)
  } catch (error) {
    console.error('Error reordering WBS item:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}