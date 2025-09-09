import oracledb from 'oracledb'
import { DatabaseError, getStandardErrorMessage } from '../lib/errors'

export interface Attendance {
  id: number
  personnelId: number
  projectId: number
  checkInTime: Date | null
  checkOutTime: Date | null
  workDate: Date
  hoursWorked: number | null
  workType: string | null
  createdAt: Date
  personnelName?: string
  personnelPosition?: string
  subcontractorName?: string
}

export interface CreateAttendanceData {
  personnelId: number
  projectId: number
  checkInTime?: Date
  checkOutTime?: Date
  workDate: Date
  hoursWorked?: number
  workType?: string
}

export interface UpdateAttendanceData {
  personnelId?: number
  projectId?: number
  checkInTime?: Date
  checkOutTime?: Date
  workDate?: Date
  hoursWorked?: number
  workType?: string
}

export interface AttendanceFilters {
  projectId?: number
  personnelId?: number
  startDate?: Date
  endDate?: Date
  workType?: string
}

export interface AttendanceStats {
  totalHours: number
  totalDays: number
  averageHoursPerDay: number
  workTypeBreakdown: { [key: string]: number }
  personnelStats: {
    personnelId: number
    personnelName: string
    totalHours: number
    totalDays: number
  }[]
}

class AttendanceRepository {
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

  async create(data: CreateAttendanceData): Promise<Attendance> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      // Auto-calculate hours worked if check-in and check-out times are provided
      let hoursWorked = data.hoursWorked
      if (!hoursWorked && data.checkInTime && data.checkOutTime) {
        const timeDiff = data.checkOutTime.getTime() - data.checkInTime.getTime()
        hoursWorked = Math.round((timeDiff / (1000 * 60 * 60)) * 100) / 100 // Round to 2 decimal places
      }
      
      const result = await connection.execute(
        `INSERT INTO ATTENDANCE (personnel_id, project_id, check_in_time, check_out_time, 
                                work_date, hours_worked, work_type)
         VALUES (:personnelId, :projectId, :checkInTime, :checkOutTime, 
                 :workDate, :hoursWorked, :workType)
         RETURNING id INTO :id`,
        {
          personnelId: data.personnelId,
          projectId: data.projectId,
          checkInTime: data.checkInTime || null,
          checkOutTime: data.checkOutTime || null,
          workDate: data.workDate,
          hoursWorked: hoursWorked || null,
          workType: data.workType || null,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      )

      await connection.commit()

      const insertedId = result.outBinds?.id as number
      const created = await this.findById(insertedId)
      
      if (!created) {
        throw new DatabaseError('Failed to retrieve created attendance record', 'DATABASE_QUERY_FAILED')
      }

      return created
    } catch (error) {
      console.error('Error creating attendance record:', error)
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

  async findById(id: number): Promise<Attendance | null> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT a.id, a.personnel_id, a.project_id, a.check_in_time, a.check_out_time,
                a.work_date, a.hours_worked, a.work_type, a.created_at,
                p.name as personnel_name, p.position as personnel_position,
                s.name as subcontractor_name
         FROM ATTENDANCE a
         LEFT JOIN PERSONNEL p ON a.personnel_id = p.id
         LEFT JOIN SUBCONTRACTORS s ON p.subcontractor_id = s.id
         WHERE a.id = :id`,
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows || result.rows.length === 0) {
        return null
      }

      const row = result.rows[0] as any
      return {
        id: row.ID,
        personnelId: row.PERSONNEL_ID,
        projectId: row.PROJECT_ID,
        checkInTime: row.CHECK_IN_TIME,
        checkOutTime: row.CHECK_OUT_TIME,
        workDate: row.WORK_DATE,
        hoursWorked: row.HOURS_WORKED,
        workType: row.WORK_TYPE,
        createdAt: row.CREATED_AT,
        personnelName: row.PERSONNEL_NAME,
        personnelPosition: row.PERSONNEL_POSITION,
        subcontractorName: row.SUBCONTRACTOR_NAME
      }
    } catch (error) {
      console.error('Error finding attendance by id:', error)
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

  async findAll(filters: AttendanceFilters = {}): Promise<Attendance[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      let query = `SELECT a.id, a.personnel_id, a.project_id, a.check_in_time, a.check_out_time,
                          a.work_date, a.hours_worked, a.work_type, a.created_at,
                          p.name as personnel_name, p.position as personnel_position,
                          s.name as subcontractor_name
                   FROM ATTENDANCE a
                   LEFT JOIN PERSONNEL p ON a.personnel_id = p.id
                   LEFT JOIN SUBCONTRACTORS s ON p.subcontractor_id = s.id
                   WHERE 1=1`
      const binds: any = {}

      if (filters.projectId) {
        query += ` AND a.project_id = :projectId`
        binds.projectId = filters.projectId
      }

      if (filters.personnelId) {
        query += ` AND a.personnel_id = :personnelId`
        binds.personnelId = filters.personnelId
      }

      if (filters.startDate) {
        query += ` AND a.work_date >= :startDate`
        binds.startDate = filters.startDate
      }

      if (filters.endDate) {
        query += ` AND a.work_date <= :endDate`
        binds.endDate = filters.endDate
      }

      if (filters.workType) {
        query += ` AND a.work_type = :workType`
        binds.workType = filters.workType
      }

      query += ` ORDER BY a.work_date DESC, a.check_in_time DESC`

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
        personnelId: row.PERSONNEL_ID,
        projectId: row.PROJECT_ID,
        checkInTime: row.CHECK_IN_TIME,
        checkOutTime: row.CHECK_OUT_TIME,
        workDate: row.WORK_DATE,
        hoursWorked: row.HOURS_WORKED,
        workType: row.WORK_TYPE,
        createdAt: row.CREATED_AT,
        personnelName: row.PERSONNEL_NAME,
        personnelPosition: row.PERSONNEL_POSITION,
        subcontractorName: row.SUBCONTRACTOR_NAME
      }))
    } catch (error) {
      console.error('Error finding attendance records:', error)
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

  async update(id: number, data: UpdateAttendanceData): Promise<Attendance | null> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const setParts: string[] = []
      const binds: any = { id }

      if (data.personnelId !== undefined) {
        setParts.push('personnel_id = :personnelId')
        binds.personnelId = data.personnelId
      }

      if (data.projectId !== undefined) {
        setParts.push('project_id = :projectId')
        binds.projectId = data.projectId
      }

      if (data.checkInTime !== undefined) {
        setParts.push('check_in_time = :checkInTime')
        binds.checkInTime = data.checkInTime
      }

      if (data.checkOutTime !== undefined) {
        setParts.push('check_out_time = :checkOutTime')
        binds.checkOutTime = data.checkOutTime
      }

      if (data.workDate !== undefined) {
        setParts.push('work_date = :workDate')
        binds.workDate = data.workDate
      }

      if (data.hoursWorked !== undefined) {
        setParts.push('hours_worked = :hoursWorked')
        binds.hoursWorked = data.hoursWorked
      }

      if (data.workType !== undefined) {
        setParts.push('work_type = :workType')
        binds.workType = data.workType
      }

      // Auto-calculate hours worked if both times are provided
      if (data.checkInTime !== undefined && data.checkOutTime !== undefined && data.hoursWorked === undefined) {
        const current = await this.findById(id)
        if (current) {
          const checkIn = data.checkInTime || current.checkInTime
          const checkOut = data.checkOutTime || current.checkOutTime
          if (checkIn && checkOut) {
            const timeDiff = checkOut.getTime() - checkIn.getTime()
            const hoursWorked = Math.round((timeDiff / (1000 * 60 * 60)) * 100) / 100
            setParts.push('hours_worked = :hoursWorked')
            binds.hoursWorked = hoursWorked
          }
        }
      }

      if (setParts.length === 0) {
        return await this.findById(id)
      }

      const query = `UPDATE ATTENDANCE SET ${setParts.join(', ')} WHERE id = :id`
      
      await connection.execute(query, binds)
      await connection.commit()

      return await this.findById(id)
    } catch (error) {
      console.error('Error updating attendance record:', error)
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
        `DELETE FROM ATTENDANCE WHERE id = :id`,
        { id }
      )

      await connection.commit()
      
      return (result.rowsAffected || 0) > 0
    } catch (error) {
      console.error('Error deleting attendance record:', error)
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

  async getStats(projectId?: number, startDate?: Date, endDate?: Date): Promise<AttendanceStats> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      let whereClause = 'WHERE 1=1'
      const binds: any = {}

      if (projectId) {
        whereClause += ' AND a.project_id = :projectId'
        binds.projectId = projectId
      }

      if (startDate) {
        whereClause += ' AND a.work_date >= :startDate'
        binds.startDate = startDate
      }

      if (endDate) {
        whereClause += ' AND a.work_date <= :endDate'
        binds.endDate = endDate
      }

      // Get total stats
      const totalStatsResult = await connection.execute(
        `SELECT 
           COALESCE(SUM(a.hours_worked), 0) as total_hours,
           COUNT(DISTINCT a.work_date || '_' || a.personnel_id) as total_days
         FROM ATTENDANCE a
         ${whereClause}`,
        binds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      // Get work type breakdown
      const workTypeResult = await connection.execute(
        `SELECT 
           COALESCE(a.work_type, 'Unknown') as work_type,
           COALESCE(SUM(a.hours_worked), 0) as hours
         FROM ATTENDANCE a
         ${whereClause}
         GROUP BY a.work_type`,
        binds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      // Get personnel stats
      const personnelStatsResult = await connection.execute(
        `SELECT 
           a.personnel_id,
           p.name as personnel_name,
           COALESCE(SUM(a.hours_worked), 0) as total_hours,
           COUNT(DISTINCT a.work_date) as total_days
         FROM ATTENDANCE a
         LEFT JOIN PERSONNEL p ON a.personnel_id = p.id
         ${whereClause}
         GROUP BY a.personnel_id, p.name
         ORDER BY total_hours DESC`,
        binds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      const totalStats = totalStatsResult.rows?.[0] as any
      const totalHours = totalStats?.TOTAL_HOURS || 0
      const totalDays = totalStats?.TOTAL_DAYS || 0

      const workTypeBreakdown: { [key: string]: number } = {}
      workTypeResult.rows?.forEach((row: any) => {
        workTypeBreakdown[row.WORK_TYPE] = row.HOURS
      })

      const personnelStats = personnelStatsResult.rows?.map((row: any) => ({
        personnelId: row.PERSONNEL_ID,
        personnelName: row.PERSONNEL_NAME || 'Unknown',
        totalHours: row.TOTAL_HOURS || 0,
        totalDays: row.TOTAL_DAYS || 0
      })) || []

      return {
        totalHours,
        totalDays,
        averageHoursPerDay: totalDays > 0 ? Math.round((totalHours / totalDays) * 100) / 100 : 0,
        workTypeBreakdown,
        personnelStats
      }
    } catch (error) {
      console.error('Error getting attendance stats:', error)
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

  async checkDuplicateEntry(personnelId: number, projectId: number, workDate: Date, excludeId?: number): Promise<boolean> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      let query = `SELECT COUNT(*) as count FROM ATTENDANCE 
                   WHERE personnel_id = :personnelId AND project_id = :projectId 
                   AND work_date = :workDate`
      const binds: any = {
        personnelId,
        projectId,
        workDate
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
      console.error('Error checking duplicate attendance entry:', error)
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

export const attendanceRepository = new AttendanceRepository()