
import { test, expect } from '@playwright/test'

test.describe('Shopping Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')
  })

  test('complete shopping flow - add to cart, checkout, payment', async ({ page }) => {
    // 1. Browse products
    await expect(page.locator('h1')).toContainText('Slolan')
    
    // Wait for products to load
    await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 })
    
    // 2. Add product to cart
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.locator('button[aria-label*="Dodaj"]').click()
    
    // Verify product added to cart
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')
    
    // 3. Go to cart
    await page.click('[data-testid="cart-icon"]')
    await expect(page).toHaveURL(/.*cart/)
    
    // 4. Proceed to checkout
    await page.click('button:has-text("Nadaljuj z nakupom")')
    await expect(page).toHaveURL(/.*checkout/)
    
    // 5. Fill checkout form
    await page.fill('input[name="ime"]', 'Test User')
    await page.fill('input[name="priimek"]', 'Test')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="telefon"]', '031123456')
    await page.fill('input[name="naslov"]', 'Test Address 123')
    await page.fill('input[name="posta"]', '1000')
    await page.fill('input[name="kraj"]', 'Ljubljana')
    
    // 6. Submit order
    await page.click('button:has-text("Oddaj naročilo")')
    
    // 7. Verify order creation
    await expect(page).toHaveURL(/.*placilo/)
    
    // 8. Complete payment (mock)
    await page.click('button:has-text("Plačaj")')
    
    // 9. Verify payment success
    await expect(page).toHaveURL(/.*payment-success/)
    await expect(page.locator('h1')).toContainText('Plačilo uspešno')
  })

  test('product search and filtering', async ({ page }) => {
    // 1. Search for products
    await page.fill('input[placeholder*="išči"]', 'test')
    await page.keyboard.press('Enter')
    
    // 2. Apply filters
    await page.click('button:has-text("Filtri")')
    await page.click('input[type="checkbox"]')
    await page.click('button:has-text("Uporabi filtre")')
    
    // 3. Verify filtered results
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(0)
  })

  test('user authentication flow', async ({ page }) => {
    // 1. Go to login page
    await page.click('button:has-text("Prijava")')
    
    // 2. Fill login form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button:has-text("Prijavi se")')
    
    // 3. Verify login (mock)
    await expect(page.locator('button:has-text("Odjava")')).toBeVisible()
  })

  test('wishlist functionality', async ({ page }) => {
    // 1. Add product to wishlist
    const firstProduct = page.locator('[data-testid="product-card"]').first()
    await firstProduct.locator('button[aria-label*="Dodaj na seznam želja"]').click()
    
    // 2. Go to wishlist
    await page.click('a[href*="wishlist"]')
    await expect(page).toHaveURL(/.*wishlist/)
    
    // 3. Verify product in wishlist
    await expect(page.locator('[data-testid="product-card"]')).toHaveCount(1)
  })

  test('responsive design - mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // 1. Verify mobile menu
    await page.click('button[aria-label*="menu"]')
    await expect(page.locator('nav')).toBeVisible()
    
    // 2. Navigate using mobile menu
    await page.click('a[href*="products"]')
    await expect(page).toHaveURL(/.*products/)
    
    // 3. Verify mobile layout
    await expect(page.locator('[data-testid="product-card"]')).toBeVisible()
  })

  test('error handling - invalid payment', async ({ page }) => {
    // 1. Go through checkout process
    await page.goto('/checkout')
    
    // 2. Try to submit without required fields
    await page.click('button:has-text("Oddaj naročilo")')
    
    // 3. Verify validation errors
    await expect(page.locator('text=Obvezno polje')).toBeVisible()
  })

  test('accessibility - keyboard navigation', async ({ page }) => {
    // 1. Navigate using keyboard
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // 2. Verify focus management
    await expect(page.locator(':focus')).toBeVisible()
    
    // 3. Test skip links
    await page.keyboard.press('Tab')
    await expect(page.locator('a[href="#main-content"]')).toBeFocused()
  })

  test('performance - page load times', async ({ page }) => {
    // 1. Measure homepage load time
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    // 2. Verify reasonable load time (under 3 seconds)
    expect(loadTime).toBeLessThan(3000)
    
    // 3. Check for images loading - use count instead of greaterThan
    const imageCount = await page.locator('img').count()
    expect(imageCount).toBeGreaterThan(0)
  })
}) 
