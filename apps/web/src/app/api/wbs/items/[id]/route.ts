import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth/[...nextauth]/auth'
import { wbsRepository } from '@/repositories/wbsRepository'
import { wbsChangeLogRepository } from '@/repositories/wbsChangeLogRepository'
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

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid WBS item ID' }, { status: 400 })
    }

    // Check if user has permission to read WBS
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'wbs.read'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const wbsItem = await wbsRepository.findById(id)
    
    if (!wbsItem) {
      return NextResponse.json({ error: 'WBS item not found' }, { status: 404 })
    }

    return NextResponse.json(wbsItem)
  } catch (error) {
    console.error('Error fetching WBS item:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(
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

    // Check if user has permission to update WBS items
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
    const { code, name, description, changeReason } = body

    const updateData = {
      code,
      name,
      description,
      changeReason
    }

    const updatedItem = await wbsRepository.update(id, updateData)

    if (!updatedItem) {
      return NextResponse.json({ error: 'Failed to update WBS item' }, { status: 500 })
    }

    // Log the change
    await wbsChangeLogRepository.logWBSChange(
      id,
      parseInt(session.user.id),
      'UPDATE',
      oldItem,
      updatedItem,
      changeReason
    )

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating WBS item:', error)
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

    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid WBS item ID' }, { status: 400 })
    }

    // Check if user has permission to delete WBS items
    const hasPermission = await permissionRepository.checkUserPermission(
      parseInt(session.user.id),
      'wbs.delete'
    )

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get item details for change tracking
    const item = await wbsRepository.findById(id)
    if (!item) {
      return NextResponse.json({ error: 'WBS item not found' }, { status: 404 })
    }

    const body = await request.json()
    const { changeReason } = body

    const deleted = await wbsRepository.delete(id)

    if (!deleted) {
      return NextResponse.json({ error: 'Failed to delete WBS item' }, { status: 500 })
    }

    // Log the change
    await wbsChangeLogRepository.logWBSChange(
      id,
      parseInt(session.user.id),
      'DELETE',
      item,
      undefined,
      changeReason
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting WBS item:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}