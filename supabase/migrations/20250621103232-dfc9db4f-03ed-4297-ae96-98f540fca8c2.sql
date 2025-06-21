-- Popravimo povezave izdelkov na originalne kategorije
-- Tehnologija -> Elektronika  
UPDATE predmeti SET kategorija_id = 'b69df7a1-ee64-402d-9353-0e123f6a65a8' 
WHERE kategorija_id = '550e8400-e29b-41d4-a716-446655440001';

-- Podvojene oblačila -> originalne oblačila
UPDATE predmeti SET kategorija_id = '45d70703-bb0d-4889-b555-ef51d04363fe' 
WHERE kategorija_id = '550e8400-e29b-41d4-a716-446655440002';

-- Podvojen nakit -> originalen nakit  
UPDATE predmeti SET kategorija_id = '4e0985d2-aab4-49f8-be5a-4b46cd2b7ea9' 
WHERE kategorija_id = '550e8400-e29b-41d4-a716-446655440003';

-- Zdaj lahko varno izbrišemo podvojene kategorije
DELETE FROM kategorije WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002', 
  '550e8400-e29b-41d4-a716-446655440003'
);

-- Dodaj komentarje tabelo za ocene izdelkov
CREATE TABLE IF NOT EXISTS public.ocene_izdelkov (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uporabnik_id uuid NOT NULL,
  izdelek_id uuid NOT NULL REFERENCES public.predmeti(id) ON DELETE CASCADE,
  ocena integer NOT NULL CHECK (ocena >= 1 AND ocena <= 5),
  komentar text,
  odobreno boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(uporabnik_id, izdelek_id)
);

-- Omogoči RLS na ocene
ALTER TABLE public.ocene_izdelkov ENABLE ROW LEVEL SECURITY;

-- RLS politike za ocene
CREATE POLICY "Uporabniki lahko vidijo odobrene ocene" 
ON public.ocene_izdelkov 
FOR SELECT 
USING (odobreno = true);

CREATE POLICY "Lastniki lahko vidijo svoje ocene" 
ON public.ocene_izdelkov 
FOR SELECT 
USING (auth.uid() = uporabnik_id);

CREATE POLICY "Uporabniki lahko dodajo svoje ocene" 
ON public.ocene_izdelkov 
FOR INSERT 
WITH CHECK (auth.uid() = uporabnik_id);

CREATE POLICY "Uporabniki lahko urejajo svoje ocene" 
ON public.ocene_izdelkov 
FOR UPDATE 
USING (auth.uid() = uporabnik_id)
WITH CHECK (auth.uid() = uporabnik_id);

CREATE POLICY "Admini vidijo vse ocene"
ON public.ocene_izdelkov
FOR ALL
USING (public.is_admin(auth.uid()));

-- Trigger za posodabljanje updated_at
CREATE TRIGGER update_ocene_izdelkov_updated_at
BEFORE UPDATE ON public.ocene_izdelkov
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();