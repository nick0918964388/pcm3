import oracledb from 'oracledb'
import { DatabaseError, getStandardErrorMessage } from '../lib/errors'

export interface Subcontractor {
  id: number
  name: string
  contactPerson: string | null
  phone: string | null
  email: string | null
  address: string | null
  createdAt: Date
}

export interface CreateSubcontractorData {
  name: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
}

export interface UpdateSubcontractorData {
  name?: string
  contactPerson?: string
  phone?: string
  email?: string
  address?: string
}

export interface SubcontractorSearchFilters {
  name?: string
  contactPerson?: string
  email?: string
}

class SubcontractorRepository {
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

  async create(data: CreateSubcontractorData): Promise<Subcontractor> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `INSERT INTO SUBCONTRACTORS (name, contact_person, phone, email, address)
         VALUES (:name, :contactPerson, :phone, :email, :address)
         RETURNING id INTO :id`,
        {
          name: data.name,
          contactPerson: data.contactPerson || null,
          phone: data.phone || null,
          email: data.email || null,
          address: data.address || null,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      )

      await connection.commit()

      const insertedId = result.outBinds?.id as number
      const created = await this.findById(insertedId)
      
      if (!created) {
        throw new DatabaseError('Failed to retrieve created subcontractor', 'DATABASE_QUERY_FAILED')
      }

      return created
    } catch (error) {
      console.error('Error creating subcontractor:', error)
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

  async findById(id: number): Promise<Subcontractor | null> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT id, name, contact_person, phone, email, address, created_at 
         FROM SUBCONTRACTORS 
         WHERE id = :id`,
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows || result.rows.length === 0) {
        return null
      }

      const row = result.rows[0] as any
      return {
        id: row.ID,
        name: row.NAME,
        contactPerson: row.CONTACT_PERSON,
        phone: row.PHONE,
        email: row.EMAIL,
        address: row.ADDRESS,
        createdAt: row.CREATED_AT
      }
    } catch (error) {
      console.error('Error finding subcontractor by id:', error)
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

  async findAll(filters: SubcontractorSearchFilters = {}): Promise<Subcontractor[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      let query = `SELECT id, name, contact_person, phone, email, address, created_at 
                   FROM SUBCONTRACTORS WHERE 1=1`
      const binds: any = {}

      if (filters.name) {
        query += ` AND UPPER(name) LIKE UPPER('%' || :name || '%')`
        binds.name = filters.name
      }

      if (filters.contactPerson) {
        query += ` AND UPPER(contact_person) LIKE UPPER('%' || :contactPerson || '%')`
        binds.contactPerson = filters.contactPerson
      }

      if (filters.email) {
        query += ` AND UPPER(email) LIKE UPPER('%' || :email || '%')`
        binds.email = filters.email
      }

      query += ` ORDER BY created_at DESC`

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
        name: row.NAME,
        contactPerson: row.CONTACT_PERSON,
        phone: row.PHONE,
        email: row.EMAIL,
        address: row.ADDRESS,
        createdAt: row.CREATED_AT
      }))
    } catch (error) {
      console.error('Error finding subcontractors:', error)
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

  async update(id: number, data: UpdateSubcontractorData): Promise<Subcontractor | null> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const setParts: string[] = []
      const binds: any = { id }

      if (data.name !== undefined) {
        setParts.push('name = :name')
        binds.name = data.name
      }

      if (data.contactPerson !== undefined) {
        setParts.push('contact_person = :contactPerson')
        binds.contactPerson = data.contactPerson
      }

      if (data.phone !== undefined) {
        setParts.push('phone = :phone')
        binds.phone = data.phone
      }

      if (data.email !== undefined) {
        setParts.push('email = :email')
        binds.email = data.email
      }

      if (data.address !== undefined) {
        setParts.push('address = :address')
        binds.address = data.address
      }

      if (setParts.length === 0) {
        return await this.findById(id)
      }

      const query = `UPDATE SUBCONTRACTORS SET ${setParts.join(', ')} WHERE id = :id`
      
      await connection.execute(query, binds)
      await connection.commit()

      return await this.findById(id)
    } catch (error) {
      console.error('Error updating subcontractor:', error)
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
        `DELETE FROM SUBCONTRACTORS WHERE id = :id`,
        { id }
      )

      await connection.commit()
      
      return (result.rowsAffected || 0) > 0
    } catch (error) {
      console.error('Error deleting subcontractor:', error)
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

export const subcontractorRepository = new SubcontractorRepository()