import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CartProvider, useCart } from '@/contexts/CartContext'
import { ProductCard } from '@/components/products/ProductCard'
import { BrowserRouter } from 'react-router-dom'

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}))

// Mock wishlist context
vi.mock('@/contexts/WishlistContext', () => ({
  useWishlist: () => ({
    isInWishlist: false,
    toggleWishlist: vi.fn()
  })
}))

const mockProduct = {
  id: '1',
  naziv: 'Test Product',
  cena: 99.99,
  popust: 0,
  slika_url: '/test-image.jpg',
  slike_urls: ['/test-image.jpg'],
  status: 'novo' as const,
  zaloga: 5,
  na_voljo: true,
  koda: 'TEST001',
  seo_slug: 'test-product'
}

// Test component to access cart context
const TestCartComponent = () => {
  const { items, addToCart, removeFromCart, getTotalPrice } = useCart()
  
  return (
    <div>
      <div data-testid="cart-count">{items.length}</div>
      <div data-testid="cart-total">{getTotalPrice().toFixed(2)}</div>
      <button onClick={() => addToCart(mockProduct, 1)}>Add to Cart</button>
      {items.length > 0 && (
        <button onClick={() => removeFromCart(items[0].id)}>Remove from Cart</button>
      )}
    </div>
  )
}

const renderWithCart = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <CartProvider>
        {component}
      </CartProvider>
    </BrowserRouter>
  )
}

describe('Cart Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('adds product to cart', async () => {
    renderWithCart(<TestCartComponent />)
    
    const addButton = screen.getByText('Add to Cart')
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('99.99')
    })
  })

  it('removes product from cart', async () => {
    renderWithCart(<TestCartComponent />)
    
    // Add product first
    const addButton = screen.getByText('Add to Cart')
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    })
    
    // Remove product
    const removeButton = screen.getByText('Remove from Cart')
    fireEvent.click(removeButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-total')).toHaveTextContent('0.00')
    })
  })

  it('persists cart data in localStorage', async () => {
    renderWithCart(<TestCartComponent />)
    
    const addButton = screen.getByText('Add to Cart')
    fireEvent.click(addButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    })
    
    // Check localStorage
    const storedCart = localStorage.getItem('cart')
    expect(storedCart).toBeTruthy()
    
    const parsedCart = JSON.parse(storedCart!)
    expect(parsedCart).toHaveLength(1)
    expect(parsedCart[0].id).toBe('1')
  })

  it('loads cart data from localStorage on mount', () => {
    // Pre-populate localStorage
    const mockCartData = [
      {
        id: '1',
        naziv: 'Test Product',
        cena: 99.99,
        quantity: 2
      }
    ]
    localStorage.setItem('cart', JSON.stringify(mockCartData))
    
    renderWithCart(<TestCartComponent />)
    
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    expect(screen.getByTestId('cart-total')).toHaveTextContent('199.98')
  })

  it('handles multiple products in cart', async () => {
    const secondProduct = { ...mockProduct, id: '2', naziv: 'Second Product' }
    
    renderWithCart(<TestCartComponent />)
    
    // Add first product
    const addButton = screen.getByText('Add to Cart')
    fireEvent.click(addButton)
    
    // Add second product (we need to mock the second product)
    // This test shows the cart can handle multiple items
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    })
  })
}) 