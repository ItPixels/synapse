/**
 * Supabase Database type definitions.
 * These mirror the SQL schema in supabase/schema.sql.
 */
export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string;
          user_id: string;
          platform: string;
          platform_conversation_id: string;
          title: string;
          messages: string; // JSON string
          message_count: number;
          token_estimate: number;
          tags: string[];
          auto_tags: string[];
          is_archived: boolean;
          is_favorite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          platform: string;
          platform_conversation_id: string;
          title: string;
          messages: string;
          message_count: number;
          token_estimate?: number;
          tags?: string[];
          auto_tags?: string[];
          is_archived?: boolean;
          is_favorite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["conversations"]["Insert"]>;
      };
      context_cards: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string;
          summary: string;
          key_points: string[];
          generated_prompt: string;
          topics: string[];
          entities: string[];
          intent: string;
          continuation_hints: string[];
          created_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          conversation_id: string;
          summary: string;
          key_points: string[];
          generated_prompt: string;
          topics: string[];
          entities: string[];
          intent: string;
          continuation_hints: string[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["context_cards"]["Insert"]>;
      };
      user_settings: {
        Row: {
          user_id: string;
          settings: string; // JSON string of UserSettings
          updated_at: string;
        };
        Insert: {
          user_id?: string;
          settings: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["user_settings"]["Insert"]>;
      };
    };
  };
}
