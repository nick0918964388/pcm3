'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Users } from 'lucide-react'

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

interface DutyCalendarProps {
  projectId: number
  dutyRosters: DutyRoster[]
  personnel: Personnel[]
  onDateSelect: (date: Date) => void
  onRosterClick: (roster: DutyRoster) => void
  onCreateRoster: (date: Date) => void
}

export default function DutyCalendar({
  projectId,
  dutyRosters,
  personnel,
  onDateSelect,
  onRosterClick,
  onCreateRoster
}: DutyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')

  const months = [
    '一月', '二月', '三月', '四月', '五月', '六月',
    '七月', '八月', '九月', '十月', '十一月', '十二月'
  ]

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  const getMonthDates = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayWeekday = firstDayOfMonth.getDay()
    
    const dates: Date[] = []
    
    // Add previous month dates to fill the first week
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      dates.push(new Date(year, month, -i))
    }
    
    // Add current month dates
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      dates.push(new Date(year, month, day))
    }
    
    // Add next month dates to fill the last week
    const remainingDays = 42 - dates.length // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      dates.push(new Date(year, month + 1, day))
    }
    
    return dates
  }

  const getDutyRostersForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    return dutyRosters.filter(roster => {
      const rosterDateString = new Date(roster.dutyDate).toISOString().split('T')[0]
      return rosterDateString === dateString
    })
  }

  const getShiftColor = (shiftType: string) => {
    switch (shiftType) {
      case 'day':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'night':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const monthDates = getMonthDates()

  return (
    <div className="w-full bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {currentDate.getFullYear()}年 {months[currentDate.getMonth()]}
            </h2>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              今天
            </button>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'month' | 'week')}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md"
            >
              <option value="month">月視圖</option>
              <option value="week">週視圖</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {monthDates.map((date, index) => {
            const dayRosters = getDutyRostersForDate(date)
            const isCurrentMonthDate = isCurrentMonth(date)
            const isTodayDate = isToday(date)

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                  !isCurrentMonthDate ? 'bg-gray-50 text-gray-400' : ''
                } ${isTodayDate ? 'bg-blue-50 border-blue-300' : ''}`}
                onClick={() => {
                  onDateSelect(date)
                  if (dayRosters.length === 0) {
                    onCreateRoster(date)
                  }
                }}
              >
                {/* Date Number */}
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    isTodayDate ? 'text-blue-600' : isCurrentMonthDate ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {date.getDate()}
                  </span>
                  {dayRosters.length > 0 && (
                    <Users className="w-4 h-4 text-gray-500" />
                  )}
                </div>

                {/* Duty Rosters */}
                <div className="space-y-1">
                  {dayRosters.slice(0, 3).map(roster => (
                    <div
                      key={roster.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onRosterClick(roster)
                      }}
                      className={`text-xs p-1 rounded border cursor-pointer hover:opacity-80 ${getShiftColor(roster.shiftType)}`}
                    >
                      <div className="font-medium truncate">
                        {roster.personnelName}
                      </div>
                      <div className="opacity-75">
                        {roster.shiftType === 'day' ? '日班' : roster.shiftType === 'night' ? '夜班' : '自訂'}
                      </div>
                    </div>
                  ))}
                  
                  {dayRosters.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayRosters.length - 3} 更多
                    </div>
                  )}
                  
                  {dayRosters.length === 0 && isCurrentMonthDate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onCreateRoster(date)
                      }}
                      className="w-full text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-300 rounded p-1 hover:bg-gray-50"
                    >
                      <Plus className="w-3 h-3 mx-auto mb-1" />
                      新增值班
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></div>
            <span>日班</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200"></div>
            <span>夜班</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200"></div>
            <span>自訂班別</span>
          </div>
        </div>
      </div>
    </div>
  )
}