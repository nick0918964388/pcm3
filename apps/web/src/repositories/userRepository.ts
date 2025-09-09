import oracledb from 'oracledb'
import bcrypt from 'bcrypt'
import { DatabaseError, getStandardErrorMessage } from '../lib/errors'

export interface User {
  id: number
  username: string
  hashedPassword: string
  fullName: string
  email: string
  createdAt: Date
}

export interface UserRole {
  userId: number
  roleName: string
}

class UserRepository {
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

  async findByUsername(username: string): Promise<User | null> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT id, username, hashed_password, full_name, email, created_at 
         FROM users 
         WHERE UPPER(username) = UPPER(:username)`,
        { username },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows || result.rows.length === 0) {
        return null
      }

      const row = result.rows[0] as any
      return {
        id: row.ID,
        username: row.USERNAME,
        hashedPassword: row.HASHED_PASSWORD,
        fullName: row.FULL_NAME,
        email: row.EMAIL,
        createdAt: row.CREATED_AT
      }
    } catch (error) {
      console.error('Error finding user by username:', error)
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

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword)
    } catch (error) {
      console.error('Error validating password:', error)
      return false
    }
  }

  async getUserRoles(userId: number): Promise<UserRole[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT ur.user_id, r.role_name
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = :userId`,
        { userId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        userId: row.USER_ID,
        roleName: row.ROLE_NAME
      }))
    } catch (error) {
      console.error('Error fetching user roles:', error)
      return []
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

  async hashPassword(plainPassword: string): Promise<string> {
    try {
      const saltRounds = 12
      return await bcrypt.hash(plainPassword, saltRounds)
    } catch (error) {
      console.error('Error hashing password:', error)
      throw new DatabaseError(getStandardErrorMessage('SERVER_INTERNAL_ERROR'), 'SERVER_INTERNAL_ERROR')
    }
  }
}

export const userRepository = new UserRepository()