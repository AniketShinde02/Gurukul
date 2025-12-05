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
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          created_at: string
          last_seen: string
          is_online: boolean
          total_chats: number
          report_count: number
          is_banned: boolean
        }
        Insert: {
          id: string
          email: string
          username: string
          avatar_url?: string | null
          created_at?: string
          last_seen?: string
          is_online?: boolean
          total_chats?: number
          report_count?: number
          is_banned?: boolean
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
          last_seen?: string
          is_online?: boolean
          total_chats?: number
          report_count?: number
          is_banned?: boolean
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user1_id: string
          user2_id: string
          started_at: string
          ended_at: string | null
          status: 'active' | 'ended' | 'reported'
          ended_by: string | null
        }
        Insert: {
          id?: string
          user1_id: string
          user2_id: string
          started_at?: string
          ended_at?: string | null
          status?: 'active' | 'ended' | 'reported'
          ended_by?: string | null
        }
        Update: {
          id?: string
          user1_id?: string
          user2_id?: string
          started_at?: string
          ended_at?: string | null
          status?: 'active' | 'ended' | 'reported'
          ended_by?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          session_id: string
          sender_id: string
          content: string | null
          type: 'text' | 'image' | 'file'
          file_url: string | null
          file_name: string | null
          is_flagged: boolean
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          sender_id: string
          content?: string | null
          type?: 'text' | 'image' | 'file'
          file_url?: string | null
          file_name?: string | null
          is_flagged?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          sender_id?: string
          content?: string | null
          type?: 'text' | 'image' | 'file'
          file_url?: string | null
          file_name?: string | null
          is_flagged?: boolean
          created_at?: string
        }
      }
      waiting_queue: {
        Row: {
          id: string
          user_id: string
          joined_at: string
          preferences: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          joined_at?: string
          preferences?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          joined_at?: string
          preferences?: Json | null
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          reported_user_id: string
          session_id: string
          reason: string
          created_at: string
          status: 'pending' | 'reviewed' | 'resolved'
        }
        Insert: {
          id?: string
          reporter_id: string
          reported_user_id: string
          session_id: string
          reason: string
          created_at?: string
          status?: 'pending' | 'reviewed' | 'resolved'
        }
        Update: {
          id?: string
          reporter_id?: string
          reported_user_id?: string
          session_id?: string
          reason?: string
          created_at?: string
          status?: 'pending' | 'reviewed' | 'resolved'
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

