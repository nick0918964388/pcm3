'use client'

import React, { useState } from 'react'
import { RoleList } from './RoleList'
import { RolePermissionDisplay } from './RolePermissionDisplay'
import { UserRoleAssignment } from './UserRoleAssignment'

interface Role {
  id: number
  name: string
  description: string
  createdAt: string
}

interface User {
  id: number
  username: string
  fullName: string
  email: string
}

// Mock user data - in a real app this would come from an API
const mockUsers: User[] = [
  { id: 1, username: 'pm.chen', fullName: '陳志明', email: 'chen.pm@pcm.com' },
  { id: 2, username: 'qc.wang', fullName: '王美惠', email: 'wang.qc@pcm.com' },
  { id: 3, username: 'sup.lin', fullName: '林建志', email: 'lin.sup@pcm.com' },
  { id: 4, username: 'eng.lee', fullName: '李怡君', email: 'lee.eng@pcm.com' }
]

export function RoleManagementDashboard() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'roles' | 'assignments'>('roles')

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
  }

  const tabs = [
    { id: 'roles' as const, label: '角色管理', description: '查看和管理系統角色' },
    { id: 'assignments' as const, label: '使用者指派', description: '管理使用者角色指派' }
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold text-gray-900">角色權限管理系統</h1>
        <p className="text-gray-600 mt-1">管理使用者角色與權限設定</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-6 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'roles' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel - Role List */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <RoleList
                  onRoleSelect={handleRoleSelect}
                  selectedRoleId={selectedRole?.id}
                />
              </div>

              {/* Right Panel - Role Permission Display */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <RolePermissionDisplay
                  roleId={selectedRole?.id}
                  roleName={selectedRole?.name}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Panel - User Selection */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">選擇使用者</h3>
                    <div className="text-sm text-gray-500">{mockUsers.length} 個使用者</div>
                  </div>
                  
                  <div className="space-y-2">
                    {mockUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedUser?.id === user.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{user.fullName}</h4>
                            <p className="text-sm text-gray-600">@{user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel - User Role Assignment */}
              <div className="bg-gray-50 p-4 rounded-lg">
                {selectedUser ? (
                  <UserRoleAssignment
                    userId={selectedUser.id}
                    userName={selectedUser.fullName}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    請選擇一個使用者以管理角色指派
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">使用說明</h3>
        <div className="text-sm text-blue-800 space-y-1">
          {activeTab === 'roles' ? (
            <>
              <p>• 左側顯示所有系統角色，點選可查看該角色的權限詳情</p>
              <p>• 右側顯示選中角色的完整權限列表，按資源類型分組</p>
              <p>• 每個角色包含多個權限，控制使用者可以執行的操作</p>
            </>
          ) : (
            <>
              <p>• 左側選擇使用者，右側管理該使用者的角色指派</p>
              <p>• 可以指派全域角色或特定專案的角色</p>
              <p>• 移除角色會立即生效，請謹慎操作</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}