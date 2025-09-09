'use client'

import { useState, useEffect } from 'react'
import { WBSChangeLog } from '@shared/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, User, FileText, AlertCircle } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface WBSChangeHistoryProps {
  projectId: number
  wbsItemId?: number
  onBack: () => void
}

const changeTypeLabels = {
  'CREATE': '建立',
  'UPDATE': '修改', 
  'DELETE': '刪除',
  'REORDER': '重新排序'
}

const changeTypeColors = {
  'CREATE': 'bg-green-100 text-green-800',
  'UPDATE': 'bg-blue-100 text-blue-800',
  'DELETE': 'bg-red-100 text-red-800',
  'REORDER': 'bg-yellow-100 text-yellow-800'
}

export function WBSChangeHistory({ projectId, wbsItemId, onBack }: WBSChangeHistoryProps) {
  const [changes, setChanges] = useState<WBSChangeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadChanges()
  }, [projectId, wbsItemId])

  const loadChanges = async () => {
    try {
      setLoading(true)
      setError(null)

      let url = `/api/wbs/${projectId}/changes?limit=50`
      if (wbsItemId) {
        url = `/api/wbs/items/${wbsItemId}/changes?limit=20`
      }

      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load change history')
      }
      
      const changeData = await response.json()
      setChanges(changeData)
    } catch (err) {
      console.error('Error loading WBS change history:', err)
      setError(err instanceof Error ? err.message : 'Failed to load change history')
    } finally {
      setLoading(false)
    }
  }

  const formatChangeValue = (value: string | undefined): React.ReactNode => {
    if (!value) return <span className="text-gray-400 italic">無</span>
    
    try {
      const parsed = JSON.parse(value)
      if (typeof parsed === 'object') {
        return (
          <div className="bg-gray-50 p-2 rounded text-sm font-mono">
            <pre>{JSON.stringify(parsed, null, 2)}</pre>
          </div>
        )
      }
      return <span className="font-mono text-sm">{value}</span>
    } catch {
      return <span className="font-mono text-sm">{value}</span>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">載入變更歷史中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
        >
          <ArrowLeft size={16} className="mr-1" />
          返回
        </Button>
        <h3 className="text-lg font-medium">
          {wbsItemId ? 'WBS 項目變更歷史' : 'WBS 專案變更歷史'}
        </h3>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Changes List */}
      {changes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p>尚無變更記錄</p>
        </div>
      ) : (
        <div className="space-y-4">
          {changes.map((change) => (
            <Card key={change.id} className="border-l-4 border-l-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary"
                      className={changeTypeColors[change.changeType]}
                    >
                      {changeTypeLabels[change.changeType]}
                    </Badge>
                    
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <User size={14} />
                      <span>使用者 ID: {change.changedBy}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar size={14} />
                    <span title={format(new Date(change.changedAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhTW })}>
                      {formatDistanceToNow(new Date(change.changedAt), { 
                        addSuffix: true, 
                        locale: zhTW 
                      })}
                    </span>
                  </div>
                </div>

                {/* Change Reason */}
                {change.changeReason && (
                  <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded">
                    <p className="text-sm">
                      <strong>變更原因：</strong>
                      {change.changeReason}
                    </p>
                  </div>
                )}

                {/* Change Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Old Value */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">變更前</h4>
                    {formatChangeValue(change.oldValue)}
                  </div>

                  {/* New Value */}
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">變更後</h4>
                    {formatChangeValue(change.newValue)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}