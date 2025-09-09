import oracledb from 'oracledb'
import { DatabaseError, getStandardErrorMessage } from '../lib/errors'

export interface ReportAttachment {
  id: number
  dailyReportId: number
  filename: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedAt: Date
}

export interface CreateAttachmentRequest {
  dailyReportId: number
  filename: string
  filePath: string
  fileSize: number
  mimeType: string
}

class ReportAttachmentRepository {
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

  async create(data: CreateAttachmentRequest): Promise<ReportAttachment> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `INSERT INTO report_attachments (daily_report_id, filename, file_path, file_size, mime_type, uploaded_at)
         VALUES (:dailyReportId, :filename, :filePath, :fileSize, :mimeType, CURRENT_TIMESTAMP)
         RETURNING id INTO :id`,
        {
          dailyReportId: data.dailyReportId,
          filename: data.filename,
          filePath: data.filePath,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
        }
      )

      await connection.commit()
      
      const insertId = result.outBinds?.id[0]
      if (!insertId) {
        throw new Error('Failed to get inserted attachment ID')
      }

      return await this.findById(insertId)
    } catch (error) {
      console.error('Error creating attachment:', error)
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

  async findById(id: number): Promise<ReportAttachment> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT id, daily_report_id, filename, file_path, file_size, mime_type, uploaded_at
         FROM report_attachments 
         WHERE id = :id`,
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows || result.rows.length === 0) {
        throw new Error('Attachment not found')
      }

      const row = result.rows[0] as any
      return {
        id: row.ID,
        dailyReportId: row.DAILY_REPORT_ID,
        filename: row.FILENAME,
        filePath: row.FILE_PATH,
        fileSize: row.FILE_SIZE,
        mimeType: row.MIME_TYPE,
        uploadedAt: row.UPLOADED_AT
      }
    } catch (error) {
      console.error('Error finding attachment by ID:', error)
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

  async findByReportId(dailyReportId: number): Promise<ReportAttachment[]> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      const result = await connection.execute(
        `SELECT id, daily_report_id, filename, file_path, file_size, mime_type, uploaded_at
         FROM report_attachments 
         WHERE daily_report_id = :dailyReportId
         ORDER BY uploaded_at DESC`,
        { dailyReportId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        id: row.ID,
        dailyReportId: row.DAILY_REPORT_ID,
        filename: row.FILENAME,
        filePath: row.FILE_PATH,
        fileSize: row.FILE_SIZE,
        mimeType: row.MIME_TYPE,
        uploadedAt: row.UPLOADED_AT
      }))
    } catch (error) {
      console.error('Error finding attachments by report ID:', error)
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
        `DELETE FROM report_attachments WHERE id = :id`,
        { id }
      )

      if (result.rowsAffected === 0) {
        throw new Error('Attachment not found')
      }

      await connection.commit()
    } catch (error) {
      console.error('Error deleting attachment:', error)
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

  async deleteByReportId(dailyReportId: number): Promise<void> {
    let connection
    
    try {
      connection = await this.getConnection()
      
      await connection.execute(
        `DELETE FROM report_attachments WHERE daily_report_id = :dailyReportId`,
        { dailyReportId }
      )

      await connection.commit()
    } catch (error) {
      console.error('Error deleting attachments by report ID:', error)
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

export const reportAttachmentRepository = new ReportAttachmentRepository()