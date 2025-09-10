import { UserRole } from '@/types/auth';

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'table' | 'metric' | 'list';
  title: string;
  data: any;
  config: WidgetConfig;
  position?: { x: number; y: number; w: number; h: number };
}

export interface WidgetConfig {
  refreshInterval?: number;
  displayOptions?: Record<string, any>;
  dataSource?: string;
  filters?: Record<string, any>;
}

export interface DashboardData {
  role: UserRole;
  widgets: DashboardWidget[];
  announcements: Announcement[];
  lastUpdated: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  author: string;
  isRead?: boolean;
}

export interface DashboardConfig {
  userId: string;
  projectId: string;
  layout: DashboardWidget[];
  theme?: 'light' | 'dark';
  refreshInterval?: number;
}

class DashboardService {
  private wsConnection: WebSocket | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();

  async fetchDashboardData(projectId: string, role: UserRole): Promise<DashboardData> {
    const response = await fetch(`/api/dashboard?projectId=${projectId}&role=${role}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    return response.json();
  }

  async fetchWidgetData(widgetId: string, params?: Record<string, any>): Promise<any> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await fetch(`/api/dashboard/widgets/${widgetId}${queryParams}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch widget data for ${widgetId}`);
    }
    return response.json();
  }

  async saveDashboardConfig(config: DashboardConfig): Promise<void> {
    const response = await fetch('/api/dashboard/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      throw new Error('Failed to save dashboard configuration');
    }
  }

  async loadDashboardConfig(userId: string, projectId: string): Promise<DashboardConfig | null> {
    const response = await fetch(`/api/dashboard/config?userId=${userId}&projectId=${projectId}`);
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to load dashboard configuration');
    }
    return response.json();
  }

  // Real-time updates via WebSocket
  connectRealTimeUpdates(projectId: string): void {
    if (this.wsConnection) {
      this.wsConnection.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/dashboard/ws?projectId=${projectId}`;
    
    this.wsConnection = new WebSocket(wsUrl);

    this.wsConnection.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.notifyListeners(data.type, data.payload);
    };

    this.wsConnection.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.wsConnection.onclose = () => {
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (this.wsConnection?.readyState === WebSocket.CLOSED) {
          this.connectRealTimeUpdates(projectId);
        }
      }, 5000);
    };
  }

  disconnectRealTimeUpdates(): void {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
  }

  addEventListener(eventType: string, callback: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(callback);
  }

  removeEventListener(eventType: string, callback: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  private notifyListeners(eventType: string, data: any): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // PM-specific data aggregation
  async fetchPMDashboardData(projectId: string): Promise<any> {
    const [schedule, dailyHours, wbsProgress, milestones, attendance] = await Promise.all([
      fetch(`/api/dashboard/pm/schedule?projectId=${projectId}`).then(r => r.json()),
      fetch(`/api/dashboard/pm/daily-hours?projectId=${projectId}`).then(r => r.json()),
      fetch(`/api/wbs/${projectId}`).then(r => r.json()),
      fetch(`/api/dashboard/pm/milestones?projectId=${projectId}`).then(r => r.json()),
      fetch(`/api/attendance/reports?projectId=${projectId}&type=overview`).then(r => r.json()),
    ]);

    return {
      schedule,
      dailyHours,
      wbsProgress,
      milestones,
      attendance,
    };
  }

  // QC-specific data aggregation
  async fetchQCDashboardData(projectId: string): Promise<any> {
    const [auditDocs, checkItems, qualityIssues, pendingReviews, qualityMetrics] = await Promise.all([
      fetch(`/api/dashboard/qc/audit-docs?projectId=${projectId}`).then(r => r.json()),
      fetch(`/api/dashboard/qc/check-items?projectId=${projectId}`).then(r => r.json()),
      fetch(`/api/dashboard/qc/issues?projectId=${projectId}`).then(r => r.json()),
      fetch(`/api/reports/daily?projectId=${projectId}&status=pending`).then(r => r.json()),
      fetch(`/api/dashboard/qc/metrics?projectId=${projectId}`).then(r => r.json()),
    ]);

    return {
      auditDocs,
      checkItems,
      qualityIssues,
      pendingReviews,
      qualityMetrics,
    };
  }
}

export const dashboardService = new DashboardService();