-- Add business customer data to orders table
ALTER TABLE public.narocila 
ADD COLUMN customer_type text DEFAULT 'personal' CHECK (customer_type IN ('personal', 'business')),
ADD COLUMN company_name text,
ADD COLUMN company_address text,
ADD COLUMN company_vat text,
ADD COLUMN company_email text;