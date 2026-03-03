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
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          amount_cents: number
          code: string
          created_at: string
          currency: string
          description: string | null
          id: string
          interval: string
          is_active: boolean
          name: string
          stripe_price_id: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: string
          is_active?: boolean
          name: string
          stripe_price_id: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval?: string
          is_active?: boolean
          name?: string
          stripe_price_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          organization_id: string
          stripe_customer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          organization_id?: string
          stripe_customer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          organization_id?: string
          stripe_customer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json
          organization_id: string
          status: string
          stripe_price_id: string
          stripe_subscription_id: string
          trial_end: string | null
          updated_at: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          status: string
          stripe_price_id: string
          stripe_subscription_id: string
          trial_end?: string | null
          updated_at?: string
        }
        Update: {
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json
          organization_id?: string
          status?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          trial_end?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_invoices: {
        Row: {
          amount_due_cents: number
          amount_paid_cents: number
          created_at: string
          currency: string
          due_date: string | null
          hosted_invoice_url: string | null
          id: string
          invoice_number: string | null
          invoice_pdf_url: string | null
          organization_id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string
          stripe_invoice_id: string
          subscription_id: string | null
        }
        Insert: {
          amount_due_cents?: number
          amount_paid_cents?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          organization_id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status: string
          stripe_invoice_id: string
          subscription_id?: string | null
        }
        Update: {
          amount_due_cents?: number
          amount_paid_cents?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          hosted_invoice_url?: string | null
          id?: string
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          organization_id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
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
          entity_type_id: string | null
          google_data: Json | null
          google_place_id: string | null
          id: string
          lat: number
          legal_form: string | null
          lng: number
          name: string
          notes: string | null
          opening_hours: Json | null
          organization_id: string
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
          entity_type_id?: string | null
          google_data?: Json | null
          google_place_id?: string | null
          id?: string
          lat: number
          legal_form?: string | null
          lng: number
          name: string
          notes?: string | null
          opening_hours?: Json | null
          organization_id?: string
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
          entity_type_id?: string | null
          google_data?: Json | null
          google_place_id?: string | null
          id?: string
          lat?: number
          legal_form?: string | null
          lng?: number
          name?: string
          notes?: string | null
          opening_hours?: Json | null
          organization_id?: string
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
        Relationships: [
          {
            foreignKeyName: "pharmacies_entity_type_id_fkey"
            columns: ["entity_type_id"]
            isOneToOne: false
            referencedRelation: "entity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_types: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_default: boolean
          key: string
          label: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          key: string
          label: string
          organization_id?: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          key?: string
          label?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_types_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          id: string
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
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
        Relationships: [
          {
            foreignKeyName: "integration_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_api_credentials: {
        Row: {
          id: string
          organization_id: string
          integration_id: string
          provider: string
          api_key: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          integration_id: string
          provider: string
          api_key: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          integration_id?: string
          provider?: string
          api_key?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_api_credentials_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_api_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_email_credentials: {
        Row: {
          id: string
          organization_id: string
          integration_id: string
          provider: string
          account_email: string
          username: string
          password: string
          imap_host: string
          imap_port: number
          imap_secure: boolean
          smtp_host: string
          smtp_port: number
          smtp_secure: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          integration_id: string
          provider: string
          account_email: string
          username: string
          password: string
          imap_host: string
          imap_port?: number
          imap_secure?: boolean
          smtp_host: string
          smtp_port?: number
          smtp_secure?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          integration_id?: string
          provider?: string
          account_email?: string
          username?: string
          password?: string
          imap_host?: string
          imap_port?: number
          imap_secure?: boolean
          smtp_host?: string
          smtp_port?: number
          smtp_secure?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_email_credentials_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_email_credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_oauth_states: {
        Row: {
          state: string
          organization_id: string
          integration_id: string
          provider: string
          created_by: string
          created_at: string
          expires_at: string
          consumed_at: string | null
        }
        Insert: {
          state: string
          organization_id?: string
          integration_id: string
          provider: string
          created_by: string
          created_at?: string
          expires_at: string
          consumed_at?: string | null
        }
        Update: {
          state?: string
          organization_id?: string
          integration_id?: string
          provider?: string
          created_by?: string
          created_at?: string
          expires_at?: string
          consumed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_oauth_states_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_oauth_states_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_oauth_tokens: {
        Row: {
          id: string
          organization_id: string
          integration_id: string
          provider: string
          provider_account_email: string | null
          access_token: string
          refresh_token: string | null
          token_type: string | null
          scope: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          integration_id: string
          provider: string
          provider_account_email?: string | null
          access_token: string
          refresh_token?: string | null
          token_type?: string | null
          scope?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          integration_id?: string
          provider?: string
          provider_account_email?: string | null
          access_token?: string
          refresh_token?: string | null
          token_type?: string | null
          scope?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_oauth_tokens_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_oauth_tokens_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_objects: {
        Row: {
          id: string
          organization_id: string
          integration_id: string
          provider: string
          sync_target: string
          external_id: string
          external_updated_at: string | null
          payload: Json
          first_seen_at: string
          last_seen_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          integration_id: string
          provider: string
          sync_target: string
          external_id: string
          external_updated_at?: string | null
          payload?: Json
          first_seen_at?: string
          last_seen_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          integration_id?: string
          provider?: string
          sync_target?: string
          external_id?: string
          external_updated_at?: string | null
          payload?: Json
          first_seen_at?: string
          last_seen_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_objects_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_objects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_jobs: {
        Row: {
          id: string
          integration_id: string
          organization_id: string
          provider: string
          job_type: string
          status: string
          payload: Json
          requested_by: string | null
          idempotency_key: string | null
          error_message: string | null
          created_at: string
          started_at: string | null
          finished_at: string | null
          attempt_count: number
          max_attempts: number
          next_retry_at: string | null
          last_attempt_at: string | null
          dead_lettered_at: string | null
        }
        Insert: {
          id?: string
          integration_id: string
          organization_id?: string
          provider: string
          job_type: string
          status?: string
          payload?: Json
          requested_by?: string | null
          idempotency_key?: string | null
          error_message?: string | null
          created_at?: string
          started_at?: string | null
          finished_at?: string | null
          attempt_count?: number
          max_attempts?: number
          next_retry_at?: string | null
          last_attempt_at?: string | null
          dead_lettered_at?: string | null
        }
        Update: {
          id?: string
          integration_id?: string
          organization_id?: string
          provider?: string
          job_type?: string
          status?: string
          payload?: Json
          requested_by?: string | null
          idempotency_key?: string | null
          error_message?: string | null
          created_at?: string
          started_at?: string | null
          finished_at?: string | null
          attempt_count?: number
          max_attempts?: number
          next_retry_at?: string | null
          last_attempt_at?: string | null
          dead_lettered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_jobs_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_job_dead_letters: {
        Row: {
          id: string
          organization_id: string
          job_id: string
          integration_id: string
          provider: string
          job_type: string
          payload: Json
          attempt_count: number
          max_attempts: number
          error_message: string
          first_created_at: string
          failed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id?: string
          job_id: string
          integration_id: string
          provider: string
          job_type: string
          payload?: Json
          attempt_count: number
          max_attempts: number
          error_message: string
          first_created_at: string
          failed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          job_id?: string
          integration_id?: string
          provider?: string
          job_type?: string
          payload?: Json
          attempt_count?: number
          max_attempts?: number
          error_message?: string
          first_created_at?: string
          failed_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_sync_job_dead_letters_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "integration_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_job_dead_letters_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "integration_sync_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "integration_sync_job_dead_letters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_sync_runs: {
        Row: {
          id: string
          integration_id: string
          organization_id: string
          run_type: string
          status: string
          started_at: string
          finished_at: string | null
          duration_ms: number
          records_processed: number
          records_failed: number
          metrics: Json
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          integration_id: string
          organization_id?: string
          run_type: string
          status: string
          started_at?: string
          finished_at?: string | null
          duration_ms?: number
          records_processed?: number
          records_failed?: number
          metrics?: Json
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          integration_id?: string
          organization_id?: string
          run_type?: string
          status?: string
          started_at?: string
          finished_at?: string | null
          duration_ms?: number
          records_processed?: number
          records_failed?: number
          metrics?: Json
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
          {
            foreignKeyName: "integration_sync_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_activities: {
        Row: {
          id: string
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
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
          {
            foreignKeyName: "pharmacy_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_contacts: {
        Row: {
          id: string
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
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
          {
            foreignKeyName: "pharmacy_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_opportunities: {
        Row: {
          id: string
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
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
          {
            foreignKeyName: "pharmacy_opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_segments: {
        Row: {
          id: string
          name: string
          description: string | null
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
          scope?: string
          filters?: Json
          is_favorite?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_segments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
          created_at?: string
          completed_at?: string | null
          idempotency_key?: string | null
          approved_by?: string | null
          approved_at?: string | null
          approval_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_actions_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_action_runs: {
        Row: {
          id: string
          action_id: string
          organization_id: string
          run_status: string
          started_at: string
          finished_at: string | null
          operation_summary: string | null
          error_message: string | null
          rollback_summary: string | null
          created_at: string
        }
        Insert: {
          id?: string
          action_id: string
          organization_id?: string
          run_status: string
          started_at?: string
          finished_at?: string | null
          operation_summary?: string | null
          error_message?: string | null
          rollback_summary?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          action_id?: string
          organization_id?: string
          run_status?: string
          started_at?: string
          finished_at?: string | null
          operation_summary?: string | null
          error_message?: string | null
          rollback_summary?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_action_runs_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "agent_actions_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_action_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bulk_import_runs: {
        Row: {
          id: string
          file_hash: string
          file_name: string
          total_rows: number
          imported_rows: number
          skipped_duplicates: number
          status: string
          organization_id: string
          created_at: string
        }
        Insert: {
          id?: string
          file_hash: string
          file_name: string
          total_rows?: number
          imported_rows?: number
          skipped_duplicates?: number
          status?: string
          organization_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          file_hash?: string
          file_name?: string
          total_rows?: number
          imported_rows?: number
          skipped_duplicates?: number
          status?: string
          organization_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_import_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_order_documents: {
        Row: {
          document_type: string
          file_name: string
          file_path: string
          id: string
          notes: string | null
          organization_id: string
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
          organization_id?: string
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
          organization_id?: string
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
          {
            foreignKeyName: "pharmacy_order_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
