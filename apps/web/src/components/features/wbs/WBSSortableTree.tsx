'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { WBSItem } from '@shared/types'
import { WBSSortableNode } from './WBSSortableNode'

interface WBSSortableTreeProps {
  items: WBSItem[]
  onEdit: (item: WBSItem) => void
  onDelete: (item: WBSItem) => void
  onAddChild: (parent: WBSItem) => void
  onReorder: (itemId: number, newParentId: number | undefined, newSortOrder: number) => void
}

export function WBSSortableTree({ 
  items, 
  onEdit, 
  onDelete, 
  onAddChild, 
  onReorder 
}: WBSSortableTreeProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<WBSItem | null>(null)
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Flatten the hierarchical structure for drag and drop
  const flattenItems = (items: WBSItem[], parentId: number | null = null, depth = 0): Array<WBSItem & { depth: number }> => {
    const flattened: Array<WBSItem & { depth: number }> = []
    
    items.forEach((item) => {
      flattened.push({ ...item, depth })
      if (item.children && item.children.length > 0) {
        flattened.push(...flattenItems(item.children, item.id, depth + 1))
      }
    })
    
    return flattened
  }

  const flatItems = flattenItems(items)
  const itemIds = flatItems.map((item) => item.id.toString())

  const findItem = (id: string): WBSItem | undefined => {
    return flatItems.find((item) => item.id.toString() === id)
  }

  const getParentId = (id: string): number | null => {
    const item = findItem(id)
    return item?.parentId || null
  }

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as string)
    const item = findItem(active.id as string)
    setActiveItem(item || null)
  }

  const handleDragOver = ({ active, over }: DragOverEvent) => {
    if (!over) return
    
    const activeId = active.id as string
    const overId = over.id as string
    
    if (activeId === overId) return
    
    // Find the active and over items
    const activeItem = findItem(activeId)
    const overItem = findItem(overId)
    
    if (!activeItem || !overItem) return
    
    // Prevent dropping parent onto its own child
    const isChildOfActive = (itemId: number): boolean => {
      const item = flatItems.find(i => i.id === itemId)
      if (!item) return false
      if (item.parentId === activeItem.id) return true
      if (item.parentId) return isChildOfActive(item.parentId)
      return false
    }
    
    if (isChildOfActive(overItem.id)) {
      return
    }
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null)
    setActiveItem(null)
    
    if (!over || active.id === over.id) return
    
    const activeId = active.id as string
    const overId = over.id as string
    
    const activeItem = findItem(activeId)
    const overItem = findItem(overId)
    
    if (!activeItem || !overItem) return
    
    // Calculate new parent and sort order
    let newParentId = overItem.parentId
    let newSortOrder = overItem.sortOrder
    
    // If dropping on an item at the same level, insert after it
    if (activeItem.parentId === overItem.parentId) {
      const siblings = flatItems.filter(item => item.parentId === overItem.parentId)
      const overIndex = siblings.findIndex(item => item.id === overItem.id)
      newSortOrder = overIndex + 1
    } else {
      // If dropping on a different level, make it the last child of the new parent
      const siblings = flatItems.filter(item => item.parentId === newParentId)
      newSortOrder = siblings.length
    }
    
    // Call the reorder handler
    onReorder(activeItem.id, newParentId || undefined, newSortOrder)
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>尚無 WBS 項目</p>
        <p className="text-sm">點擊上方的「新增項目」開始建立專案工作分解結構</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div className="wbs-sortable-tree space-y-1">
          {flatItems.map((item) => (
            <WBSSortableNode
              key={item.id}
              item={item}
              depth={item.depth}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      </SortableContext>
      
      <DragOverlay>
        {activeItem ? (
          <div className="bg-white border rounded-lg shadow-lg p-3 opacity-95">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-600">
                {activeItem.code}
              </span>
              <span className="text-sm font-medium">
                {activeItem.name}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}