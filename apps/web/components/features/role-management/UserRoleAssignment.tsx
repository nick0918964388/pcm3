'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Role {
  id: number
  name: string
  description: string
}

interface UserRoleAssignment {
  userId: number
  roleId: number
  projectId?: number
  roleName: string
  projectName?: string
  createdAt: string
}

interface Project {
  id: number
  name: string
  code: string
}

interface UserRoleAssignmentProps {
  userId: number
  userName: string
}

export function UserRoleAssignment({ userId, userName }: UserRoleAssignmentProps) {
  const [userRoles, setUserRoles] = useState<UserRoleAssignment[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [assignLoading, setAssignLoading] = useState(false)

  const [newAssignment, setNewAssignment] = useState({
    roleId: '',
    projectId: ''
  })

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    try {
      const [userRolesRes, rolesRes, projectsRes] = await Promise.all([
        fetch(`/api/users/${userId}/roles`),
        fetch('/api/roles'),
        fetch('/api/projects') // Assuming this endpoint exists
      ])

      if (!userRolesRes.ok || !rolesRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const userRolesData = await userRolesRes.json()
      const rolesData = await rolesRes.json()
      
      setUserRoles(userRolesData)
      setAvailableRoles(rolesData)
      
      // Projects endpoint might not exist yet, handle gracefully
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json()
        setProjects(projectsData)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignRole = async () => {
    if (!newAssignment.roleId) return

    setAssignLoading(true)
    try {
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          roleId: parseInt(newAssignment.roleId),
          projectId: newAssignment.projectId ? parseInt(newAssignment.projectId) : undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to assign role')
      }

      const updatedRoles = await response.json()
      setUserRoles(updatedRoles)
      setNewAssignment({ roleId: '', projectId: '' })
      setShowAssignForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role')
    } finally {
      setAssignLoading(false)
    }
  }

  const handleRemoveRole = async (roleId: number, projectId?: number) => {
    if (!confirm('確定要移除此角色嗎？')) return

    try {
      const params = new URLSearchParams({ roleId: roleId.toString() })
      if (projectId) {
        params.append('projectId', projectId.toString())
      }

      const response = await fetch(`/api/users/${userId}/roles?${params}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to remove role')
      }

      const updatedRoles = await response.json()
      setUserRoles(updatedRoles)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove role')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="text-sm text-gray-500">載入使用者角色...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-sm text-red-600">錯誤: {error}</div>
        <Button 
          onClick={fetchData} 
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
        <h3 className="text-lg font-semibold">{userName} 的角色指派</h3>
        <Button
          onClick={() => setShowAssignForm(true)}
          size="sm"
        >
          指派角色
        </Button>
      </div>

      {/* Current Role Assignments */}
      <div className="space-y-2">
        <h4 className="font-medium">目前角色</h4>
        {userRoles.length === 0 ? (
          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded">
            尚未指派任何角色
          </div>
        ) : (
          userRoles.map((assignment, index) => (
            <div
              key={`${assignment.roleId}-${assignment.projectId || 'global'}`}
              className="flex items-center justify-between p-3 border rounded"
            >
              <div>
                <div className="font-medium">{assignment.roleName}</div>
                <div className="text-sm text-gray-600">
                  {assignment.projectName ? `專案: ${assignment.projectName}` : '全域角色'}
                </div>
                <div className="text-xs text-gray-400">
                  指派日期: {new Date(assignment.createdAt).toLocaleDateString('zh-TW')}
                </div>
              </div>
              <Button
                onClick={() => handleRemoveRole(assignment.roleId, assignment.projectId)}
                variant="destructive"
                size="sm"
              >
                移除
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Assignment Form Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">指派新角色</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">選擇角色</label>
                <select
                  value={newAssignment.roleId}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, roleId: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">請選擇角色...</option>
                  {availableRoles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description}
                    </option>
                  ))}
                </select>
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">選擇專案 (可選)</label>
                  <select
                    value={newAssignment.projectId}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">全域角色</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>
                        {project.name} ({project.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                onClick={() => {
                  setShowAssignForm(false)
                  setNewAssignment({ roleId: '', projectId: '' })
                }}
                variant="outline"
              >
                取消
              </Button>
              <Button
                onClick={handleAssignRole}
                disabled={assignLoading || !newAssignment.roleId}
              >
                {assignLoading ? '指派中...' : '確認指派'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}