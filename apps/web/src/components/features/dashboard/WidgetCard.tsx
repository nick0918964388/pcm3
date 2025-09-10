'use client';

import { useState, useEffect } from 'react';
import { DashboardWidget } from '@/services/dashboardService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Maximize2, Settings, X } from 'lucide-react';
import { ChartWidget } from './widgets/ChartWidget';
import { MetricWidget } from './widgets/MetricWidget';
import { TableWidget } from './widgets/TableWidget';
import { ListWidget } from './widgets/ListWidget';

interface WidgetCardProps {
  widget: DashboardWidget;
  isCustomizing: boolean;
  onRemove?: () => void;
  onRefresh?: () => void;
}

export function WidgetCard({ widget, isCustomizing, onRemove, onRefresh }: WidgetCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await onRefresh?.();
    } finally {
      setIsLoading(false);
    }
  };

  const renderWidgetContent = () => {
    switch (widget.type) {
      case 'chart':
        return <ChartWidget data={widget.data} config={widget.config} />;
      case 'metric':
        return <MetricWidget data={widget.data} config={widget.config} />;
      case 'table':
        return <TableWidget data={widget.data} config={widget.config} />;
      case 'list':
        return <ListWidget data={widget.data} config={widget.config} />;
      default:
        return <div>Unsupported widget type</div>;
    }
  };

  return (
    <Card className={`widget-card ${isCustomizing ? 'border-dashed border-2' : ''} ${isExpanded ? 'fixed inset-4 z-50' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        <div className="flex items-center gap-1">
          {!isCustomizing && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              {widget.config.displayOptions && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-8 w-8 p-0"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
          {isCustomizing && onRemove && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onRemove}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          renderWidgetContent()
        )}
      </CardContent>
    </Card>
  );
}