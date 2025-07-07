-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

-- Create predmet status enum
CREATE TYPE public.predmet_status AS ENUM ('novo', 'znizano', 'prodano');

-- Create narocilo status enum  
CREATE TYPE public.narocilo_status AS ENUM ('oddano', 'potrjeno', 'poslano', 'dostavljeno', 'preklicano');

-- Create vracilo status enum
CREATE TYPE public.vracilo_status AS ENUM ('oddano', 'obravnava', 'odobreno', 'zavrnjeno');

-- Create profiles table for additional user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  ime TEXT NOT NULL,
  priimek TEXT NOT NULL,
  telefon TEXT,
  naslov TEXT,
  vloga user_role NOT NULL DEFAULT 'user',
  preferred_language TEXT DEFAULT 'sl',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kategorije table
CREATE TABLE public.kategorije (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naziv TEXT NOT NULL,
  naziv_en TEXT,
  naziv_de TEXT,
  naziv_it TEXT,
  naziv_ru TEXT,
  opis TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create predmeti table
CREATE TABLE public.predmeti (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  naziv TEXT NOT NULL,
  naziv_en TEXT,
  naziv_de TEXT,
  naziv_it TEXT,
  naziv_ru TEXT,
  koda TEXT UNIQUE NOT NULL,
  stevilka TEXT,
  barva TEXT,
  opis TEXT,
  opis_en TEXT,
  opis_de TEXT,
  opis_it TEXT,
  opis_ru TEXT,
  slika_url TEXT,
  slike_urls TEXT[], -- Array of image URLs
  cena DECIMAL(10,2) NOT NULL,
  zaloga INTEGER NOT NULL DEFAULT 0,
  na_voljo BOOLEAN NOT NULL DEFAULT true,
  kategorija_id UUID REFERENCES public.kategorije(id),
  atributi JSONB DEFAULT '{}',
  status predmet_status NOT NULL DEFAULT 'novo',
  popust DECIMAL(5,2) DEFAULT 0,
  seo_slug TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create narocila table
CREATE TABLE public.narocila (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uporabnik_id UUID NOT NULL REFERENCES auth.users(id),
  artikli JSONB NOT NULL,
  skupna_cena DECIMAL(10,2) NOT NULL,
  status narocilo_status NOT NULL DEFAULT 'oddano',
  naslov_dostave TEXT NOT NULL,
  telefon_kontakt TEXT NOT NULL,
  opombe TEXT,
  datum TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create komentarji table
CREATE TABLE public.komentarji (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  izdelek_id UUID NOT NULL REFERENCES public.predmeti(id) ON DELETE CASCADE,
  uporabnik_id UUID NOT NULL REFERENCES auth.users(id),
  ocena INTEGER CHECK (ocena >= 1 AND ocena <= 5),
  besedilo TEXT,
  odobreno BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wishlist table
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uporabnik_id UUID NOT NULL REFERENCES auth.users(id),
  izdelek_id UUID NOT NULL REFERENCES public.predmeti(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(uporabnik_id, izdelek_id)
);

-- Create admin_log table
CREATE TABLE public.admin_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  dejanje TEXT NOT NULL,
  podrobnosti JSONB,
  cas TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vracila table
CREATE TABLE public.vracila (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  narocilo_id UUID NOT NULL REFERENCES public.narocila(id),
  uporabnik_id UUID NOT NULL REFERENCES auth.users(id),
  opis TEXT NOT NULL,
  status vracilo_status NOT NULL DEFAULT 'oddano',
  admin_odgovor TEXT,
  datum TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kuponi table
CREATE TABLE public.kuponi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  koda TEXT UNIQUE NOT NULL,
  popust DECIMAL(5,2) NOT NULL,
  veljavnost_od TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  veljavnost_do TIMESTAMP WITH TIME ZONE NOT NULL,
  aktivna BOOLEAN NOT NULL DEFAULT true,
  max_uporaba INTEGER DEFAULT 1,
  trenutna_uporaba INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kategorije ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predmeti ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narocila ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.komentarji ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vracila ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kuponi ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 AND vloga = 'admin'
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for kategorije (public read, admin write)
CREATE POLICY "Everyone can view categories" ON public.kategorije
FOR SELECT USING (true);

CREATE POLICY "Only admins can manage categories" ON public.kategorije
FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for predmeti (public read, admin write)
CREATE POLICY "Everyone can view products" ON public.predmeti
FOR SELECT USING (true);

CREATE POLICY "Only admins can manage products" ON public.predmeti
FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for narocila
CREATE POLICY "Users can view their own orders" ON public.narocila
FOR SELECT USING (auth.uid() = uporabnik_id);

CREATE POLICY "Users can create orders" ON public.narocila
FOR INSERT WITH CHECK (auth.uid() = uporabnik_id);

CREATE POLICY "Admins can view all orders" ON public.narocila
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update orders" ON public.narocila
FOR UPDATE USING (public.is_admin(auth.uid()));

-- RLS Policies for komentarji
CREATE POLICY "Everyone can view approved comments" ON public.komentarji
FOR SELECT USING (odobreno = true);

CREATE POLICY "Users can create comments" ON public.komentarji
FOR INSERT WITH CHECK (auth.uid() = uporabnik_id);

CREATE POLICY "Admins can manage all comments" ON public.komentarji
FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for wishlist
CREATE POLICY "Users can manage their wishlist" ON public.wishlist
FOR ALL USING (auth.uid() = uporabnik_id);

-- RLS Policies for admin_log
CREATE POLICY "Only admins can view admin log" ON public.admin_log
FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Only admins can insert admin log" ON public.admin_log
FOR INSERT WITH CHECK (public.is_admin(auth.uid()) AND auth.uid() = admin_id);

-- RLS Policies for vracila
CREATE POLICY "Users can view their own returns" ON public.vracila
FOR SELECT USING (auth.uid() = uporabnik_id);

CREATE POLICY "Users can create returns" ON public.vracila
FOR INSERT WITH CHECK (auth.uid() = uporabnik_id);

CREATE POLICY "Admins can manage all returns" ON public.vracila
FOR ALL USING (public.is_admin(auth.uid()));

-- RLS Policies for kuponi
CREATE POLICY "Everyone can view active coupons" ON public.kuponi
FOR SELECT USING (aktivna = true AND now() BETWEEN veljavnost_od AND veljavnost_do);

CREATE POLICY "Only admins can manage coupons" ON public.kuponi
FOR ALL USING (public.is_admin(auth.uid()));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kategorije_updated_at
  BEFORE UPDATE ON public.kategorije
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predmeti_updated_at
  BEFORE UPDATE ON public.predmeti
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_narocila_updated_at
  BEFORE UPDATE ON public.narocila
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_komentarji_updated_at
  BEFORE UPDATE ON public.komentarji
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vracila_updated_at
  BEFORE UPDATE ON public.vracila
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, ime, priimek, vloga)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'ime', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'priimek', ''),
    'user'
  );
  RETURN NEW;
END;
$$;

-- Trigger to automatically create profile for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_predmeti_kategorija ON public.predmeti(kategorija_id);
CREATE INDEX idx_predmeti_status ON public.predmeti(status);
CREATE INDEX idx_predmeti_koda ON public.predmeti(koda);
CREATE INDEX idx_predmeti_seo_slug ON public.predmeti(seo_slug);
CREATE INDEX idx_predmeti_cena ON public.predmeti(cena);
CREATE INDEX idx_predmeti_zaloga ON public.predmeti(zaloga);
CREATE INDEX idx_predmeti_na_voljo ON public.predmeti(na_voljo);
CREATE INDEX idx_predmeti_created_at ON public.predmeti(created_at);
CREATE INDEX idx_narocila_uporabnik ON public.narocila(uporabnik_id);
CREATE INDEX idx_narocila_status ON public.narocila(status);
CREATE INDEX idx_narocila_datum ON public.narocila(datum);
CREATE INDEX idx_komentarji_izdelek ON public.komentarji(izdelek_id);
CREATE INDEX idx_komentarji_odobreno ON public.komentarji(odobreno);
CREATE INDEX idx_wishlist_uporabnik ON public.wishlist(uporabnik_id);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_profiles_vloga ON public.profiles(vloga);

-- Add additional constraints for data integrity
ALTER TABLE public.predmeti ADD CONSTRAINT check_cena_positive CHECK (cena > 0);
ALTER TABLE public.predmeti ADD CONSTRAINT check_zaloga_non_negative CHECK (zaloga >= 0);
ALTER TABLE public.predmeti ADD CONSTRAINT check_popust_range CHECK (popust >= 0 AND popust <= 100);
ALTER TABLE public.narocila ADD CONSTRAINT check_skupna_cena_positive CHECK (skupna_cena > 0);
ALTER TABLE public.komentarji ADD CONSTRAINT check_ocena_range CHECK (ocena >= 1 AND ocena <= 5);
ALTER TABLE public.kuponi ADD CONSTRAINT check_popust_positive CHECK (popust > 0);
ALTER TABLE public.kuponi ADD CONSTRAINT check_veljavnost_order CHECK (veljavnost_do > veljavnost_od);

-- Insert some sample categories
INSERT INTO public.kategorije (naziv, naziv_en, naziv_de, naziv_it, naziv_ru, opis) VALUES
('Elektronika', 'Electronics', 'Elektronik', 'Elettronica', 'Электроника', 'Elektronski izdelki'),
('Oblačila', 'Clothing', 'Kleidung', 'Abbigliamento', 'Одежда', 'Oblačila in moda'),
('Nakit', 'Jewelry', 'Schmuck', 'Gioielli', 'Ювелирные изделия', 'Nakit in ure'),
('Oprema za dom', 'Home & Garden', 'Haus & Garten', 'Casa e Giardino', 'Дом и сад', 'Oprema za dom in vrt'),
('Vozila', 'Vehicles', 'Fahrzeuge', 'Veicoli', 'Транспорт', 'Vozila in rezervni deli'),
('Umetnost', 'Art & Collectibles', 'Kunst & Sammlerstücke', 'Arte e Collezionismo', 'Искусство', 'Umetniška dela in kolekcije');