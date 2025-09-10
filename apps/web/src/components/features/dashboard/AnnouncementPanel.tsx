'use client';

import { useState } from 'react';
import { Announcement } from '@/services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, ChevronDown, ChevronUp, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

interface AnnouncementPanelProps {
  announcements: Announcement[];
  projectId: string;
}

export function AnnouncementPanel({ announcements, projectId }: AnnouncementPanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'medium':
        return '中';
      case 'low':
        return '低';
      default:
        return priority;
    }
  };

  const displayedAnnouncements = showAll ? announcements : announcements.slice(0, 3);

  return (
    <Card className="h-fit">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Bell className="h-5 w-5" />
          最新公告
        </CardTitle>
        {announcements.length > 0 && (
          <Badge variant="outline">{announcements.length}</Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>目前沒有公告</p>
          </div>
        ) : (
          <>
            {displayedAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getPriorityColor(announcement.priority) as any}>
                        {getPriorityLabel(announcement.priority)}
                      </Badge>
                      {announcement.isRead === false && (
                        <Badge variant="outline" className="bg-blue-50">
                          新
                        </Badge>
                      )}
                    </div>
                    <h4 className="font-medium text-sm mb-1 line-clamp-2">
                      {announcement.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {announcement.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(announcement.createdAt), 'PP', { locale: zhTW })}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleExpanded(announcement.id)}
                    className="h-8 w-8 p-0"
                  >
                    {expandedIds.has(announcement.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {expandedIds.has(announcement.id) && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
            
            {announcements.length > 3 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? '顯示較少' : `查看全部 (${announcements.length})`}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}