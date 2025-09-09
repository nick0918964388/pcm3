'use client'

import { useState } from 'react'
import { WBSItem } from '@shared/types'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronDown, Plus, Edit2, Trash2, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WBSTreeProps {
  items: WBSItem[]
  level?: number
  onEdit: (item: WBSItem) => void
  onDelete: (item: WBSItem) => void
  onAddChild: (parent: WBSItem) => void
  onReorder?: (item: WBSItem, newParentId?: number, newSortOrder?: number) => void
}

interface WBSTreeNodeProps {
  item: WBSItem
  level: number
  onEdit: (item: WBSItem) => void
  onDelete: (item: WBSItem) => void
  onAddChild: (parent: WBSItem) => void
  onReorder?: (item: WBSItem, newParentId?: number, newSortOrder?: number) => void
}

function WBSTreeNode({ item, level, onEdit, onDelete, onAddChild, onReorder }: WBSTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showActions, setShowActions] = useState(false)

  const hasChildren = item.children && item.children.length > 0
  const indent = level * 20

  const toggleExpanded = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div className="wbs-node">
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded border-l-2 border-transparent group",
          level === 0 && "border-l-blue-400",
          level === 1 && "border-l-green-400", 
          level === 2 && "border-l-yellow-400",
          level >= 3 && "border-l-gray-400"
        )}
        style={{ marginLeft: `${indent}px` }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Expand/Collapse Button */}
        <button
          onClick={toggleExpanded}
          className={cn(
            "p-1 hover:bg-gray-200 rounded",
            !hasChildren && "invisible"
          )}
        >
          {hasChildren && (
            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          )}
        </button>

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

      {/* Children */}
      {hasChildren && isExpanded && item.children && (
        <div className="children">
          {item.children.map((child) => (
            <WBSTreeNode
              key={child.id}
              item={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onReorder={onReorder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function WBSTree({ items, level = 0, onEdit, onDelete, onAddChild, onReorder }: WBSTreeProps) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>尚無 WBS 項目</p>
        <p className="text-sm">點擊上方的「新增項目」開始建立專案工作分解結構</p>
      </div>
    )
  }

  return (
    <div className="wbs-tree space-y-1">
      {items.map((item) => (
        <WBSTreeNode
          key={item.id}
          item={item}
          level={level}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onReorder={onReorder}
        />
      ))}
    </div>
  )
}