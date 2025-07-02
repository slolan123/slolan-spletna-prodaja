
export interface PaymentOrder {
  id: string;
  total: number;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export interface PaymentSession {
  redirectUrl: string;
  sessionId: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// Abstract payment interface - can be swapped for different providers
export abstract class PaymentProvider {
  abstract createPaymentSession(order: PaymentOrder): Promise<PaymentSession>;
  abstract verifyPayment(sessionId: string): Promise<PaymentResult>;
}

// Mock Nexi implementation - will be replaced with real API
export class MockNexiProvider extends PaymentProvider {
  async createPaymentSession(order: PaymentOrder): Promise<PaymentSession> {
    // Mock Nexi session creation
    const sessionId = `mock_session_${Date.now()}`;
    const redirectUrl = `https://fake-nexi-redirect.com/checkout/${sessionId}`;
    
    return {
      redirectUrl,
      sessionId
    };
  }

  async verifyPayment(sessionId: string): Promise<PaymentResult> {
    // Mock payment verification - always successful for testing
    return {
      success: true,
      transactionId: `txn_${sessionId}_${Date.now()}`
    };
  }
}

// Factory to get the current payment provider
export const getPaymentProvider = (): PaymentProvider => {
  // For now, always return mock Nexi
  // Later: switch based on configuration
  return new MockNexiProvider();
};
