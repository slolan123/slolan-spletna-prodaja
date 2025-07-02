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
// SAFEGUARD: This class only handles payment processing, never modifies product data
export class MockNexiProvider extends PaymentProvider {
  async createPaymentSession(order: PaymentOrder): Promise<PaymentSession> {
    console.log('🎯 MockNexiProvider.createPaymentSession called with order:', order.id);
    
    // Validate order data
    if (!order || !order.id || !order.total || !order.items || order.items.length === 0) {
      console.error('❌ Invalid order data provided:', order);
      throw new Error('Invalid order data provided');
    }

    // Mock Nexi session creation - always return valid redirect URL
    const sessionId = `mock_session_${Date.now()}`;
    
    // For testing, redirect to our success page instead of external URL
    const redirectUrl = '/payment-success';
    
    console.log('⏳ Simulating API call delay...');
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = {
      redirectUrl,
      sessionId
    };
    
    console.log('✅ Mock Nexi createPaymentSession result:', result);
    
    return result;
  }

  async verifyPayment(sessionId: string): Promise<PaymentResult> {
    console.log('🔍 MockNexiProvider.verifyPayment called with sessionId:', sessionId);
    
    // Validate session ID
    if (!sessionId || typeof sessionId !== 'string') {
      console.error('❌ Invalid session ID:', sessionId);
      return {
        success: false,
        error: 'Invalid session ID'
      };
    }

    console.log('⏳ Simulating payment verification delay...');
    // Mock payment verification - always successful for testing
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const result = {
      success: true,
      transactionId: `txn_${sessionId}_${Date.now()}`
    };
    
    console.log('✅ Mock Nexi verifyPayment result:', result);
    
    return result;
  }
}

// Real Nexi implementation placeholder - ready for future replacement
export class RealNexiProvider extends PaymentProvider {
  private alias: string;
  private secret: string;
  private environment: string;
  
  constructor(alias: string, secret: string, environment: string = 'test') {
    super();
    this.alias = alias;
    this.secret = secret;
    this.environment = environment;
  }

  async createPaymentSession(order: PaymentOrder): Promise<PaymentSession> {
    // TODO: Implement real Nexi XPay CEE API call
    // This is where the actual Nexi integration will go
    throw new Error('Real Nexi provider not implemented yet');
  }

  async verifyPayment(sessionId: string): Promise<PaymentResult> {
    // TODO: Implement real Nexi payment verification
    throw new Error('Real Nexi provider not implemented yet');
  }
}

// Factory to get the current payment provider
export const getPaymentProvider = (): PaymentProvider => {
  // For now, always return mock Nexi
  // Later: switch based on configuration or environment variables
  return new MockNexiProvider();
  
  // Future implementation:
  // const useRealNexi = process.env.NODE_ENV === 'production';
  // if (useRealNexi) {
  //   return new RealNexiProvider(
  //     process.env.NEXI_ALIAS!,
  //     process.env.NEXI_SECRET!,
  //     process.env.NEXI_ENV!
  //   );
  // }
  // return new MockNexiProvider();
};
