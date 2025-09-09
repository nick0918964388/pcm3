import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

// Mock the Button component to avoid dependency issues in tests
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button data-testid="button" {...props}>
      {children}
    </button>
  ),
}))

describe('Home Page', () => {
  it('renders the welcome message', () => {
    render(<Home />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('歡迎使用 PCM 系統')
  })

  it('renders the subtitle', () => {
    render(<Home />)
    
    const subtitle = screen.getByText('Personnel Career Management System')
    expect(subtitle).toBeInTheDocument()
  })

  it('renders the start button', () => {
    render(<Home />)
    
    const button = screen.getByTestId('button')
    expect(button).toHaveTextContent('開始使用')
  })
})