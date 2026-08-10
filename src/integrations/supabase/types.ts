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
      imported_videos: {
        Row: {
          created_at: string
          description: string | null
          episode: string | null
          external_id: string | null
          id: string
          is_recent: boolean
          position: number
          published_at: string | null
          source: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          episode?: string | null
          external_id?: string | null
          id?: string
          is_recent?: boolean
          position?: number
          published_at?: string | null
          source: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          episode?: string | null
          external_id?: string | null
          id?: string
          is_recent?: boolean
          position?: number
          published_at?: string | null
          source?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      imported_videos_backup: {
        Row: {
          backed_up_at: string
          backup_id: number
          created_at: string
          description: string | null
          episode: string | null
          external_id: string | null
          id: string
          is_recent: boolean
          position: number
          published_at: string | null
          source: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          backed_up_at?: string
          backup_id?: number
          created_at?: string
          description?: string | null
          episode?: string | null
          external_id?: string | null
          id?: string
          is_recent?: boolean
          position?: number
          published_at?: string | null
          source: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          backed_up_at?: string
          backup_id?: number
          created_at?: string
          description?: string | null
          episode?: string | null
          external_id?: string | null
          id?: string
          is_recent?: boolean
          position?: number
          published_at?: string | null
          source?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      media_library: {
        Row: {
          alt_text: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      news_cache: {
        Row: {
          key: string
          payload: Json
          updated_at: string
        }
        Insert: {
          key: string
          payload: Json
          updated_at?: string
        }
        Update: {
          key?: string
          payload?: Json
          updated_at?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          content: Json | null
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          favorite_genre: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          favorite_genre?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          favorite_genre?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      youtube_blacklist: {
        Row: {
          created_at: string
          id: string
          kind: string
          reason: string | null
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          reason?: string | null
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          reason?: string | null
          value?: string
        }
        Relationships: []
      }
      youtube_manga_videos: {
        Row: {
          channel_title: string | null
          created_at: string
          description: string | null
          duration_sec: number
          is_hidden: boolean
          published_at: string
          thumbnail: string | null
          title: string
          updated_at: string
          video_id: string
          view_count: number
          vision_checked: boolean
          vision_verdict: string | null
        }
        Insert: {
          channel_title?: string | null
          created_at?: string
          description?: string | null
          duration_sec?: number
          is_hidden?: boolean
          published_at: string
          thumbnail?: string | null
          title: string
          updated_at?: string
          video_id: string
          view_count?: number
          vision_checked?: boolean
          vision_verdict?: string | null
        }
        Update: {
          channel_title?: string | null
          created_at?: string
          description?: string | null
          duration_sec?: number
          is_hidden?: boolean
          published_at?: string
          thumbnail?: string | null
          title?: string
          updated_at?: string
          video_id?: string
          view_count?: number
          vision_checked?: boolean
          vision_verdict?: string | null
        }
        Relationships: []
      }
      youtube_manga_videos_backup: {
        Row: {
          backed_up_at: string
          backup_id: number
          channel_title: string | null
          created_at: string
          description: string | null
          duration_sec: number
          is_hidden: boolean
          published_at: string
          thumbnail: string | null
          title: string
          updated_at: string
          video_id: string
          view_count: number
          vision_checked: boolean
          vision_verdict: string | null
        }
        Insert: {
          backed_up_at?: string
          backup_id?: number
          channel_title?: string | null
          created_at?: string
          description?: string | null
          duration_sec?: number
          is_hidden?: boolean
          published_at: string
          thumbnail?: string | null
          title: string
          updated_at?: string
          video_id: string
          view_count?: number
          vision_checked?: boolean
          vision_verdict?: string | null
        }
        Update: {
          backed_up_at?: string
          backup_id?: number
          channel_title?: string | null
          created_at?: string
          description?: string | null
          duration_sec?: number
          is_hidden?: boolean
          published_at?: string
          thumbnail?: string | null
          title?: string
          updated_at?: string
          video_id?: string
          view_count?: number
          vision_checked?: boolean
          vision_verdict?: string | null
        }
        Relationships: []
      }
      youtube_sync_state: {
        Row: {
          key: string
          last_published_at: string | null
          last_run_at: string
          updated_at: string
        }
        Insert: {
          key: string
          last_published_at?: string | null
          last_run_at?: string
          updated_at?: string
        }
        Update: {
          key?: string
          last_published_at?: string | null
          last_run_at?: string
          updated_at?: string
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
      sync_secret_header_value: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
