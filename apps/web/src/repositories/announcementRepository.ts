import { getConnection } from '@/lib/database';
import oracledb from 'oracledb';

export interface Announcement {
  id: string;
  projectId: string;
  title: string;
  content: string;
  createdBy: string;
  createdByName?: string;
  isActive: boolean;
  priority: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  publishedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  isRead?: boolean;
  readCount?: number;
  totalReaders?: number;
}

export interface CreateAnnouncementData {
  projectId: string;
  title: string;
  content: string;
  createdBy: string;
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  expiresAt?: Date;
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  expiresAt?: Date;
  isActive?: boolean;
}

export interface AnnouncementStats {
  totalReaders: number;
  readCount: number;
  readPercentage: number;
  recentReaders: Array<{
    userId: string;
    userName: string;
    readAt: Date;
  }>;
}

class AnnouncementRepository {
  async getAnnouncements(
    projectId: string,
    userId?: string,
    options: {
      includeRead?: boolean;
      priority?: 'high' | 'normal' | 'low';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Announcement[]> {
    const connection = await getConnection();
    try {
      let query = `
        SELECT 
          a.id,
          a.project_id,
          a.title,
          a.content,
          a.created_by,
          u.name as created_by_name,
          a.is_active,
          a.priority,
          a.scheduled_at,
          a.published_at,
          a.expires_at,
          a.created_at,
          ${userId ? 'ar.read_at IS NOT NULL as is_read,' : ''}
          (SELECT COUNT(*) FROM announcement_reads WHERE announcement_id = a.id) as read_count
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        ${userId ? 'LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = :userId' : ''}
        WHERE a.project_id = :projectId
          AND (a.scheduled_at IS NULL OR a.scheduled_at <= SYSDATE)
          AND (a.expires_at IS NULL OR a.expires_at > SYSDATE)
      `;

      const params: any = { projectId };
      if (userId) params.userId = userId;

      if (options.priority) {
        query += ' AND a.priority = :priority';
        params.priority = options.priority;
      }

      if (!options.includeRead && userId) {
        query += ' AND ar.read_at IS NULL';
      }

      query += `
        ORDER BY 
          CASE a.priority 
            WHEN 'high' THEN 1 
            WHEN 'normal' THEN 2 
            ELSE 3 
          END,
          a.created_at DESC
      `;

      if (options.limit) {
        query += ' OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY';
        params.offset = options.offset || 0;
        params.limit = options.limit;
      }

      const result = await connection.execute<any>(query, params);

      return result.rows?.map((row: any) => ({
        id: row.ID?.toString(),
        projectId: row.PROJECT_ID?.toString(),
        title: row.TITLE,
        content: row.CONTENT,
        createdBy: row.CREATED_BY?.toString(),
        createdByName: row.CREATED_BY_NAME,
        isActive: Boolean(row.IS_ACTIVE),
        priority: row.PRIORITY,
        scheduledAt: row.SCHEDULED_AT,
        publishedAt: row.PUBLISHED_AT,
        expiresAt: row.EXPIRES_AT,
        createdAt: row.CREATED_AT,
        isRead: userId ? Boolean(row.IS_READ) : undefined,
        readCount: row.READ_COUNT || 0,
      })) || [];
    } finally {
      await connection.close();
    }
  }

  async getAnnouncementById(id: string, userId?: string): Promise<Announcement | null> {
    const connection = await getConnection();
    try {
      const query = `
        SELECT 
          a.id,
          a.project_id,
          a.title,
          a.content,
          a.created_by,
          u.name as created_by_name,
          a.is_active,
          a.priority,
          a.scheduled_at,
          a.published_at,
          a.expires_at,
          a.created_at,
          ${userId ? 'ar.read_at IS NOT NULL as is_read,' : ''}
          (SELECT COUNT(*) FROM announcement_reads WHERE announcement_id = a.id) as read_count,
          (SELECT COUNT(DISTINCT user_id) FROM users WHERE project_id = a.project_id) as total_readers
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        ${userId ? 'LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = :userId' : ''}
        WHERE a.id = :id
      `;

      const params: any = { id };
      if (userId) params.userId = userId;

      const result = await connection.execute<any>(query, params);

      const row = result.rows?.[0];
      if (!row) return null;

      return {
        id: row.ID?.toString(),
        projectId: row.PROJECT_ID?.toString(),
        title: row.TITLE,
        content: row.CONTENT,
        createdBy: row.CREATED_BY?.toString(),
        createdByName: row.CREATED_BY_NAME,
        isActive: Boolean(row.IS_ACTIVE),
        priority: row.PRIORITY,
        scheduledAt: row.SCHEDULED_AT,
        publishedAt: row.PUBLISHED_AT,
        expiresAt: row.EXPIRES_AT,
        createdAt: row.CREATED_AT,
        isRead: userId ? Boolean(row.IS_READ) : undefined,
        readCount: row.READ_COUNT || 0,
        totalReaders: row.TOTAL_READERS || 0,
      };
    } finally {
      await connection.close();
    }
  }

  async createAnnouncement(data: CreateAnnouncementData): Promise<string> {
    const connection = await getConnection();
    try {
      const result = await connection.execute<any>(
        `INSERT INTO announcements (
          project_id, title, content, created_by, priority, scheduled_at, expires_at, published_at, created_at
        ) VALUES (
          :projectId, :title, :content, :createdBy, :priority, :scheduledAt, :expiresAt, 
          CASE WHEN :scheduledAt IS NULL THEN SYSDATE ELSE NULL END, SYSDATE
        ) RETURNING id INTO :id`,
        {
          projectId: data.projectId,
          title: data.title,
          content: data.content,
          createdBy: data.createdBy,
          priority: data.priority || 'normal',
          scheduledAt: data.scheduledAt || null,
          expiresAt: data.expiresAt || null,
          id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
        }
      );

      await connection.commit();
      return result.outBinds?.id[0]?.toString() || '';
    } finally {
      await connection.close();
    }
  }

  async updateAnnouncement(id: string, data: UpdateAnnouncementData): Promise<boolean> {
    const connection = await getConnection();
    try {
      const updateFields: string[] = [];
      const params: any = { id };

      if (data.title !== undefined) {
        updateFields.push('title = :title');
        params.title = data.title;
      }
      if (data.content !== undefined) {
        updateFields.push('content = :content');
        params.content = data.content;
      }
      if (data.priority !== undefined) {
        updateFields.push('priority = :priority');
        params.priority = data.priority;
      }
      if (data.scheduledAt !== undefined) {
        updateFields.push('scheduled_at = :scheduledAt');
        params.scheduledAt = data.scheduledAt;
      }
      if (data.expiresAt !== undefined) {
        updateFields.push('expires_at = :expiresAt');
        params.expiresAt = data.expiresAt;
      }
      if (data.isActive !== undefined) {
        updateFields.push('is_active = :isActive');
        params.isActive = data.isActive ? 1 : 0;
      }

      if (updateFields.length === 0) {
        return false;
      }

      const result = await connection.execute(
        `UPDATE announcements SET ${updateFields.join(', ')} WHERE id = :id`,
        params
      );

      await connection.commit();
      return (result.rowsAffected || 0) > 0;
    } finally {
      await connection.close();
    }
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    const connection = await getConnection();
    try {
      // Soft delete by setting is_active to 0
      const result = await connection.execute(
        'UPDATE announcements SET is_active = 0 WHERE id = :id',
        { id }
      );

      await connection.commit();
      return (result.rowsAffected || 0) > 0;
    } finally {
      await connection.close();
    }
  }

  async markAsRead(announcementId: string, userId: string): Promise<void> {
    const connection = await getConnection();
    try {
      await connection.execute(
        `MERGE INTO announcement_reads ar
        USING (SELECT :announcementId as announcement_id, :userId as user_id FROM dual) src
        ON (ar.announcement_id = src.announcement_id AND ar.user_id = src.user_id)
        WHEN NOT MATCHED THEN
          INSERT (announcement_id, user_id, read_at)
          VALUES (src.announcement_id, src.user_id, SYSDATE)`,
        { announcementId, userId }
      );

      await connection.commit();
    } finally {
      await connection.close();
    }
  }

  async getAnnouncementStats(announcementId: string): Promise<AnnouncementStats> {
    const connection = await getConnection();
    try {
      // Get read statistics
      const statsResult = await connection.execute<any>(
        `SELECT 
          (SELECT COUNT(DISTINCT user_id) 
           FROM users u 
           JOIN announcements a ON u.project_id = a.project_id 
           WHERE a.id = :announcementId) as total_readers,
          COUNT(*) as read_count
        FROM announcement_reads ar
        WHERE ar.announcement_id = :announcementId`,
        { announcementId }
      );

      // Get recent readers
      const readersResult = await connection.execute<any>(
        `SELECT 
          ar.user_id,
          u.name as user_name,
          ar.read_at
        FROM announcement_reads ar
        LEFT JOIN users u ON ar.user_id = u.id
        WHERE ar.announcement_id = :announcementId
        ORDER BY ar.read_at DESC
        FETCH FIRST 10 ROWS ONLY`,
        { announcementId }
      );

      const stats = statsResult.rows?.[0];
      const totalReaders = stats?.TOTAL_READERS || 0;
      const readCount = stats?.READ_COUNT || 0;

      return {
        totalReaders,
        readCount,
        readPercentage: totalReaders > 0 ? Math.round((readCount / totalReaders) * 100) : 0,
        recentReaders: readersResult.rows?.map((row: any) => ({
          userId: row.USER_ID?.toString(),
          userName: row.USER_NAME || 'Unknown',
          readAt: row.READ_AT,
        })) || [],
      };
    } finally {
      await connection.close();
    }
  }

  async getScheduledAnnouncements(): Promise<Announcement[]> {
    const connection = await getConnection();
    try {
      const result = await connection.execute<any>(
        `SELECT 
          a.id,
          a.project_id,
          a.title,
          a.content,
          a.created_by,
          a.is_active,
          a.priority,
          a.scheduled_at,
          a.published_at,
          a.expires_at,
          a.created_at
        FROM announcements a
        WHERE a.scheduled_at IS NOT NULL 
          AND a.scheduled_at <= SYSDATE 
          AND a.published_at IS NULL
          AND a.is_active = 1`
      );

      return result.rows?.map((row: any) => ({
        id: row.ID?.toString(),
        projectId: row.PROJECT_ID?.toString(),
        title: row.TITLE,
        content: row.CONTENT,
        createdBy: row.CREATED_BY?.toString(),
        isActive: Boolean(row.IS_ACTIVE),
        priority: row.PRIORITY,
        scheduledAt: row.SCHEDULED_AT,
        publishedAt: row.PUBLISHED_AT,
        expiresAt: row.EXPIRES_AT,
        createdAt: row.CREATED_AT,
      })) || [];
    } finally {
      await connection.close();
    }
  }

  async publishScheduledAnnouncement(id: string): Promise<boolean> {
    const connection = await getConnection();
    try {
      const result = await connection.execute(
        'UPDATE announcements SET published_at = SYSDATE WHERE id = :id AND published_at IS NULL',
        { id }
      );

      await connection.commit();
      return (result.rowsAffected || 0) > 0;
    } finally {
      await connection.close();
    }
  }

  async searchAnnouncements(
    projectId: string,
    query: string,
    filters: {
      priority?: 'high' | 'normal' | 'low';
      createdBy?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ): Promise<Announcement[]> {
    const connection = await getConnection();
    try {
      let sql = `
        SELECT 
          a.id,
          a.project_id,
          a.title,
          a.content,
          a.created_by,
          u.name as created_by_name,
          a.is_active,
          a.priority,
          a.scheduled_at,
          a.published_at,
          a.expires_at,
          a.created_at,
          (SELECT COUNT(*) FROM announcement_reads WHERE announcement_id = a.id) as read_count
        FROM announcements a
        LEFT JOIN users u ON a.created_by = u.id
        WHERE a.project_id = :projectId
          AND a.is_active = 1
          AND (UPPER(a.title) LIKE UPPER(:query) OR UPPER(a.content) LIKE UPPER(:query))
      `;

      const params: any = { 
        projectId, 
        query: `%${query}%` 
      };

      if (filters.priority) {
        sql += ' AND a.priority = :priority';
        params.priority = filters.priority;
      }

      if (filters.createdBy) {
        sql += ' AND a.created_by = :createdBy';
        params.createdBy = filters.createdBy;
      }

      if (filters.dateFrom) {
        sql += ' AND a.created_at >= :dateFrom';
        params.dateFrom = filters.dateFrom;
      }

      if (filters.dateTo) {
        sql += ' AND a.created_at <= :dateTo';
        params.dateTo = filters.dateTo;
      }

      sql += `
        ORDER BY 
          CASE a.priority 
            WHEN 'high' THEN 1 
            WHEN 'normal' THEN 2 
            ELSE 3 
          END,
          a.created_at DESC
      `;

      const result = await connection.execute<any>(sql, params);

      return result.rows?.map((row: any) => ({
        id: row.ID?.toString(),
        projectId: row.PROJECT_ID?.toString(),
        title: row.TITLE,
        content: row.CONTENT,
        createdBy: row.CREATED_BY?.toString(),
        createdByName: row.CREATED_BY_NAME,
        isActive: Boolean(row.IS_ACTIVE),
        priority: row.PRIORITY,
        scheduledAt: row.SCHEDULED_AT,
        publishedAt: row.PUBLISHED_AT,
        expiresAt: row.EXPIRES_AT,
        createdAt: row.CREATED_AT,
        readCount: row.READ_COUNT || 0,
      })) || [];
    } finally {
      await connection.close();
    }
  }
}

export const announcementRepository = new AnnouncementRepository();