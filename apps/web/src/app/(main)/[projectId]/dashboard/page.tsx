'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { dashboardService, DashboardData } from '@/services/dashboardService';
import { DashboardGrid } from '@/components/features/dashboard/DashboardGrid';
import { DashboardHeader } from '@/components/features/dashboard/DashboardHeader';
import { AnnouncementPanel } from '@/components/features/dashboard/AnnouncementPanel';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Alert } from '@/components/ui/alert';
import { UserRole } from '@/types/auth';

export default function DashboardPage() {
  const { data: session } = useSession();
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    if (session?.user && projectId) {
      loadDashboardData();
      // Connect to real-time updates
      dashboardService.connectRealTimeUpdates(projectId);
      
      // Set up event listeners
      dashboardService.addEventListener('widget-update', handleWidgetUpdate);
      dashboardService.addEventListener('announcement-new', handleNewAnnouncement);

      return () => {
        dashboardService.disconnectRealTimeUpdates();
        dashboardService.removeEventListener('widget-update', handleWidgetUpdate);
        dashboardService.removeEventListener('announcement-new', handleNewAnnouncement);
      };
    }
  }, [session, projectId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userRole = session?.user?.role as UserRole;
      const data = await dashboardService.fetchDashboardData(projectId, userRole);
      
      // Load user's custom configuration if exists
      const customConfig = await dashboardService.loadDashboardConfig(
        session?.user?.id || '',
        projectId
      );
      
      if (customConfig) {
        // Merge custom layout with fetched data
        data.widgets = mergeWidgetLayouts(data.widgets, customConfig.layout);
      }
      
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('無法載入儀表板資料');
    } finally {
      setLoading(false);
    }
  };

  const handleWidgetUpdate = (updatedWidget: any) => {
    setDashboardData(prev => {
      if (!prev) return prev;
      
      const updatedWidgets = prev.widgets.map(widget =>
        widget.id === updatedWidget.id ? { ...widget, data: updatedWidget.data } : widget
      );
      
      return {
        ...prev,
        widgets: updatedWidgets,
        lastUpdated: new Date(),
      };
    });
  };

  const handleNewAnnouncement = (announcement: any) => {
    setDashboardData(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        announcements: [announcement, ...prev.announcements].slice(0, 5),
      };
    });
  };

  const handleLayoutChange = async (newLayout: any[]) => {
    if (!session?.user || !dashboardData) return;
    
    try {
      // Update local state
      const updatedWidgets = dashboardData.widgets.map(widget => {
        const layoutItem = newLayout.find(item => item.i === widget.id);
        if (layoutItem) {
          return {
            ...widget,
            position: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
            },
          };
        }
        return widget;
      });
      
      setDashboardData({
        ...dashboardData,
        widgets: updatedWidgets,
      });
      
      // Save to server
      await dashboardService.saveDashboardConfig({
        userId: session.user.id,
        projectId,
        layout: updatedWidgets,
      });
    } catch (err) {
      console.error('Failed to save layout:', err);
    }
  };

  const mergeWidgetLayouts = (widgets: any[], customLayout: any[]) => {
    return widgets.map(widget => {
      const customWidget = customLayout.find(cw => cw.id === widget.id);
      if (customWidget?.position) {
        return { ...widget, position: customWidget.position };
      }
      return widget;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <p>{error}</p>
        </Alert>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        projectId={projectId}
        role={dashboardData.role}
        lastUpdated={dashboardData.lastUpdated}
        isCustomizing={isCustomizing}
        onToggleCustomize={() => setIsCustomizing(!isCustomizing)}
        onRefresh={loadDashboardData}
      />
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <DashboardGrid
              widgets={dashboardData.widgets}
              isCustomizing={isCustomizing}
              onLayoutChange={handleLayoutChange}
            />
          </div>
          
          <div className="lg:col-span-1">
            <AnnouncementPanel
              announcements={dashboardData.announcements}
              projectId={projectId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}