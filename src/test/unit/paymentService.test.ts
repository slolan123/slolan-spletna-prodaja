
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPaymentProvider, RealNexiProvider, MockNexiProvider } from '@/services/paymentService'

// Mock environment variables
vi.mock('import.meta.env', () => ({
  env: {
    VITE_PAYMENT_ENVIRONMENT: 'staging',
    VITE_PAYMENT_PROVIDER: 'nexi_xpay_cee',
    VITE_ENABLE_PAYMENT_LOGGING: 'true',
    VITE_ENABLE_PAYMENT_RETRY: 'true',
    VITE_USE_MOCK_PAYMENT: 'false'
  }
}))

// Mock fetch
global.fetch = vi.fn()

const mockOrder = {
  id: 'test-order-123',
  total: 25.50,
  currency: 'EUR',
  items: [
    {
      name: 'Test Product',
      quantity: 1,
      price: 25.50
    }
  ]
}

interface PaymentSessionResult {
  success: boolean
  redirectUrl: string
  sessionId: string
}

describe('PaymentService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPaymentProvider', () => {
    it('returns RealNexiProvider by default', () => {
      const provider = getPaymentProvider()
      expect(provider).toBeInstanceOf(RealNexiProvider)
    })

    it('returns MockNexiProvider when mock payment is enabled', () => {
      // Temporarily override environment variable
      vi.mocked(import.meta.env).VITE_USE_MOCK_PAYMENT = 'true'
      
      const provider = getPaymentProvider()
      expect(provider).toBeInstanceOf(MockNexiProvider)
    })
  })

  describe('RealNexiProvider', () => {
    let provider: RealNexiProvider

    beforeEach(() => {
      provider = new RealNexiProvider()
    })

    it('validates order data correctly', async () => {
      const invalidOrder = { ...mockOrder, total: 0 }
      
      await expect(provider.createPaymentSession(invalidOrder))
        .rejects.toThrow('Neveljavni podatki naročila')
    })

    it('validates order with no items', async () => {
      const invalidOrder = { ...mockOrder, items: [] }
      
      await expect(provider.createPaymentSession(invalidOrder))
        .rejects.toThrow('Naročilo nima izdelkov')
    })

    it('validates order total limit', async () => {
      const invalidOrder = { ...mockOrder, total: 15000 }
      
      await expect(provider.createPaymentSession(invalidOrder))
        .rejects.toThrow('Naročilo presega dovoljeno vrednost')
    })

    it('creates payment session successfully', async () => {
      const mockResponse: PaymentSessionResult = {
        success: true,
        redirectUrl: 'https://test-payment.com/checkout',
        sessionId: 'session_123'
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response)

      const result = await provider.createPaymentSession(mockOrder) as PaymentSessionResult
      
      expect(result.redirectUrl).toBe('https://test-payment.com/checkout')
      expect(result.sessionId).toBe('session_123')
    })

    it('handles API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      } as Response)

      await expect(provider.createPaymentSession(mockOrder))
        .rejects.toThrow('HTTP 500: Internal Server Error')
    })

    it('handles network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      await expect(provider.createPaymentSession(mockOrder))
        .rejects.toThrow('Napaka pri ustvarjanju plačilne seje: Network error')
    })
  })

  describe('MockNexiProvider', () => {
    let provider: MockNexiProvider

    beforeEach(() => {
      provider = new MockNexiProvider()
    })

    it('creates mock payment session', async () => {
      const result = await provider.createPaymentSession(mockOrder) as PaymentSessionResult
      
      expect(result.success).toBe(true)
      expect(result.redirectUrl).toContain('/payment-success')
      expect(result.sessionId).toContain('mock_session')
    })

    it('verifies mock payment', async () => {
      const result = await provider.verifyPayment('mock_session_123')
      
      expect(result.success).toBe(true)
      expect(result.transactionId).toContain('txn_mock_session_123')
    })

    it('handles invalid session ID', async () => {
      const result = await provider.verifyPayment('')
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid session ID')
    })
  })
}) 
