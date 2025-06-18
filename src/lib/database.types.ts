export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      courses: {
        Row: {
          id: string
          title: string
          image: string
          description: string
          fees: number
          course_material_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          image: string
          description: string
          fees: number
          course_material_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          image?: string
          description?: string
          fees?: number
          course_material_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          order_index?: number
          created_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          chapter_id: string
          title: string
          url: string
          duration: string | null
          description: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          title: string
          url: string
          duration?: string | null
          description?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          title?: string
          url?: string
          duration?: string | null
          description?: string | null
          order_index?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}