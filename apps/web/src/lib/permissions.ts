import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { permissionRepository } from '@/repositories/permissionRepository'

export interface PermissionCheckOptions {
  permission: string
  projectId?: number
  allowSelfAccess?: boolean  // Allow users to access their own resources
  resourceUserId?: number    // The user ID of the resource being accessed
}

export function requirePermission(permission: string, options?: Omit<PermissionCheckOptions, 'permission'>) {
  return async function(req: NextRequest, res: NextResponse, next: () => void) {
    try {
      const session = await auth()
      
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      const userId = parseInt(session.user.id)
      
      // Check for self-access permission if enabled
      if (options?.allowSelfAccess && options?.resourceUserId === userId) {
        next()
        return
      }

      const hasPermission = await permissionRepository.checkUserPermission(
        userId,
        permission,
        options?.projectId
      )

      if (!hasPermission) {
        return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
      }

      next()
    } catch (error) {
      console.error('Permission check error:', error)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
  }
}

export async function checkPermission(
  userId: number, 
  permission: string, 
  projectId?: number
): Promise<boolean> {
  try {
    return await permissionRepository.checkUserPermission(userId, permission, projectId)
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

export async function getUserPermissions(userId: number, projectId?: number) {
  try {
    return await permissionRepository.getUserPermissions(userId, projectId)
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return []
  }
}

// Common permission checks
export const PERMISSIONS = {
  // Project permissions
  PROJECT_READ: 'project.read',
  PROJECT_WRITE: 'project.write',
  PROJECT_DELETE: 'project.delete',
  
  // WBS permissions
  WBS_READ: 'wbs.read',
  WBS_WRITE: 'wbs.write',
  WBS_DELETE: 'wbs.delete',
  
  // Personnel permissions
  PERSONNEL_READ: 'personnel.read',
  PERSONNEL_WRITE: 'personnel.write',
  PERSONNEL_DELETE: 'personnel.delete',
  
  // Report permissions
  REPORTS_READ: 'reports.read',
  REPORTS_WRITE: 'reports.write',
  REPORTS_DELETE: 'reports.delete',
  REPORTS_APPROVE: 'reports.approve',
  
  // Announcement permissions
  ANNOUNCEMENTS_READ: 'announcements.read',
  ANNOUNCEMENTS_WRITE: 'announcements.write',
  ANNOUNCEMENTS_DELETE: 'announcements.delete',
  
  // Duty roster permissions
  DUTY_READ: 'duty.read',
  DUTY_WRITE: 'duty.write',
  DUTY_DELETE: 'duty.delete',
  
  // Attendance permissions
  ATTENDANCE_READ: 'attendance.read',
  ATTENDANCE_WRITE: 'attendance.write',
  ATTENDANCE_DELETE: 'attendance.delete',
  
  // User and role permissions
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
  ROLES_READ: 'roles.read',
  ROLES_WRITE: 'roles.write',
  ROLES_ASSIGN: 'roles.assign',
  
  // Dashboard and system permissions
  DASHBOARD_READ: 'dashboard.read',
  SYSTEM_ADMIN: 'system.admin'
} as const

// Permission decorators for Next.js API routes
export function withPermission(permission: string, options?: Omit<PermissionCheckOptions, 'permission'>) {
  return function(handler: (req: NextRequest, context: any) => Promise<NextResponse>) {
    return async function(req: NextRequest, context: any): Promise<NextResponse> {
      try {
        const session = await auth()
        
        if (!session) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = parseInt(session.user.id)
        
        // Check for self-access permission if enabled
        if (options?.allowSelfAccess && options?.resourceUserId === userId) {
          return handler(req, context)
        }

        const hasPermission = await permissionRepository.checkUserPermission(
          userId,
          permission,
          options?.projectId
        )

        if (!hasPermission) {
          return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        return handler(req, context)
      } catch (error) {
        console.error('Permission check error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
      }
    }
  }
}

// Helper function to get project ID from request
export function extractProjectId(req: NextRequest): number | undefined {
  const url = new URL(req.url)
  const projectId = url.searchParams.get('projectId')
  return projectId ? parseInt(projectId) : undefined
}

// Helper function to get user ID from params
export function extractUserIdFromParams(params: { id?: string }): number | undefined {
  return params.id ? parseInt(params.id) : undefined
}

// Batch permission check
export async function checkMultiplePermissions(
  userId: number, 
  permissions: string[], 
  projectId?: number
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {}
  
  await Promise.all(
    permissions.map(async (permission) => {
      results[permission] = await checkPermission(userId, permission, projectId)
    })
  )
  
  return results
}