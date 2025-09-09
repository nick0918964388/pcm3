import oracledb from 'oracledb'
import { DatabaseError, getStandardErrorMessage } from '../lib/errors'
import { WBSChangeLog } from '@shared/types'

class WBSChangeLogRepository {
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

  async create(changeLog: Omit<WBSChangeLog, 'id' | 'changedAt'>): Promise<WBSChangeLog> {
    let connection

    try {
      connection = await this.getConnection()

      const result = await connection.execute(
        `INSERT INTO WBS_CHANGE_LOGS (wbs_item_id, changed_by, change_type, old_value, new_value, change_reason)
         VALUES (:wbsItemId, :changedBy, :changeType, :oldValue, :newValue, :changeReason)
         RETURNING id, changed_at INTO :id, :changedAt`,
        {
          wbsItemId: changeLog.wbsItemId,
          changedBy: changeLog.changedBy,
          changeType: changeLog.changeType,
          oldValue: changeLog.oldValue || null,
          newValue: changeLog.newValue || null,
          changeReason: changeLog.changeReason || null,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          changedAt: { type: oracledb.DATE, dir: oracledb.BIND_OUT }
        }
      )

      await connection.commit()

      const newLog: WBSChangeLog = {
        id: result.outBinds.id[0],
        wbsItemId: changeLog.wbsItemId,
        changedBy: changeLog.changedBy,
        changeType: changeLog.changeType,
        oldValue: changeLog.oldValue,
        newValue: changeLog.newValue,
        changeReason: changeLog.changeReason,
        changedAt: result.outBinds.changedAt[0]
      }

      return newLog
    } catch (error) {
      if (connection) {
        await connection.rollback()
      }
      console.error('Error creating WBS change log:', error)
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

  async findByWBSItemId(wbsItemId: number, limit?: number): Promise<WBSChangeLog[]> {
    let connection

    try {
      connection = await this.getConnection()

      let query = `SELECT id, wbs_item_id, changed_by, change_type, old_value, new_value, change_reason, changed_at
         FROM WBS_CHANGE_LOGS
         WHERE wbs_item_id = :wbsItemId
         ORDER BY changed_at DESC`
      
      const bindParams: any = { wbsItemId }
      
      if (limit) {
        query += ` FETCH FIRST :limit ROWS ONLY`
        bindParams.limit = limit
      }

      const result = await connection.execute(
        query,
        bindParams,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        id: row.ID,
        wbsItemId: row.WBS_ITEM_ID,
        changedBy: row.CHANGED_BY,
        changeType: row.CHANGE_TYPE,
        oldValue: row.OLD_VALUE,
        newValue: row.NEW_VALUE,
        changeReason: row.CHANGE_REASON,
        changedAt: row.CHANGED_AT
      }))
    } catch (error) {
      console.error('Error finding WBS change logs by item ID:', error)
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

  async findByProjectId(projectId: number, limit?: number): Promise<WBSChangeLog[]> {
    let connection

    try {
      connection = await this.getConnection()

      let query = `SELECT wcl.id, wcl.wbs_item_id, wcl.changed_by, wcl.change_type, wcl.old_value, wcl.new_value, wcl.change_reason, wcl.changed_at
         FROM WBS_CHANGE_LOGS wcl
         JOIN WBS_ITEMS wi ON wcl.wbs_item_id = wi.id
         WHERE wi.project_id = :projectId
         ORDER BY wcl.changed_at DESC`
      
      const bindParams: any = { projectId }
      
      if (limit) {
        query += ` FETCH FIRST :limit ROWS ONLY`
        bindParams.limit = limit
      }

      const result = await connection.execute(
        query,
        bindParams,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        id: row.ID,
        wbsItemId: row.WBS_ITEM_ID,
        changedBy: row.CHANGED_BY,
        changeType: row.CHANGE_TYPE,
        oldValue: row.OLD_VALUE,
        newValue: row.NEW_VALUE,
        changeReason: row.CHANGE_REASON,
        changedAt: row.CHANGED_AT
      }))
    } catch (error) {
      console.error('Error finding WBS change logs by project ID:', error)
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

  async logWBSChange(
    wbsItemId: number,
    changedBy: number,
    changeType: 'CREATE' | 'UPDATE' | 'DELETE' | 'REORDER',
    oldValue?: any,
    newValue?: any,
    changeReason?: string
  ): Promise<WBSChangeLog> {
    const changeLog: Omit<WBSChangeLog, 'id' | 'changedAt'> = {
      wbsItemId,
      changedBy,
      changeType,
      oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
      newValue: newValue ? JSON.stringify(newValue) : undefined,
      changeReason
    }

    return this.create(changeLog)
  }
}

export const wbsChangeLogRepository = new WBSChangeLogRepository()