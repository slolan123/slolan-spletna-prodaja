# Navodila za migracijo - Plačilo po predračunu

## Korak 1: Zagon migracije v Supabase

Za pravilno delovanje nove funkcionalnosti "Plačilo po predračunu" je potrebno zagnati migracijo v Supabase:

1. Pojdite v Supabase Dashboard
2. Izberite vaš projekt
3. Pojdite na "SQL Editor"
4. Kopirajte in zaženite naslednjo SQL kodo:

```sql
-- Add 'predracun' status to narocilo_status enum
ALTER TYPE public.narocilo_status ADD VALUE 'predracun';

-- Add payment_method column to narocila table
ALTER TABLE public.narocila 
ADD COLUMN payment_method text DEFAULT 'card' CHECK (payment_method IN ('card', 'predracun'));
```

## Korak 2: Preverjanje migracije

Po zagonu migracije preverite, da so se spremembe uspešno izvedle:

```sql
-- Preverite, da je 'predracun' dodan v enum
SELECT unnest(enum_range(NULL::narocilo_status));

-- Preverite, da obstaja payment_method stolpec
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'narocila' AND column_name = 'payment_method';
```

## Korak 3: Testiranje funkcionalnosti

1. Odprite aplikacijo
2. Dodajte izdelke v košarico
3. Pojdite na checkout
4. Označite "Kupujem kot podjetje"
5. Izpolnite podjetniške podatke
6. Izberite "Plačilo po predračunu (TRR)"
7. Oddajte naročilo
8. Preverite, da se prikažejo podatki za nakazilo

## Opombe

- Vse naročila s plačilom po predračunu bodo imela status "oddano" z opombo "PLAČILO PO PREDRAČUNU"
- Admin lahko vidi status "Predračun" v admin panelu
- Uporabniki lahko prenesejo račun z novimi podatki podjetja SIVAR D.O.O.
- Podatki za nakazilo se prikažejo takoj po oddaji naročila

## Podatki podjetja

- **Ime:** SIVAR D.O.O.
- **Naslov:** Ložice 8, 5210 Deskle, Slovenija
- **Telefon:** +386 040 232500
- **Email:** loziceprodaja@gmail.com
- **Matična številka:** 3507939000
- **Davčna številka:** SI23998547
- **TRR:** SI56 1910 0001 0297 574
- **Branding:** Slolan (ostane nespremenjen) 