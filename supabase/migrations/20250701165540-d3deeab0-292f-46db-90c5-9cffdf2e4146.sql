
-- Dodaj tabelo za barvne različice izdelkov
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.predmeti(id) ON DELETE CASCADE,
  color_name TEXT NOT NULL,
  color_value TEXT, -- hex vrednost ali CSS barva
  images TEXT[], -- array slik za to barvno različico
  stock INTEGER NOT NULL DEFAULT 0,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, color_name)
);

-- Omogoči RLS za product_variants
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies za product_variants
CREATE POLICY "Everyone can view product variants" 
  ON public.product_variants 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage product variants" 
  ON public.product_variants 
  FOR ALL 
  USING (is_admin(auth.uid()));

-- Dodaj trigger za updated_at
CREATE TRIGGER update_product_variants_updated_at 
  BEFORE UPDATE ON public.product_variants 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Posodobi narocila tabelo da vključuje izbrane barve
ALTER TABLE public.narocila 
ADD COLUMN IF NOT EXISTS selected_variants JSONB DEFAULT '[]'::jsonb;

-- Dodaj komentar za razjasnitev
COMMENT ON COLUMN public.narocila.selected_variants IS 'Array of selected product variants with color information: [{"product_id": "uuid", "variant_id": "uuid", "color_name": "string", "quantity": number}]';
