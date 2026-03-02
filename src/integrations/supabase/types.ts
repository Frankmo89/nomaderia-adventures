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
      destinations: {
        Row: {
          affiliate_links: Json | null
          best_season: string | null
          common_fears: Json | null
          country: string
          created_at: string
          days_needed: string | null
          difficulty_description: string | null
          difficulty_level: string
          estimated_budget_usd: number | null
          experience_type: string | null
          featured: boolean | null
          full_guide_markdown: string | null
          gallery_images: string[] | null
          gear_list_markdown: string | null
          has_premium_itinerary: boolean | null
          hero_image_url: string | null
          id: string
          is_published: boolean | null
          itinerary_markdown: string | null
          premium_itinerary_price: number | null
          preparation_plan: string | null
          region: string | null
          short_description: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          affiliate_links?: Json | null
          best_season?: string | null
          common_fears?: Json | null
          country: string
          created_at?: string
          days_needed?: string | null
          difficulty_description?: string | null
          difficulty_level?: string
          estimated_budget_usd?: number | null
          experience_type?: string | null
          featured?: boolean | null
          full_guide_markdown?: string | null
          gallery_images?: string[] | null
          gear_list_markdown?: string | null
          has_premium_itinerary?: boolean | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean | null
          itinerary_markdown?: string | null
          premium_itinerary_price?: number | null
          preparation_plan?: string | null
          region?: string | null
          short_description?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          affiliate_links?: Json | null
          best_season?: string | null
          common_fears?: Json | null
          country?: string
          created_at?: string
          days_needed?: string | null
          difficulty_description?: string | null
          difficulty_level?: string
          estimated_budget_usd?: number | null
          experience_type?: string | null
          featured?: boolean | null
          full_guide_markdown?: string | null
          gallery_images?: string[] | null
          gear_list_markdown?: string | null
          has_premium_itinerary?: boolean | null
          hero_image_url?: string | null
          id?: string
          is_published?: boolean | null
          itinerary_markdown?: string | null
          premium_itinerary_price?: number | null
          preparation_plan?: string | null
          region?: string | null
          short_description?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
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
          created_at: string
          destination: string
          email: string
          estimated_budget: string | null
          id: string
          message: string | null
          name: string
        }
        Insert: {
          created_at?: string
          destination: string
          email: string
          estimated_budget?: string | null
          id?: string
          message?: string | null
          name: string
        }
        Update: {
          created_at?: string
          destination?: string
          email?: string
          estimated_budget?: string | null
          id?: string
          message?: string | null
          name?: string
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
      quiz_responses: {
        Row: {
          budget_range: string | null
          created_at: string
          email: string | null
          fitness_level: string | null
          id: string
          interest: string | null
          main_barrier: string | null
          recommended_destinations: string[] | null
          travel_style: string | null
          trip_duration: string | null
        }
        Insert: {
          budget_range?: string | null
          created_at?: string
          email?: string | null
          fitness_level?: string | null
          id?: string
          interest?: string | null
          main_barrier?: string | null
          recommended_destinations?: string[] | null
          travel_style?: string | null
          trip_duration?: string | null
        }
        Update: {
          budget_range?: string | null
          created_at?: string
          email?: string | null
          fitness_level?: string | null
          id?: string
          interest?: string | null
          main_barrier?: string | null
          recommended_destinations?: string[] | null
          travel_style?: string | null
          trip_duration?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin"
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
    },
  },
} as const
