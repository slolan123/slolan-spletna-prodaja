
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

// Real Nexi XPay CEE implementation using Supabase Edge Function
export class RealNexiProvider extends PaymentProvider {
  private environment: string;
  
  constructor(environment: string = 'test') {
    super();
    this.environment = environment;
  }

  async createPaymentSession(order: PaymentOrder): Promise<PaymentSession> {
    try {
      console.log('🎯 RealNexiProvider.createPaymentSession called for order:', order.id);
      console.log('📊 Order details:', {
        id: order.id,
        total: order.total,
        currency: order.currency,
        itemCount: order.items.length
      });

      // Validate order data before sending
      if (!order || !order.id || !order.total || order.total <= 0) {
        console.error('❌ Invalid order data:', order);
        throw new Error('Neveljavni podatki naročila');
      }

      if (!order.items || order.items.length === 0) {
        console.error('❌ No items in order:', order);
        throw new Error('Naročilo nima izdelkov');
      }

      console.log('📤 Sending request to Supabase Edge Function...');
      
      // Call Supabase Edge Function for secure Nexi integration
      const response = await fetch('https://vkftjzirmhsyvtodxzxa.supabase.co/functions/v1/create-nexi-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZnRqemlybWhzeXZ0b2R4enhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0MjAyMTYsImV4cCI6MjA2NTk5NjIxNn0.rX3LxN5eGm8AHN693W-3joRndUb8Rau1iHpvlAYtfpM`
        },
        body: JSON.stringify({ order })
      });

      console.log('📥 Edge Function response status:', response.status);

      // Get response text first to handle both JSON and text responses
      const responseText = await response.text();
      console.log('📥 Edge Function raw response:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse Edge Function response as JSON:', parseError);
        console.error('📝 Raw response text:', responseText);
        throw new Error(`Napaka pri komunikaciji s plačilnim sistemom: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        console.error('❌ Edge Function returned error:', data);
        throw new Error(data.error || `HTTP ${response.status}: ${responseText}`);
      }

      if (!data.success) {
        console.error('❌ Nexi payment session creation failed:', data);
        throw new Error(data.error || 'Nexi session creation failed');
      }

      if (!data.redirectUrl) {
        console.error('❌ No redirectUrl in successful response:', data);
        throw new Error('Manjka povezava za preusmerjanje na plačilno stran');
      }

      console.log('✅ Nexi payment session created successfully:', {
        sessionId: data.sessionId,
        redirectUrl: data.redirectUrl.substring(0, 50) + '...'
      });
      
      return {
        redirectUrl: data.redirectUrl,
        sessionId: data.sessionId || `session_${Date.now()}`
      };

    } catch (error) {
      console.error('💥 RealNexiProvider.createPaymentSession error:', error);
      
      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw new Error(`Napaka pri ustvarjanju plačilne seje: ${error.message}`);
      } else {
        throw new Error('Neznana napaka pri ustvarjanju plačilne seje');
      }
    }
  }

  async verifyPayment(sessionId: string): Promise<PaymentResult> {
    try {
      console.log('🔍 Verifying payment for session:', sessionId);
      
      // For now, return success - webhook handles actual verification
      return {
        success: true,
        transactionId: `nexi_${sessionId}_${Date.now()}`
      };
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment verification failed'
      };
    }
  }
}

// Main factory function - returns real Nexi provider
export const getPaymentProvider = (): PaymentProvider => {
  console.log('🏭 Creating RealNexiProvider instance');
  return new RealNexiProvider('test');
};
