import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AnnouncementForm, AnnouncementFormData } from '@/components/features/announcements/AnnouncementForm';

// Mock the rich text editor
jest.mock('@/components/common/RichTextEditor', () => ({
  RichTextEditor: ({ value, onChange }: any) => (
    <textarea
      data-testid="rich-text-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('AnnouncementForm', () => {
  const mockOnSave = jest.fn();
  const mockOnCancel = jest.fn();

  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    isLoading: false,
    mode: 'create' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(<AnnouncementForm {...defaultProps} />);
    
    expect(screen.getByText('建立公告')).toBeInTheDocument();
    expect(screen.getByLabelText('標題 *')).toBeInTheDocument();
    expect(screen.getByTestId('rich-text-editor')).toBeInTheDocument();
    expect(screen.getByText('發布')).toBeInTheDocument();
    expect(screen.getByText('儲存草稿')).toBeInTheDocument();
  });

  it('renders edit form correctly', () => {
    const mockAnnouncement = {
      id: '1',
      projectId: 'proj123',
      title: 'Test Announcement',
      content: 'Test content',
      createdBy: 'user123',
      isActive: true,
      priority: 'normal' as const,
      createdAt: new Date(),
    };

    render(
      <AnnouncementForm
        {...defaultProps}
        announcement={mockAnnouncement}
        mode="edit"
      />
    );
    
    expect(screen.getByText('編輯公告')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Announcement')).toBeInTheDocument();
    expect(screen.getByText('更新')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<AnnouncementForm {...defaultProps} />);
    
    const publishButton = screen.getByText('發布');
    expect(publishButton).toBeDisabled();
    
    // Fill title but not content
    const titleInput = screen.getByLabelText('標題 *');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    
    expect(publishButton).toBeDisabled();
    
    // Fill content
    const contentEditor = screen.getByTestId('rich-text-editor');
    fireEvent.change(contentEditor, { target: { value: 'Test content' } });
    
    expect(publishButton).not.toBeDisabled();
  });

  it('calls onSave with correct data when form is submitted', async () => {
    render(<AnnouncementForm {...defaultProps} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('標題 *'), {
      target: { value: 'Test Title' },
    });
    
    fireEvent.change(screen.getByTestId('rich-text-editor'), {
      target: { value: 'Test content' },
    });
    
    // Submit form
    fireEvent.click(screen.getByText('發布'));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Test Title',
        content: 'Test content',
        priority: 'normal',
        saveAsDraft: false,
      });
    });
  });

  it('calls onSave with saveAsDraft flag when saving draft', async () => {
    render(<AnnouncementForm {...defaultProps} />);
    
    // Fill form
    fireEvent.change(screen.getByLabelText('標題 *'), {
      target: { value: 'Draft Title' },
    });
    
    fireEvent.change(screen.getByTestId('rich-text-editor'), {
      target: { value: 'Draft content' },
    });
    
    // Save as draft
    fireEvent.click(screen.getByText('儲存草稿'));
    
    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Draft Title',
        content: 'Draft content',
        priority: 'normal',
        saveAsDraft: true,
      });
    });
  });

  it('shows preview mode correctly', () => {
    render(<AnnouncementForm {...defaultProps} />);
    
    // Fill form first
    fireEvent.change(screen.getByLabelText('標題 *'), {
      target: { value: 'Preview Title' },
    });
    
    fireEvent.change(screen.getByTestId('rich-text-editor'), {
      target: { value: 'Preview content' },
    });
    
    // Click preview
    fireEvent.click(screen.getByText('預覽'));
    
    expect(screen.getByText('公告預覽')).toBeInTheDocument();
    expect(screen.getByText('Preview Title')).toBeInTheDocument();
    expect(screen.getByText('編輯')).toBeInTheDocument();
  });

  it('handles priority selection', () => {
    render(<AnnouncementForm {...defaultProps} />);
    
    // The select component would be tested in integration tests
    // Here we just verify the form structure includes priority selection
    expect(screen.getByText('優先級')).toBeInTheDocument();
  });

  it('handles scheduling options', () => {
    render(<AnnouncementForm {...defaultProps} />);
    
    expect(screen.getByText('排程發布時間')).toBeInTheDocument();
    expect(screen.getByText('過期時間')).toBeInTheDocument();
    expect(screen.getByText('留空則立即發布')).toBeInTheDocument();
    expect(screen.getByText('留空則永不過期')).toBeInTheDocument();
  });

  it('shows unsaved changes indicator', async () => {
    render(<AnnouncementForm {...defaultProps} />);
    
    // Make a change
    fireEvent.change(screen.getByLabelText('標題 *'), {
      target: { value: 'Changed title' },
    });
    
    await waitFor(() => {
      expect(screen.getByText('有未儲存的變更')).toBeInTheDocument();
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<AnnouncementForm {...defaultProps} />);
    
    fireEvent.click(screen.getByText('取消'));
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables form when loading', () => {
    render(<AnnouncementForm {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('取消')).toBeDisabled();
    expect(screen.getByText('儲存草稿')).toBeDisabled();
    expect(screen.getByText('發布')).toBeDisabled();
  });
});