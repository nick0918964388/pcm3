'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Role {
  id: number
  name: string
  description: string
  createdAt: string
}

interface RoleWithPermissions extends Role {
  permissions: string[]
}

interface RoleListProps {
  onRoleSelect?: (role: Role) => void
  selectedRoleId?: number
}

export function RoleList({ onRoleSelect, selectedRoleId }: RoleListProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRoles()
  }, [])

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles')
      if (!response.ok) {
        throw new Error('Failed to fetch roles')
      }
      const data = await response.json()
      setRoles(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-500">載入角色列表...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-sm text-red-600">錯誤: {error}</div>
        <Button 
          onClick={fetchRoles} 
          className="mt-2"
          size="sm"
          variant="outline"
        >
          重試
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">角色列表</h3>
        <div className="text-sm text-gray-500">{roles.length} 個角色</div>
      </div>
      
      {roles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          尚無角色資料
        </div>
      ) : (
        <div className="space-y-2">
          {roles.map((role) => (
            <div
              key={role.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedRoleId === role.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onRoleSelect?.(role)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{role.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(role.createdAt).toLocaleDateString('zh-TW')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}