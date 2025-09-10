'use client';

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface ChartWidgetProps {
  data: any;
  config: any;
}

export function ChartWidget({ data, config }: ChartWidgetProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || !data) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const chartType = config?.displayOptions?.chartType || 'bar';
    
    chartInstance.current = new Chart(ctx, {
      type: chartType as any,
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            display: chartType !== 'metric',
          },
          tooltip: {
            enabled: true,
          },
        },
        scales: chartType === 'bar' || chartType === 'line' ? {
          y: {
            beginAtZero: true,
            stacked: config?.displayOptions?.stacked,
          },
          x: {
            stacked: config?.displayOptions?.stacked,
          },
        } : undefined,
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, config]);

  return (
    <div className="relative h-64">
      <canvas ref={chartRef} />
    </div>
  );
}