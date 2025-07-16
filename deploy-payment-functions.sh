#!/bin/bash

echo "🚀 Deploying Payment Edge Functions..."

# Deploy create-nexi-payment function
echo "📤 Deploying create-nexi-payment..."
supabase functions deploy create-nexi-payment

# Deploy nexi-webhook function
echo "📤 Deploying nexi-webhook..."
supabase functions deploy nexi-webhook

# Deploy verify-payment function
echo "📤 Deploying verify-payment..."
supabase functions deploy verify-payment

# Deploy verify-lock-code function
echo "📤 Deploying verify-lock-code..."
supabase functions deploy verify-lock-code

echo "✅ All payment functions deployed successfully!"
echo ""
echo "🔗 Function URLs:"
echo "  - create-nexi-payment: https://vkftjzirmhsyvtodxzxa.supabase.co/functions/v1/create-nexi-payment"
echo "  - nexi-webhook: https://vkftjzirmhsyvtodxzxa.supabase.co/functions/v1/nexi-webhook"
echo "  - verify-payment: https://vkftjzirmhsyvtodxzxa.supabase.co/functions/v1/verify-payment"
echo "  - verify-lock-code: https://vkftjzirmhsyvtodxzxa.supabase.co/functions/v1/verify-lock-code"
echo ""
echo "🔧 Environment variables are already configured in Supabase Dashboard"
echo "📝 Don't forget to create .env.local file with your frontend environment variables" 