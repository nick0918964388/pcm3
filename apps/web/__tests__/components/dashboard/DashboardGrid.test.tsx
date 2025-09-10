import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardGrid } from '@/components/features/dashboard/DashboardGrid';
import { DashboardWidget } from '@/services/dashboardService';

// Mock the WidgetCard component
jest.mock('@/components/features/dashboard/WidgetCard', () => ({
  WidgetCard: ({ widget }: { widget: DashboardWidget }) => (
    <div data-testid={`widget-${widget.id}`}>{widget.title}</div>
  ),
}));

describe('DashboardGrid', () => {
  const mockWidgets: DashboardWidget[] = [
    {
      id: 'widget1',
      type: 'chart',
      title: 'Test Chart',
      data: { labels: [], datasets: [] },
      config: {},
      position: { x: 0, y: 0, w: 6, h: 4 },
    },
    {
      id: 'widget2',
      type: 'metric',
      title: 'Test Metric',
      data: { value: 100 },
      config: {},
      position: { x: 6, y: 0, w: 6, h: 4 },
    },
  ];

  it('renders all widgets', () => {
    render(<DashboardGrid widgets={mockWidgets} isCustomizing={false} />);
    
    expect(screen.getByTestId('widget-widget1')).toBeInTheDocument();
    expect(screen.getByTestId('widget-widget2')).toBeInTheDocument();
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('Test Metric')).toBeInTheDocument();
  });

  it('shows empty state when no widgets', () => {
    render(<DashboardGrid widgets={[]} isCustomizing={false} />);
    
    expect(screen.getByText('沒有可顯示的儀表板小工具')).toBeInTheDocument();
  });

  it('shows customization controls when in customizing mode', () => {
    render(<DashboardGrid widgets={mockWidgets} isCustomizing={true} />);
    
    expect(screen.getByText('重置佈局')).toBeInTheDocument();
    expect(screen.getByText('儲存佈局')).toBeInTheDocument();
  });

  it('calls onLayoutChange when reset button is clicked', () => {
    const mockOnLayoutChange = jest.fn();
    render(
      <DashboardGrid
        widgets={mockWidgets}
        isCustomizing={true}
        onLayoutChange={mockOnLayoutChange}
      />
    );
    
    const resetButton = screen.getByText('重置佈局');
    fireEvent.click(resetButton);
    
    expect(mockOnLayoutChange).toHaveBeenCalled();
    const calledLayout = mockOnLayoutChange.mock.calls[0][0];
    expect(calledLayout).toHaveLength(2);
    expect(calledLayout[0].i).toBe('widget1');
  });

  it('applies grid columns based on widget positions', () => {
    const { container } = render(
      <DashboardGrid widgets={mockWidgets} isCustomizing={false} />
    );
    
    const gridElement = container.querySelector('.dashboard-grid');
    expect(gridElement).toBeInTheDocument();
  });
});