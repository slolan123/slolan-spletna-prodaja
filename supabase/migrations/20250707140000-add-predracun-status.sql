-- Add 'predracun' status to narocilo_status enum
ALTER TYPE public.narocilo_status ADD VALUE 'predracun';

-- Add payment_method column to narocila table
ALTER TABLE public.narocila 
ADD COLUMN payment_method text DEFAULT 'card' CHECK (payment_method IN ('card', 'predracun')); 