'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Clock, Palette } from 'lucide-react'

interface ShiftType {
  id: string
  name: string
  startTime: string
  endTime: string
  color: string
  isDefault: boolean
  description?: string
}

interface ShiftManagementProps {
  projectId: number
  onShiftTypesChange?: (shiftTypes: ShiftType[]) => void
}

const DEFAULT_SHIFT_TYPES: ShiftType[] = [
  {
    id: 'day',
    name: '日班',
    startTime: '08:00',
    endTime: '17:00',
    color: '#3B82F6',
    isDefault: true,
    description: '正常工作時間'
  },
  {
    id: 'night',
    name: '夜班',
    startTime: '20:00',
    endTime: '05:00',
    color: '#7C3AED',
    isDefault: true,
    description: '夜間工作時間'
  }
]

const COLOR_OPTIONS = [
  '#3B82F6', // Blue
  '#7C3AED', // Purple
  '#059669', // Green
  '#DC2626', // Red
  '#D97706', // Orange
  '#7C2D12', // Brown
  '#374151', // Gray
  '#BE185D', // Pink
]

export default function ShiftManagement({ projectId, onShiftTypesChange }: ShiftManagementProps) {
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>(DEFAULT_SHIFT_TYPES)
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    color: COLOR_OPTIONS[0],
    description: ''
  })

  useEffect(() => {
    // Load custom shift types from localStorage or API
    const savedShiftTypes = localStorage.getItem(`shiftTypes_${projectId}`)
    if (savedShiftTypes) {
      try {
        const parsed = JSON.parse(savedShiftTypes)
        setShiftTypes(parsed)
      } catch (error) {
        console.error('Error parsing saved shift types:', error)
      }
    }
  }, [projectId])

  useEffect(() => {
    onShiftTypesChange?.(shiftTypes)
  }, [shiftTypes, onShiftTypesChange])

  const saveShiftTypes = (newShiftTypes: ShiftType[]) => {
    setShiftTypes(newShiftTypes)
    localStorage.setItem(`shiftTypes_${projectId}`, JSON.stringify(newShiftTypes))
  }

  const openModal = (shift?: ShiftType) => {
    if (shift) {
      setEditingShift(shift)
      setFormData({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        color: shift.color,
        description: shift.description || ''
      })
    } else {
      setEditingShift(null)
      setFormData({
        name: '',
        startTime: '',
        endTime: '',
        color: COLOR_OPTIONS[0],
        description: ''
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingShift(null)
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      color: COLOR_OPTIONS[0],
      description: ''
    })
  }

  const handleSave = () => {
    if (!formData.name || !formData.startTime || !formData.endTime) {
      alert('請填寫所有必填欄位')
      return
    }

    if (editingShift) {
      // Update existing shift
      const updatedShiftTypes = shiftTypes.map(shift =>
        shift.id === editingShift.id
          ? { ...shift, ...formData }
          : shift
      )
      saveShiftTypes(updatedShiftTypes)
    } else {
      // Create new shift
      const newShift: ShiftType = {
        id: `custom_${Date.now()}`,
        ...formData,
        isDefault: false
      }
      saveShiftTypes([...shiftTypes, newShift])
    }

    closeModal()
  }

  const handleDelete = (shiftId: string) => {
    const shift = shiftTypes.find(s => s.id === shiftId)
    if (shift?.isDefault) {
      alert('無法刪除預設班別')
      return
    }

    if (!confirm('確定要刪除這個班別嗎？')) return

    const updatedShiftTypes = shiftTypes.filter(shift => shift.id !== shiftId)
    saveShiftTypes(updatedShiftTypes)
  }

  const resetToDefault = () => {
    if (!confirm('確定要重置為預設班別設定嗎？這將刪除所有自訂班別。')) return
    saveShiftTypes(DEFAULT_SHIFT_TYPES)
  }

  const formatTime = (time: string) => {
    return time.substring(0, 5) // Remove seconds if present
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">班別管理</h2>
          <p className="text-gray-600 mt-1">設定和管理值班時間類型</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => openModal()}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>新增班別</span>
          </button>
          <button
            onClick={resetToDefault}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            重置預設
          </button>
        </div>
      </div>

      {/* Shift Types List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shiftTypes.map(shift => (
          <div
            key={shift.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: shift.color }}
                ></div>
                <h3 className="font-medium text-gray-900">{shift.name}</h3>
                {shift.isDefault && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    預設
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => openModal(shift)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                {!shift.isDefault && (
                  <button
                    onClick={() => handleDelete(shift.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatTime(shift.startTime)} - {formatTime(shift.endTime)}</span>
              </div>
              {shift.description && (
                <p className="text-sm text-gray-500">{shift.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingShift ? '編輯班別' : '新增班別'}
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    班別名稱 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="例如：早班、午班..."
                  />
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      開始時間 *
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      結束時間 *
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    顏色標示
                  </label>
                  <div className="flex space-x-2">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded border-2 ${
                          formData.color === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="班別說明（選填）"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingShift ? '更新' : '新增'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}