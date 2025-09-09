'use client'

import { useState, useEffect } from 'react'
import { X, Search, User, Building2 } from 'lucide-react'

interface Personnel {
  id: number
  name: string
  position?: string
  subcontractorName?: string
}

interface DutyRoster {
  id?: number
  projectId: number
  personnelId: number
  dutyDate: Date
  shiftType: string
  notes?: string
  personnelName?: string
  personnelPosition?: string
  subcontractorName?: string
}

interface PersonnelAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (roster: DutyRoster) => void
  projectId: number
  selectedDate: Date
  personnel: Personnel[]
  existingRoster?: DutyRoster
  loading?: boolean
}

export default function PersonnelAssignmentModal({
  isOpen,
  onClose,
  onSave,
  projectId,
  selectedDate,
  personnel,
  existingRoster,
  loading = false
}: PersonnelAssignmentModalProps) {
  const [selectedPersonnelId, setSelectedPersonnelId] = useState<number | null>(null)
  const [shiftType, setShiftType] = useState<string>('day')
  const [notes, setNotes] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [isMultipleAssignment, setIsMultipleAssignment] = useState(false)
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<number[]>([])

  useEffect(() => {
    if (existingRoster) {
      setSelectedPersonnelId(existingRoster.personnelId)
      setShiftType(existingRoster.shiftType)
      setNotes(existingRoster.notes || '')
    } else {
      setSelectedPersonnelId(null)
      setShiftType('day')
      setNotes('')
    }
    setSelectedPersonnelIds([])
    setIsMultipleAssignment(false)
    setSearchTerm('')
  }, [existingRoster, isOpen])

  const filteredPersonnel = personnel.filter(person =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (person.position?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (person.subcontractorName?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handlePersonnelSelect = (personnelId: number) => {
    if (isMultipleAssignment) {
      setSelectedPersonnelIds(prev => 
        prev.includes(personnelId) 
          ? prev.filter(id => id !== personnelId)
          : [...prev, personnelId]
      )
    } else {
      setSelectedPersonnelId(personnelId)
    }
  }

  const handleSave = () => {
    if (isMultipleAssignment && selectedPersonnelIds.length > 0) {
      // Save multiple rosters
      selectedPersonnelIds.forEach(personnelId => {
        const selectedPerson = personnel.find(p => p.id === personnelId)
        const roster: DutyRoster = {
          ...(existingRoster?.id && { id: existingRoster.id }),
          projectId,
          personnelId,
          dutyDate: selectedDate,
          shiftType,
          notes,
          personnelName: selectedPerson?.name,
          personnelPosition: selectedPerson?.position,
          subcontractorName: selectedPerson?.subcontractorName
        }
        onSave(roster)
      })
    } else if (selectedPersonnelId) {
      // Save single roster
      const selectedPerson = personnel.find(p => p.id === selectedPersonnelId)
      const roster: DutyRoster = {
        ...(existingRoster?.id && { id: existingRoster.id }),
        projectId,
        personnelId: selectedPersonnelId,
        dutyDate: selectedDate,
        shiftType,
        notes,
        personnelName: selectedPerson?.name,
        personnelPosition: selectedPerson?.position,
        subcontractorName: selectedPerson?.subcontractorName
      }
      onSave(roster)
    }
  }

  const canSave = isMultipleAssignment ? selectedPersonnelIds.length > 0 : selectedPersonnelId !== null

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {existingRoster ? '編輯值班安排' : '新增值班安排'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Date Display */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              值班日期
            </label>
            <div className="p-3 bg-gray-50 rounded-md text-gray-900">
              {selectedDate.toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </div>
          </div>

          {/* Shift Type */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              班別類型
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setShiftType('day')}
                className={`p-3 rounded-md border text-center transition-colors ${
                  shiftType === 'day'
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">日班</div>
                <div className="text-xs opacity-75">8:00-17:00</div>
              </button>
              <button
                onClick={() => setShiftType('night')}
                className={`p-3 rounded-md border text-center transition-colors ${
                  shiftType === 'night'
                    ? 'bg-purple-100 border-purple-300 text-purple-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">夜班</div>
                <div className="text-xs opacity-75">20:00-05:00</div>
              </button>
              <button
                onClick={() => setShiftType('custom')}
                className={`p-3 rounded-md border text-center transition-colors ${
                  shiftType === 'custom'
                    ? 'bg-gray-100 border-gray-300 text-gray-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">自訂</div>
                <div className="text-xs opacity-75">彈性時間</div>
              </button>
            </div>
          </div>

          {/* Multiple Assignment Toggle */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isMultipleAssignment}
                onChange={(e) => {
                  setIsMultipleAssignment(e.target.checked)
                  if (!e.target.checked) {
                    setSelectedPersonnelIds([])
                  }
                }}
                className="mr-2"
                disabled={!!existingRoster}
              />
              <span className="text-sm text-gray-700">多人值班（可選擇多位人員）</span>
            </label>
          </div>

          {/* Personnel Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              選擇值班人員
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜尋人員姓名、職位或承包商..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Personnel List */}
          <div className="mb-6 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            {filteredPersonnel.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                沒有找到符合條件的人員
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPersonnel.map(person => {
                  const isSelected = isMultipleAssignment 
                    ? selectedPersonnelIds.includes(person.id)
                    : selectedPersonnelId === person.id

                  return (
                    <div
                      key={person.id}
                      onClick={() => handlePersonnelSelect(person.id)}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-blue-400' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {isMultipleAssignment && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="text-blue-600"
                          />
                        )}
                        <User className="w-8 h-8 text-gray-400" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{person.name}</div>
                          <div className="text-sm text-gray-500 flex items-center space-x-2">
                            {person.position && (
                              <span>{person.position}</span>
                            )}
                            {person.subcontractorName && (
                              <>
                                <Building2 className="w-3 h-3" />
                                <span>{person.subcontractorName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              備註
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="輸入值班備註（選填）..."
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '儲存中...' : existingRoster ? '更新' : '新增'}
          </button>
        </div>
      </div>
    </div>
  )
}