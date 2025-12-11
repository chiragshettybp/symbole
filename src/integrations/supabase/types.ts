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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          summary: string
        }
        Insert: {
          action: string
          admin_id: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          summary: string
        }
        Update: {
          action?: string
          admin_id?: string
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          summary?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          browser: string | null
          city: string | null
          click_target: string | null
          country: string | null
          created_at: string
          device_type: string | null
          event_type: string
          id: string
          is_bounce: boolean | null
          metadata: Json | null
          os: string | null
          page_title: string | null
          page_url: string
          product_id: string | null
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          scroll_depth: number | null
          session_duration: number | null
          session_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          click_target?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_type: string
          id?: string
          is_bounce?: boolean | null
          metadata?: Json | null
          os?: string | null
          page_title?: string | null
          page_url: string
          product_id?: string | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          scroll_depth?: number | null
          session_duration?: number | null
          session_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          click_target?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          event_type?: string
          id?: string
          is_bounce?: boolean | null
          metadata?: Json | null
          os?: string | null
          page_title?: string | null
          page_url?: string
          product_id?: string | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          scroll_depth?: number | null
          session_duration?: number | null
          session_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          color: string
          created_at: string
          id: string
          product_id: string
          quantity: number
          session_id: string
          size: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          session_id: string
          size: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          session_id?: string
          size?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_analytics_summary: {
        Row: {
          avg_scroll_depth: number | null
          avg_session_duration: number | null
          bounce_rate: number | null
          created_at: string
          date: string
          desktop_visits: number | null
          id: string
          mobile_visits: number | null
          product_click_rate: number | null
          tablet_visits: number | null
          top_browsers: Json | null
          top_pages: Json | null
          total_page_views: number | null
          total_visits: number | null
          unique_visitors: number | null
          updated_at: string
        }
        Insert: {
          avg_scroll_depth?: number | null
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string
          date: string
          desktop_visits?: number | null
          id?: string
          mobile_visits?: number | null
          product_click_rate?: number | null
          tablet_visits?: number | null
          top_browsers?: Json | null
          top_pages?: Json | null
          total_page_views?: number | null
          total_visits?: number | null
          unique_visitors?: number | null
          updated_at?: string
        }
        Update: {
          avg_scroll_depth?: number | null
          avg_session_duration?: number | null
          bounce_rate?: number | null
          created_at?: string
          date?: string
          desktop_visits?: number | null
          id?: string
          mobile_visits?: number | null
          product_click_rate?: number | null
          tablet_visits?: number | null
          top_browsers?: Json | null
          top_pages?: Json | null
          total_page_views?: number | null
          total_visits?: number | null
          unique_visitors?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          name_snapshot: string
          order_id: string
          product_id: string | null
          quantity: number
          size: string
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          name_snapshot: string
          order_id: string
          product_id?: string | null
          quantity?: number
          size: string
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          name_snapshot?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          size?: string
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          checkout_completed_at: string | null
          checkout_initiated_at: string | null
          city: string | null
          country: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount: number | null
          first_name: string | null
          id: string
          instagram_username: string | null
          invoice_url: string | null
          items: Json
          last_name: string | null
          notes: string | null
          order_number: string
          payment_method: string
          pincode: string | null
          shipping_address: Json
          shipping_cost: number | null
          state: string | null
          status: string
          subtotal: number
          tags: string[] | null
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          checkout_completed_at?: string | null
          checkout_initiated_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          discount?: number | null
          first_name?: string | null
          id?: string
          instagram_username?: string | null
          invoice_url?: string | null
          items: Json
          last_name?: string | null
          notes?: string | null
          order_number: string
          payment_method?: string
          pincode?: string | null
          shipping_address: Json
          shipping_cost?: number | null
          state?: string | null
          status?: string
          subtotal: number
          tags?: string[] | null
          tax?: number
          total: number
          updated_at?: string
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          checkout_completed_at?: string | null
          checkout_initiated_at?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          discount?: number | null
          first_name?: string | null
          id?: string
          instagram_username?: string | null
          invoice_url?: string | null
          items?: Json
          last_name?: string | null
          notes?: string | null
          order_number?: string
          payment_method?: string
          pincode?: string | null
          shipping_address?: Json
          shipping_cost?: number | null
          state?: string | null
          status?: string
          subtotal?: number
          tags?: string[] | null
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string
          order_id: string
          slip_url: string | null
          status: string
          txn_ref: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string
          order_id: string
          slip_url?: string | null
          status?: string
          txn_ref?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string
          order_id?: string
          slip_url?: string | null
          status?: string
          txn_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          product_id: string
          size: string
          sku: string
          stock: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          size: string
          sku: string
          stock?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          size?: string
          sku?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          category: string
          colors: string[]
          created_at: string
          description: string | null
          featured: boolean | null
          id: string
          images: string[]
          name: string
          original_price: number | null
          price: number
          sizes: string[]
          slug: string
          stock_count: number
          thumbnail_image: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          brand?: string | null
          category?: string
          colors?: string[]
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: string[]
          name: string
          original_price?: number | null
          price: number
          sizes?: string[]
          slug: string
          stock_count?: number
          thumbnail_image?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          brand?: string | null
          category?: string
          colors?: string[]
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: string[]
          name?: string
          original_price?: number | null
          price?: number
          sizes?: string[]
          slug?: string
          stock_count?: number
          thumbnail_image?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          payment_id: string | null
          reason: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          payment_id?: string | null
          reason?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_id?: string | null
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          photos: string[] | null
          product_id: string | null
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string | null
          user_name: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          photos?: string[] | null
          product_id?: string | null
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id?: string | null
          user_name?: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          photos?: string[] | null
          product_id?: string | null
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string | null
          user_name?: string
          verified?: boolean
        }
        Relationships: []
      }
      settings: {
        Row: {
          auto_generate_invoice: boolean
          company_address: Json
          company_name: string
          created_at: string
          currency: string
          gst_number: string | null
          id: string
          invoice_prefix: string
          invoice_terms: string | null
          shipping_fee: number
          tax_rate: number
          updated_at: string
        }
        Insert: {
          auto_generate_invoice?: boolean
          company_address?: Json
          company_name?: string
          created_at?: string
          currency?: string
          gst_number?: string | null
          id?: string
          invoice_prefix?: string
          invoice_terms?: string | null
          shipping_fee?: number
          tax_rate?: number
          updated_at?: string
        }
        Update: {
          auto_generate_invoice?: boolean
          company_address?: Json
          company_name?: string
          created_at?: string
          currency?: string
          gst_number?: string | null
          id?: string
          invoice_prefix?: string
          invoice_terms?: string | null
          shipping_fee?: number
          tax_rate?: number
          updated_at?: string
        }
        Relationships: []
      }
      shipment_status_history: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          shipment_id: string
          status: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          shipment_id: string
          status: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          shipment_id?: string
          status?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_status_history_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_delivery: string | null
          carrier_name: string
          created_at: string
          estimated_delivery: string | null
          id: string
          label_url: string | null
          order_id: string
          ship_date: string | null
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          actual_delivery?: string | null
          carrier_name: string
          created_at?: string
          estimated_delivery?: string | null
          id?: string
          label_url?: string | null
          order_id: string
          ship_date?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          actual_delivery?: string | null
          carrier_name?: string
          created_at?: string
          estimated_delivery?: string | null
          id?: string
          label_url?: string | null
          order_id?: string
          ship_date?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      current_user_is_admin: { Args: never; Returns: boolean }
      generate_order_number: { Args: never; Returns: string }
      is_admin: { Args: { user_id?: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
