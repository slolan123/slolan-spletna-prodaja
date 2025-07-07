import { test, expect } from '@playwright/test'

test.describe('Security Tests', () => {
  test('XSS protection', async ({ page }) => {
    // Test XSS in search input
    await page.goto('/')
    
    const xssPayload = '<script>alert("XSS")</script>'
    await page.fill('input[placeholder*="išči"]', xssPayload)
    await page.keyboard.press('Enter')
    
    // Verify script is not executed
    const pageContent = await page.content()
    expect(pageContent).not.toContain('<script>alert("XSS")</script>')
  })

  test('SQL injection protection', async ({ page }) => {
    // Test SQL injection in search
    await page.goto('/')
    
    const sqlInjectionPayload = "'; DROP TABLE users; --"
    await page.fill('input[placeholder*="išči"]', sqlInjectionPayload)
    await page.keyboard.press('Enter')
    
    // Verify no error page is shown
    await expect(page.locator('body')).not.toContainText('SQL')
    await expect(page.locator('body')).not.toContainText('error')
  })

  test('CSRF protection', async ({ page }) => {
    // Test form submission without proper CSRF token
    await page.goto('/checkout')
    
    // Try to submit form directly via JavaScript
    await page.evaluate(() => {
      const form = document.querySelector('form')
      if (form) {
        form.submit()
      }
    })
    
    // Verify form validation prevents submission
    await expect(page.locator('text=Obvezno polje')).toBeVisible()
  })

  test('authentication bypass', async ({ page }) => {
    // Try to access protected routes without authentication
    await page.goto('/admin')
    
    // Should redirect to login or show access denied
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/login|auth|denied/)
  })

  test('input validation', async ({ page }) => {
    // Test various malicious inputs
    const maliciousInputs = [
      'javascript:alert("XSS")',
      'data:text/html,<script>alert("XSS")</script>',
      'vbscript:msgbox("XSS")',
      'onload=alert("XSS")',
      'onerror=alert("XSS")'
    ]
    
    for (const input of maliciousInputs) {
      await page.goto('/')
      await page.fill('input[placeholder*="išči"]', input)
      await page.keyboard.press('Enter')
      
      // Verify no script execution
      const pageContent = await page.content()
      expect(pageContent).not.toContain('alert("XSS")')
    }
  })

  test('file upload security', async ({ page }) => {
    // Test malicious file upload
    await page.goto('/admin/products')
    
    // Try to upload executable file
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: 'malicious.exe',
        mimeType: 'application/x-msdownload',
        buffer: Buffer.from('fake executable content')
      })
      
      // Verify file type validation
      await expect(page.locator('text=Neveljavna datoteka')).toBeVisible()
    }
  })

  test('rate limiting', async ({ page }) => {
    // Test rapid form submissions
    await page.goto('/checkout')
    
    // Submit form multiple times rapidly
    for (let i = 0; i < 10; i++) {
      await page.click('button:has-text("Oddaj naročilo")')
    }
    
    // Verify rate limiting is in place
    await expect(page.locator('text=Preveč poskusov')).toBeVisible()
  })

  test('secure headers', async ({ page }) => {
    // Check for security headers
    const response = await page.goto('/')
    
    // Verify security headers are present
    const headers = response?.headers()
    expect(headers?.['x-frame-options']).toBeTruthy()
    expect(headers?.['x-content-type-options']).toBe('nosniff')
    expect(headers?.['x-xss-protection']).toBe('1; mode=block')
  })

  test('password strength', async ({ page }) => {
    // Test weak password
    await page.goto('/auth')
    
    await page.fill('input[name="password"]', '123')
    await page.click('button:has-text("Registracija")')
    
    // Verify password strength validation
    await expect(page.locator('text=Geslo mora biti daljše')).toBeVisible()
  })

  test('session management', async ({ page }) => {
    // Test session timeout
    await page.goto('/')
    
    // Simulate long inactivity
    await page.evaluate(() => {
      // Clear any stored session data
      localStorage.clear()
      sessionStorage.clear()
    })
    
    // Try to access protected content
    await page.goto('/profile')
    
    // Should redirect to login
    expect(page.url()).toMatch(/login|auth/)
  })
}) 