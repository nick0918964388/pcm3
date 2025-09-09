import oracledb from 'oracledb'
import { DatabaseError, getStandardErrorMessage } from '../lib/errors'

export interface DailyReport {
  id: number
  projectId: number
  reportedBy: number
  reportDate: Date
  content?: string
  weather?: string
  progressNotes?: string
  issues?: string
  status: 'draft' | 'submitted' | 'reviewed' | 'rejected'
  reviewedBy?: number
  reviewedAt?: Date
  reviewComment?: string
  createdAt: Date
}

export interface CreateDailyReportRequest {
  projectId: number
  reportedBy: number
  reportDate: Date
  content?: string
  weather?: string
  progressNotes?: string
  issues?: string
}

export interface UpdateDailyReportRequest {
  content?: string
  weather?: string
  progressNotes?: string
  issues?: string
  status?: 'draft' | 'submitted' | 'reviewed' | 'rejected'
  reviewedBy?: number
  reviewComment?: string
}

class DailyReportRepository {
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

  async create(data: CreateDailyReportRequest): Promise<DailyReport> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `INSERT INTO daily_reports (project_id, reported_by, report_date, content, weather, progress_notes, issues, status, created_at)
         VALUES (:projectId, :reportedBy, :reportDate, :content, :weather, :progressNotes, :issues, 'draft', CURRENT_TIMESTAMP)
         RETURNING id INTO :id`,
        {
          projectId: data.projectId,
          reportedBy: data.reportedBy,
          reportDate: data.reportDate,
          content: data.content || null,
          weather: data.weather || null,
          progressNotes: data.progressNotes || null,
          issues: data.issues || null,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        }
      )

      await connection.commit()
      
      const insertId = result.outBinds?.id[0]
      if (!insertId) {
        throw new Error('Failed to get inserted report ID')
      }

      return await this.findById(insertId)
    } catch (error) {
      console.error('Error creating daily report:', error)
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

  async findById(id: number): Promise<DailyReport> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT id, project_id, reported_by, report_date, content, weather, progress_notes, issues, status, reviewed_by, reviewed_at, created_at
         FROM daily_reports 
         WHERE id = :id`,
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Daily report not found')
      }

      const row = result.rows[0] as any
      return {
        id: row.ID,
        projectId: row.PROJECT_ID,
        reportedBy: row.REPORTED_BY,
        reportDate: row.REPORT_DATE,
        content: row.CONTENT,
        weather: row.WEATHER,
        progressNotes: row.PROGRESS_NOTES,
        issues: row.ISSUES,
        status: row.STATUS,
        reviewedBy: row.REVIEWED_BY,
        reviewedAt: row.REVIEWED_AT,
        reviewComment: null, // Would come from reviews table in production
        createdAt: row.CREATED_AT
      }
    } catch (error) {
      console.error('Error finding daily report by ID:', error)
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

  async findByProjectId(projectId: number, offset: number = 0, limit: number = 50): Promise<DailyReport[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT id, project_id, reported_by, report_date, content, weather, progress_notes, issues, status, reviewed_by, reviewed_at, created_at
         FROM daily_reports 
         WHERE project_id = :projectId
         ORDER BY report_date DESC, created_at DESC
         OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
        { projectId, offset, limit },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        id: row.ID,
        projectId: row.PROJECT_ID,
        reportedBy: row.REPORTED_BY,
        reportDate: row.REPORT_DATE,
        content: row.CONTENT,
        weather: row.WEATHER,
        progressNotes: row.PROGRESS_NOTES,
        issues: row.ISSUES,
        status: row.STATUS,
        reviewedBy: row.REVIEWED_BY,
        reviewedAt: row.REVIEWED_AT,
        reviewComment: null, // Would come from reviews table in production
        createdAt: row.CREATED_AT
      }))
    } catch (error) {
      console.error('Error finding daily reports by project ID:', error)
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

  async update(id: number, data: UpdateDailyReportRequest): Promise<DailyReport> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const updateFields: string[] = []
      const updateValues: any = { id }
      
      if (data.content !== undefined) {
        updateFields.push('content = :content')
        updateValues.content = data.content
      }
      
      if (data.weather !== undefined) {
        updateFields.push('weather = :weather')
        updateValues.weather = data.weather
      }
      
      if (data.progressNotes !== undefined) {
        updateFields.push('progress_notes = :progressNotes')
        updateValues.progressNotes = data.progressNotes
      }
      
      if (data.issues !== undefined) {
        updateFields.push('issues = :issues')
        updateValues.issues = data.issues
      }
      
      if (data.status !== undefined) {
        updateFields.push('status = :status')
        updateValues.status = data.status
      }
      
      if (data.reviewedBy !== undefined) {
        updateFields.push('reviewed_by = :reviewedBy')
        updateValues.reviewedBy = data.reviewedBy
        updateFields.push('reviewed_at = CURRENT_TIMESTAMP')
      }
      
      // Note: reviewComment would be stored separately in a reviews table in production
      // For now, we'll handle the review workflow without persisting comments

      if (updateFields.length === 0) {
        return await this.findById(id)
      }

      await connection.execute(
        `UPDATE daily_reports 
         SET ${updateFields.join(', ')}
         WHERE id = :id`,
        updateValues
      )

      await connection.commit()
      
      return await this.findById(id)
    } catch (error) {
      console.error('Error updating daily report:', error)
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

  async delete(id: number): Promise<void> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `DELETE FROM daily_reports WHERE id = :id`,
        { id }
      )

      if (result.rowsAffected === 0) {
        throw new Error('Daily report not found')
      }

      await connection.commit()
    } catch (error) {
      console.error('Error deleting daily report:', error)
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

  async findByStatus(projectId: number, status: string, offset: number = 0, limit: number = 50): Promise<DailyReport[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT id, project_id, reported_by, report_date, content, weather, progress_notes, issues, status, reviewed_by, reviewed_at, created_at
         FROM daily_reports 
         WHERE project_id = :projectId AND status = :status
         ORDER BY report_date DESC, created_at DESC
         OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
        { projectId, status, offset, limit },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        id: row.ID,
        projectId: row.PROJECT_ID,
        reportedBy: row.REPORTED_BY,
        reportDate: row.REPORT_DATE,
        content: row.CONTENT,
        weather: row.WEATHER,
        progressNotes: row.PROGRESS_NOTES,
        issues: row.ISSUES,
        status: row.STATUS,
        reviewedBy: row.REVIEWED_BY,
        reviewedAt: row.REVIEWED_AT,
        reviewComment: null, // Would come from reviews table in production
        createdAt: row.CREATED_AT
      }))
    } catch (error) {
      console.error('Error finding daily reports by status:', error)
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

export const dailyReportRepository = new DailyReportRepository()