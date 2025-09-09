'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Calendar, Users, BarChart3, Settings, Download } from 'lucide-react'
import DutyCalendar from '../../../../components/features/duty-roster/DutyCalendar'
import PersonnelAssignmentModal from '../../../../components/features/duty-roster/PersonnelAssignmentModal'
import ShiftManagement from '../../../../components/features/duty-roster/ShiftManagement'

interface DutyRoster {
  id: number
  projectId: number
  personnelId: number
  dutyDate: Date
  shiftType: string
  notes?: string
  personnelName?: string
  personnelPosition?: string
  subcontractorName?: string
}

interface Personnel {
  id: number
  name: string
  position?: string
  subcontractorName?: string
}

interface AttendanceStats {
  totalHours: number
  totalDays: number
  averageHoursPerDay: number
  workTypeBreakdown: { [key: string]: number }
  personnelStats: {
    personnelId: number
    personnelName: string
    totalHours: number
    totalDays: number
  }[]
}

export default function DutyRosterPage() {
  const params = useParams()
  const projectId = parseInt(params.projectId as string, 10)

  const [dutyRosters, setDutyRosters] = useState<DutyRoster[]>([])
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedRoster, setSelectedRoster] = useState<DutyRoster | undefined>()
  const [saveLoading, setSaveLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'calendar' | 'stats' | 'shifts'>('calendar')

  useEffect(() => {
    if (projectId) {
      loadData()
    }
  }, [projectId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load duty rosters for current month
      const startDate = new Date()
      startDate.setDate(1)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
      
      const [rostersResponse, personnelResponse, statsResponse] = await Promise.all([
        fetch(`/api/duty-rosters?projectId=${projectId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`),
        fetch('/api/personnel'),
        fetch(`/api/attendance/reports?projectId=${projectId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
      ])

      if (rostersResponse.ok) {
        const rostersData = await rostersResponse.json()
        setDutyRosters(rostersData.data.map((roster: any) => ({
          ...roster,
          dutyDate: new Date(roster.dutyDate)
        })))
      }

      if (personnelResponse.ok) {
        const personnelData = await personnelResponse.json()
        setPersonnel(personnelData.data)
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setAttendanceStats(statsData.data.stats)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
  }

  const handleCreateRoster = (date: Date) => {
    setSelectedDate(date)
    setSelectedRoster(undefined)
    setModalOpen(true)
  }

  const handleRosterClick = (roster: DutyRoster) => {
    setSelectedDate(new Date(roster.dutyDate))
    setSelectedRoster(roster)
    setModalOpen(true)
  }

  const handleSaveRoster = async (roster: DutyRoster) => {
    try {
      setSaveLoading(true)
      
      const url = roster.id ? `/api/duty-rosters/${roster.id}` : '/api/duty-rosters'
      const method = roster.id ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: roster.projectId,
          personnelId: roster.personnelId,
          dutyDate: roster.dutyDate.toISOString(),
          shiftType: roster.shiftType,
          notes: roster.notes
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        if (roster.id) {
          // Update existing roster
          setDutyRosters(prev => prev.map(r => 
            r.id === roster.id ? { ...result.data, dutyDate: new Date(result.data.dutyDate) } : r
          ))
        } else {
          // Add new roster
          setDutyRosters(prev => [...prev, { ...result.data, dutyDate: new Date(result.data.dutyDate) }])
        }
        
        setModalOpen(false)
        setSelectedRoster(undefined)
      } else {
        const error = await response.json()
        alert(`儲存失敗: ${error.error}`)
      }
    } catch (error) {
      console.error('Error saving roster:', error)
      alert('儲存時發生錯誤，請稍後再試')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDeleteRoster = async (rosterId: number) => {
    if (!confirm('確定要刪除這個值班安排嗎？')) return

    try {
      const response = await fetch(`/api/duty-rosters/${rosterId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDutyRosters(prev => prev.filter(r => r.id !== rosterId))
        setModalOpen(false)
        setSelectedRoster(undefined)
      } else {
        const error = await response.json()
        alert(`刪除失敗: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting roster:', error)
      alert('刪除時發生錯誤，請稍後再試')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">載入中...</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">值班表與出勤系統</h1>
        <p className="text-gray-600">管理人員值班安排並追蹤出勤統計</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'calendar'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>值班表</span>
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>出勤統計</span>
          </button>
          <button
            onClick={() => setActiveTab('shifts')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'shifts'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>班別管理</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'calendar' ? (
        <DutyCalendar
          projectId={projectId}
          dutyRosters={dutyRosters}
          personnel={personnel}
          onDateSelect={handleDateSelect}
          onRosterClick={handleRosterClick}
          onCreateRoster={handleCreateRoster}
        />
      ) : activeTab === 'stats' ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">出勤統計報表</h2>
            <p className="text-gray-600">本月出勤數據統計與分析</p>
          </div>

          {attendanceStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Summary Cards */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{attendanceStats.totalHours}</div>
                <div className="text-sm text-blue-600">總工時</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{attendanceStats.totalDays}</div>
                <div className="text-sm text-green-600">總工作天數</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{attendanceStats.averageHoursPerDay}</div>
                <div className="text-sm text-purple-600">平均時數/天</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{attendanceStats.personnelStats.length}</div>
                <div className="text-sm text-orange-600">參與人員數</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              暂无出勤統計數據
            </div>
          )}

          {/* Personnel Stats Table */}
          {attendanceStats && attendanceStats.personnelStats.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">人員出勤統計</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        人員姓名
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        總工時
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        工作天數
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        平均時數/天
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceStats.personnelStats.map((stat) => (
                      <tr key={stat.personnelId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stat.personnelName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.totalHours} 小時
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.totalDays} 天
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {stat.totalDays > 0 ? (stat.totalHours / stat.totalDays).toFixed(1) : 0} 小時
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <ShiftManagement
          projectId={projectId}
        />
      )}

      {/* Personnel Assignment Modal */}
      <PersonnelAssignmentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedRoster(undefined)
        }}
        onSave={handleSaveRoster}
        projectId={projectId}
        selectedDate={selectedDate}
        personnel={personnel}
        existingRoster={selectedRoster}
        loading={saveLoading}
      />
    </div>
  )
}