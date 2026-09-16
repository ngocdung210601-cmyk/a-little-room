import { isSupabaseConfigured } from '../lib/supabase/client'
import { mockChatService } from './mockChatService'
import { supabaseChatService } from './supabaseChatService'
import type { ChatService } from './chatService'

export const chatService: ChatService = isSupabaseConfigured ? supabaseChatService : mockChatService
export const isUsingMockBackend = !isSupabaseConfigured

export * from './chatService'
