'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Upload, X, FileText, Image, Video } from 'lucide-react'
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

interface DailyReportFormProps {
  projectId: number
  report?: DailyReport | null
  onSuccess: () => void
  onCancel: () => void
}

const WEATHER_OPTIONS = [
  { value: 'sunny', label: '晴天' },
  { value: 'cloudy', label: '陰天' },
  { value: 'rainy', label: '雨天' },
  { value: 'stormy', label: '暴雨' },
  { value: 'windy', label: '強風' }
]

export function DailyReportForm({ projectId, report, onSuccess, onCancel }: DailyReportFormProps) {
  const { data: session } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    reportDate: report?.reportDate ? new Date(report.reportDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    weather: report?.weather || '',
    progressNotes: report?.progressNotes || '',
    issues: report?.issues || '',
    content: report?.content || ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.reportDate) {
      newErrors.reportDate = '報告日期為必填項目'
    }

    if (!formData.progressNotes.trim()) {
      newErrors.progressNotes = '進度記錄為必填項目'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // First save the report
      const reportUrl = report ? `/api/reports/daily/${report.id}` : '/api/reports/daily'
      const reportMethod = report ? 'PUT' : 'POST'

      const reportResponse = await fetch(reportUrl, {
        method: reportMethod,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: projectId,
          reportDate: formData.reportDate,
          content: formData.content.trim() || null,
          weather: formData.weather || null,
          progressNotes: formData.progressNotes.trim(),
          issues: formData.issues.trim() || null,
        }),
      })

      if (!reportResponse.ok) {
        throw new Error('Failed to save report')
      }

      const result = await reportResponse.json()
      const savedReport = result.success ? result.data : result

      // Then upload files if any
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const formData = new FormData()
          formData.append('file', file)

          const uploadResponse = await fetch(`/api/reports/daily/${savedReport.id}/attachments`, {
            method: 'POST',
            body: formData,
          })

          if (!uploadResponse.ok) {
            console.error(`Failed to upload file: ${file.name}`)
          }
        }
      }

      onSuccess()
    } catch (error) {
      console.error('Error saving report:', error)
      alert('儲存失敗，請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).filter(file => {
      // File type validation
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'video/mp4'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        alert(`檔案類型不支援: ${file.name}`)
        return false
      }
      
      // File size validation (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`檔案過大: ${file.name} (最大 10MB)`)
        return false
      }
      
      return true
    })

    setSelectedFiles(prev => [...prev, ...newFiles])
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />
    return <FileText className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">
          {report ? '編輯每日報告' : '新增每日報告'}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>報告內容</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="reportDate">報告日期 *</Label>
                    <Input
                      id="reportDate"
                      type="date"
                      value={formData.reportDate}
                      onChange={(e) => handleInputChange('reportDate', e.target.value)}
                      className={errors.reportDate ? 'border-destructive' : ''}
                    />
                    {errors.reportDate && (
                      <p className="text-sm text-destructive">{errors.reportDate}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weather">天氣狀況</Label>
                    <Select
                      value={formData.weather}
                      onValueChange={(value) => handleInputChange('weather', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="請選擇天氣狀況" />
                      </SelectTrigger>
                      <SelectContent>
                        {WEATHER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="progressNotes">進度記錄 *</Label>
                  <Textarea
                    id="progressNotes"
                    value={formData.progressNotes}
                    onChange={(e) => handleInputChange('progressNotes', e.target.value)}
                    placeholder="請描述今日工程進度..."
                    className={`min-h-[120px] ${errors.progressNotes ? 'border-destructive' : ''}`}
                  />
                  {errors.progressNotes && (
                    <p className="text-sm text-destructive">{errors.progressNotes}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issues">問題與異常</Label>
                  <Textarea
                    id="issues"
                    value={formData.issues}
                    onChange={(e) => handleInputChange('issues', e.target.value)}
                    placeholder="如有問題或異常情況請詳細描述..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">備註說明</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="其他需要說明的事項..."
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? '儲存中...' : '儲存'}
                  </Button>
                  <Button type="button" variant="outline" onClick={onCancel}>
                    取消
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>附件上傳</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    拖拉檔案到此處或點擊上傳
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    選擇檔案
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4"
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    支援: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, MP4
                    <br />
                    最大檔案大小: 10MB
                  </p>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <Label>待上傳檔案</Label>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-2 border rounded-lg"
                        >
                          {getFileIcon(file)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}