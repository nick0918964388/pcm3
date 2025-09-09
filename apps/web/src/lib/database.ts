import oracledb from 'oracledb'
import { DatabaseError, getStandardErrorMessage } from './errors'

export class DatabaseConnection {
  static async getConnection() {
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

  static async withConnection<T>(
    operation: (connection: oracledb.Connection) => Promise<T>
  ): Promise<T> {
    let connection
    
    try {
      connection = await this.getConnection()
      return await operation(connection)
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

  static async withTransaction<T>(
    operation: (connection: oracledb.Connection) => Promise<T>
  ): Promise<T> {
    let connection
    
    try {
      connection = await this.getConnection()
      const result = await operation(connection)
      await connection.commit()
      return result
    } catch (error) {
      if (connection) {
        try {
          await connection.rollback()
        } catch (rollbackError) {
          console.error('Error rolling back transaction:', rollbackError)
        }
      }
      throw error
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