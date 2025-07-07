export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_log: {
        Row: {
          admin_id: string
          cas: string
          dejanje: string
          id: string
          podrobnosti: Json | null
        }
        Insert: {
          admin_id: string
          cas?: string
          dejanje: string
          id?: string
          podrobnosti?: Json | null
        }
        Update: {
          admin_id?: string
          cas?: string
          dejanje?: string
          id?: string
          podrobnosti?: Json | null
        }
        Relationships: []
      }
      kategorije: {
        Row: {
          created_at: string
          id: string
          naziv: string
          naziv_de: string | null
          naziv_en: string | null
          naziv_it: string | null
          naziv_ru: string | null
          opis: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          naziv: string
          naziv_de?: string | null
          naziv_en?: string | null
          naziv_it?: string | null
          naziv_ru?: string | null
          opis?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          naziv?: string
          naziv_de?: string | null
          naziv_en?: string | null
          naziv_it?: string | null
          naziv_ru?: string | null
          opis?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      komentarji: {
        Row: {
          besedilo: string | null
          created_at: string
          id: string
          izdelek_id: string
          ocena: number | null
          odobreno: boolean
          updated_at: string
          uporabnik_id: string
        }
        Insert: {
          besedilo?: string | null
          created_at?: string
          id?: string
          izdelek_id: string
          ocena?: number | null
          odobreno?: boolean
          updated_at?: string
          uporabnik_id: string
        }
        Update: {
          besedilo?: string | null
          created_at?: string
          id?: string
          izdelek_id?: string
          ocena?: number | null
          odobreno?: boolean
          updated_at?: string
          uporabnik_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "komentarji_izdelek_id_fkey"
            columns: ["izdelek_id"]
            isOneToOne: false
            referencedRelation: "predmeti"
            referencedColumns: ["id"]
          },
        ]
      }
      kuponi: {
        Row: {
          aktivna: boolean
          created_at: string
          id: string
          koda: string
          max_uporaba: number | null
          popust: number
          trenutna_uporaba: number | null
          veljavnost_do: string
          veljavnost_od: string
        }
        Insert: {
          aktivna?: boolean
          created_at?: string
          id?: string
          koda: string
          max_uporaba?: number | null
          popust: number
          trenutna_uporaba?: number | null
          veljavnost_do: string
          veljavnost_od?: string
        }
        Update: {
          aktivna?: boolean
          created_at?: string
          id?: string
          koda?: string
          max_uporaba?: number | null
          popust?: number
          trenutna_uporaba?: number | null
          veljavnost_do?: string
          veljavnost_od?: string
        }
        Relationships: []
      }
      narocila: {
        Row: {
          artikli: Json
          datum: string
          id: string
          naslov_dostave: string
          opombe: string | null
          selected_variants: Json | null
          skupna_cena: number
          status: Database["public"]["Enums"]["narocilo_status"]
          telefon_kontakt: string
          updated_at: string
          uporabnik_id: string
        }
        Insert: {
          artikli: Json
          datum?: string
          id?: string
          naslov_dostave: string
          opombe?: string | null
          selected_variants?: Json | null
          skupna_cena: number
          status?: Database["public"]["Enums"]["narocilo_status"]
          telefon_kontakt: string
          updated_at?: string
          uporabnik_id: string
        }
        Update: {
          artikli?: Json
          datum?: string
          id?: string
          naslov_dostave?: string
          opombe?: string | null
          selected_variants?: Json | null
          skupna_cena?: number
          status?: Database["public"]["Enums"]["narocilo_status"]
          telefon_kontakt?: string
          updated_at?: string
          uporabnik_id?: string
        }
        Relationships: []
      }
      ocene_izdelkov: {
        Row: {
          created_at: string
          id: string
          izdelek_id: string
          komentar: string | null
          ocena: number
          odobreno: boolean
          updated_at: string
          uporabnik_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          izdelek_id: string
          komentar?: string | null
          ocena: number
          odobreno?: boolean
          updated_at?: string
          uporabnik_id: string
        }
        Update: {
          created_at?: string
          id?: string
          izdelek_id?: string
          komentar?: string | null
          ocena?: number
          odobreno?: boolean
          updated_at?: string
          uporabnik_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocene_izdelkov_izdelek_id_fkey"
            columns: ["izdelek_id"]
            isOneToOne: false
            referencedRelation: "predmeti"
            referencedColumns: ["id"]
          },
        ]
      }
      predmeti: {
        Row: {
          atributi: Json | null
          barva: string | null
          cena: number
          created_at: string
          id: string
          kategorija_id: string | null
          koda: string
          masa: number | null
          na_voljo: boolean
          naziv: string
          naziv_de: string | null
          naziv_en: string | null
          naziv_it: string | null
          naziv_ru: string | null
          opis: string | null
          opis_de: string | null
          opis_en: string | null
          opis_it: string | null
          opis_ru: string | null
          popust: number | null
          seo_slug: string | null
          slika_url: string | null
          slike_urls: string[] | null
          status: Database["public"]["Enums"]["predmet_status"]
          stevilka: string | null
          updated_at: string
          zaloga: number
        }
        Insert: {
          atributi?: Json | null
          barva?: string | null
          cena: number
          created_at?: string
          id?: string
          kategorija_id?: string | null
          koda: string
          masa?: number | null
          na_voljo?: boolean
          naziv: string
          naziv_de?: string | null
          naziv_en?: string | null
          naziv_it?: string | null
          naziv_ru?: string | null
          opis?: string | null
          opis_de?: string | null
          opis_en?: string | null
          opis_it?: string | null
          opis_ru?: string | null
          popust?: number | null
          seo_slug?: string | null
          slika_url?: string | null
          slike_urls?: string[] | null
          status?: Database["public"]["Enums"]["predmet_status"]
          stevilka?: string | null
          updated_at?: string
          zaloga?: number
        }
        Update: {
          atributi?: Json | null
          barva?: string | null
          cena?: number
          created_at?: string
          id?: string
          kategorija_id?: string | null
          koda?: string
          masa?: number | null
          na_voljo?: boolean
          naziv?: string
          naziv_de?: string | null
          naziv_en?: string | null
          naziv_it?: string | null
          naziv_ru?: string | null
          opis?: string | null
          opis_de?: string | null
          opis_en?: string | null
          opis_it?: string | null
          opis_ru?: string | null
          popust?: number | null
          seo_slug?: string | null
          slika_url?: string | null
          slike_urls?: string[] | null
          status?: Database["public"]["Enums"]["predmet_status"]
          stevilka?: string | null
          updated_at?: string
          zaloga?: number
        }
        Relationships: [
          {
            foreignKeyName: "predmeti_kategorija_id_fkey"
            columns: ["kategorija_id"]
            isOneToOne: false
            referencedRelation: "kategorije"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          available: boolean
          color_name: string
          color_value: string | null
          created_at: string
          id: string
          images: string[] | null
          product_id: string
          stock: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          color_name: string
          color_value?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          product_id: string
          stock?: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          color_name?: string
          color_value?: string | null
          created_at?: string
          id?: string
          images?: string[] | null
          product_id?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "predmeti"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          ime: string
          naslov: string | null
          preferred_language: string | null
          priimek: string
          telefon: string | null
          updated_at: string
          user_id: string
          vloga: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          ime: string
          naslov?: string | null
          preferred_language?: string | null
          priimek: string
          telefon?: string | null
          updated_at?: string
          user_id: string
          vloga?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          id?: string
          ime?: string
          naslov?: string | null
          preferred_language?: string | null
          priimek?: string
          telefon?: string | null
          updated_at?: string
          user_id?: string
          vloga?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      vracila: {
        Row: {
          admin_odgovor: string | null
          datum: string
          id: string
          narocilo_id: string
          opis: string
          status: Database["public"]["Enums"]["vracilo_status"]
          updated_at: string
          uporabnik_id: string
        }
        Insert: {
          admin_odgovor?: string | null
          datum?: string
          id?: string
          narocilo_id: string
          opis: string
          status?: Database["public"]["Enums"]["vracilo_status"]
          updated_at?: string
          uporabnik_id: string
        }
        Update: {
          admin_odgovor?: string | null
          datum?: string
          id?: string
          narocilo_id?: string
          opis?: string
          status?: Database["public"]["Enums"]["vracilo_status"]
          updated_at?: string
          uporabnik_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vracila_narocilo_id_fkey"
            columns: ["narocilo_id"]
            isOneToOne: false
            referencedRelation: "narocila"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          izdelek_id: string
          uporabnik_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          izdelek_id: string
          uporabnik_id: string
        }
        Update: {
          created_at?: string
          id?: string
          izdelek_id?: string
          uporabnik_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_izdelek_id_fkey"
            columns: ["izdelek_id"]
            isOneToOne: false
            referencedRelation: "predmeti"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      narocilo_status:
        | "oddano"
        | "potrjeno"
        | "poslano"
        | "dostavljeno"
        | "preklicano"
      predmet_status: "novo" | "znizano" | "prodano"
      user_role: "admin" | "user"
      vracilo_status: "oddano" | "obravnava" | "odobreno" | "zavrnjeno"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      narocilo_status: [
        "oddano",
        "potrjeno",
        "poslano",
        "dostavljeno",
        "preklicano",
      ],
      predmet_status: ["novo", "znizano", "prodano"],
      user_role: ["admin", "user"],
      vracilo_status: ["oddano", "obravnava", "odobreno", "zavrnjeno"],
    },
  },
} as const
