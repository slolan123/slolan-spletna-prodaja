-- Dodaj vzorčne podatke za testiranje (z unikatnimi kodami)

-- Najprej dodaj vzorčne kategorije (če že ne obstajajo)
INSERT INTO public.kategorije (id, naziv, naziv_en, naziv_de, naziv_it, naziv_ru, opis) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Tehnologija', 'Technology', 'Technologie', 'Tecnologia', 'Технология', 'Tehnološki izdelki'),
('550e8400-e29b-41d4-a716-446655440002', 'Oblačila', 'Clothing', 'Kleidung', 'Abbigliamento', 'Одежда', 'Oblačila in moda'),
('550e8400-e29b-41d4-a716-446655440003', 'Nakit', 'Jewelry', 'Schmuck', 'Gioielli', 'Ювелирные изделия', 'Nakit in ure')
ON CONFLICT (id) DO NOTHING;

-- Dodaj vzorčne izdelke z SEO slug-ovi (z unikatnimi kodami)
INSERT INTO public.predmeti (
  id, naziv, naziv_en, naziv_de, naziv_it, naziv_ru, 
  cena, popust, slika_url, status, zaloga, na_voljo, 
  koda, seo_slug, barva, kategorija_id, opis, opis_en, opis_de, opis_it, opis_ru
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440011',
  'MacBook Pro 13"', 'MacBook Pro 13"', 'MacBook Pro 13"', 'MacBook Pro 13"', 'MacBook Pro 13"',
  1200.00, 15, '/placeholder.svg', 'znizano', 5, true,
  'LAPTOP001', 'macbook-pro-13-lap001', 'Srebrna', '550e8400-e29b-41d4-a716-446655440001',
  'Odličen MacBook Pro 13" z M1 procesorjem. Malo rabljen, odlično stanje.',
  'Excellent MacBook Pro 13" with M1 processor. Lightly used, excellent condition.',
  'Ausgezeichnetes MacBook Pro 13" mit M1-Prozessor. Wenig gebraucht, ausgezeichneter Zustand.',
  'Eccellente MacBook Pro 13" con processore M1. Poco usato, condizioni eccellenti.',
  'Отличный MacBook Pro 13" с процессором M1. Мало использованный, отличное состояние.'
),
(
  '550e8400-e29b-41d4-a716-446655440012',
  'Elegantna črna jakna', 'Elegant Black Jacket', 'Elegante schwarze Jacke', 'Giacca nera elegante', 'Элегантная черная куртка',
  89.99, 0, '/placeholder.svg', 'novo', 10, true,
  'JACKET001', 'elegantna-crna-jakna-jak001', 'Črna', '550e8400-e29b-41d4-a716-446655440002',
  'Elegantna črna jakna iz kakovostnega materiala. Popolna za posebne priložnosti.',
  'Elegant black jacket made from quality material. Perfect for special occasions.',
  'Elegante schwarze Jacke aus hochwertigem Material. Perfekt für besondere Anlässe.',
  'Elegante giacca nera realizzata con materiale di qualità. Perfetta per occasioni speciali.',
  'Элегантная черная куртка из качественного материала. Идеально подходит для особых случаев.'
),
(
  '550e8400-e29b-41d4-a716-446655440013',
  'Rolex Daytona replika', 'Rolex Daytona Replica', 'Rolex Daytona Replik', 'Replica Rolex Daytona', 'Реплика Rolex Daytona',
  299.00, 25, '/placeholder.svg', 'znizano', 3, true,
  'WATCH001', 'rolex-daytona-replika-ura001', 'Zlata', '550e8400-e29b-41d4-a716-446655440003',
  'Visokokakovostna replika Rolex Daytona ure. Avtomatski mehanizem, voden odporen.',
  'High-quality Rolex Daytona replica watch. Automatic movement, water resistant.',
  'Hochwertige Rolex Daytona Replik-Uhr. Automatisches Uhrwerk, wasserdicht.',
  'Replica di alta qualità dell''orologio Rolex Daytona. Movimento automatico, resistente all''acqua.',
  'Высококачественная реплика часов Rolex Daytona. Автоматический механизм, водонепроницаемые.'
),
(
  '550e8400-e29b-41d4-a716-446655440014',
  'iPhone 14 Pro', 'iPhone 14 Pro', 'iPhone 14 Pro', 'iPhone 14 Pro', 'iPhone 14 Pro',
  850.00, 10, '/placeholder.svg', 'novo', 8, true,
  'PHONE001', 'iphone-14-pro-tel001', 'Temno vijolična', '550e8400-e29b-41d4-a716-446655440001',
  'iPhone 14 Pro v odličnem stanju. 128GB, z originalnim polnilcem.',
  'iPhone 14 Pro in excellent condition. 128GB, with original charger.',
  'iPhone 14 Pro in ausgezeichnetem Zustand. 128GB, mit Originalladegerät.',
  'iPhone 14 Pro in ottime condizioni. 128GB, con caricabatterie originale.',
  'iPhone 14 Pro в отличном состоянии. 128ГБ, с оригинальным зарядным устройством.'
),
(
  '550e8400-e29b-41d4-a716-446655440015',
  'Zimska bunda Nike', 'Nike Winter Jacket', 'Nike Winterjacke', 'Giacca invernale Nike', 'Зимняя куртка Nike',
  120.00, 0, '/placeholder.svg', 'novo', 15, true,
  'JACKET002', 'zimska-bunda-nike-jak002', 'Modra', '550e8400-e29b-41d4-a716-446655440002',
  'Topla zimska bunda Nike z vodoodbojno površino. Velikost L.',
  'Warm Nike winter jacket with water-repellent surface. Size L.',
  'Warme Nike Winterjacke mit wasserabweisender Oberfläche. Größe L.',
  'Calda giacca invernale Nike con superficie idrorepellente. Taglia L.',
  'Теплая зимняя куртка Nike с водоотталкивающей поверхностью. Размер L.'
)
ON CONFLICT (id) DO NOTHING;

-- Dodaj admin profil za obstoječega uporabnika
INSERT INTO public.profiles (id, user_id, ime, priimek, telefon, naslov, vloga, preferred_language) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440020',
  'a47c5d88-6c1d-4502-adf8-989b5a31b342', -- user_id iz auth logov
  'Admin',
  'Testni', 
  '+386 40 123 456',
  'Testni naslov 123, 1000 Ljubljana',
  'admin',
  'sl'
) ON CONFLICT (user_id) DO UPDATE SET 
  vloga = 'admin',
  ime = 'Admin',
  priimek = 'Testni',
  telefon = '+386 40 123 456',
  naslov = 'Testni naslov 123, 1000 Ljubljana';