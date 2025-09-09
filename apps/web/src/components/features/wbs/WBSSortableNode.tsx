'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { WBSItem } from '@shared/types'
import { Button } from '@/components/ui/button'
import { GripVertical, Plus, Edit2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WBSSortableNodeProps {
  item: WBSItem & { depth: number }
  depth: number
  onEdit: (item: WBSItem) => void
  onDelete: (item: WBSItem) => void
  onAddChild: (parent: WBSItem) => void
}

export function WBSSortableNode({ item, depth, onEdit, onDelete, onAddChild }: WBSSortableNodeProps) {
  const [showActions, setShowActions] = useState(false)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id.toString(),
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const indent = depth * 20

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "wbs-sortable-node group",
        isDragging && "opacity-50"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded border-l-2 border-transparent",
          depth === 0 && "border-l-blue-400",
          depth === 1 && "border-l-green-400", 
          depth === 2 && "border-l-yellow-400",
          depth >= 3 && "border-l-gray-400",
          isDragging && "bg-gray-100"
        )}
        style={{ marginLeft: `${indent}px` }}
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-200 rounded"
          title="拖拽排序"
        >
          <GripVertical size={14} className="text-gray-400" />
        </div>

        {/* WBS Code */}
        <div className="min-w-[80px] text-sm font-mono text-gray-600">
          {item.code}
        </div>

        {/* WBS Name */}
        <div className="flex-1 text-sm font-medium">
          {item.name}
        </div>

        {/* Level Indicator */}
        <div className="text-xs text-gray-400">
          Level {item.levelNumber}
        </div>

        {/* Action Buttons */}
        <div className={cn(
          "flex items-center gap-1 transition-opacity",
          showActions ? "opacity-100" : "opacity-0"
        )}>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onAddChild(item)}
            title="新增子項目"
          >
            <Plus size={12} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onEdit(item)}
            title="編輯"
          >
            <Edit2 size={12} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
            onClick={() => onDelete(item)}
            title="刪除"
          >
            <Trash2 size={12} />
          </Button>
        </div>

        {/* Description tooltip */}
        {item.description && (
          <div className="text-xs text-gray-400" title={item.description}>
            ℹ
          </div>
        )}
      </div>
    </div>
  )
}