export interface ChatSession {
  id: string
  user1_id: string
  user2_id: string
  started_at: string
  ended_at: string | null
  status: 'active' | 'ended' | 'reported'
  ended_by: string | null
}

export interface Message {
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

export interface Profile {
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

export interface WaitingUser {
  id: string
  user_id: string
  joined_at: string
  preferences: any | null
}

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  session_id: string
  reason: string
  created_at: string
  status: 'pending' | 'reviewed' | 'resolved'
}

export interface MatchingState {
  isInQueue: boolean
  isMatched: boolean
  currentSession: ChatSession | null
  queuePosition: number | null
}

export interface ChatState {
  messages: Message[]
  isTyping: boolean
  otherUserTyping: boolean
  isConnected: boolean
}

