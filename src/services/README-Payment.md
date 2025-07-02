
# Payment System Documentation

## Overview
The payment system has been refactored to work independently of Supabase Edge Functions, making it suitable for deployment on custom domains (e.g., www.slolan.com).

## Current Implementation

### Frontend Mock Payment Provider
- **File**: `src/services/mockPaymentProvider.ts`
- **Purpose**: Handles mock Nexi payments entirely in the frontend
- **Benefits**: 
  - Works on any domain/hosting platform
  - No dependency on Supabase Edge Functions
  - Easy to migrate to different hosting providers

### Usage
```typescript
import { getFrontendPaymentProvider } from '@/services/mockPaymentProvider';

const paymentProvider = getFrontendPaymentProvider();
const session = await paymentProvider.createPaymentSession(orderData);
```

## Files Updated
1. `src/services/mockPaymentProvider.ts` - New frontend-only payment provider
2. `src/pages/Placilo.tsx` - Updated to use frontend provider
3. `src/pages/PaymentSuccess.tsx` - Updated payment verification
4. `src/services/paymentService.ts` - Marked as deprecated, kept for compatibility

## Migration to Real Nexi API
When ready to implement real Nexi payments:

1. Update `RealNexiProvider` in `paymentService.ts`
2. Or create new provider in `mockPaymentProvider.ts`
3. Configure Nexi credentials securely
4. Update factory function to return real provider

## Key Features Preserved
- ✅ Toast notifications
- ✅ Loading animations  
- ✅ Order status updates
- ✅ Error handling
- ✅ i18n support
- ✅ Responsive design
- ✅ No product data modification

## Testing
- Mock payment simulation with 1.5s delay
- Proper error handling for invalid orders
- Session ID generation and tracking
- Order status updates in Supabase
