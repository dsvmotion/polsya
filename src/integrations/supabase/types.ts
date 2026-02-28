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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      geography_cities: {
        Row: {
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          name_local: string | null
          population: number | null
          province_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          name_local?: string | null
          population?: number | null
          province_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          name_local?: string | null
          population?: number | null
          province_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geography_cities_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "geography_provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      geography_countries: {
        Row: {
          code: string
          created_at: string
          name: string
          name_local: string | null
        }
        Insert: {
          code: string
          created_at?: string
          name: string
          name_local?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          name?: string
          name_local?: string | null
        }
        Relationships: []
      }
      geography_provinces: {
        Row: {
          code: string | null
          country_code: string
          created_at: string
          id: string
          name: string
          name_local: string | null
        }
        Insert: {
          code?: string | null
          country_code: string
          created_at?: string
          id?: string
          name: string
          name_local?: string | null
        }
        Update: {
          code?: string | null
          country_code?: string
          created_at?: string
          id?: string
          name?: string
          name_local?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "geography_provinces_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "geography_countries"
            referencedColumns: ["code"]
          },
        ]
      }
      pharmacies: {
        Row: {
          address: string | null
          autonomous_community: string | null
          city: string | null
          client_type: Database["public"]["Enums"]["client_type"]
          commercial_status: Database["public"]["Enums"]["pharmacy_status"]
          country: string | null
          created_at: string
          email: string | null
          google_data: Json | null
          google_place_id: string | null
          id: string
          lat: number
          legal_form: string | null
          lng: number
          name: string
          notes: string | null
          opening_hours: Json | null
          phone: string | null
          postal_code: string | null
          province: string | null
          saved_at: string | null
          secondary_phone: string | null
          sub_locality: string | null
          subsector: string | null
          activity: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          autonomous_community?: string | null
          city?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          commercial_status?: Database["public"]["Enums"]["pharmacy_status"]
          country?: string | null
          created_at?: string
          email?: string | null
          google_data?: Json | null
          google_place_id?: string | null
          id?: string
          lat: number
          legal_form?: string | null
          lng: number
          name: string
          notes?: string | null
          opening_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          saved_at?: string | null
          secondary_phone?: string | null
          sub_locality?: string | null
          subsector?: string | null
          activity?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          autonomous_community?: string | null
          city?: string | null
          client_type?: Database["public"]["Enums"]["client_type"]
          commercial_status?: Database["public"]["Enums"]["pharmacy_status"]
          country?: string | null
          created_at?: string
          email?: string | null
          google_data?: Json | null
          google_place_id?: string | null
          id?: string
          lat?: number
          legal_form?: string | null
          lng?: number
          name?: string
          notes?: string | null
          opening_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          saved_at?: string | null
          secondary_phone?: string | null
          sub_locality?: string | null
          subsector?: string | null
          activity?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      integration_connections: {
        Row: {
          id: string
          provider: string
          display_name: string
          status: string
          is_enabled: boolean
          metadata: Json
          last_sync_at: string | null
          last_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider: string
          display_name: string
          status?: string
          is_enabled?: boolean
          metadata?: Json
          last_sync_at?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider?: string
          display_name?: string
          status?: string
          is_enabled?: boolean
          metadata?: Json
          last_sync_at?: string | null
          last_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      integration_sync_runs: {
        Row: {
          id: string
          integration_id: string
          run_type: string
          status: string
          started_at: string
          finished_at: string | null
          records_processed: number
          records_failed: number
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          integration_id: string
          run_type: string
          status: string
          started_at?: string
          finished_at?: string | null
          records_processed?: number
          records_failed?: number
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          integration_id?: string
          run_type?: string
          status?: string
          started_at?: string
          finished_at?: string | null
          records_processed?: number
          records_failed?: number
          error_message?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_runs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_activities: {
        Row: {
          id: string
          pharmacy_id: string
          activity_type: string
          title: string
          description: string | null
          due_at: string | null
          completed_at: string | null
          owner: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          activity_type: string
          title: string
          description?: string | null
          due_at?: string | null
          completed_at?: string | null
          owner?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pharmacy_id?: string
          activity_type?: string
          title?: string
          description?: string | null
          due_at?: string | null
          completed_at?: string | null
          owner?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_activities_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_contacts: {
        Row: {
          id: string
          pharmacy_id: string
          name: string
          role: string | null
          email: string | null
          phone: string | null
          is_primary: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          name: string
          role?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pharmacy_id?: string
          name?: string
          role?: string | null
          email?: string | null
          phone?: string | null
          is_primary?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_contacts_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_opportunities: {
        Row: {
          id: string
          pharmacy_id: string
          title: string
          stage: string
          amount: number
          probability: number
          expected_close_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          pharmacy_id: string
          title: string
          stage: string
          amount?: number
          probability?: number
          expected_close_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pharmacy_id?: string
          title?: string
          stage?: string
          amount?: number
          probability?: number
          expected_close_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_opportunities_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_segments: {
        Row: {
          id: string
          name: string
          description: string | null
          scope: string
          filters: Json
          is_favorite: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          scope?: string
          filters?: Json
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          scope?: string
          filters?: Json
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_actions_log: {
        Row: {
          id: string
          agent_name: string
          action_type: string
          target_type: string
          target_id: string | null
          payload: Json
          status: string
          error_message: string | null
          requested_by: string | null
          created_at: string
          completed_at: string | null
          idempotency_key: string | null
          approved_by: string | null
          approved_at: string | null
          approval_note: string | null
        }
        Insert: {
          id?: string
          agent_name: string
          action_type: string
          target_type: string
          target_id?: string | null
          payload?: Json
          status?: string
          error_message?: string | null
          requested_by?: string | null
          created_at?: string
          completed_at?: string | null
          idempotency_key?: string | null
          approved_by?: string | null
          approved_at?: string | null
          approval_note?: string | null
        }
        Update: {
          id?: string
          agent_name?: string
          action_type?: string
          target_type?: string
          target_id?: string | null
          payload?: Json
          status?: string
          error_message?: string | null
          requested_by?: string | null
          created_at?: string
          completed_at?: string | null
          idempotency_key?: string | null
          approved_by?: string | null
          approved_at?: string | null
          approval_note?: string | null
        }
        Relationships: []
      }
      pharmacy_order_documents: {
        Row: {
          document_type: string
          file_name: string
          file_path: string
          id: string
          notes: string | null
          order_id: string | null
          pharmacy_id: string
          uploaded_at: string
        }
        Insert: {
          document_type: string
          file_name: string
          file_path: string
          id?: string
          notes?: string | null
          order_id?: string | null
          pharmacy_id: string
          uploaded_at?: string
        }
        Update: {
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          pharmacy_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_order_documents_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      client_type: "pharmacy" | "herbalist";
      pharmacy_status: "not_contacted" | "contacted" | "qualified" | "proposal" | "client" | "retained" | "lost";
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
      client_type: ["pharmacy", "herbalist"],
      pharmacy_status: ["not_contacted", "contacted", "qualified", "proposal", "client", "retained", "lost"],
    },
  },
} as const
