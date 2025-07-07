/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_PAYMENT_ENVIRONMENT: string
  readonly VITE_PAYMENT_PROVIDER: string
  readonly VITE_ENABLE_PAYMENT_LOGGING: string
  readonly VITE_ENABLE_PAYMENT_RETRY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
