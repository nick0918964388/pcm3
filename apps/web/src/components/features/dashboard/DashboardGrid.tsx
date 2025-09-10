'use client';

import { useState, useEffect } from 'react';
import { DashboardWidget } from '@/services/dashboardService';
import { WidgetCard } from './WidgetCard';
import { Button } from '@/components/ui/button';
import { Grid3x3, Save, RotateCcw } from 'lucide-react';

interface DashboardGridProps {
  widgets: DashboardWidget[];
  isCustomizing: boolean;
  onLayoutChange?: (layout: any[]) => void;
}

export function DashboardGrid({ widgets, isCustomizing, onLayoutChange }: DashboardGridProps) {
  const [gridLayout, setGridLayout] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // Initialize grid layout from widgets
    const layout = widgets.map((widget, index) => ({
      i: widget.id,
      x: widget.position?.x ?? (index % 2) * 6,
      y: widget.position?.y ?? Math.floor(index / 2) * 4,
      w: widget.position?.w ?? 6,
      h: widget.position?.h ?? 4,
      minW: 3,
      minH: 2,
      maxW: 12,
    }));
    setGridLayout(layout);
  }, [widgets]);

  const handleLayoutChange = (newLayout: any[]) => {
    setGridLayout(newLayout);
    if (onLayoutChange && !isDragging) {
      onLayoutChange(newLayout);
    }
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragStop = () => {
    setIsDragging(false);
    if (onLayoutChange) {
      onLayoutChange(gridLayout);
    }
  };

  const resetLayout = () => {
    const defaultLayout = widgets.map((widget, index) => ({
      i: widget.id,
      x: (index % 2) * 6,
      y: Math.floor(index / 2) * 4,
      w: 6,
      h: 4,
      minW: 3,
      minH: 2,
      maxW: 12,
    }));
    setGridLayout(defaultLayout);
    if (onLayoutChange) {
      onLayoutChange(defaultLayout);
    }
  };

  // Responsive grid configuration
  const getGridCols = () => {
    if (typeof window !== 'undefined') {
      if (window.innerWidth < 640) return 1;
      if (window.innerWidth < 1024) return 2;
      return 3;
    }
    return 3;
  };

  const renderGrid = () => {
    if (isCustomizing) {
      // In customization mode, show draggable grid
      return (
        <div className="relative">
          <div className="absolute top-0 right-0 z-10 flex gap-2 p-2 bg-white rounded-lg shadow">
            <Button
              size="sm"
              variant="outline"
              onClick={resetLayout}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              重置佈局
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={() => onLayoutChange?.(gridLayout)}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              儲存佈局
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {widgets.map((widget) => (
              <div
                key={widget.id}
                className="cursor-move hover:shadow-lg transition-shadow"
                draggable={isCustomizing}
                onDragStart={handleDragStart}
                onDragEnd={handleDragStop}
              >
                <WidgetCard widget={widget} isCustomizing={isCustomizing} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Normal display mode
    const cols = getGridCols();
    const gridClassName = `grid gap-4 ${
      cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : 'grid-cols-3'
    }`;

    return (
      <div className={gridClassName}>
        {widgets.map((widget) => (
          <div
            key={widget.id}
            style={{
              gridColumn: `span ${Math.min(widget.position?.w ?? 1, cols)}`,
              gridRow: `span ${widget.position?.h ?? 1}`,
            }}
          >
            <WidgetCard widget={widget} isCustomizing={false} />
          </div>
        ))}
      </div>
    );
  };

  if (widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg shadow">
        <Grid3x3 className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500">沒有可顯示的儀表板小工具</p>
      </div>
    );
  }

  return <div className="dashboard-grid">{renderGrid()}</div>;
}