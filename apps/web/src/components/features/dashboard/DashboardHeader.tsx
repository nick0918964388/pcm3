'use client';

import { UserRole } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Settings, Grid3x3 } from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface DashboardHeaderProps {
  projectId: string;
  role: UserRole;
  lastUpdated: Date;
  isCustomizing: boolean;
  onToggleCustomize: () => void;
  onRefresh: () => void;
}

export function DashboardHeader({
  projectId,
  role,
  lastUpdated,
  isCustomizing,
  onToggleCustomize,
  onRefresh,
}: DashboardHeaderProps) {
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.PM:
        return 'primary';
      case UserRole.QC:
        return 'success';
      case UserRole.ADMIN:
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getRoleDisplayName = (role: UserRole) => {
    switch (role) {
      case UserRole.PM:
        return '專案經理';
      case UserRole.QC:
        return '品管人員';
      case UserRole.ADMIN:
        return '系統管理員';
      default:
        return '一般使用者';
    }
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">專案儀表板</h1>
            <Badge variant={getRoleBadgeColor(role) as any}>
              {getRoleDisplayName(role)}
            </Badge>
            <span className="text-sm text-gray-500">
              專案 ID: {projectId}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              最後更新: {format(new Date(lastUpdated), 'PPpp', { locale: zhTW })}
            </span>
            
            <Button
              size="sm"
              variant="outline"
              onClick={onRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              重新整理
            </Button>
            
            <Button
              size="sm"
              variant={isCustomizing ? 'default' : 'outline'}
              onClick={onToggleCustomize}
              className="flex items-center gap-2"
            >
              <Grid3x3 className="h-4 w-4" />
              {isCustomizing ? '完成編輯' : '自訂版面'}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              設定
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}