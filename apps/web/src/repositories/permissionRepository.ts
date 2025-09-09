import oracledb from 'oracledb'
import { DatabaseError, getStandardErrorMessage } from '../lib/errors'

export interface Permission {
  id: number
  name: string
  description: string
  resource: string
  action: string
  createdAt: Date
}

export interface UserPermission {
  userId: number
  permissionName: string
  resource: string
  action: string
}

class PermissionRepository {
  private async getConnection() {
    try {
      const connection = await oracledb.getConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        connectString: process.env.DB_CONNECT_STRING
      })
      return connection
    } catch (error) {
      console.error('Database connection error:', error)
      throw new DatabaseError(getStandardErrorMessage('DATABASE_CONNECTION_FAILED'), 'DATABASE_CONNECTION_FAILED')
    }
  }

  async getAllPermissions(): Promise<Permission[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT id, name, description, resource, action, created_at 
         FROM permissions 
         ORDER BY resource, action`,
        {},
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        id: row.ID,
        name: row.NAME,
        description: row.DESCRIPTION,
        resource: row.RESOURCE,
        action: row.ACTION,
        createdAt: row.CREATED_AT
      }))
    } catch (error) {
      console.error('Error fetching all permissions:', error)
      throw new DatabaseError(getStandardErrorMessage('DATABASE_QUERY_FAILED'), 'DATABASE_QUERY_FAILED')
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (error) {
          console.error('Error closing connection:', error)
        }
      }
    }
  }

  async getUserPermissions(userId: number, projectId?: number): Promise<UserPermission[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const sql = `
        SELECT DISTINCT p.name, p.resource, p.action
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN roles r ON rp.role_id = r.id
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = :userId
        ${projectId ? 'AND (ur.project_id = :projectId OR ur.project_id IS NULL)' : ''}
        ORDER BY p.resource, p.action`
      
      const params: any = { userId }
      if (projectId) {
        params.projectId = projectId
      }
      
      const result = await connection.execute(
        sql,
        params,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        userId,
        permissionName: row.NAME,
        resource: row.RESOURCE,
        action: row.ACTION
      }))
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      throw new DatabaseError(getStandardErrorMessage('DATABASE_QUERY_FAILED'), 'DATABASE_QUERY_FAILED')
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (error) {
          console.error('Error closing connection:', error)
        }
      }
    }
  }

  async checkUserPermission(userId: number, permission: string, projectId?: number): Promise<boolean> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const sql = `
        SELECT COUNT(*) as permission_count
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN roles r ON rp.role_id = r.id
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = :userId 
        AND p.name = :permission
        ${projectId ? 'AND (ur.project_id = :projectId OR ur.project_id IS NULL)' : ''}`
      
      const params: any = { userId, permission }
      if (projectId) {
        params.projectId = projectId
      }
      
      const result = await connection.execute(
        sql,
        params,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows || result.rows.length === 0) {
        return false
      }

      const row = result.rows[0] as any
      return row.PERMISSION_COUNT > 0
    } catch (error) {
      console.error('Error checking user permission:', error)
      return false
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (error) {
          console.error('Error closing connection:', error)
        }
      }
    }
  }

  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT id, name, description, resource, action, created_at 
         FROM permissions 
         WHERE resource = :resource
         ORDER BY action`,
        { resource },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        id: row.ID,
        name: row.NAME,
        description: row.DESCRIPTION,
        resource: row.RESOURCE,
        action: row.ACTION,
        createdAt: row.CREATED_AT
      }))
    } catch (error) {
      console.error('Error fetching permissions by resource:', error)
      throw new DatabaseError(getStandardErrorMessage('DATABASE_QUERY_FAILED'), 'DATABASE_QUERY_FAILED')
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (error) {
          console.error('Error closing connection:', error)
        }
      }
    }
  }

  async createPermission(permission: Omit<Permission, 'id' | 'createdAt'>): Promise<number> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `INSERT INTO permissions (name, description, resource, action) 
         VALUES (:name, :description, :resource, :action)
         RETURNING id INTO :id`,
        {
          name: permission.name,
          description: permission.description,
          resource: permission.resource,
          action: permission.action,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        }
      )

      await connection.commit()
      
      const newId = (result.outBinds as any).id[0]
      return newId
    } catch (error) {
      console.error('Error creating permission:', error)
      if (connection) {
        try {
          await connection.rollback()
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError)
        }
      }
      throw new DatabaseError(getStandardErrorMessage('DATABASE_INSERT_FAILED'), 'DATABASE_INSERT_FAILED')
    } finally {
      if (connection) {
        try {
          await connection.close()
        } catch (error) {
          console.error('Error closing connection:', error)
        }
      }
    }
  }
}

export const permissionRepository = new PermissionRepository()