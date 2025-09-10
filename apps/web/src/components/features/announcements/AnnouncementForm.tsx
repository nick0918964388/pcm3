'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/common/RichTextEditor';
import { CalendarIcon, Eye, Save, Send } from 'lucide-react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import type { Announcement } from '@/repositories/announcementRepository';

interface AnnouncementFormProps {
  announcement?: Announcement;
  onSave: (data: AnnouncementFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  priority: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
  expiresAt?: Date;
  saveAsDraft?: boolean;
}

export function AnnouncementForm({
  announcement,
  onSave,
  onCancel,
  isLoading = false,
  mode = 'create',
}: AnnouncementFormProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AnnouncementFormData>({
    defaultValues: {
      title: announcement?.title || '',
      content: announcement?.content || '',
      priority: announcement?.priority || 'normal',
      scheduledAt: announcement?.scheduledAt,
      expiresAt: announcement?.expiresAt,
    },
  });

  const watchedContent = watch('content');
  const watchedTitle = watch('title');
  const watchedPriority = watch('priority');

  const handleImageUpload = async (file: File): Promise<string> => {
    setImageUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'announcement');

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const { url } = await response.json();
      return url;
    } finally {
      setImageUploadLoading(false);
    }
  };

  const onSubmit = async (data: AnnouncementFormData, saveAsDraft = false) => {
    try {
      await onSave({
        ...data,
        saveAsDraft,
      });
    } catch (error) {
      console.error('Form submission error:', error);
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
        return '高優先級';
      case 'normal':
        return '一般';
      case 'low':
        return '低優先級';
      default:
        return priority;
    }
  };

  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">公告預覽</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(false)}
              disabled={isLoading}
            >
              編輯
            </Button>
            <Button
              onClick={handleSubmit((data) => onSubmit(data, false))}
              disabled={isLoading || !watchedTitle.trim() || !watchedContent.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              發布
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl">{watchedTitle || '未命名公告'}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={getPriorityColor(watchedPriority) as any}>
                    {getPriorityLabel(watchedPriority)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {format(new Date(), 'PPpp', { locale: zhTW })}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: watchedContent || '<p>沒有內容</p>' }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          {mode === 'create' ? '建立公告' : '編輯公告'}
        </h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            取消
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(true)}
            disabled={!watchedTitle.trim() || !watchedContent.trim()}
          >
            <Eye className="h-4 w-4 mr-2" />
            預覽
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSubmit((data) => onSubmit(data, true))}
            disabled={isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            儲存草稿
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !watchedTitle.trim() || !watchedContent.trim()}
          >
            <Send className="h-4 w-4 mr-2" />
            {mode === 'create' ? '發布' : '更新'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>公告內容</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">標題 *</Label>
                <Input
                  id="title"
                  {...register('title', {
                    required: '請輸入公告標題',
                    maxLength: {
                      value: 255,
                      message: '標題不能超過 255 個字元',
                    },
                  })}
                  placeholder="輸入公告標題"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="content">內容 *</Label>
                <Controller
                  name="content"
                  control={control}
                  rules={{
                    required: '請輸入公告內容',
                    minLength: {
                      value: 10,
                      message: '內容至少需要 10 個字元',
                    },
                  }}
                  render={({ field }) => (
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      onImageUpload={handleImageUpload}
                      placeholder="輸入公告內容..."
                      disabled={isLoading || imageUploadLoading}
                    />
                  )}
                />
                {errors.content && (
                  <p className="text-sm text-red-500 mt-1">{errors.content.message}</p>
                )}
                {imageUploadLoading && (
                  <p className="text-sm text-blue-500 mt-1">圖片上傳中...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>公告設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="priority">優先級</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="選擇優先級" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">高優先級</SelectItem>
                        <SelectItem value="normal">一般</SelectItem>
                        <SelectItem value="low">低優先級</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div>
                <Label htmlFor="scheduledAt">排程發布時間</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  {...register('scheduledAt', {
                    valueAsDate: true,
                  })}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                />
                <p className="text-xs text-gray-500 mt-1">
                  留空則立即發布
                </p>
              </div>

              <div>
                <Label htmlFor="expiresAt">過期時間</Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  {...register('expiresAt', {
                    valueAsDate: true,
                  })}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                />
                <p className="text-xs text-gray-500 mt-1">
                  留空則永不過期
                </p>
              </div>
            </CardContent>
          </Card>

          {isDirty && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-600">
                  <div className="w-2 h-2 bg-amber-600 rounded-full animate-pulse" />
                  <span className="text-sm">有未儲存的變更</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </form>
  );
}