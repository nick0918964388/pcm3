import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnnouncementPanel } from '@/components/features/dashboard/AnnouncementPanel';
import { Announcement } from '@/services/dashboardService';

describe('AnnouncementPanel', () => {
  const mockAnnouncements: Announcement[] = [
    {
      id: '1',
      title: 'High Priority Announcement',
      content: 'This is a high priority announcement content',
      priority: 'high',
      createdAt: new Date('2025-01-10'),
      author: 'Admin',
      isRead: false,
    },
    {
      id: '2',
      title: 'Medium Priority Announcement',
      content: 'This is a medium priority announcement content',
      priority: 'medium',
      createdAt: new Date('2025-01-09'),
      author: 'Manager',
      isRead: true,
    },
    {
      id: '3',
      title: 'Low Priority Announcement',
      content: 'This is a low priority announcement content',
      priority: 'low',
      createdAt: new Date('2025-01-08'),
      author: 'User',
      isRead: true,
    },
    {
      id: '4',
      title: 'Fourth Announcement',
      content: 'This is the fourth announcement',
      priority: 'low',
      createdAt: new Date('2025-01-07'),
      author: 'User2',
      isRead: true,
    },
  ];

  it('renders announcement panel with title', () => {
    render(<AnnouncementPanel announcements={[]} projectId="proj123" />);
    
    expect(screen.getByText('最新公告')).toBeInTheDocument();
  });

  it('shows empty state when no announcements', () => {
    render(<AnnouncementPanel announcements={[]} projectId="proj123" />);
    
    expect(screen.getByText('目前沒有公告')).toBeInTheDocument();
  });

  it('displays announcements with correct priority badges', () => {
    render(<AnnouncementPanel announcements={mockAnnouncements} projectId="proj123" />);
    
    expect(screen.getByText('高')).toBeInTheDocument();
    expect(screen.getByText('中')).toBeInTheDocument();
    expect(screen.getByText('低')).toBeInTheDocument();
  });

  it('shows only first 3 announcements by default', () => {
    render(<AnnouncementPanel announcements={mockAnnouncements} projectId="proj123" />);
    
    expect(screen.getByText('High Priority Announcement')).toBeInTheDocument();
    expect(screen.getByText('Medium Priority Announcement')).toBeInTheDocument();
    expect(screen.getByText('Low Priority Announcement')).toBeInTheDocument();
    expect(screen.queryByText('Fourth Announcement')).not.toBeInTheDocument();
  });

  it('shows "View All" button when more than 3 announcements', () => {
    render(<AnnouncementPanel announcements={mockAnnouncements} projectId="proj123" />);
    
    const viewAllButton = screen.getByText(/查看全部 \(4\)/);
    expect(viewAllButton).toBeInTheDocument();
  });

  it('expands to show all announcements when "View All" is clicked', () => {
    render(<AnnouncementPanel announcements={mockAnnouncements} projectId="proj123" />);
    
    const viewAllButton = screen.getByText(/查看全部 \(4\)/);
    fireEvent.click(viewAllButton);
    
    expect(screen.getByText('Fourth Announcement')).toBeInTheDocument();
    expect(screen.getByText('顯示較少')).toBeInTheDocument();
  });

  it('expands individual announcement when clicked', () => {
    render(<AnnouncementPanel announcements={mockAnnouncements} projectId="proj123" />);
    
    // Find and click the expand button for the first announcement
    const expandButtons = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg')
    );
    fireEvent.click(expandButtons[0]);
    
    expect(screen.getByText('This is a high priority announcement content')).toBeInTheDocument();
  });

  it('shows "new" badge for unread announcements', () => {
    render(<AnnouncementPanel announcements={mockAnnouncements} projectId="proj123" />);
    
    expect(screen.getByText('新')).toBeInTheDocument();
  });

  it('displays author and date information', () => {
    render(<AnnouncementPanel announcements={mockAnnouncements} projectId="proj123" />);
    
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Manager')).toBeInTheDocument();
  });
});