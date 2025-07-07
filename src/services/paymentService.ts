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

export interface PaymentConfig {
  environment: 'staging' | 'production';
  provider: string;
  enableLogging: boolean;
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
}

// Get configuration from environment variables
const getPaymentConfig = (): PaymentConfig => ({
  environment: (import.meta.env.VITE_PAYMENT_ENVIRONMENT as 'staging' | 'production') || 'staging',
  provider: import.meta.env.VITE_PAYMENT_PROVIDER || 'nexi_xpay_cee',
  enableLogging: import.meta.env.VITE_ENABLE_PAYMENT_LOGGING === 'true',
  enableRetry: import.meta.env.VITE_ENABLE_PAYMENT_RETRY === 'true',
  maxRetries: 3,
  retryDelay: 1000,
});

// Secure logging function
const logPayment = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  const config = getPaymentConfig();
  if (!config.enableLogging) return;
  
  const logData = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(data && { data: JSON.stringify(data, null, 2) })
  };
  
  switch (level) {
    case 'info':
      console.log('💳 [PAYMENT]', logData);
      break;
    case 'warn':
      console.warn('⚠️ [PAYMENT]', logData);
      break;
    case 'error':
      console.error('❌ [PAYMENT]', logData);
      break;
  }
};

// Retry wrapper for API calls
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      logPayment('warn', `Attempt ${attempt} failed`, { error: error.message });
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
};

// Abstract payment interface - can be swapped for different providers
export abstract class PaymentProvider {
  protected config: PaymentConfig;
  
  constructor() {
    this.config = getPaymentConfig();
  }
  
  abstract createPaymentSession(order: PaymentOrder): Promise<PaymentSession>;
  abstract verifyPayment(sessionId: string): Promise<PaymentResult>;
  
  protected validateOrder(order: PaymentOrder): void {
    if (!order || !order.id || !order.total || order.total <= 0) {
      throw new Error('Neveljavni podatki naročila');
    }
    
    if (!order.items || order.items.length === 0) {
      throw new Error('Naročilo nima izdelkov');
    }
    
    if (order.total > 10000) {
      throw new Error('Naročilo presega dovoljeno vrednost');
    }
  }
}

// DEPRECATED: Use getFrontendPaymentProvider from mockPaymentProvider.ts instead
// This mock provider was dependent on Supabase Edge functions
export class MockNexiProvider extends PaymentProvider {
  async createPaymentSession(order: PaymentOrder): Promise<PaymentSession> {
    logPayment('warn', 'MockNexiProvider is deprecated. Use getFrontendPaymentProvider instead.');
    
    this.validateOrder(order);
    
    // Fallback implementation that works without Edge functions
    const sessionId = `fallback_session_${Date.now()}`;
    const redirectUrl = `/payment-success?session_id=${sessionId}&order_id=${order.id}`;
    
    logPayment('info', 'Mock payment session created', { sessionId, orderId: order.id });
    
    return {
      redirectUrl,
      sessionId
    };
  }

  async verifyPayment(sessionId: string): Promise<PaymentResult> {
    logPayment('warn', 'MockNexiProvider is deprecated. Use getFrontendPaymentProvider instead.');
    
    if (!sessionId) {
      throw new Error('Manjka session ID');
    }
    
    return {
      success: true,
      transactionId: `fallback_txn_${sessionId}_${Date.now()}`
    };
  }
}

// Real Nexi XPay CEE implementation using Supabase Edge Function
export class RealNexiProvider extends PaymentProvider {
  private supabaseUrl: string;
  private supabaseKey: string;
  
  constructor() {
    super();
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      throw new Error('Supabase konfiguracija manjka');
    }
  }

  async createPaymentSession(order: PaymentOrder): Promise<PaymentSession> {
    try {
      logPayment('info', 'Creating Nexi payment session', { orderId: order.id });
      
      this.validateOrder(order);

      const operation = async () => {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/create-nexi-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          },
          body: JSON.stringify({ order }),
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Nexi session creation failed');
        }

        if (!data.redirectUrl) {
          throw new Error('Manjka povezava za preusmerjanje na plačilno stran');
        }

        return {
          redirectUrl: data.redirectUrl,
          sessionId: data.sessionId || `session_${Date.now()}`
        };
      };

      const result = this.config.enableRetry 
        ? await withRetry(operation, this.config.maxRetries, this.config.retryDelay)
        : await operation();

      logPayment('info', 'Nexi payment session created successfully', { 
        sessionId: result.sessionId,
        redirectUrl: result.redirectUrl.substring(0, 50) + '...'
      });
      
      return result;

    } catch (error) {
      logPayment('error', 'Nexi payment session creation failed', { 
        error: error.message,
        orderId: order.id 
      });
      
      throw new Error(`Napaka pri ustvarjanju plačilne seje: ${error.message}`);
    }
  }

  async verifyPayment(sessionId: string): Promise<PaymentResult> {
    try {
      logPayment('info', 'Verifying payment', { sessionId });
      
      if (!sessionId) {
        throw new Error('Manjka session ID');
      }

      const operation = async () => {
        const response = await fetch(`${this.supabaseUrl}/functions/v1/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          },
          body: JSON.stringify({ sessionId }),
          signal: AbortSignal.timeout(15000) // 15 second timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Payment verification failed');
        }

        return {
          success: data.success,
          transactionId: data.transactionId
        };
      };

      const result = this.config.enableRetry 
        ? await withRetry(operation, this.config.maxRetries, this.config.retryDelay)
        : await operation();

      logPayment('info', 'Payment verification completed', { 
        sessionId,
        success: result.success,
        transactionId: result.transactionId
      });
      
      return result;
      
    } catch (error) {
      logPayment('error', 'Payment verification failed', { 
        error: error.message,
        sessionId 
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Main factory function - returns real Nexi provider
export const getPaymentProvider = (): PaymentProvider => {
  const config = getPaymentConfig();
  logPayment('info', 'Creating payment provider', { 
    provider: config.provider,
    environment: config.environment 
  });
  
  // For testing, use mock provider if Nexi is not working
  if (config.environment === 'staging' && import.meta.env.VITE_USE_MOCK_PAYMENT === 'true') {
    logPayment('info', 'Using mock payment provider for testing');
    return new MockNexiProvider();
  }
  
  return new RealNexiProvider();
};
