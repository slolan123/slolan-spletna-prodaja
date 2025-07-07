import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { BrowserRouter } from 'react-router-dom'

// Mock Supabase
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn()
  }))
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}))

// Test component to access context
const TestComponent = () => {
  const { user, loading, signIn, signUp, signOut } = useAuth()
  
  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="user">{user ? user.email : 'No User'}</div>
      <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => signUp('test@example.com', 'password', 'John', 'Doe')}>Sign Up</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

const renderWithAuth = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('provides loading state initially', () => {
    renderWithAuth(<TestComponent />)
    
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
  })

  it('handles sign in', async () => {
    mockSupabase.auth.signIn.mockResolvedValue({ error: null })
    
    renderWithAuth(<TestComponent />)
    
    const signInButton = screen.getByText('Sign In')
    signInButton.click()
    
    await waitFor(() => {
      expect(mockSupabase.auth.signIn).toHaveBeenCalledWith('test@example.com', 'password')
    })
  })

  it('handles sign up', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({ error: null })
    
    renderWithAuth(<TestComponent />)
    
    const signUpButton = screen.getByText('Sign Up')
    signUpButton.click()
    
    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        options: {
          data: {
            ime: 'John',
            priimek: 'Doe'
          }
        }
      })
    })
  })

  it('handles sign out', async () => {
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    
    renderWithAuth(<TestComponent />)
    
    const signOutButton = screen.getByText('Sign Out')
    signOutButton.click()
    
    await waitFor(() => {
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  it('shows no user when not authenticated', () => {
    renderWithAuth(<TestComponent />)
    
    expect(screen.getByTestId('user')).toHaveTextContent('No User')
  })
}) 