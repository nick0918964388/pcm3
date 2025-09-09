'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Edit, Download, FileText, Image, Video, Calendar, Cloud, User, MessageSquare } from 'lucide-react'
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

export interface ReportAttachment {
  id: number
  dailyReportId: number
  filename: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedAt: Date
}

interface DailyReportDetailProps {
  reportId: number
  onBack: () => void
  onEdit: () => void
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

export function DailyReportDetail({ reportId, onBack, onEdit }: DailyReportDetailProps) {
  const { data: session } = useSession()
  const [report, setReport] = useState<DailyReport | null>(null)
  const [attachments, setAttachments] = useState<ReportAttachment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReport()
    loadAttachments()
  }, [reportId])

  const loadReport = async () => {
    try {
      const response = await fetch(`/api/reports/daily/${reportId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch report')
      }
      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Error loading report:', error)
      alert('載入報告失敗，請稍後再試')
    }
  }

  const loadAttachments = async () => {
    try {
      const response = await fetch(`/api/reports/daily/${reportId}/attachments`)
      if (!response.ok) {
        throw new Error('Failed to fetch attachments')
      }
      const data = await response.json()
      setAttachments(data)
    } catch (error) {
      console.error('Error loading attachments:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadAttachment = async (attachmentId: number, filename: string) => {
    try {
      const response = await fetch(`/api/reports/daily/${reportId}/attachments/${attachmentId}`)
      if (!response.ok) {
        throw new Error('Failed to download attachment')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading attachment:', error)
      alert('下載失敗，請稍後再試')
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (mimeType.startsWith('video/')) return <Video className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-gray-500">載入中...</p>
      </div>
    )
  }

  const canEdit = (report.status === 'draft' || report.status === 'rejected') && 
                  session?.user?.id === report.reportedBy.toString()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-2xl font-bold">每日報告詳情</h1>
        </div>
        {canEdit && (
          <Button onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            編輯
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>報告資訊</CardTitle>
                <Badge variant={STATUS_COLORS[report.status]}>
                  {STATUS_LABELS[report.status]}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">報告日期:</span>
                  <span className="font-medium">{formatDate(report.reportDate)}</span>
                </div>
                {report.weather && (
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">天氣狀況:</span>
                    <span className="font-medium">
                      {WEATHER_LABELS[report.weather as keyof typeof WEATHER_LABELS] || report.weather}
                    </span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">進度記錄</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {report.progressNotes}
                </p>
              </div>

              {report.issues && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2 text-red-600">問題與異常</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {report.issues}
                    </p>
                  </div>
                </>
              )}

              {report.content && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-medium mb-2">備註說明</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {report.content}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>建立資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">建立者:</span>
                <span>用戶 #{report.reportedBy}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">建立時間:</span>
                <span>{formatDateTime(report.createdAt)}</span>
              </div>
              {report.reviewedBy && report.reviewedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">審核時間:</span>
                  <span>{formatDateTime(report.reviewedAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>附件 ({attachments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {getFileIcon(attachment.mimeType)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {attachment.filename}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(attachment.fileSize)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadAttachment(attachment.id, attachment.filename)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}