export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      audit_events: {
        Row: { id: number; organization_id: string; actor_id: string | null; action: string; resource_type: string; resource_id: string | null; metadata: Json; created_at: string }
        Insert: { id?: never; organization_id: string; actor_id?: string | null; action: string; resource_type: string; resource_id?: string | null; metadata?: Json; created_at?: string }
        Update: { organization_id?: string; actor_id?: string | null; action?: string; resource_type?: string; resource_id?: string | null; metadata?: Json; created_at?: string }
        Relationships: []
      }
      data_policies: {
        Row: { organization_id: string; shadow_transcripts: boolean; consent_logging: boolean; acoustic_signals: boolean; raw_audio_retention_hours: number; version: number; updated_by: string | null; updated_at: string }
        Insert: { organization_id: string; shadow_transcripts?: boolean; consent_logging?: boolean; acoustic_signals?: boolean; raw_audio_retention_hours?: number; version?: number; updated_by?: string | null; updated_at?: string }
        Update: { shadow_transcripts?: boolean; consent_logging?: boolean; acoustic_signals?: boolean; raw_audio_retention_hours?: number; version?: number; updated_by?: string | null; updated_at?: string }
        Relationships: []
      }
      organization_members: {
        Row: { organization_id: string; user_id: string; role: Database['public']['Enums']['app_role']; created_at: string }
        Insert: { organization_id: string; user_id: string; role?: Database['public']['Enums']['app_role']; created_at?: string }
        Update: { role?: Database['public']['Enums']['app_role'] }
        Relationships: []
      }
      organizations: {
        Row: { id: string; name: string; slug: string; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; slug: string; created_by?: string | null; created_at?: string; updated_at?: string }
        Update: { name?: string; slug?: string; created_by?: string | null; updated_at?: string }
        Relationships: []
      }
      profiles: {
        Row: { id: string; email: string; display_name: string; default_organization_id: string | null; created_at: string; updated_at: string }
        Insert: { id: string; email: string; display_name: string; default_organization_id?: string | null; created_at?: string; updated_at?: string }
        Update: { display_name?: string; default_organization_id?: string | null; updated_at?: string }
        Relationships: []
      }
      voice_sessions: {
        Row: { id: string; organization_id: string; created_by: string; status: string; route_mode: string; primary_model: string; consent_version: string; started_at: string; ended_at: string | null; metadata: Json }
        Insert: { id?: string; organization_id: string; created_by: string; status?: string; route_mode?: string; primary_model?: string; consent_version?: string; started_at?: string; ended_at?: string | null; metadata?: Json }
        Update: { status?: string; route_mode?: string; primary_model?: string; ended_at?: string | null; metadata?: Json }
        Relationships: []
      }
      voice_turns: {
        Row: { id: string; organization_id: string; session_id: string | null; user_id: string; started_at: string; duration_ms: number; route: string; model: string; latency_ms: number; signal: string; status: string; transcript: string | null; acoustic_signals: Json; created_at: string }
        Insert: { id?: string; organization_id: string; session_id?: string | null; user_id: string; started_at?: string; duration_ms: number; route: string; model: string; latency_ms: number; signal?: string; status?: string; transcript?: string | null; acoustic_signals?: Json; created_at?: string }
        Update: { session_id?: string | null; duration_ms?: number; route?: string; model?: string; latency_ms?: number; signal?: string; status?: string; transcript?: string | null; acoustic_signals?: Json }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      can_manage_organization: { Args: { target_organization_id: string }; Returns: boolean }
      can_view_profile: { Args: { target_user_id: string }; Returns: boolean }
      is_organization_admin: { Args: { target_organization_id: string }; Returns: boolean }
      is_organization_member: { Args: { target_organization_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: 'demo' | 'user' | 'admin'
    }
    CompositeTypes: Record<string, never>
  }
}
