'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Permission {
  id: number
  name: string
  description: string
  resource: string
  action: string
}

interface RoleWithPermissions {
  id: number
  name: string
  description: string
  permissions: string[]
  createdAt: string
}

interface RolePermissionDisplayProps {
  roleId?: number
  roleName?: string
}

export function RolePermissionDisplay({ roleId, roleName }: RolePermissionDisplayProps) {
  const [role, setRole] = useState<RoleWithPermissions | null>(null)
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (roleId) {
      fetchRolePermissions()
    }
    fetchAllPermissions()
  }, [roleId])

  const fetchRolePermissions = async () => {
    if (!roleId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/roles/${roleId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch role permissions')
      }
      const data = await response.json()
      setRole(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllPermissions = async () => {
    try {
      const response = await fetch('/api/permissions')
      if (!response.ok) {
        throw new Error('Failed to fetch permissions')
      }
      const data = await response.json()
      setAllPermissions(data)
    } catch (err) {
      console.error('Failed to fetch all permissions:', err)
    }
  }

  const groupPermissionsByResource = (permissions: Permission[]) => {
    const grouped: Record<string, Permission[]> = {}
    permissions.forEach(permission => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = []
      }
      grouped[permission.resource].push(permission)
    })
    return grouped
  }

  const getPermissionsByNames = (permissionNames: string[]): Permission[] => {
    return allPermissions.filter(p => permissionNames.includes(p.name))
  }

  if (!roleId) {
    return (
      <div className="text-center py-8 text-gray-500">
        請選擇一個角色以查看權限詳情
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-500">載入角色權限...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-sm text-red-600">錯誤: {error}</div>
        <Button 
          onClick={fetchRolePermissions} 
          className="mt-2"
          size="sm"
          variant="outline"
        >
          重試
        </Button>
      </div>
    )
  }

  if (!role) {
    return (
      <div className="text-center py-8 text-gray-500">
        找不到角色資料
      </div>
    )
  }

  const rolePermissions = getPermissionsByNames(role.permissions)
  const groupedPermissions = groupPermissionsByResource(rolePermissions)

  const resourceNameMap: Record<string, string> = {
    'project': '專案管理',
    'wbs': '工作分解結構',
    'personnel': '人員管理',
    'reports': '報告管理',
    'announcements': '公告管理',
    'duty': '值班管理',
    'attendance': '出勤管理',
    'users': '使用者管理',
    'roles': '角色管理',
    'dashboard': '儀表板',
    'system': '系統管理'
  }

  const actionNameMap: Record<string, string> = {
    'read': '檢視',
    'write': '編輯',
    'delete': '刪除',
    'approve': '審核',
    'assign': '指派',
    'admin': '管理'
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900">{role.name}</h3>
        <p className="text-blue-700 mt-1">{role.description}</p>
        <div className="text-sm text-blue-600 mt-2">
          建立時間: {new Date(role.createdAt).toLocaleDateString('zh-TW')}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-semibold">權限詳情</h4>
          <div className="text-sm text-gray-500">
            共 {role.permissions.length} 個權限
          </div>
        </div>

        {role.permissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded">
            此角色尚未配置任何權限
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedPermissions).map(([resource, permissions]) => (
              <div key={resource} className="border rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-2">
                  {resourceNameMap[resource] || resource}
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {permissions.map(permission => (
                    <div
                      key={permission.id}
                      className="flex items-center space-x-2 text-sm"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div>
                        <span className="font-medium">
                          {actionNameMap[permission.action] || permission.action}
                        </span>
                        <div className="text-gray-500 text-xs">
                          {permission.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400 pt-4 border-t">
        <strong>權限說明:</strong> 每個角色可以包含多個權限，權限按照資源類型分組顯示。
        綠點表示該角色擁有對應的操作權限。
      </div>
    </div>
  )
}