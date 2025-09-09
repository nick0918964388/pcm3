import oracledb from 'oracledb'
import { DatabaseError, getStandardErrorMessage } from '../lib/errors'

export interface DutyRoster {
  id: number
  projectId: number
  personnelId: number
  dutyDate: Date
  shiftType: string
  notes: string | null
  createdAt: Date
  personnelName?: string
  personnelPosition?: string
  subcontractorName?: string
}

export interface CreateDutyRosterData {
  projectId: number
  personnelId: number
  dutyDate: Date
  shiftType: string
  notes?: string
}

export interface UpdateDutyRosterData {
  projectId?: number
  personnelId?: number
  dutyDate?: Date
  shiftType?: string
  notes?: string
}

export interface DutyRosterFilters {
  projectId?: number
  personnelId?: number
  startDate?: Date
  endDate?: Date
  shiftType?: string
}

class DutyRosterRepository {
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

  async create(data: CreateDutyRosterData): Promise<DutyRoster> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      // Check for conflicts (same person, same date, same shift)
      const conflictCheck = await connection.execute(
        `SELECT COUNT(*) as count FROM DUTY_ROSTERS 
         WHERE project_id = :projectId AND personnel_id = :personnelId 
         AND duty_date = :dutyDate AND shift_type = :shiftType`,
        {
          projectId: data.projectId,
          personnelId: data.personnelId,
          dutyDate: data.dutyDate,
          shiftType: data.shiftType
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      const conflictRow = conflictCheck.rows?.[0] as any
      if (conflictRow?.COUNT > 0) {
        throw new DatabaseError('Personnel already assigned to this shift on this date', 'CONFLICT_ERROR')
      }
      
      const result = await connection.execute(
        `INSERT INTO DUTY_ROSTERS (project_id, personnel_id, duty_date, shift_type, notes)
         VALUES (:projectId, :personnelId, :dutyDate, :shiftType, :notes)
         RETURNING id INTO :id`,
        {
          projectId: data.projectId,
          personnelId: data.personnelId,
          dutyDate: data.dutyDate,
          shiftType: data.shiftType,
          notes: data.notes || null,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      )

      await connection.commit()

      const insertedId = result.outBinds?.id as number
      const created = await this.findById(insertedId)
      
      if (!created) {
        throw new DatabaseError('Failed to retrieve created duty roster', 'DATABASE_QUERY_FAILED')
      }

      return created
    } catch (error) {
      console.error('Error creating duty roster:', error)
      if (connection) {
        await connection.rollback()
      }
      
      if (error instanceof DatabaseError) {
        throw error
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

  async findById(id: number): Promise<DutyRoster | null> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT dr.id, dr.project_id, dr.personnel_id, dr.duty_date, 
                dr.shift_type, dr.notes, dr.created_at,
                p.name as personnel_name, p.position as personnel_position,
                s.name as subcontractor_name
         FROM DUTY_ROSTERS dr
         LEFT JOIN PERSONNEL p ON dr.personnel_id = p.id
         LEFT JOIN SUBCONTRACTORS s ON p.subcontractor_id = s.id
         WHERE dr.id = :id`,
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows || result.rows.length === 0) {
        return null
      }

      const row = result.rows[0] as any
      return {
        id: row.ID,
        projectId: row.PROJECT_ID,
        personnelId: row.PERSONNEL_ID,
        dutyDate: row.DUTY_DATE,
        shiftType: row.SHIFT_TYPE,
        notes: row.NOTES,
        createdAt: row.CREATED_AT,
        personnelName: row.PERSONNEL_NAME,
        personnelPosition: row.PERSONNEL_POSITION,
        subcontractorName: row.SUBCONTRACTOR_NAME
      }
    } catch (error) {
      console.error('Error finding duty roster by id:', error)
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

  async findAll(filters: DutyRosterFilters = {}): Promise<DutyRoster[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      let query = `SELECT dr.id, dr.project_id, dr.personnel_id, dr.duty_date, 
                          dr.shift_type, dr.notes, dr.created_at,
                          p.name as personnel_name, p.position as personnel_position,
                          s.name as subcontractor_name
                   FROM DUTY_ROSTERS dr
                   LEFT JOIN PERSONNEL p ON dr.personnel_id = p.id
                   LEFT JOIN SUBCONTRACTORS s ON p.subcontractor_id = s.id
                   WHERE 1=1`
      const binds: any = {}

      if (filters.projectId) {
        query += ` AND dr.project_id = :projectId`
        binds.projectId = filters.projectId
      }

      if (filters.personnelId) {
        query += ` AND dr.personnel_id = :personnelId`
        binds.personnelId = filters.personnelId
      }

      if (filters.startDate) {
        query += ` AND dr.duty_date >= :startDate`
        binds.startDate = filters.startDate
      }

      if (filters.endDate) {
        query += ` AND dr.duty_date <= :endDate`
        binds.endDate = filters.endDate
      }

      if (filters.shiftType) {
        query += ` AND dr.shift_type = :shiftType`
        binds.shiftType = filters.shiftType
      }

      query += ` ORDER BY dr.duty_date ASC, dr.shift_type ASC`

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
        projectId: row.PROJECT_ID,
        personnelId: row.PERSONNEL_ID,
        dutyDate: row.DUTY_DATE,
        shiftType: row.SHIFT_TYPE,
        notes: row.NOTES,
        createdAt: row.CREATED_AT,
        personnelName: row.PERSONNEL_NAME,
        personnelPosition: row.PERSONNEL_POSITION,
        subcontractorName: row.SUBCONTRACTOR_NAME
      }))
    } catch (error) {
      console.error('Error finding duty rosters:', error)
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

  async findByProjectAndDateRange(projectId: number, startDate: Date, endDate: Date): Promise<DutyRoster[]> {
    return this.findAll({ projectId, startDate, endDate })
  }

  async update(id: number, data: UpdateDutyRosterData): Promise<DutyRoster | null> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      // Check for conflicts if personnel, date, or shift is being updated
      if (data.personnelId || data.dutyDate || data.shiftType) {
        const current = await this.findById(id)
        if (!current) {
          return null
        }

        const conflictCheck = await connection.execute(
          `SELECT COUNT(*) as count FROM DUTY_ROSTERS 
           WHERE project_id = :projectId AND personnel_id = :personnelId 
           AND duty_date = :dutyDate AND shift_type = :shiftType AND id != :id`,
          {
            projectId: data.projectId || current.projectId,
            personnelId: data.personnelId || current.personnelId,
            dutyDate: data.dutyDate || current.dutyDate,
            shiftType: data.shiftType || current.shiftType,
            id
          },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        const conflictRow = conflictCheck.rows?.[0] as any
        if (conflictRow?.COUNT > 0) {
          throw new DatabaseError('Personnel already assigned to this shift on this date', 'CONFLICT_ERROR')
        }
      }
      
      const setParts: string[] = []
      const binds: any = { id }

      if (data.projectId !== undefined) {
        setParts.push('project_id = :projectId')
        binds.projectId = data.projectId
      }

      if (data.personnelId !== undefined) {
        setParts.push('personnel_id = :personnelId')
        binds.personnelId = data.personnelId
      }

      if (data.dutyDate !== undefined) {
        setParts.push('duty_date = :dutyDate')
        binds.dutyDate = data.dutyDate
      }

      if (data.shiftType !== undefined) {
        setParts.push('shift_type = :shiftType')
        binds.shiftType = data.shiftType
      }

      if (data.notes !== undefined) {
        setParts.push('notes = :notes')
        binds.notes = data.notes
      }

      if (setParts.length === 0) {
        return await this.findById(id)
      }

      const query = `UPDATE DUTY_ROSTERS SET ${setParts.join(', ')} WHERE id = :id`
      
      await connection.execute(query, binds)
      await connection.commit()

      return await this.findById(id)
    } catch (error) {
      console.error('Error updating duty roster:', error)
      if (connection) {
        await connection.rollback()
      }
      
      if (error instanceof DatabaseError) {
        throw error
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
        `DELETE FROM DUTY_ROSTERS WHERE id = :id`,
        { id }
      )

      await connection.commit()
      
      return (result.rowsAffected || 0) > 0
    } catch (error) {
      console.error('Error deleting duty roster:', error)
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

  async checkConflicts(projectId: number, personnelId: number, dutyDate: Date, shiftType: string, excludeId?: number): Promise<boolean> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      let query = `SELECT COUNT(*) as count FROM DUTY_ROSTERS 
                   WHERE project_id = :projectId AND personnel_id = :personnelId 
                   AND duty_date = :dutyDate AND shift_type = :shiftType`
      const binds: any = {
        projectId,
        personnelId,
        dutyDate,
        shiftType
      }

      if (excludeId) {
        query += ` AND id != :excludeId`
        binds.excludeId = excludeId
      }

      const result = await connection.execute(
        query,
        binds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      const row = result.rows?.[0] as any
      return (row?.COUNT || 0) > 0
    } catch (error) {
      console.error('Error checking duty roster conflicts:', error)
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

export const dutyRosterRepository = new DutyRosterRepository()