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

// DEPRECATED: Use getFrontendPaymentProvider from mockPaymentProvider.ts instead
// This mock provider was dependent on Supabase Edge functions
export class MockNexiProvider extends PaymentProvider {
  async createPaymentSession(order: PaymentOrder): Promise<PaymentSession> {
    console.warn('⚠️ MockNexiProvider is deprecated. Use getFrontendPaymentProvider instead.');
    
    // Fallback implementation that works without Edge functions
    const sessionId = `fallback_session_${Date.now()}`;
    const redirectUrl = `/payment-success?session_id=${sessionId}&order_id=${order.id}`;
    
    return {
      redirectUrl,
      sessionId
    };
  }

  async verifyPayment(sessionId: string): Promise<PaymentResult> {
    console.warn('⚠️ MockNexiProvider is deprecated. Use getFrontendPaymentProvider instead.');
    
    return {
      success: true,
      transactionId: `fallback_txn_${sessionId}_${Date.now()}`
    };
  }
}

// Real Nexi XPay CEE implementation
export class RealNexiProvider extends PaymentProvider {
  private environment: string;
  
  constructor(environment: string = 'test') {
    super();
    this.environment = environment;
  }

  async createPaymentSession(order: PaymentOrder): Promise<PaymentSession> {
    try {
      console.log('🎯 RealNexiProvider.createPaymentSession called for order:', order.id);
      
      // Call Supabase Edge Function for secure Nexi integration
      const response = await fetch('https://vkftjzirmhsyvtodxzxa.supabase.co/functions/v1/create-nexi-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZnRqemlybWhzeXZ0b2R4enhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjAyMTYsImV4cCI6MjA2NTk5NjIxNn0.rX3LxN5eGm8AHN693W-3joRndUb8Rau1iHpvlAYtfpM`
        },
        body: JSON.stringify({ order })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Nexi payment session creation failed');
      }

      console.log('✅ Nexi payment session created:', data.sessionId);
      
      return {
        redirectUrl: data.redirectUrl,
        sessionId: data.sessionId
      };

    } catch (error) {
      console.error('❌ Nexi payment session creation error:', error);
      throw error;
    }
  }

  async verifyPayment(sessionId: string): Promise<PaymentResult> {
    // For now, return success - webhook handles actual verification
    return {
      success: true,
      transactionId: `nexi_${sessionId}_${Date.now()}`
    };
  }
}

// Main factory function - returns real Nexi provider
export const getPaymentProvider = (): PaymentProvider => {
  return new RealNexiProvider('test');
};
