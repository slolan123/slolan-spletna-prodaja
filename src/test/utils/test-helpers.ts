
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { CartProvider } from '@/contexts/CartContext'
import { WishlistProvider } from '@/contexts/WishlistProvider'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Test wrapper with all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return React.createElement(
    QueryClientProvider,
    { client: queryClient },
    React.createElement(
      BrowserRouter,
      null,
      React.createElement(
        AuthProvider,
        null,
        React.createElement(
          CartProvider,
          null,
          React.createElement(
            WishlistProvider,
            null,
            children
          )
        )
      )
    )
  )
}

// Custom render function
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Mock data generators
export const createMockProduct = (overrides = {}) => ({
  id: '1',
  naziv: 'Test Product',
  naziv_en: 'Test Product EN',
  cena: 99.99,
  popust: 0,
  slika_url: '/test-image.jpg',
  slike_urls: ['/test-image.jpg'],
  status: 'novo' as const,
  zaloga: 5,
  na_voljo: true,
  koda: 'TEST001',
  seo_slug: 'test-product',
  ...overrides
})

export const createMockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  ime: 'Test',
  priimek: 'User',
  role: 'user' as const,
  ...overrides
})

export const createMockOrder = (overrides = {}) => ({
  id: 'order-1',
  uporabnik_id: 'user-1',
  status: 'oddano' as const,
  total: 99.99,
  datum: new Date().toISOString(),
  artikli: JSON.stringify([createMockProduct()]),
  ...overrides
})

// Test utilities
export const waitForLoadingToFinish = async () => {
  // Wait for any loading states to finish
  await new Promise(resolve => setTimeout(resolve, 100))
}

export const mockLocalStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key])
    }
  }
}

export const mockSessionStorage = () => {
  const store: Record<string, string> = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key])
    }
  }
}

// Form testing utilities
export const fillForm = async (formData: Record<string, string>) => {
  // This would be implemented with actual form filling logic
  return formData
}

export const submitForm = async (formSelector: string) => {
  // This would be implemented with actual form submission logic
  return true
}

// API mocking utilities
export const mockApiResponse = (endpoint: string, response: any) => {
  // Mock fetch for specific endpoint
  global.fetch = jest.fn().mockImplementation((url) => {
    if (url.includes(endpoint)) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response)
      })
    }
    return Promise.resolve({
      ok: false,
      status: 404
    })
  })
}

export const mockApiError = (endpoint: string, error: any) => {
  global.fetch = jest.fn().mockImplementation((url) => {
    if (url.includes(endpoint)) {
      return Promise.reject(error)
    }
    return Promise.resolve({
      ok: false,
      status: 404
    })
  })
}

// Export custom render
export { customRender as render }
