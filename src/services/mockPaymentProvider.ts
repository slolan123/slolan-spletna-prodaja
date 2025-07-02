
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
  success: boolean;
  redirectUrl: string;
  sessionId: string;
  error?: string;
}

// Frontend-only mock Nexi provider - no Supabase Edge functions needed
export class FrontendMockNexiProvider {
  async createPaymentSession(order: PaymentOrder): Promise<PaymentSession> {
    console.log('🎯 FrontendMockNexiProvider.createPaymentSession called with order:', order.id);
    
    // Validate order data
    if (!order || !order.id || !order.total || !order.items || order.items.length === 0) {
      console.error('❌ Invalid order data provided:', order);
      return {
        success: false,
        redirectUrl: '',
        sessionId: '',
        error: 'Invalid order data provided'
      };
    }

    if (order.total <= 0) {
      console.error('❌ Invalid order total:', order.total);
      return {
        success: false,
        redirectUrl: '',
        sessionId: '',
        error: 'Invalid order total'
      };
    }

    // Mock session creation - simulate API delay
    console.log('⏳ Simulating Nexi API call...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const sessionId = `mock_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const redirectUrl = `/payment-success?session_id=${sessionId}&order_id=${order.id}`;
    
    const result = {
      success: true,
      redirectUrl,
      sessionId
    };
    
    console.log('✅ Mock Nexi createPaymentSession result:', result);
    
    return result;
  }

  async verifyPayment(sessionId: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    console.log('🔍 FrontendMockNexiProvider.verifyPayment called with sessionId:', sessionId);
    
    if (!sessionId || typeof sessionId !== 'string') {
      console.error('❌ Invalid session ID:', sessionId);
      return {
        success: false,
        error: 'Invalid session ID'
      };
    }

    // Mock payment verification - simulate API delay
    console.log('⏳ Simulating payment verification...');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = {
      success: true,
      transactionId: `txn_${sessionId}_${Date.now()}`
    };
    
    console.log('✅ Mock Nexi verifyPayment result:', result);
    
    return result;
  }
}

// Factory to get the payment provider
export const getFrontendPaymentProvider = (): FrontendMockNexiProvider => {
  return new FrontendMockNexiProvider();
};
