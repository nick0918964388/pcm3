import oracledb from 'oracledb'
import { DatabaseError, getStandardErrorMessage } from '../lib/errors'

export interface Role {
  id: number
  name: string
  description: string
  createdAt: Date
}

export interface RoleWithPermissions extends Role {
  permissions: string[]
}

export interface UserRoleAssignment {
  userId: number
  roleId: number
  projectId?: number
  roleName: string
  projectName?: string
  createdAt: Date
}

class RoleRepository {
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

  async getAllRoles(): Promise<Role[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT id, name, description, created_at 
         FROM roles 
         ORDER BY name`,
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
        createdAt: row.CREATED_AT
      }))
    } catch (error) {
      console.error('Error fetching all roles:', error)
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

  async getRoleWithPermissions(roleId: number): Promise<RoleWithPermissions | null> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const roleResult = await connection.execute(
        `SELECT id, name, description, created_at 
         FROM roles 
         WHERE id = :roleId`,
        { roleId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!roleResult.rows || roleResult.rows.length === 0) {
        return null
      }

      const roleRow = roleResult.rows[0] as any
      const role: Role = {
        id: roleRow.ID,
        name: roleRow.NAME,
        description: roleRow.DESCRIPTION,
        createdAt: roleRow.CREATED_AT
      }

      const permissionsResult = await connection.execute(
        `SELECT p.name 
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = :roleId
         ORDER BY p.name`,
        { roleId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      const permissions = permissionsResult.rows ? 
        permissionsResult.rows.map((row: any) => row.NAME) : []

      return {
        ...role,
        permissions
      }
    } catch (error) {
      console.error('Error fetching role with permissions:', error)
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

  async getUserRoles(userId: number): Promise<UserRoleAssignment[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT ur.user_id, ur.role_id, ur.project_id, r.name as role_name, 
                p.name as project_name, ur.created_at
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         LEFT JOIN projects p ON ur.project_id = p.id
         WHERE ur.user_id = :userId
         ORDER BY r.name, p.name NULLS FIRST`,
        { userId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        userId: row.USER_ID,
        roleId: row.ROLE_ID,
        projectId: row.PROJECT_ID,
        roleName: row.ROLE_NAME,
        projectName: row.PROJECT_NAME,
        createdAt: row.CREATED_AT
      }))
    } catch (error) {
      console.error('Error fetching user roles:', error)
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

  async assignRoleToUser(userId: number, roleId: number, projectId?: number): Promise<void> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      await connection.execute(
        `INSERT INTO user_roles (user_id, role_id, project_id) 
         VALUES (:userId, :roleId, :projectId)`,
        {
          userId,
          roleId,
          projectId: projectId || null
        }
      )

      await connection.commit()
    } catch (error) {
      console.error('Error assigning role to user:', error)
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

  async removeRoleFromUser(userId: number, roleId: number, projectId?: number): Promise<void> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const whereClause = projectId 
        ? 'user_id = :userId AND role_id = :roleId AND project_id = :projectId'
        : 'user_id = :userId AND role_id = :roleId AND project_id IS NULL'
      
      const params: any = { userId, roleId }
      if (projectId) {
        params.projectId = projectId
      }
      
      await connection.execute(
        `DELETE FROM user_roles WHERE ${whereClause}`,
        params
      )

      await connection.commit()
    } catch (error) {
      console.error('Error removing role from user:', error)
      if (connection) {
        try {
          await connection.rollback()
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError)
        }
      }
      throw new DatabaseError(getStandardErrorMessage('DATABASE_DELETE_FAILED'), 'DATABASE_DELETE_FAILED')
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

  async createRole(role: Omit<Role, 'id' | 'createdAt'>): Promise<number> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `INSERT INTO roles (name, description) 
         VALUES (:name, :description)
         RETURNING id INTO :id`,
        {
          name: role.name,
          description: role.description,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        }
      )

      await connection.commit()
      
      const newId = (result.outBinds as any).id[0]
      return newId
    } catch (error) {
      console.error('Error creating role:', error)
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

  async assignPermissionToRole(roleId: number, permissionId: number): Promise<void> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      await connection.execute(
        `INSERT INTO role_permissions (role_id, permission_id) 
         VALUES (:roleId, :permissionId)`,
        { roleId, permissionId }
      )

      await connection.commit()
    } catch (error) {
      console.error('Error assigning permission to role:', error)
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

  async removePermissionFromRole(roleId: number, permissionId: number): Promise<void> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      await connection.execute(
        `DELETE FROM role_permissions 
         WHERE role_id = :roleId AND permission_id = :permissionId`,
        { roleId, permissionId }
      )

      await connection.commit()
    } catch (error) {
      console.error('Error removing permission from role:', error)
      if (connection) {
        try {
          await connection.rollback()
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError)
        }
      }
      throw new DatabaseError(getStandardErrorMessage('DATABASE_DELETE_FAILED'), 'DATABASE_DELETE_FAILED')
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

export const roleRepository = new RoleRepository()