import oracledb from 'oracledb'
import { DatabaseError, getStandardErrorMessage } from '../lib/errors'
import { WBSItem, WBSCreateRequest, WBSUpdateRequest, WBSReorderRequest } from '@shared/types'

class WBSRepository {
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

  async findByProjectId(projectId: number): Promise<WBSItem[]> {
    let connection

    try {
      connection = await this.getConnection()

      const result = await connection.execute(
        `SELECT id, project_id, parent_id, code, name, description, level_number, sort_order, created_at
         FROM WBS_ITEMS
         WHERE project_id = :projectId
         ORDER BY sort_order ASC`,
        { projectId },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (!result.rows) {
        return []
      }

      return result.rows.map((row: any) => ({
        id: row.ID,
        projectId: row.PROJECT_ID,
        parentId: row.PARENT_ID,
        code: row.CODE,
        name: row.NAME,
        description: row.DESCRIPTION,
        levelNumber: row.LEVEL_NUMBER,
        sortOrder: row.SORT_ORDER,
        createdAt: row.CREATED_AT
      }))
    } catch (error) {
      console.error('Error finding WBS items by project ID:', error)
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

  async findById(id: number): Promise<WBSItem | null> {
    let connection

    try {
      connection = await this.getConnection()

      const result = await connection.execute(
        `SELECT id, project_id, parent_id, code, name, description, level_number, sort_order, created_at
         FROM WBS_ITEMS
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
        projectId: row.PROJECT_ID,
        parentId: row.PARENT_ID,
        code: row.CODE,
        name: row.NAME,
        description: row.DESCRIPTION,
        levelNumber: row.LEVEL_NUMBER,
        sortOrder: row.SORT_ORDER,
        createdAt: row.CREATED_AT
      }
    } catch (error) {
      console.error('Error finding WBS item by ID:', error)
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

  async create(wbsData: WBSCreateRequest): Promise<WBSItem> {
    let connection

    try {
      connection = await this.getConnection()

      // Calculate level number based on parent
      let levelNumber = 1
      if (wbsData.parentId) {
        const parentResult = await connection.execute(
          `SELECT level_number FROM WBS_ITEMS WHERE id = :parentId`,
          { parentId: wbsData.parentId },
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )
        
        if (parentResult.rows && parentResult.rows.length > 0) {
          const parentRow = parentResult.rows[0] as any
          levelNumber = parentRow.LEVEL_NUMBER + 1
        }
      }

      // Get next sort order for the same parent
      let sortOrder = 0
      const sortOrderResult = await connection.execute(
        `SELECT COALESCE(MAX(sort_order), -1) + 1 as next_order
         FROM WBS_ITEMS
         WHERE project_id = :projectId AND (parent_id = :parentId OR (parent_id IS NULL AND :parentId IS NULL))`,
        { 
          projectId: wbsData.projectId, 
          parentId: wbsData.parentId || null 
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (sortOrderResult.rows && sortOrderResult.rows.length > 0) {
        const sortOrderRow = sortOrderResult.rows[0] as any
        sortOrder = sortOrderRow.NEXT_ORDER
      }

      const result = await connection.execute(
        `INSERT INTO WBS_ITEMS (project_id, parent_id, code, name, description, level_number, sort_order)
         VALUES (:projectId, :parentId, :code, :name, :description, :levelNumber, :sortOrder)
         RETURNING id, created_at INTO :id, :createdAt`,
        {
          projectId: wbsData.projectId,
          parentId: wbsData.parentId || null,
          code: wbsData.code,
          name: wbsData.name,
          description: wbsData.description || null,
          levelNumber,
          sortOrder,
          id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          createdAt: { type: oracledb.DATE, dir: oracledb.BIND_OUT }
        }
      )

      await connection.commit()

      const newItem: WBSItem = {
        id: result.outBinds.id[0],
        projectId: wbsData.projectId,
        parentId: wbsData.parentId,
        code: wbsData.code,
        name: wbsData.name,
        description: wbsData.description,
        levelNumber,
        sortOrder,
        createdAt: result.outBinds.createdAt[0]
      }

      return newItem
    } catch (error) {
      if (connection) {
        await connection.rollback()
      }
      console.error('Error creating WBS item:', error)
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

  async update(id: number, wbsData: WBSUpdateRequest): Promise<WBSItem | null> {
    let connection

    try {
      connection = await this.getConnection()

      // Build dynamic update query
      const updateFields: string[] = []
      const bindParams: any = { id }

      if (wbsData.code !== undefined) {
        updateFields.push('code = :code')
        bindParams.code = wbsData.code
      }
      if (wbsData.name !== undefined) {
        updateFields.push('name = :name')
        bindParams.name = wbsData.name
      }
      if (wbsData.description !== undefined) {
        updateFields.push('description = :description')
        bindParams.description = wbsData.description
      }

      if (updateFields.length === 0) {
        return await this.findById(id)
      }

      const updateQuery = `UPDATE WBS_ITEMS SET ${updateFields.join(', ')} WHERE id = :id`
      
      await connection.execute(updateQuery, bindParams)
      await connection.commit()

      return await this.findById(id)
    } catch (error) {
      if (connection) {
        await connection.rollback()
      }
      console.error('Error updating WBS item:', error)
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

      // Check if item has children
      const childrenResult = await connection.execute(
        `SELECT COUNT(*) as child_count FROM WBS_ITEMS WHERE parent_id = :id`,
        { id },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      )

      if (childrenResult.rows && childrenResult.rows.length > 0) {
        const childrenRow = childrenResult.rows[0] as any
        if (childrenRow.CHILD_COUNT > 0) {
          throw new DatabaseError('Cannot delete WBS item with children', 'ITEM_HAS_CHILDREN')
        }
      }

      const result = await connection.execute(
        `DELETE FROM WBS_ITEMS WHERE id = :id`,
        { id }
      )

      await connection.commit()
      return result.rowsAffected === 1
    } catch (error) {
      if (connection) {
        await connection.rollback()
      }
      console.error('Error deleting WBS item:', error)
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

  async reorder(id: number, reorderData: WBSReorderRequest): Promise<WBSItem | null> {
    let connection

    try {
      connection = await this.getConnection()

      // Get current item details
      const currentItem = await this.findById(id)
      if (!currentItem) {
        throw new DatabaseError('WBS item not found', 'ITEM_NOT_FOUND')
      }

      // Calculate new level number if parent is changing
      let newLevelNumber = currentItem.levelNumber
      if (reorderData.newParentId !== undefined && reorderData.newParentId !== currentItem.parentId) {
        if (reorderData.newParentId) {
          const parentResult = await connection.execute(
            `SELECT level_number FROM WBS_ITEMS WHERE id = :parentId`,
            { parentId: reorderData.newParentId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          )
          
          if (parentResult.rows && parentResult.rows.length > 0) {
            const parentRow = parentResult.rows[0] as any
            newLevelNumber = parentRow.LEVEL_NUMBER + 1
          }
        } else {
          newLevelNumber = 1
        }
      }

      // Update items that need to be shifted
      if (reorderData.newSortOrder < currentItem.sortOrder) {
        // Moving up: shift items down
        await connection.execute(
          `UPDATE WBS_ITEMS 
           SET sort_order = sort_order + 1 
           WHERE project_id = :projectId 
           AND (parent_id = :newParentId OR (parent_id IS NULL AND :newParentId IS NULL))
           AND sort_order >= :newSortOrder 
           AND sort_order < :currentSortOrder`,
          {
            projectId: currentItem.projectId,
            newParentId: reorderData.newParentId !== undefined ? reorderData.newParentId : currentItem.parentId,
            newSortOrder: reorderData.newSortOrder,
            currentSortOrder: currentItem.sortOrder
          }
        )
      } else if (reorderData.newSortOrder > currentItem.sortOrder) {
        // Moving down: shift items up
        await connection.execute(
          `UPDATE WBS_ITEMS 
           SET sort_order = sort_order - 1 
           WHERE project_id = :projectId 
           AND (parent_id = :newParentId OR (parent_id IS NULL AND :newParentId IS NULL))
           AND sort_order > :currentSortOrder 
           AND sort_order <= :newSortOrder`,
          {
            projectId: currentItem.projectId,
            newParentId: reorderData.newParentId !== undefined ? reorderData.newParentId : currentItem.parentId,
            currentSortOrder: currentItem.sortOrder,
            newSortOrder: reorderData.newSortOrder
          }
        )
      }

      // Update the item itself
      await connection.execute(
        `UPDATE WBS_ITEMS 
         SET parent_id = :parentId, sort_order = :sortOrder, level_number = :levelNumber
         WHERE id = :id`,
        {
          id,
          parentId: reorderData.newParentId !== undefined ? reorderData.newParentId : currentItem.parentId,
          sortOrder: reorderData.newSortOrder,
          levelNumber: newLevelNumber
        }
      )

      await connection.commit()
      return await this.findById(id)
    } catch (error) {
      if (connection) {
        await connection.rollback()
      }
      console.error('Error reordering WBS item:', error)
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

  buildHierarchy(items: WBSItem[]): WBSItem[] {
    const itemMap = new Map<number, WBSItem>()
    const roots: WBSItem[] = []

    // Create a map and initialize children arrays
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] })
    })

    // Build the hierarchy
    items.forEach(item => {
      const mappedItem = itemMap.get(item.id)!
      if (item.parentId) {
        const parent = itemMap.get(item.parentId)
        if (parent) {
          parent.children!.push(mappedItem)
        }
      } else {
        roots.push(mappedItem)
      }
    })

    return roots
  }
}

export const wbsRepository = new WBSRepository()