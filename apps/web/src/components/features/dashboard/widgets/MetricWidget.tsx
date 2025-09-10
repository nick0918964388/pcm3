'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricWidgetProps {
  data: any;
  config: any;
}

export function MetricWidget({ data, config }: MetricWidgetProps) {
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  // Handle different metric data formats
  if (data.value !== undefined) {
    // Single metric format
    return (
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            {data.value}
            {data.unit && <span className="text-lg text-gray-500 ml-1">{data.unit}</span>}
          </span>
          {data.trend && (
            <div className="flex items-center gap-1">
              {getTrendIcon(data.trend)}
              {data.change && <span className="text-sm text-gray-600">{data.change}</span>}
            </div>
          )}
        </div>
        {data.subtitle && (
          <p className="text-sm text-gray-600">{data.subtitle}</p>
        )}
      </div>
    );
  }

  // Multiple metrics format (e.g., attendance)
  if (data.present !== undefined || data.high !== undefined) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {data.present !== undefined && (
          <>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{data.present}</p>
              <p className="text-sm text-gray-600">出席</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{data.absent}</p>
              <p className="text-sm text-gray-600">缺席</p>
            </div>
          </>
        )}
        {data.high !== undefined && (
          <>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{data.high}</p>
              <p className="text-sm text-gray-600">高</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{data.medium}</p>
              <p className="text-sm text-gray-600">中</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{data.low}</p>
              <p className="text-sm text-gray-600">低</p>
            </div>
          </>
        )}
      </div>
    );
  }

  return <div>No data available</div>;
}