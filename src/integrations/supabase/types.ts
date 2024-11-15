export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agent_details: {
        Row: {
          charges: string | null
          id: string
          is_verified: boolean | null
          rating: number | null
          rating_count: number | null
          specialization: string | null
          total_reviews: number | null
          working_days: string | null
          working_hours: string | null
        }
        Insert: {
          charges?: string | null
          id: string
          is_verified?: boolean | null
          rating?: number | null
          rating_count?: number | null
          specialization?: string | null
          total_reviews?: number | null
          working_days?: string | null
          working_hours?: string | null
        }
        Update: {
          charges?: string | null
          id?: string
          is_verified?: boolean | null
          rating?: number | null
          rating_count?: number | null
          specialization?: string | null
          total_reviews?: number | null
          working_days?: string | null
          working_hours?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_details_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          agent_id: string | null
          appointment_type: string
          created_at: string
          customer_id: string | null
          id: string
          payment_status: string | null
          property: string
          requested_date: string
          requested_time: string
          status: string | null
        }
        Insert: {
          agent_id?: string | null
          appointment_type: string
          created_at?: string
          customer_id?: string | null
          id?: string
          payment_status?: string | null
          property: string
          requested_date: string
          requested_time: string
          status?: string | null
        }
        Update: {
          agent_id?: string | null
          appointment_type?: string
          created_at?: string
          customer_id?: string | null
          id?: string
          payment_status?: string | null
          property?: string
          requested_date?: string
          requested_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_payments: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string | null
          id: string
          released_at: string | null
          status: string | null
          transaction_hash: string | null
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          released_at?: string | null
          status?: string | null
          transaction_hash?: string | null
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string | null
          id?: string
          released_at?: string | null
          status?: string | null
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          chat_room_id: string | null
          contact: string | null
          created_at: string
          id: number
          sender_id: string | null
        }
        Insert: {
          chat_room_id?: string | null
          contact?: string | null
          created_at?: string
          id?: number
          sender_id?: string | null
        }
        Update: {
          chat_room_id?: string | null
          contact?: string | null
          created_at?: string
          id?: number
          sender_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          created_at: string
          district: string | null
          full_name: string
          id: string
          state: string | null
          type: Database["public"]["Enums"]["user_type"]
          wallet_id: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string
          district?: string | null
          full_name: string
          id: string
          state?: string | null
          type: Database["public"]["Enums"]["user_type"]
          wallet_id?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string
          district?: string | null
          full_name?: string
          id?: string
          state?: string | null
          type?: Database["public"]["Enums"]["user_type"]
          wallet_id?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          agent_id: string | null
          appointment_id: string | null
          comment: string | null
          created_at: string
          customer_id: string | null
          id: string
          rating: number | null
        }
        Insert: {
          agent_id?: string | null
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          rating?: number | null
        }
        Update: {
          agent_id?: string | null
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_uuid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      user_type: "customer" | "agent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
