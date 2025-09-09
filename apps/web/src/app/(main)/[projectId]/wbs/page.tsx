import { Metadata } from 'next'
import { WBSManager } from '@/components/features/wbs/WBSManager'

interface WBSPageProps {
  params: {
    projectId: string
  }
}

export const metadata: Metadata = {
  title: 'WBS 管理 - PCM 平台',
  description: 'WBS 工作分解結構管理系統',
}

export default function WBSPage({ params }: WBSPageProps) {
  const projectId = parseInt(params.projectId)

  if (isNaN(projectId)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">無效的專案 ID</h1>
          <p className="text-gray-600">請檢查網址是否正確</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <WBSManager projectId={projectId} />
    </div>
  )
}