import oracledb from 'oracledb'
import { DatabaseError, getStandardErrorMessage } from '../lib/errors'

export interface Personnel {
  id: number
  subcontractorId: number
  name: string
  position: string | null
  phone: string | null
  email: string | null
  employeeId: string | null
  createdAt: Date
  subcontractorName?: string
}

export interface CreatePersonnelData {
  subcontractorId: number
  name: string
  position?: string
  phone?: string
  email?: string
  employeeId?: string
}

export interface UpdatePersonnelData {
  subcontractorId?: number
  name?: string
  position?: string
  phone?: string
  email?: string
  employeeId?: string
}

export interface PersonnelSearchFilters {
  name?: string
  position?: string
  email?: string
  subcontractorId?: number
  subcontractorName?: string
}

class PersonnelRepository {
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

  async create(data: CreatePersonnelData): Promise<Personnel> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `INSERT INTO PERSONNEL (subcontractor_id, name, position, phone, email, employee_id)
         VALUES (:subcontractorId, :name, :position, :phone, :email, :employeeId)
         RETURNING id INTO :id`,
        {
          subcontractorId: data.subcontractorId,
          name: data.name,
          position: data.position || null,
          phone: data.phone || null,
          email: data.email || null,
          employeeId: data.employeeId || null,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      )

      await connection.commit()

      const insertedId = result.outBinds?.id as number
      const created = await this.findById(insertedId)
      
      if (!created) {
        throw new DatabaseError('Failed to retrieve created personnel', 'DATABASE_QUERY_FAILED')
      }

      return created
    } catch (error) {
      console.error('Error creating personnel:', error)
      if (connection) {
        await connection.rollback()
      }
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

  async findById(id: number): Promise<Personnel | null> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT p.id, p.subcontractor_id, p.name, p.position, p.phone, p.email, 
                p.employee_id, p.created_at, s.name as subcontractor_name
         FROM PERSONNEL p
         LEFT JOIN SUBCONTRACTORS s ON p.subcontractor_id = s.id
         WHERE p.id = :id`,
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows || result.rows.length === 0) {
        return null
      }

      const row = result.rows[0] as any
      return {
        id: row.ID,
        subcontractorId: row.SUBCONTRACTOR_ID,
        name: row.NAME,
        position: row.POSITION,
        phone: row.PHONE,
        email: row.EMAIL,
        employeeId: row.EMPLOYEE_ID,
        createdAt: row.CREATED_AT,
        subcontractorName: row.SUBCONTRACTOR_NAME
      }
    } catch (error) {
      console.error('Error finding personnel by id:', error)
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

  async findAll(filters: PersonnelSearchFilters = {}): Promise<Personnel[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      let query = `SELECT p.id, p.subcontractor_id, p.name, p.position, p.phone, p.email, 
                          p.employee_id, p.created_at, s.name as subcontractor_name
                   FROM PERSONNEL p
                   LEFT JOIN SUBCONTRACTORS s ON p.subcontractor_id = s.id
                   WHERE 1=1`
      const binds: any = {}

      if (filters.name) {
        query += ` AND UPPER(p.name) LIKE UPPER('%' || :name || '%')`
        binds.name = filters.name
      }

      if (filters.position) {
        query += ` AND UPPER(p.position) LIKE UPPER('%' || :position || '%')`
        binds.position = filters.position
      }

      if (filters.email) {
        query += ` AND UPPER(p.email) LIKE UPPER('%' || :email || '%')`
        binds.email = filters.email
      }

      if (filters.subcontractorId) {
        query += ` AND p.subcontractor_id = :subcontractorId`
        binds.subcontractorId = filters.subcontractorId
      }

      if (filters.subcontractorName) {
        query += ` AND UPPER(s.name) LIKE UPPER('%' || :subcontractorName || '%')`
        binds.subcontractorName = filters.subcontractorName
      }

      query += ` ORDER BY p.created_at DESC`

      const result = await connection.execute(
        query,
        binds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        id: row.ID,
        subcontractorId: row.SUBCONTRACTOR_ID,
        name: row.NAME,
        position: row.POSITION,
        phone: row.PHONE,
        email: row.EMAIL,
        employeeId: row.EMPLOYEE_ID,
        createdAt: row.CREATED_AT,
        subcontractorName: row.SUBCONTRACTOR_NAME
      }))
    } catch (error) {
      console.error('Error finding personnel:', error)
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

  async findBySubcontractor(subcontractorId: number): Promise<Personnel[]> {
    return this.findAll({ subcontractorId })
  }

  async update(id: number, data: UpdatePersonnelData): Promise<Personnel | null> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const setParts: string[] = []
      const binds: any = { id }

      if (data.subcontractorId !== undefined) {
        setParts.push('subcontractor_id = :subcontractorId')
        binds.subcontractorId = data.subcontractorId
      }

      if (data.name !== undefined) {
        setParts.push('name = :name')
        binds.name = data.name
      }

      if (data.position !== undefined) {
        setParts.push('position = :position')
        binds.position = data.position
      }

      if (data.phone !== undefined) {
        setParts.push('phone = :phone')
        binds.phone = data.phone
      }

      if (data.email !== undefined) {
        setParts.push('email = :email')
        binds.email = data.email
      }

      if (data.employeeId !== undefined) {
        setParts.push('employee_id = :employeeId')
        binds.employeeId = data.employeeId
      }

      if (setParts.length === 0) {
        return await this.findById(id)
      }

      const query = `UPDATE PERSONNEL SET ${setParts.join(', ')} WHERE id = :id`
      
      await connection.execute(query, binds)
      await connection.commit()

      return await this.findById(id)
    } catch (error) {
      console.error('Error updating personnel:', error)
      if (connection) {
        await connection.rollback()
      }
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

  async delete(id: number): Promise<boolean> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `DELETE FROM PERSONNEL WHERE id = :id`,
        { id }
      )

      await connection.commit()
      
      return (result.rowsAffected || 0) > 0
    } catch (error) {
      console.error('Error deleting personnel:', error)
      if (connection) {
        await connection.rollback()
      }
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
}

export const personnelRepository = new PersonnelRepository()