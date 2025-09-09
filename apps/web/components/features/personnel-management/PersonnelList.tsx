'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PersonnelCard } from './PersonnelCard'
import { PersonnelForm } from './PersonnelForm'
import { PersonnelImport } from './PersonnelImport'
import { Search, Plus, Users, Upload } from 'lucide-react'

export interface Personnel {
  id: number
  subcontractorId: number
  name: string
  position: string | null
  phone: string | null
  email: string | null
  employeeId: string | null
  createdAt: string
  subcontractorName?: string
}

export interface Subcontractor {
  id: number
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
}

export function PersonnelList() {
  const [personnel, setPersonnel] = useState<Personnel[]>([])
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingPersonnel, setEditingPersonnel] = useState<Personnel | null>(null)

  const fetchSubcontractors = async () => {
    try {
      const response = await fetch('/api/subcontractors')
      if (!response.ok) {
        throw new Error('Failed to fetch subcontractors')
      }
      const data = await response.json()
      if (data.success) {
        setSubcontractors(data.data)
      }
    } catch (error) {
      console.error('Error fetching subcontractors:', error)
    }
  }

  const fetchPersonnel = async (filters: { name?: string; subcontractorId?: number } = {}) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filters.name) {
        params.append('name', filters.name)
      }
      if (filters.subcontractorId) {
        params.append('subcontractorId', filters.subcontractorId.toString())
      }

      const response = await fetch(`/api/personnel?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch personnel')
      }

      const data = await response.json()
      if (data.success) {
        setPersonnel(data.data)
      }
    } catch (error) {
      console.error('Error fetching personnel:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubcontractors()
    fetchPersonnel()
  }, [])

  const handleSearch = () => {
    const filters: { name?: string; subcontractorId?: number } = {}
    if (searchTerm) {
      filters.name = searchTerm
    }
    if (selectedSubcontractor && selectedSubcontractor !== 'all') {
      filters.subcontractorId = parseInt(selectedSubcontractor)
    }
    fetchPersonnel(filters)
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleAdd = () => {
    setEditingPersonnel(null)
    setShowForm(true)
  }

  const handleImport = () => {
    setShowImport(true)
  }

  const handleEdit = (person: Personnel) => {
    setEditingPersonnel(person)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此人員嗎？')) {
      return
    }

    try {
      const response = await fetch(`/api/personnel/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete personnel')
      }

      const data = await response.json()
      if (data.success) {
        handleSearch()
      }
    } catch (error) {
      console.error('Error deleting personnel:', error)
      alert('刪除失敗')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingPersonnel(null)
    handleSearch()
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingPersonnel(null)
  }

  const handleImportSuccess = () => {
    setShowImport(false)
    handleSearch()
  }

  const handleImportCancel = () => {
    setShowImport(false)
  }

  if (showForm) {
    return (
      <PersonnelForm
        personnel={editingPersonnel}
        subcontractors={subcontractors}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    )
  }

  if (showImport) {
    return (
      <PersonnelImport
        subcontractors={subcontractors}
        onSuccess={handleImportSuccess}
        onBack={handleImportCancel}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">人員管理</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={handleAdd} className="flex-1 sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            新增人員
          </Button>
          <Button onClick={handleImport} variant="outline" className="flex-1 sm:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            批量匯入
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="搜尋人員姓名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleSearchKeyPress}
          />
        </div>
        <Select value={selectedSubcontractor} onValueChange={setSelectedSubcontractor}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="選擇協力廠商" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有廠商</SelectItem>
            {subcontractors.map((subcontractor) => (
              <SelectItem key={subcontractor.id} value={subcontractor.id.toString()}>
                {subcontractor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSearch} variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">載入中...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {personnel.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              沒有找到人員資料
            </div>
          ) : (
            personnel.map((person) => (
              <PersonnelCard
                key={person.id}
                personnel={person}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}