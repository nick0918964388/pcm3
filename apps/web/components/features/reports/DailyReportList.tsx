'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Eye, Edit, Trash2, FileText, Calendar, User, Cloud, Send } from 'lucide-react'
import { useSession } from 'next-auth/react'

export interface DailyReport {
  id: number
  projectId: number
  reportedBy: number
  reportDate: Date
  content?: string
  weather?: string
  progressNotes?: string
  issues?: string
  status: 'draft' | 'submitted' | 'reviewed' | 'rejected'
  reviewedBy?: number
  reviewedAt?: Date
  createdAt: Date
}

interface DailyReportListProps {
  projectId: number
  onCreateReport: () => void
  onEditReport: (report: DailyReport) => void
  onViewReport: (report: DailyReport) => void
}

const STATUS_LABELS = {
  draft: '草稿',
  submitted: '已提交',
  reviewed: '已審核',
  rejected: '已退回'
}

const STATUS_COLORS = {
  draft: 'secondary',
  submitted: 'warning',
  reviewed: 'success',
  rejected: 'destructive'
} as const

const WEATHER_LABELS = {
  sunny: '晴天',
  cloudy: '陰天',
  rainy: '雨天',
  stormy: '暴雨',
  windy: '強風'
} as const

export function DailyReportList({ projectId, onCreateReport, onEditReport, onViewReport }: DailyReportListProps) {
  const { data: session } = useSession()
  const [reports, setReports] = useState<DailyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const loadReports = async (reset = false) => {
    try {
      setLoading(true)
      const currentPage = reset ? 0 : page
      const offset = currentPage * 10

      let url = `/api/reports/daily?projectId=${projectId}&offset=${offset}&limit=10`
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`
      }

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const result = await response.json()
      const data = result.success ? result.data : result
      
      if (reset) {
        setReports(data)
        setPage(0)
      } else {
        setReports(prev => [...prev, ...data])
      }
      
      setHasMore(data.length === 10)
      if (!reset) {
        setPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error loading reports:', error)
      alert('載入報告失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports(true)
  }, [projectId, statusFilter])

  const filteredReports = reports.filter(report =>
    searchTerm === '' || 
    report.progressNotes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.issues?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (reportId: number) => {
    if (!confirm('確定要刪除此報告嗎？')) {
      return
    }

    try {
      const response = await fetch(`/api/reports/daily/${reportId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete report')
      }

      setReports(prev => prev.filter(r => r.id !== reportId))
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('刪除失敗，請稍後再試')
    }
  }

  const handleSubmit = async (reportId: number) => {
    if (!confirm('確定要提交此報告嗎？提交後將無法編輯。')) {
      return
    }

    try {
      const response = await fetch(`/api/reports/daily/${reportId}/submit`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to submit report')
      }

      // Reload reports to reflect status change
      loadReports(true)
      alert('報告已提交，等待審核')
    } catch (error) {
      console.error('Error submitting report:', error)
      alert('提交失敗，請稍後再試')
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const getWeatherIcon = (weather?: string) => {
    return <Cloud className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">每日報告</h1>
        <Button onClick={onCreateReport}>
          <Plus className="mr-2 h-4 w-4" />
          新增報告
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="搜尋報告內容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="狀態篩選" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部狀態</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="submitted">已提交</SelectItem>
            <SelectItem value="reviewed">已審核</SelectItem>
            <SelectItem value="rejected">已退回</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {loading && reports.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">載入中...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">尚未有任何報告</p>
            <Button onClick={onCreateReport}>建立第一份報告</Button>
          </div>
        ) : (
          filteredReports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {formatDate(report.reportDate)}
                      </div>
                      {report.weather && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          {getWeatherIcon(report.weather)}
                          {WEATHER_LABELS[report.weather as keyof typeof WEATHER_LABELS] || report.weather}
                        </div>
                      )}
                      <Badge variant={STATUS_COLORS[report.status]}>
                        {STATUS_LABELS[report.status]}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-medium mb-1">進度記錄</h3>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {report.progressNotes}
                      </p>
                    </div>

                    {report.issues && (
                      <div>
                        <h4 className="font-medium mb-1 text-red-600">問題與異常</h4>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {report.issues}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      建立時間: {formatDate(report.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewReport(report)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {(report.status === 'draft' || report.status === 'rejected') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditReport(report)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {report.status === 'draft' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSubmit(report.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {hasMore && !loading && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => loadReports(false)}
            disabled={loading}
          >
            載入更多
          </Button>
        </div>
      )}
    </div>
  )
}