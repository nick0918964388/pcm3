'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'

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

interface PersonnelFormProps {
  personnel?: Personnel | null
  subcontractors: Subcontractor[]
  onSuccess: () => void
  onCancel: () => void
}

export function PersonnelForm({ personnel, subcontractors, onSuccess, onCancel }: PersonnelFormProps) {
  const [formData, setFormData] = useState({
    subcontractorId: personnel?.subcontractorId?.toString() || '',
    name: personnel?.name || '',
    position: personnel?.position || '',
    phone: personnel?.phone || '',
    email: personnel?.email || '',
    employeeId: personnel?.employeeId || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '人員姓名為必填項目'
    }

    if (!formData.subcontractorId) {
      newErrors.subcontractorId = '請選擇協力廠商'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '請輸入有效的電子郵件地址'
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
      const url = personnel ? `/api/personnel/${personnel.id}` : '/api/personnel'
      const method = personnel ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subcontractorId: parseInt(formData.subcontractorId),
          name: formData.name.trim(),
          position: formData.position.trim() || null,
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          employeeId: formData.employeeId.trim() || null,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save personnel')
      }

      const data = await response.json()
      if (data.success) {
        onSuccess()
      } else {
        throw new Error(data.error || 'Failed to save personnel')
      }
    } catch (error) {
      console.error('Error saving personnel:', error)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">
          {personnel ? '編輯人員' : '新增人員'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>基本資料</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="subcontractorId">協力廠商 *</Label>
                <Select 
                  value={formData.subcontractorId} 
                  onValueChange={(value) => handleInputChange('subcontractorId', value)}
                >
                  <SelectTrigger className={errors.subcontractorId ? 'border-destructive' : ''}>
                    <SelectValue placeholder="請選擇協力廠商" />
                  </SelectTrigger>
                  <SelectContent>
                    {subcontractors.map((subcontractor) => (
                      <SelectItem key={subcontractor.id} value={subcontractor.id.toString()}>
                        {subcontractor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subcontractorId && (
                  <p className="text-sm text-destructive">{errors.subcontractorId}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">人員姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="請輸入人員姓名"
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">職位</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="請輸入職位"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeId">員工編號</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => handleInputChange('employeeId', e.target.value)}
                  placeholder="請輸入員工編號"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">電話</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="請輸入電話號碼"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">電子郵件</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="請輸入電子郵件地址"
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
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
  )
}