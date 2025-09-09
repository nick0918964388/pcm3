'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WBSItem, WBSCreateRequest, WBSUpdateRequest } from '@shared/types'
import { X } from 'lucide-react'

interface WBSItemFormProps {
  parentItem?: WBSItem
  editItem?: WBSItem
  projectId: number
  onSave: (data: WBSCreateRequest | WBSUpdateRequest) => void
  onCancel: () => void
  isLoading?: boolean
}

export function WBSItemForm({ 
  parentItem, 
  editItem, 
  projectId, 
  onSave, 
  onCancel, 
  isLoading = false 
}: WBSItemFormProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    changeReason: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!editItem

  useEffect(() => {
    if (editItem) {
      setFormData({
        code: editItem.code,
        name: editItem.name,
        description: editItem.description || '',
        changeReason: ''
      })
    } else {
      // Generate suggested code for new items
      let suggestedCode = '1.0'
      if (parentItem) {
        suggestedCode = `${parentItem.code}.1`
      }
      
      setFormData({
        code: suggestedCode,
        name: '',
        description: '',
        changeReason: ''
      })
    }
  }, [editItem, parentItem])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.code.trim()) {
      newErrors.code = '請輸入 WBS 代碼'
    } else if (!/^[\w.-]+$/.test(formData.code.trim())) {
      newErrors.code = 'WBS 代碼只能包含字母、數字、點號和連字號'
    }

    if (!formData.name.trim()) {
      newErrors.name = '請輸入項目名稱'
    }

    if (isEditing && !formData.changeReason.trim()) {
      newErrors.changeReason = '編輯項目時請說明變更原因'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const data = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      changeReason: formData.changeReason.trim() || undefined
    }

    if (isEditing) {
      onSave(data as WBSUpdateRequest)
    } else {
      const createData: WBSCreateRequest = {
        ...data,
        projectId,
        parentId: parentItem?.id
      }
      onSave(createData)
    }
  }

  const title = isEditing 
    ? `編輯 WBS 項目: ${editItem?.code}` 
    : parentItem 
      ? `新增子項目 (上級: ${parentItem.code})` 
      : '新增根項目'

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-medium">
          {title}
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={onCancel}
        >
          <X size={16} />
        </Button>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* WBS Code */}
          <div className="space-y-2">
            <Label htmlFor="code">
              WBS 代碼 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              name="code"
              type="text"
              value={formData.code}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="例：1.1 或 A.1.2"
              className={errors.code ? "border-red-500" : ""}
            />
            {errors.code && (
              <p className="text-sm text-red-600">{errors.code}</p>
            )}
          </div>

          {/* WBS Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              項目名稱 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="例：系統分析與設計"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">項目描述</Label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              disabled={isLoading}
              placeholder="詳細說明此 WBS 項目的內容、範圍或要求..."
              className="min-h-20 w-full px-3 py-2 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Change Reason (for edits) */}
          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="changeReason">
                變更原因 <span className="text-red-500">*</span>
              </Label>
              <textarea
                id="changeReason"
                name="changeReason"
                value={formData.changeReason}
                onChange={handleInputChange}
                disabled={isLoading}
                placeholder="請說明為什麼要修改此項目..."
                className={`min-h-16 w-full px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.changeReason ? "border-red-500" : "border-gray-300"
                }`}
                rows={2}
              />
              {errors.changeReason && (
                <p className="text-sm text-red-600">{errors.changeReason}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? '處理中...' : (isEditing ? '更新項目' : '建立項目')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}