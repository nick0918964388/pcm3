'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Check, X, MessageSquare, Calendar, Cloud, User } from 'lucide-react'
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

interface DailyReportReviewProps {
  report: DailyReport
  onBack: () => void
  onReviewComplete: () => void
}

const WEATHER_LABELS = {
  sunny: '晴天',
  cloudy: '陰天',
  rainy: '雨天',
  stormy: '暴雨',
  windy: '強風'
} as const

export function DailyReportReview({ report, onBack, onReviewComplete }: DailyReportReviewProps) {
  const { data: session } = useSession()
  const [reviewComment, setReviewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleReview = async (action: 'approve' | 'reject') => {
    if (action === 'reject' && !reviewComment.trim()) {
      alert('退回報告時必須填寫意見')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/reports/daily/${report.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'reviewed' : 'rejected',
          reviewedBy: parseInt(session?.user?.id || '0'),
          reviewComment: reviewComment.trim() || null
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update report')
      }

      alert(action === 'approve' ? '報告已通過審核' : '報告已退回')
      onReviewComplete()
    } catch (error) {
      console.error('Error reviewing report:', error)
      alert('審核失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
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

  // Only allow review if status is submitted and user has review permission
  const canReview = report.status === 'submitted' && session?.user?.id

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">審核報告</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>報告內容</CardTitle>
                <Badge variant="warning">
                  等待審核
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
              <CardTitle>報告資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">提交者:</span>
                <span>用戶 #{report.reportedBy}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">建立時間:</span>
                <span>{formatDateTime(report.createdAt)}</span>
              </div>
            </CardContent>
          </Card>

          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle>審核意見</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reviewComment">審核意見 (退回時必填)</Label>
                  <Textarea
                    id="reviewComment"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="請輸入審核意見..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleReview('approve')}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    通過
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReview('reject')}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    <X className="mr-2 h-4 w-4" />
                    退回
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!canReview && (
            <Card>
              <CardHeader>
                <CardTitle>審核狀態</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {report.status === 'draft' && '此報告仍為草稿狀態'}
                  {report.status === 'reviewed' && '此報告已通過審核'}
                  {report.status === 'rejected' && '此報告已被退回'}
                  {report.status === 'submitted' && '您沒有審核此報告的權限'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}