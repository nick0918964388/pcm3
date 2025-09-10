'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnnouncementForm, AnnouncementFormData } from '@/components/features/announcements/AnnouncementForm';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar, 
  User, 
  BarChart3,
  Filter 
} from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { Announcement } from '@/repositories/announcementRepository';
import { UserRole } from '@/types/auth';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showDrafts, setShowDrafts] = useState(false);

  const canManageAnnouncements = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.PM;

  useEffect(() => {
    if (session?.user && projectId) {
      loadAnnouncements();
    }
  }, [session, projectId, showDrafts]);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        projectId,
        includeRead: 'true',
      });

      if (priorityFilter !== 'all') {
        params.append('priority', priorityFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const response = await fetch(`/api/announcements?${params}`);
      if (!response.ok) {
        throw new Error('Failed to load announcements');
      }

      const data = await response.json();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      setError('無法載入公告列表');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = () => {
    setSelectedAnnouncement(null);
    setViewMode('create');
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setViewMode('edit');
  };

  const handleViewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setViewMode('view');
  };

  const handleSaveAnnouncement = async (data: AnnouncementFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      const isEdit = viewMode === 'edit' && selectedAnnouncement;
      const url = isEdit 
        ? `/api/announcements/${selectedAnnouncement.id}`
        : '/api/announcements';
      
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          ...data,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEdit ? 'update' : 'create'} announcement`);
      }

      await loadAnnouncements();
      setViewMode('list');
      setSelectedAnnouncement(null);
    } catch (err) {
      console.error('Failed to save announcement:', err);
      setError(`無法${viewMode === 'edit' ? '更新' : '建立'}公告`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    if (!confirm(`確定要刪除公告「${announcement.title}」嗎？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/announcements/${announcement.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      await loadAnnouncements();
    } catch (err) {
      console.error('Failed to delete announcement:', err);
      setError('無法刪除公告');
    }
  };

  const handleMarkAsRead = async (announcement: Announcement) => {
    try {
      await fetch(`/api/announcements/${announcement.id}/read`, {
        method: 'POST',
      });
      
      // Update local state
      setAnnouncements(prev => 
        prev.map(a => 
          a.id === announcement.id 
            ? { ...a, isRead: true }
            : a
        )
      );
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'normal':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return '高';
      case 'normal':
        return '中';
      case 'low':
        return '低';
      default:
        return priority;
    }
  };

  if (viewMode === 'create' || viewMode === 'edit') {
    return (
      <div className="container mx-auto p-6">
        <AnnouncementForm
          announcement={selectedAnnouncement || undefined}
          onSave={handleSaveAnnouncement}
          onCancel={() => setViewMode('list')}
          isLoading={submitting}
          mode={viewMode}
        />
      </div>
    );
  }

  if (viewMode === 'view' && selectedAnnouncement) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">公告詳情</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setViewMode('list')}
              >
                返回列表
              </Button>
              {canManageAnnouncements && (
                <Button
                  onClick={() => handleEditAnnouncement(selectedAnnouncement)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  編輯
                </Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-xl">{selectedAnnouncement.title}</CardTitle>
                  <div className="flex items-center gap-4">
                    <Badge variant={getPriorityColor(selectedAnnouncement.priority) as any}>
                      {getPriorityLabel(selectedAnnouncement.priority)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <User className="h-4 w-4" />
                      {selectedAnnouncement.createdByName || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(selectedAnnouncement.createdAt), 'PPpp', { locale: zhTW })}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }}
              />
              
              {canManageAnnouncements && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <BarChart3 className="h-4 w-4" />
                    <span>已讀人數: {selectedAnnouncement.readCount || 0}</span>
                    {selectedAnnouncement.totalReaders && (
                      <span>/ {selectedAnnouncement.totalReaders}</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">公告管理</h1>
          {canManageAnnouncements && (
            <Button onClick={handleCreateAnnouncement}>
              <Plus className="h-4 w-4 mr-2" />
              建立公告
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="搜尋公告..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadAnnouncements()}
                  className="pl-10"
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="high">高優先級</SelectItem>
                  <SelectItem value="normal">一般</SelectItem>
                  <SelectItem value="low">低優先級</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadAnnouncements}>
                <Filter className="h-4 w-4 mr-2" />
                篩選
              </Button>
            </div>
          </CardHeader>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">沒有找到公告</p>
                  {canManageAnnouncements && (
                    <Button
                      onClick={handleCreateAnnouncement}
                      className="mt-4"
                      variant="outline"
                    >
                      建立第一個公告
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              announcements.map((announcement) => (
                <Card
                  key={announcement.id}
                  className={`hover:shadow-md transition-shadow ${
                    !announcement.isRead ? 'border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold truncate">
                            {announcement.title}
                          </h3>
                          <Badge variant={getPriorityColor(announcement.priority) as any}>
                            {getPriorityLabel(announcement.priority)}
                          </Badge>
                          {!announcement.isRead && (
                            <Badge variant="outline" className="bg-blue-50">
                              新
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {announcement.createdByName || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(announcement.createdAt), 'PPp', { locale: zhTW })}
                          </div>
                          {canManageAnnouncements && (
                            <div className="flex items-center gap-1">
                              <BarChart3 className="h-4 w-4" />
                              已讀: {announcement.readCount || 0}
                            </div>
                          )}
                        </div>

                        <div 
                          className="text-gray-700 line-clamp-2"
                          dangerouslySetInnerHTML={{ 
                            __html: announcement.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...' 
                          }}
                        />
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleViewAnnouncement(announcement);
                            if (!announcement.isRead) {
                              handleMarkAsRead(announcement);
                            }
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManageAnnouncements && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditAnnouncement(announcement)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteAnnouncement(announcement)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}