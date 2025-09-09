'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SubcontractorCard } from './SubcontractorCard'
import { SubcontractorForm } from './SubcontractorForm'
import { Search, Plus } from 'lucide-react'

export interface Subcontractor {
  id: number
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  createdAt: string
}

export function SubcontractorList() {
  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSubcontractor, setEditingSubcontractor] = useState<Subcontractor | null>(null)

  const fetchSubcontractors = async (filters: { name?: string } = {}) => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (filters.name) {
        params.append('name', filters.name)
      }

      const response = await fetch(`/api/subcontractors?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch subcontractors')
      }

      const data = await response.json()
      if (data.success) {
        setSubcontractors(data.data)
      }
    } catch (error) {
      console.error('Error fetching subcontractors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubcontractors()
  }, [])

  const handleSearch = () => {
    fetchSubcontractors({ name: searchTerm })
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleAdd = () => {
    setEditingSubcontractor(null)
    setShowForm(true)
  }

  const handleEdit = (subcontractor: Subcontractor) => {
    setEditingSubcontractor(subcontractor)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('確定要刪除此協力廠商嗎？')) {
      return
    }

    try {
      const response = await fetch(`/api/subcontractors/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete subcontractor')
      }

      const data = await response.json()
      if (data.success) {
        fetchSubcontractors({ name: searchTerm })
      }
    } catch (error) {
      console.error('Error deleting subcontractor:', error)
      alert('刪除失敗')
    }
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingSubcontractor(null)
    fetchSubcontractors({ name: searchTerm })
  }

  const handleFormCancel = () => {
    setShowForm(false)
    setEditingSubcontractor(null)
  }

  if (showForm) {
    return (
      <SubcontractorForm
        subcontractor={editingSubcontractor}
        onSuccess={handleFormSuccess}
        onCancel={handleFormCancel}
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">協力廠商管理</h1>
        <Button onClick={handleAdd} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          新增協力廠商
        </Button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="搜尋廠商名稱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleSearchKeyPress}
          />
        </div>
        <Button onClick={handleSearch} variant="outline">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">載入中...</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subcontractors.length === 0 ? (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              沒有找到協力廠商
            </div>
          ) : (
            subcontractors.map((subcontractor) => (
              <SubcontractorCard
                key={subcontractor.id}
                subcontractor={subcontractor}
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