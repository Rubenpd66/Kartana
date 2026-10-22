// Generado con generate_typescript_types (MCP de Supabase) el 23/10/2026, tras modelo_v01 e imagenes_v01.
// No editar a mano: volver a generar después de cada migración.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accesos: {
        Row: {
          actualizado_en: string
          actualizado_por: string | null
          estado: string
          local_id: string
          notas: string | null
          plan: string
          vigente_hasta: string | null
        }
        Insert: {
          actualizado_en?: string
          actualizado_por?: string | null
          estado: string
          local_id: string
          notas?: string | null
          plan?: string
          vigente_hasta?: string | null
        }
        Update: {
          actualizado_en?: string
          actualizado_por?: string | null
          estado?: string
          local_id?: string
          notas?: string | null
          plan?: string
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accesos_actualizado_por_fkey"
            columns: ["actualizado_por"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accesos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: true
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      aceptaciones_legales: {
        Row: {
          aceptada_en: string
          documento: string
          id: number
          usuario_id: string
          version: string
        }
        Insert: {
          aceptada_en?: string
          documento: string
          id?: never
          usuario_id: string
          version: string
        }
        Update: {
          aceptada_en?: string
          documento?: string
          id?: never
          usuario_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "aceptaciones_legales_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locales: {
        Row: {
          actualizado_en: string
          color_marca: string
          creado_en: string
          descripcion: string | null
          direccion: string | null
          dueno_id: string
          horarios: Json
          id: string
          idioma_base: string
          idiomas_activos: string[]
          logo_ruta: string | null
          nombre: string
          permitir_indexar: boolean
          publicado: boolean
          slug: string
          telefono: string | null
          traducciones: Json
        }
        Insert: {
          actualizado_en?: string
          color_marca?: string
          creado_en?: string
          descripcion?: string | null
          direccion?: string | null
          dueno_id: string
          horarios?: Json
          id?: string
          idioma_base?: string
          idiomas_activos?: string[]
          logo_ruta?: string | null
          nombre: string
          permitir_indexar?: boolean
          publicado?: boolean
          slug: string
          telefono?: string | null
          traducciones?: Json
        }
        Update: {
          actualizado_en?: string
          color_marca?: string
          creado_en?: string
          descripcion?: string | null
          direccion?: string | null
          dueno_id?: string
          horarios?: Json
          id?: string
          idioma_base?: string
          idiomas_activos?: string[]
          logo_ruta?: string | null
          nombre?: string
          permitir_indexar?: boolean
          publicado?: boolean
          slug?: string
          telefono?: string | null
          traducciones?: Json
        }
        Relationships: [
          {
            foreignKeyName: "locales_dueno_id_fkey"
            columns: ["dueno_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          actualizado_en: string
          contenido: Json
          creado_en: string
          dias: number[]
          hora_fin: string | null
          hora_inicio: string | null
          id: string
          local_id: string
          nombre: string
          notas: string | null
          orden: number
          precio_centimos: number | null
          traducciones: Json
          visible: boolean
        }
        Insert: {
          actualizado_en?: string
          contenido?: Json
          creado_en?: string
          dias?: number[]
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          local_id: string
          nombre?: string
          notas?: string | null
          orden?: number
          precio_centimos?: number | null
          traducciones?: Json
          visible?: boolean
        }
        Update: {
          actualizado_en?: string
          contenido?: Json
          creado_en?: string
          dias?: number[]
          hora_fin?: string | null
          hora_inicio?: string | null
          id?: string
          local_id?: string
          nombre?: string
          notas?: string | null
          orden?: number
          precio_centimos?: number | null
          traducciones?: Json
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "menus_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          actualizado_en: string
          correo: string
          creado_en: string
          id: string
          nombre: string | null
          prueba_usada_en: string | null
        }
        Insert: {
          actualizado_en?: string
          correo?: string
          creado_en?: string
          id: string
          nombre?: string | null
          prueba_usada_en?: string | null
        }
        Update: {
          actualizado_en?: string
          correo?: string
          creado_en?: string
          id?: string
          nombre?: string | null
          prueba_usada_en?: string | null
        }
        Relationships: []
      }
      platos: {
        Row: {
          actualizado_en: string
          agotado: boolean
          alergenos: string[]
          alergenos_confirmados: boolean
          creado_en: string
          descripcion: string | null
          etiquetas: string[]
          foto_ruta: string | null
          id: string
          local_id: string
          nombre: string
          orden: number
          precios: Json
          seccion_id: string
          traducciones: Json
          trazas: string[]
          visible: boolean
        }
        Insert: {
          actualizado_en?: string
          agotado?: boolean
          alergenos?: string[]
          alergenos_confirmados?: boolean
          creado_en?: string
          descripcion?: string | null
          etiquetas?: string[]
          foto_ruta?: string | null
          id?: string
          local_id: string
          nombre: string
          orden?: number
          precios: Json
          seccion_id: string
          traducciones?: Json
          trazas?: string[]
          visible?: boolean
        }
        Update: {
          actualizado_en?: string
          agotado?: boolean
          alergenos?: string[]
          alergenos_confirmados?: boolean
          creado_en?: string
          descripcion?: string | null
          etiquetas?: string[]
          foto_ruta?: string | null
          id?: string
          local_id?: string
          nombre?: string
          orden?: number
          precios?: Json
          seccion_id?: string
          traducciones?: Json
          trazas?: string[]
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "platos_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platos_seccion_fk"
            columns: ["seccion_id", "local_id"]
            isOneToOne: false
            referencedRelation: "secciones"
            referencedColumns: ["id", "local_id"]
          },
        ]
      }
      secciones: {
        Row: {
          actualizado_en: string
          creado_en: string
          descripcion: string | null
          id: string
          local_id: string
          nombre: string
          orden: number
          traducciones: Json
          visible: boolean
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          id?: string
          local_id: string
          nombre: string
          orden?: number
          traducciones?: Json
          visible?: boolean
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          descripcion?: string | null
          id?: string
          local_id?: string
          nombre?: string
          orden?: number
          traducciones?: Json
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "secciones_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
      slugs_anteriores: {
        Row: {
          creado_en: string
          local_id: string
          slug: string
        }
        Insert: {
          creado_en?: string
          local_id: string
          slug: string
        }
        Update: {
          creado_en?: string
          local_id?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "slugs_anteriores_local_id_fkey"
            columns: ["local_id"]
            isOneToOne: false
            referencedRelation: "locales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activar_piloto: {
        Args: { p_local: string }
        Returns: {
          actualizado_en: string
          actualizado_por: string | null
          estado: string
          local_id: string
          notas: string | null
          plan: string
          vigente_hasta: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "accesos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cambiar_estado_acceso: {
        Args: { p_estado: string; p_local: string }
        Returns: {
          actualizado_en: string
          actualizado_por: string | null
          estado: string
          local_id: string
          notas: string | null
          plan: string
          vigente_hasta: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "accesos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      reordenar: { Args: { p_ids: string[]; p_tabla: string }; Returns: number }
      salud: { Args: never; Returns: string }
      slug_ocupado: {
        Args: { p_local?: string; p_slug: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
