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

// DEPRECATED: Factory function - use getFrontendPaymentProvider instead
export const getPaymentProvider = (): PaymentProvider => {
  console.warn('⚠️ getPaymentProvider is deprecated. Use getFrontendPaymentProvider from mockPaymentProvider.ts instead.');
  return new MockNexiProvider();
};
