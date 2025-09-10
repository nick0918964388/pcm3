import { getConnection } from '@/lib/database';
import { UserRole } from '@/types/auth';
import { DashboardWidget, Announcement } from '@/services/dashboardService';
import oracledb from 'oracledb';

class DashboardRepository {
  // Get widgets configured for a specific role
  async getWidgetsByRole(role: UserRole, projectId: string): Promise<DashboardWidget[]> {
    const connection = await getConnection();
    try {
      // Default widget configurations by role
      const roleWidgetMap: Record<UserRole, string[]> = {
        [UserRole.PM]: ['schedule-summary', 'daily-hours', 'wbs-progress', 'milestones', 'attendance-overview'],
        [UserRole.QC]: ['audit-docs', 'check-items', 'quality-issues', 'pending-reviews', 'quality-metrics'],
        [UserRole.ADMIN]: ['system-status', 'user-activity', 'resource-usage', 'error-logs'],
        [UserRole.USER]: ['my-tasks', 'team-updates', 'recent-reports'],
      };

      const widgetIds = roleWidgetMap[role] || roleWidgetMap[UserRole.USER];
      const widgets: DashboardWidget[] = [];

      for (const widgetId of widgetIds) {
        const widgetData = await this.getWidgetData(widgetId, projectId, connection);
        if (widgetData) {
          widgets.push(widgetData);
        }
      }

      return widgets;
    } finally {
      await connection.close();
    }
  }

  // Get specific widget data
  private async getWidgetData(
    widgetId: string,
    projectId: string,
    connection: oracledb.Connection
  ): Promise<DashboardWidget | null> {
    switch (widgetId) {
      case 'schedule-summary':
        return await this.getScheduleSummaryWidget(projectId, connection);
      case 'daily-hours':
        return await this.getDailyHoursWidget(projectId, connection);
      case 'wbs-progress':
        return await this.getWBSProgressWidget(projectId, connection);
      case 'milestones':
        return await this.getMilestonesWidget(projectId, connection);
      case 'attendance-overview':
        return await this.getAttendanceWidget(projectId, connection);
      case 'audit-docs':
        return await this.getAuditDocsWidget(projectId, connection);
      case 'check-items':
        return await this.getCheckItemsWidget(projectId, connection);
      case 'quality-issues':
        return await this.getQualityIssuesWidget(projectId, connection);
      case 'pending-reviews':
        return await this.getPendingReviewsWidget(projectId, connection);
      case 'quality-metrics':
        return await this.getQualityMetricsWidget(projectId, connection);
      default:
        return null;
    }
  }

  // PM Widgets
  private async getScheduleSummaryWidget(
    projectId: string,
    connection: oracledb.Connection
  ): Promise<DashboardWidget> {
    const result = await connection.execute<any>(
      `SELECT 
        COUNT(*) as total_tasks,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tasks,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks
      FROM wbs_items
      WHERE project_id = :projectId`,
      { projectId }
    );

    const data = result.rows?.[0] || {};
    
    return {
      id: 'schedule-summary',
      type: 'chart',
      title: '時程摘要',
      data: {
        labels: ['已完成', '進行中', '待處理'],
        datasets: [{
          data: [data.COMPLETED_TASKS || 0, data.IN_PROGRESS_TASKS || 0, data.PENDING_TASKS || 0],
          backgroundColor: ['#10b981', '#3b82f6', '#9ca3af'],
        }],
      },
      config: {
        displayOptions: { chartType: 'pie' },
      },
    };
  }

  private async getDailyHoursWidget(
    projectId: string,
    connection: oracledb.Connection
  ): Promise<DashboardWidget> {
    const result = await connection.execute<any>(
      `SELECT 
        TO_CHAR(attendance_date, 'YYYY-MM-DD') as date,
        SUM(hours_worked) as total_hours
      FROM attendance_records
      WHERE project_id = :projectId
        AND attendance_date >= SYSDATE - 7
      GROUP BY TO_CHAR(attendance_date, 'YYYY-MM-DD')
      ORDER BY date`,
      { projectId }
    );

    return {
      id: 'daily-hours',
      type: 'chart',
      title: '每日工時統計',
      data: {
        labels: result.rows?.map((r: any) => r.DATE) || [],
        datasets: [{
          label: '工時',
          data: result.rows?.map((r: any) => r.TOTAL_HOURS) || [],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        }],
      },
      config: {
        displayOptions: { chartType: 'line' },
      },
    };
  }

  private async getWBSProgressWidget(
    projectId: string,
    connection: oracledb.Connection
  ): Promise<DashboardWidget> {
    const result = await connection.execute<any>(
      `SELECT 
        COUNT(*) as total,
        SUM(progress) / COUNT(*) as avg_progress
      FROM wbs_items
      WHERE project_id = :projectId`,
      { projectId }
    );

    const data = result.rows?.[0] || {};

    return {
      id: 'wbs-progress',
      type: 'metric',
      title: 'WBS 整體進度',
      data: {
        value: Math.round(data.AVG_PROGRESS || 0),
        unit: '%',
        trend: 'up',
        change: '+5%',
      },
      config: {},
    };
  }

  private async getMilestonesWidget(
    projectId: string,
    connection: oracledb.Connection
  ): Promise<DashboardWidget> {
    const result = await connection.execute<any>(
      `SELECT 
        name,
        TO_CHAR(due_date, 'YYYY-MM-DD') as due_date,
        status
      FROM project_milestones
      WHERE project_id = :projectId
        AND due_date <= SYSDATE + 30
      ORDER BY due_date`,
      { projectId },
      { maxRows: 5 }
    );

    return {
      id: 'milestones',
      type: 'list',
      title: '即將到期的里程碑',
      data: {
        items: result.rows?.map((r: any) => ({
          title: r.NAME,
          subtitle: `到期日: ${r.DUE_DATE}`,
          status: r.STATUS,
        })) || [],
      },
      config: {},
    };
  }

  private async getAttendanceWidget(
    projectId: string,
    connection: oracledb.Connection
  ): Promise<DashboardWidget> {
    const result = await connection.execute<any>(
      `SELECT 
        COUNT(DISTINCT personnel_id) as total_personnel,
        COUNT(CASE WHEN status = 'Present' THEN 1 END) as present_today,
        COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent_today
      FROM attendance_records
      WHERE project_id = :projectId
        AND attendance_date = TRUNC(SYSDATE)`,
      { projectId }
    );

    const data = result.rows?.[0] || {};

    return {
      id: 'attendance-overview',
      type: 'metric',
      title: '今日出勤',
      data: {
        present: data.PRESENT_TODAY || 0,
        absent: data.ABSENT_TODAY || 0,
        total: data.TOTAL_PERSONNEL || 0,
      },
      config: {},
    };
  }

  // QC Widgets
  private async getAuditDocsWidget(
    projectId: string,
    connection: oracledb.Connection
  ): Promise<DashboardWidget> {
    const result = await connection.execute<any>(
      `SELECT 
        document_type,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved
      FROM quality_documents
      WHERE project_id = :projectId
      GROUP BY document_type`,
      { projectId }
    );

    return {
      id: 'audit-docs',
      type: 'table',
      title: '品質稽核文件摘要',
      data: {
        headers: ['文件類型', '總數', '已核准'],
        rows: result.rows?.map((r: any) => [r.DOCUMENT_TYPE, r.COUNT, r.APPROVED]) || [],
      },
      config: {},
    };
  }

  private async getCheckItemsWidget(
    projectId: string,
    connection: oracledb.Connection
  ): Promise<DashboardWidget> {
    const result = await connection.execute<any>(
      `SELECT 
        category,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
      FROM check_items
      WHERE project_id = :projectId
      GROUP BY category`,
      { projectId }
    );

    return {
      id: 'check-items',
      type: 'chart',
      title: '檢查項目完成狀態',
      data: {
        labels: result.rows?.map((r: any) => r.CATEGORY) || [],
        datasets: [
          {
            label: '已完成',
            data: result.rows?.map((r: any) => r.COMPLETED) || [],
            backgroundColor: '#10b981',
          },
          {
            label: '總數',
            data: result.rows?.map((r: any) => r.TOTAL) || [],
            backgroundColor: '#e5e7eb',
          },
        ],
      },
      config: {
        displayOptions: { chartType: 'bar', stacked: true },
      },
    };
  }

  private async getQualityIssuesWidget(
    projectId: string,
    connection: oracledb.Connection
  ): Promise<DashboardWidget> {
    const result = await connection.execute<any>(
      `SELECT 
        severity,
        COUNT(*) as count
      FROM quality_issues
      WHERE project_id = :projectId
        AND status != 'Resolved'
      GROUP BY severity`,
      { projectId }
    );

    return {
      id: 'quality-issues',
      type: 'metric',
      title: '品質問題追蹤',
      data: {
        high: result.rows?.find((r: any) => r.SEVERITY === 'High')?.COUNT || 0,
        medium: result.rows?.find((r: any) => r.SEVERITY === 'Medium')?.COUNT || 0,
        low: result.rows?.find((r: any) => r.SEVERITY === 'Low')?.COUNT || 0,
      },
      config: {},
    };
  }

  private async getPendingReviewsWidget(
    projectId: string,
    connection: oracledb.Connection
  ): Promise<DashboardWidget> {
    const result = await connection.execute<any>(
      `SELECT 
        report_id,
        report_type,
        TO_CHAR(created_at, 'YYYY-MM-DD') as created_date,
        submitted_by
      FROM daily_reports
      WHERE project_id = :projectId
        AND status = 'Pending'
      ORDER BY created_at DESC`,
      { projectId },
      { maxRows: 10 }
    );

    return {
      id: 'pending-reviews',
      type: 'list',
      title: '待審核報告',
      data: {
        items: result.rows?.map((r: any) => ({
          id: r.REPORT_ID,
          title: r.REPORT_TYPE,
          subtitle: `${r.CREATED_DATE} - ${r.SUBMITTED_BY}`,
        })) || [],
      },
      config: {},
    };
  }

  private async getQualityMetricsWidget(
    projectId: string,
    connection: oracledb.Connection
  ): Promise<DashboardWidget> {
    const result = await connection.execute<any>(
      `SELECT 
        metric_name,
        metric_value,
        target_value
      FROM quality_metrics
      WHERE project_id = :projectId
        AND period = TO_CHAR(SYSDATE, 'YYYY-MM')`,
      { projectId }
    );

    return {
      id: 'quality-metrics',
      type: 'chart',
      title: '品質指標趨勢',
      data: {
        labels: result.rows?.map((r: any) => r.METRIC_NAME) || [],
        datasets: [
          {
            label: '實際值',
            data: result.rows?.map((r: any) => r.METRIC_VALUE) || [],
            borderColor: '#3b82f6',
          },
          {
            label: '目標值',
            data: result.rows?.map((r: any) => r.TARGET_VALUE) || [],
            borderColor: '#10b981',
            borderDash: [5, 5],
          },
        ],
      },
      config: {
        displayOptions: { chartType: 'line' },
      },
    };
  }

  // Get recent announcements
  async getRecentAnnouncements(projectId: string, limit: number = 5): Promise<Announcement[]> {
    const connection = await getConnection();
    try {
      const result = await connection.execute<any>(
        `SELECT 
          announcement_id as id,
          title,
          content,
          priority,
          created_at,
          created_by as author
        FROM announcements
        WHERE project_id = :projectId
          AND is_active = 1
        ORDER BY 
          CASE priority 
            WHEN 'high' THEN 1 
            WHEN 'medium' THEN 2 
            ELSE 3 
          END,
          created_at DESC`,
        { projectId },
        { maxRows: limit }
      );

      return result.rows?.map((row: any) => ({
        id: row.ID,
        title: row.TITLE,
        content: row.CONTENT,
        priority: row.PRIORITY,
        createdAt: row.CREATED_AT,
        author: row.AUTHOR,
      })) || [];
    } finally {
      await connection.close();
    }
  }

  // Mark announcements as read
  async markAnnouncementsAsRead(announcementIds: string[], userId: string): Promise<void> {
    const connection = await getConnection();
    try {
      for (const announcementId of announcementIds) {
        await connection.execute(
          `MERGE INTO announcement_reads ar
          USING (SELECT :announcementId as announcement_id, :userId as user_id FROM dual) src
          ON (ar.announcement_id = src.announcement_id AND ar.user_id = src.user_id)
          WHEN NOT MATCHED THEN
            INSERT (announcement_id, user_id, read_at)
            VALUES (src.announcement_id, src.user_id, SYSDATE)`,
          { announcementId, userId }
        );
      }
      await connection.commit();
    } finally {
      await connection.close();
    }
  }

  // Save user dashboard configuration
  async saveDashboardConfig(userId: string, projectId: string, config: any): Promise<void> {
    const connection = await getConnection();
    try {
      await connection.execute(
        `MERGE INTO dashboard_configs dc
        USING (SELECT :userId as user_id, :projectId as project_id FROM dual) src
        ON (dc.user_id = src.user_id AND dc.project_id = src.project_id)
        WHEN MATCHED THEN
          UPDATE SET 
            config = :config,
            updated_at = SYSDATE
        WHEN NOT MATCHED THEN
          INSERT (user_id, project_id, config, created_at, updated_at)
          VALUES (src.user_id, src.project_id, :config, SYSDATE, SYSDATE)`,
        { userId, projectId, config: JSON.stringify(config) }
      );
      await connection.commit();
    } finally {
      await connection.close();
    }
  }

  // Load user dashboard configuration
  async loadDashboardConfig(userId: string, projectId: string): Promise<any | null> {
    const connection = await getConnection();
    try {
      const result = await connection.execute<any>(
        `SELECT config 
        FROM dashboard_configs
        WHERE user_id = :userId AND project_id = :projectId`,
        { userId, projectId }
      );

      if (result.rows && result.rows.length > 0) {
        return JSON.parse(result.rows[0].CONFIG);
      }
      return null;
    } finally {
      await connection.close();
    }
  }
}

export const dashboardRepository = new DashboardRepository();