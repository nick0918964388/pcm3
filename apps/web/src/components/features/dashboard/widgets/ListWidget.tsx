'use client';

import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

interface ListWidgetProps {
  data: {
    items: Array<{
      id?: string;
      title: string;
      subtitle?: string;
      status?: string;
      badge?: string;
      onClick?: () => void;
    }>;
  };
  config: any;
}

export function ListWidget({ data, config }: ListWidgetProps) {
  if (!data?.items || data.items.length === 0) {
    return <div className="text-gray-500 text-center py-4">沒有項目</div>;
  }

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'approved':
        return 'success';
      case 'pending':
      case 'in progress':
        return 'warning';
      case 'overdue':
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <ul className="divide-y divide-gray-200">
      {data.items.map((item, index) => (
        <li
          key={item.id || index}
          className="py-3 hover:bg-gray-50 transition-colors cursor-pointer"
          onClick={item.onClick}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {item.title}
              </p>
              {item.subtitle && (
                <p className="text-sm text-gray-500 truncate">
                  {item.subtitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {item.status && (
                <Badge variant={getStatusColor(item.status) as any}>
                  {item.status}
                </Badge>
              )}
              {item.badge && (
                <Badge variant="outline">
                  {item.badge}
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}