import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ProductCard } from '@/components/products/ProductCard'

// Mock the contexts
vi.mock('@/contexts/CartContext', () => ({
  useCart: () => ({
    addToCart: vi.fn()
  })
}))

vi.mock('@/contexts/WishlistContext', () => ({
  useWishlist: () => ({
    isInWishlist: false,
    toggleWishlist: vi.fn()
  })
}))

const mockProduct = {
  id: '1',
  naziv: 'Test Product',
  naziv_en: 'Test Product EN',
  cena: 99.99,
  popust: 10,
  slika_url: '/test-image.jpg',
  slike_urls: ['/test-image.jpg', '/test-image-2.jpg'],
  status: 'novo' as const,
  zaloga: 5,
  na_voljo: true,
  koda: 'TEST001',
  seo_slug: 'test-product'
}

describe('ProductCard', () => {
  it('renders product information correctly', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText('Test Product')).toBeInTheDocument()
    expect(screen.getByText('TEST001')).toBeInTheDocument()
    expect(screen.getByText('€89.99')).toBeInTheDocument() // Price after discount
    expect(screen.getByText('€99.99')).toBeInTheDocument() // Original price
    expect(screen.getByText('-10%')).toBeInTheDocument()
  })

  it('shows correct stock status', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByText(/Na zalogi \(5\)/)).toBeInTheDocument()
  })

  it('shows out of stock when zaloga is 0', () => {
    const outOfStockProduct = { ...mockProduct, zaloga: 0 }
    render(<ProductCard product={outOfStockProduct} />)
    
    expect(screen.getByText('Ni na zalogi')).toBeInTheDocument()
  })

  it('disables add to cart button when out of stock', () => {
    const outOfStockProduct = { ...mockProduct, zaloga: 0, na_voljo: false }
    render(<ProductCard product={outOfStockProduct} />)
    
    const addToCartButton = screen.getByRole('button', { name: /Dodaj Test Product v košarico/ })
    expect(addToCartButton).toBeDisabled()
  })

  it('shows multiple images indicator when product has multiple images', () => {
    render(<ProductCard product={mockProduct} />)
    
    expect(screen.getByLabelText('2 slik')).toBeInTheDocument()
  })

  it('renders product image with correct alt text', () => {
    render(<ProductCard product={mockProduct} />)
    
    const image = screen.getByAltText('Test Product')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '/test-image.jpg')
  })

  it('renders product link with correct href', () => {
    render(<ProductCard product={mockProduct} />)
    
    const link = screen.getByRole('link', { name: /Poglej podrobnosti za Test Product/ })
    expect(link).toHaveAttribute('href', '/product/1')
  })
}) 