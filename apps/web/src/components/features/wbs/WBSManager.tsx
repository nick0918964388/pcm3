'use client'

import { useState, useEffect } from 'react'
import { WBSItem, WBSCreateRequest, WBSUpdateRequest } from '@shared/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WBSTree } from './WBSTree'
import { WBSSortableTree } from './WBSSortableTree'
import { WBSItemForm } from './WBSItemForm'
import { WBSChangeHistory } from './WBSChangeHistory'
import { Plus, FileText, History, Download, AlertCircle, ChevronDown } from 'lucide-react'
import { WBSExporter } from '@/lib/wbs-export'

interface WBSManagerProps {
  projectId: number
}

type ViewMode = 'tree' | 'form' | 'history'

interface FormState {
  mode: 'create' | 'edit' | 'create-child'
  parentItem?: WBSItem
  editItem?: WBSItem
}

export function WBSManager({ projectId }: WBSManagerProps) {
  const [wbsItems, setWBSItems] = useState<WBSItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('tree')
  const [formState, setFormState] = useState<FormState | null>(null)
  const [sortableMode, setSortableMode] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Load WBS items for the project
  useEffect(() => {
    loadWBSItems()
  }, [projectId])

  const loadWBSItems = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/wbs/${projectId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load WBS items')
      }
      
      const items = await response.json()
      setWBSItems(items)
    } catch (err) {
      console.error('Error loading WBS items:', err)
      setError(err instanceof Error ? err.message : 'Failed to load WBS items')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoot = () => {
    setFormState({ mode: 'create' })
    setViewMode('form')
  }

  const handleAddChild = (parent: WBSItem) => {
    setFormState({ mode: 'create-child', parentItem: parent })
    setViewMode('form')
  }

  const handleEdit = (item: WBSItem) => {
    setFormState({ mode: 'edit', editItem: item })
    setViewMode('form')
  }

  const handleDelete = async (item: WBSItem) => {
    if (!confirm(`確定要刪除「${item.name}」嗎？\n\n注意：如果此項目有子項目，將無法刪除。`)) {
      return
    }

    const changeReason = prompt('請說明刪除原因：')
    if (changeReason === null) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/wbs/items/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ changeReason })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete WBS item')
      }

      await loadWBSItems()
    } catch (err) {
      console.error('Error deleting WBS item:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete WBS item')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async (data: WBSCreateRequest | WBSUpdateRequest) => {
    if (!formState) return

    try {
      setSaving(true)
      setError(null)

      let response: Response

      if (formState.mode === 'edit' && formState.editItem) {
        // Update existing item
        response = await fetch(`/api/wbs/items/${formState.editItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        })
      } else {
        // Create new item
        response = await fetch(`/api/wbs/${projectId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save WBS item')
      }

      await loadWBSItems()
      handleCancelForm()
    } catch (err) {
      console.error('Error saving WBS item:', err)
      setError(err instanceof Error ? err.message : 'Failed to save WBS item')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelForm = () => {
    setFormState(null)
    setViewMode('tree')
  }

  const handleReorder = async (itemId: number, newParentId: number | undefined, newSortOrder: number) => {
    const changeReason = prompt('請說明重新排序的原因：')
    if (changeReason === null) return

    try {
      setSaving(true)
      setError(null)

      const response = await fetch(`/api/wbs/items/${itemId}/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newParentId,
          newSortOrder,
          changeReason
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reorder WBS item')
      }

      await loadWBSItems()
    } catch (err) {
      console.error('Error reordering WBS item:', err)
      setError(err instanceof Error ? err.message : 'Failed to reorder WBS item')
    } finally {
      setSaving(false)
    }
  }

  const handleViewHistory = () => {
    setViewMode('history')
  }

  const handleBackToTree = () => {
    setViewMode('tree')
  }

  const handleExport = (format: 'excel' | 'pdf' | 'json') => {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      let content: string
      let filename: string
      let contentType: string

      switch (format) {
        case 'json':
          content = WBSExporter.exportToJSON(wbsItems, { 
            format: 'json', 
            includeDescription: true, 
            includeIds: true 
          })
          filename = `WBS-Project-${projectId}-${timestamp}.json`
          contentType = 'application/json'
          break
        
        case 'excel':
          content = WBSExporter.exportToCSV(wbsItems, { 
            format: 'excel', 
            includeDescription: true 
          })
          filename = `WBS-Project-${projectId}-${timestamp}.csv`
          contentType = 'text/csv'
          break
        
        case 'pdf':
          content = WBSExporter.exportToHTML(wbsItems, { 
            format: 'pdf', 
            includeDescription: true 
          })
          filename = `WBS-Project-${projectId}-${timestamp}.html`
          contentType = 'text/html'
          break
        
        default:
          throw new Error('Unsupported export format')
      }

      WBSExporter.downloadFile(content, filename, contentType)
      setShowExportMenu(false)
    } catch (err) {
      console.error('Export error:', err)
      setError('匯出失敗，請稍後再試')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">載入 WBS 結構中...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText size={20} />
            WBS 工作分解結構管理
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {viewMode !== 'tree' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToTree}
              >
                返回列表
              </Button>
            )}
            
            {viewMode === 'tree' && (
              <>
                <Button
                  variant={sortableMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortableMode(!sortableMode)}
                  disabled={saving}
                >
                  {sortableMode ? '完成排序' : '拖拉排序'}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewHistory}
                >
                  <History size={16} className="mr-1" />
                  變更歷史
                </Button>
                
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={saving}
                  >
                    <Download size={16} className="mr-1" />
                    匯出
                    <ChevronDown size={14} className="ml-1" />
                  </Button>
                  
                  {showExportMenu && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[120px]">
                      <button
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        onClick={() => handleExport('excel')}
                      >
                        Excel (CSV)
                      </button>
                      <button
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        onClick={() => handleExport('pdf')}
                      >
                        HTML
                      </button>
                      <button
                        className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                        onClick={() => handleExport('json')}
                      >
                        JSON
                      </button>
                    </div>
                  )}
                </div>
                
                <Button
                  size="sm"
                  onClick={handleCreateRoot}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={saving || sortableMode}
                >
                  <Plus size={16} className="mr-1" />
                  新增項目
                </Button>
              </>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {viewMode === 'tree' && (
            <>
              {sortableMode ? (
                <WBSSortableTree
                  items={wbsItems}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                  onReorder={handleReorder}
                />
              ) : (
                <WBSTree
                  items={wbsItems}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                />
              )}
            </>
          )}
          
          {viewMode === 'form' && formState && (
            <WBSItemForm
              projectId={projectId}
              parentItem={formState.parentItem}
              editItem={formState.editItem}
              onSave={handleSave}
              onCancel={handleCancelForm}
              isLoading={saving}
            />
          )}
          
          {viewMode === 'history' && (
            <WBSChangeHistory
              projectId={projectId}
              onBack={handleBackToTree}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}