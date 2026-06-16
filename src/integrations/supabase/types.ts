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
      admin_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          lead_email: string | null
          lead_source: string | null
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          lead_email?: string | null
          lead_source?: string | null
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          lead_email?: string | null
          lead_source?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      ai_content_meta: {
        Row: {
          content_id: string
          content_type: string
          generated_at: string
          id: string
          model: string | null
          sources: Json
          verify_flags: Json
        }
        Insert: {
          content_id: string
          content_type: string
          generated_at?: string
          id?: string
          model?: string | null
          sources?: Json
          verify_flags?: Json
        }
        Update: {
          content_id?: string
          content_type?: string
          generated_at?: string
          id?: string
          model?: string | null
          sources?: Json
          verify_flags?: Json
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          category: string
          content_markdown: string | null
          created_at: string
          featured: boolean | null
          hero_image_url: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          reading_time_min: number | null
          short_description: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string
          content_markdown?: string | null
          created_at?: string
          featured?: boolean | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          reading_time_min?: number | null
          short_description?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string
          content_markdown?: string | null
          created_at?: string
          featured?: boolean | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          reading_time_min?: number | null
          short_description?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_itineraries: {
        Row: {
          client_email: string | null
          client_name: string
          client_whatsapp: string | null
          content: Json
          created_at: string
          delivered_at: string | null
          friendly_slug: string | null
          id: string
          party: Json
          request_id: string | null
          share_token: string
          status: string
          template_id: string | null
          trip_end: string | null
          trip_start: string | null
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_whatsapp?: string | null
          content?: Json
          created_at?: string
          delivered_at?: string | null
          friendly_slug?: string | null
          id?: string
          party?: Json
          request_id?: string | null
          share_token?: string
          status?: string
          template_id?: string | null
          trip_end?: string | null
          trip_start?: string | null
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_whatsapp?: string | null
          content?: Json
          created_at?: string
          delivered_at?: string | null
          friendly_slug?: string | null
          id?: string
          party?: Json
          request_id?: string | null
          share_token?: string
          status?: string
          template_id?: string | null
          trip_end?: string | null
          trip_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_itineraries_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "itinerary_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_itineraries_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "itinerary_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          access_type: string | null
          accessibility_markdown: string | null
          affiliate_links: Json | null
          altitude_warning: boolean | null
          base_city: string | null
          beginner_friendly: boolean | null
          best_season: string | null
          best_sunrise_sunset_spots: Json | null
          camping_available: boolean | null
          cell_signal_status: string | null
          common_fears: Json | null
          with_kids_markdown: string | null
          content_version: number | null
          country: string
          created_at: string
          days_needed: string | null
          designation: string | null
          difficulty_description: string | null
          difficulty_level: string
          drive_time_from_la: string | null
          drive_time_from_san_diego: string | null
          entrance_fee_type: string | null
          entrance_fee_usd: number | null
          estimated_budget_usd: number | null
          experience_type: string | null
          faqs: Json | null
          featured: boolean | null
          food_and_dining_markdown: string | null
          food_nearby_markdown: string | null
          full_guide_markdown: string | null
          gallery_images: string[] | null
          gear_list_markdown: string | null
          getting_there_markdown: string | null
          good_for: string[] | null
          has_nonresident_surcharge: boolean | null
          has_premium_itinerary: boolean | null
          hero_image_url: string | null
          id: string
          internal_notes: string | null
          is_published: boolean | null
          itinerary_markdown: string | null
          last_verified_at: string | null
          latitude: number | null
          lodging_info: Json | null
          longitude: number | null
          max_days: number | null
          max_elevation_ft: number | null
          meta_description: string | null
          meta_title: string | null
          min_days: number | null
          nearest_airport: string | null
          nearest_town: string | null
          nonresident_surcharge: number | null
          not_ideal_if: string[] | null
          nps_url: string | null
          official_name: string | null
          park_code: string | null
          peak_season: string | null
          permits_info: Json | null
          pet_policy_markdown: string | null
          pet_policy_status: string | null
          photo_spots: Json | null
          premium_itinerary_price: number | null
          preparation_plan: string | null
          recreation_gov_url: string | null
          region: string | null
          requires_permit: boolean | null
          research_status: string | null
          rv_max_length_ft: number | null
          safety_markdown: string | null
          season_to_avoid: string | null
          seasonal_closures: string | null
          short_description: string | null
          signature_hikes: Json | null
          slug: string
          tags: string[] | null
          timed_entry_required: boolean | null
          timezone: string | null
          title: string
          top_activities: string[] | null
          updated_at: string
          water_availability: string | null
          weather_markdown: string | null
          why_visit_markdown: string | null
          wildlife: string | null
        }
        Insert: {
          access_type?: string | null
          accessibility_markdown?: string | null
          affiliate_links?: Json | null
          altitude_warning?: boolean | null
          base_city?: string | null
          beginner_friendly?: boolean | null
          best_season?: string | null
          best_sunrise_sunset_spots?: Json | null
          camping_available?: boolean | null
          cell_signal_status?: string | null
          common_fears?: Json | null
          with_kids_markdown?: string | null
          content_version?: number | null
          country: string
          created_at?: string
          days_needed?: string | null
          designation?: string | null
          difficulty_description?: string | null
          difficulty_level?: string
          drive_time_from_la?: string | null
          drive_time_from_san_diego?: string | null
          entrance_fee_type?: string | null
          entrance_fee_usd?: number | null
          estimated_budget_usd?: number | null
          experience_type?: string | null
          faqs?: Json | null
          featured?: boolean | null
          food_and_dining_markdown?: string | null
          food_nearby_markdown?: string | null
          full_guide_markdown?: string | null
          gallery_images?: string[] | null
          gear_list_markdown?: string | null
          getting_there_markdown?: string | null
          good_for?: string[] | null
          has_nonresident_surcharge?: boolean | null
          has_premium_itinerary?: boolean | null
          hero_image_url?: string | null
          id?: string
          internal_notes?: string | null
          is_published?: boolean | null
          itinerary_markdown?: string | null
          last_verified_at?: string | null
          latitude?: number | null
          lodging_info?: Json | null
          longitude?: number | null
          max_days?: number | null
          max_elevation_ft?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_days?: number | null
          nearest_airport?: string | null
          nearest_town?: string | null
          nonresident_surcharge?: number | null
          not_ideal_if?: string[] | null
          nps_url?: string | null
          official_name?: string | null
          park_code?: string | null
          peak_season?: string | null
          permits_info?: Json | null
          pet_policy_markdown?: string | null
          pet_policy_status?: string | null
          photo_spots?: Json | null
          premium_itinerary_price?: number | null
          preparation_plan?: string | null
          recreation_gov_url?: string | null
          region?: string | null
          requires_permit?: boolean | null
          research_status?: string | null
          rv_max_length_ft?: number | null
          safety_markdown?: string | null
          season_to_avoid?: string | null
          seasonal_closures?: string | null
          short_description?: string | null
          signature_hikes?: Json | null
          slug: string
          tags?: string[] | null
          timed_entry_required?: boolean | null
          timezone?: string | null
          title: string
          top_activities?: string[] | null
          updated_at?: string
          water_availability?: string | null
          weather_markdown?: string | null
          why_visit_markdown?: string | null
          wildlife?: string | null
        }
        Update: {
          access_type?: string | null
          accessibility_markdown?: string | null
          affiliate_links?: Json | null
          altitude_warning?: boolean | null
          base_city?: string | null
          beginner_friendly?: boolean | null
          best_season?: string | null
          best_sunrise_sunset_spots?: Json | null
          camping_available?: boolean | null
          cell_signal_status?: string | null
          common_fears?: Json | null
          with_kids_markdown?: string | null
          content_version?: number | null
          country?: string
          created_at?: string
          days_needed?: string | null
          designation?: string | null
          difficulty_description?: string | null
          difficulty_level?: string
          drive_time_from_la?: string | null
          drive_time_from_san_diego?: string | null
          entrance_fee_type?: string | null
          entrance_fee_usd?: number | null
          estimated_budget_usd?: number | null
          experience_type?: string | null
          faqs?: Json | null
          featured?: boolean | null
          food_and_dining_markdown?: string | null
          food_nearby_markdown?: string | null
          full_guide_markdown?: string | null
          gallery_images?: string[] | null
          gear_list_markdown?: string | null
          getting_there_markdown?: string | null
          good_for?: string[] | null
          has_nonresident_surcharge?: boolean | null
          has_premium_itinerary?: boolean | null
          hero_image_url?: string | null
          id?: string
          internal_notes?: string | null
          is_published?: boolean | null
          itinerary_markdown?: string | null
          last_verified_at?: string | null
          latitude?: number | null
          lodging_info?: Json | null
          longitude?: number | null
          max_days?: number | null
          max_elevation_ft?: number | null
          meta_description?: string | null
          meta_title?: string | null
          min_days?: number | null
          nearest_airport?: string | null
          nearest_town?: string | null
          nonresident_surcharge?: number | null
          not_ideal_if?: string[] | null
          nps_url?: string | null
          official_name?: string | null
          park_code?: string | null
          peak_season?: string | null
          permits_info?: Json | null
          pet_policy_markdown?: string | null
          pet_policy_status?: string | null
          photo_spots?: Json | null
          premium_itinerary_price?: number | null
          preparation_plan?: string | null
          recreation_gov_url?: string | null
          region?: string | null
          requires_permit?: boolean | null
          research_status?: string | null
          rv_max_length_ft?: number | null
          safety_markdown?: string | null
          season_to_avoid?: string | null
          seasonal_closures?: string | null
          short_description?: string | null
          signature_hikes?: Json | null
          slug?: string
          tags?: string[] | null
          timed_entry_required?: boolean | null
          timezone?: string | null
          title?: string
          top_activities?: string[] | null
          updated_at?: string
          water_availability?: string | null
          weather_markdown?: string | null
          why_visit_markdown?: string | null
          wildlife?: string | null
        }
        Relationships: []
      }
      gear_articles: {
        Row: {
          category: string
          content_markdown: string | null
          created_at: string
          featured: boolean | null
          hero_image_url: string | null
          id: string
          is_published: boolean | null
          products: Json | null
          short_description: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content_markdown?: string | null
          created_at?: string
          featured?: boolean | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean | null
          products?: Json | null
          short_description?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content_markdown?: string | null
          created_at?: string
          featured?: boolean | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean | null
          products?: Json | null
          short_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      itinerary_requests: {
        Row: {
          contacted_at: string | null
          created_at: string
          destination: string
          email: string
          estimated_budget: string | null
          id: string
          message: string | null
          name: string
          status: Database["public"]["Enums"]["lead_status"]
        }
        Insert: {
          contacted_at?: string | null
          created_at?: string
          destination: string
          email: string
          estimated_budget?: string | null
          id?: string
          message?: string | null
          name: string
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Update: {
          contacted_at?: string | null
          created_at?: string
          destination?: string
          email?: string
          estimated_budget?: string | null
          id?: string
          message?: string | null
          name?: string
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Relationships: []
      }
      itinerary_templates: {
        Row: {
          content: Json
          created_at: string
          destination_id: string
          id: string
          is_published: boolean
          research_status: string
          suggested_days: number
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          destination_id: string
          id?: string
          is_published?: boolean
          research_status?: string
          suggested_days?: number
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          destination_id?: string
          id?: string
          is_published?: boolean
          research_status?: string
          suggested_days?: number
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_templates_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_chunks: {
        Row: {
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          source_field: string
          source_id: string
          source_table: string
        }
        Insert: {
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_field: string
          source_id: string
          source_table: string
        }
        Update: {
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_field?: string
          source_id?: string
          source_table?: string
        }
        Relationships: []
      }
      media_slider: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          is_active: boolean | null
          media_type: string
          public_url: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          media_type: string
          public_url: string
          storage_path: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          media_type?: string
          public_url?: string
          storage_path?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string | null
        }
        Relationships: []
      }
      park_live_data: {
        Row: {
          alerts: Json | null
          campgrounds: Json | null
          coordinates: Json | null
          created_at: string | null
          destination_id: string | null
          entrance_fee_usd: number | null
          entrance_fees: Json | null
          images: Json | null
          lat_long: string | null
          nps_images: Json | null
          operating_hours: Json | null
          park_code: string
          permits: Json | null
          sync_errors: Json | null
          synced_at: string | null
          updated_at: string | null
        }
        Insert: {
          alerts?: Json | null
          campgrounds?: Json | null
          coordinates?: Json | null
          created_at?: string | null
          destination_id?: string | null
          entrance_fee_usd?: number | null
          entrance_fees?: Json | null
          images?: Json | null
          lat_long?: string | null
          nps_images?: Json | null
          operating_hours?: Json | null
          park_code: string
          permits?: Json | null
          sync_errors?: Json | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Update: {
          alerts?: Json | null
          campgrounds?: Json | null
          coordinates?: Json | null
          created_at?: string | null
          destination_id?: string | null
          entrance_fee_usd?: number | null
          entrance_fees?: Json | null
          images?: Json | null
          lat_long?: string | null
          nps_images?: Json | null
          operating_hours?: Json | null
          park_code?: string
          permits?: Json | null
          sync_errors?: Json | null
          synced_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "park_live_data_destination_id_fkey"
            columns: ["destination_id"]
            isOneToOne: false
            referencedRelation: "destinations"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_alerts: {
        Row: {
          created_at: string
          email: string
          id: string
          notes: string | null
          notified_at: string | null
          park: string
          permit_name: string
          status: string
          target_year: number
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          notified_at?: string | null
          park: string
          permit_name: string
          status?: string
          target_year: number
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          notified_at?: string | null
          park?: string
          permit_name?: string
          status?: string
          target_year?: number
        }
        Relationships: []
      }
      permit_windows: {
        Row: {
          closes_at: string | null
          created_at: string
          how_to_apply_url: string | null
          id: string
          is_active: boolean
          notes: string | null
          opens_at: string
          park: string
          permit_name: string
          source_url: string | null
          updated_at: string
          window_type: string
          year: number
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          how_to_apply_url?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          opens_at: string
          park: string
          permit_name: string
          source_url?: string | null
          updated_at?: string
          window_type: string
          year: number
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          how_to_apply_url?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          opens_at?: string
          park?: string
          permit_name?: string
          source_url?: string | null
          updated_at?: string
          window_type?: string
          year?: number
        }
        Relationships: []
      }
      quiz_responses: {
        Row: {
          budget_range: string | null
          contacted_at: string | null
          created_at: string
          email: string | null
          fitness_level: string | null
          id: string
          interest: string | null
          is_us_resident: boolean | null
          main_barrier: string | null
          recommended_destinations: string[] | null
          status: Database["public"]["Enums"]["lead_status"]
          travel_style: string | null
          trip_duration: string | null
        }
        Insert: {
          budget_range?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          fitness_level?: string | null
          id?: string
          interest?: string | null
          is_us_resident?: boolean | null
          main_barrier?: string | null
          recommended_destinations?: string[] | null
          status?: Database["public"]["Enums"]["lead_status"]
          travel_style?: string | null
          trip_duration?: string | null
        }
        Update: {
          budget_range?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          fitness_level?: string | null
          id?: string
          interest?: string | null
          is_us_resident?: boolean | null
          main_barrier?: string | null
          recommended_destinations?: string[] | null
          status?: Database["public"]["Enums"]["lead_status"]
          travel_style?: string | null
          trip_duration?: string | null
        }
        Relationships: []
      }
      sentinel_leads: {
        Row: {
          contacted_at: string | null
          created_at: string | null
          email: string
          id: string
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
        }
        Insert: {
          contacted_at?: string | null
          created_at?: string | null
          email: string
          id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Update: {
          contacted_at?: string | null
          created_at?: string | null
          email?: string
          id?: string
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          fechas: string | null
          id: string
          nivel: string | null
          notas: string | null
          origen: string | null
          parque: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          fechas?: string | null
          id?: string
          nivel?: string | null
          notas?: string | null
          origen?: string | null
          parque?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          fechas?: string | null
          id?: string
          nivel?: string | null
          notas?: string | null
          origen?: string | null
          parque?: string | null
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_itinerary_by_token: {
        Args: { p_token: string }
        Returns: {
          client_name: string
          content: Json
          status: string
          trip_end: string
          trip_start: string
          updated_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_knowledge_chunks: {
        Args: {
          match_count?: number
          min_similarity?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          metadata: Json
          similarity: number
          source_field: string
          source_table: string
        }[]
      }
    }
    Enums: {
      app_role: "admin"
      lead_status: "nuevo" | "contactado" | "convertido"
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
      app_role: ["admin"],
      lead_status: ["nuevo", "contactado", "convertido"],
    },
  },
} as const
