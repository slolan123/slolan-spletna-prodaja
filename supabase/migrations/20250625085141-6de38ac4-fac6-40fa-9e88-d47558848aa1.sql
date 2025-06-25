
-- Dodamo novo kolono "masa" v tabelo predmeti za shranjevanje teže izdelka
ALTER TABLE public.predmeti 
ADD COLUMN masa NUMERIC(10,3) NULL;

-- Dodamo komentar za boljše razumevanje
COMMENT ON COLUMN public.predmeti.masa IS 'Masa/teža izdelka v kilogramih';
