'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { DailyReportList } from '@/components/features/reports/DailyReportList'
import { DailyReportForm } from '@/components/features/reports/DailyReportForm'
import { DailyReportDetail } from '@/components/features/reports/DailyReportDetail'

interface DailyReport {
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

type ViewMode = 'list' | 'form' | 'detail'

export default function ReportsPage() {
  const params = useParams()
  const projectId = parseInt(params.projectId as string)
  
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null)
  const [reportIdForDetail, setReportIdForDetail] = useState<number | null>(null)

  const handleCreateReport = () => {
    setSelectedReport(null)
    setViewMode('form')
  }

  const handleEditReport = (report: DailyReport) => {
    setSelectedReport(report)
    setViewMode('form')
  }

  const handleViewReport = (report: DailyReport) => {
    setReportIdForDetail(report.id)
    setViewMode('detail')
  }

  const handleFormSuccess = () => {
    setViewMode('list')
    setSelectedReport(null)
  }

  const handleFormCancel = () => {
    setViewMode('list')
    setSelectedReport(null)
  }

  const handleDetailBack = () => {
    setViewMode('list')
    setReportIdForDetail(null)
  }

  const handleDetailEdit = () => {
    if (reportIdForDetail && selectedReport) {
      setViewMode('form')
    }
  }

  if (viewMode === 'form') {
    return (
      <DailyReportForm
        projectId={projectId}
        report={selectedReport}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    )
  }

  if (viewMode === 'detail' && reportIdForDetail) {
    return (
      <DailyReportDetail
        reportId={reportIdForDetail}
        onBack={handleDetailBack}
        onEdit={handleDetailEdit}
      />
    )
  }

  return (
    <DailyReportList
      projectId={projectId}
      onCreateReport={handleCreateReport}
      onEditReport={handleEditReport}
      onViewReport={handleViewReport}
    />
  )
}